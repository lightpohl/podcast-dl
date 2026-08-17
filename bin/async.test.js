import fs from "fs";
import os from "os";
import path from "path";
import { Readable } from "stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let testDirectory;

const getTempFiles = () =>
  fs.readdirSync(testDirectory).filter((name) => name.startsWith(".podcast-dl-"));

const loadDownload = async ({ content = "episode audio", contentType = "audio/mpeg" } = {}) => {
  vi.resetModules();

  const got = vi.fn(async () => ({
    headers: {
      "content-length": `${Buffer.byteLength(content)}`,
      "content-type": contentType,
    },
  }));
  got.stream = vi.fn(() => Readable.from([content]));

  vi.doMock("got", () => ({ default: got }));

  const { download } = await import("./async.js");
  return { download, got };
};

const loadDownloadItems = async () => {
  vi.resetModules();

  const got = vi.fn(async () => ({
    headers: {
      "content-length": "13",
      "content-type": "audio/wav",
    },
  }));
  got.stream = vi.fn(() => Readable.from(["episode audio"]));

  const runFfmpeg = vi.fn(async ({ outputPath }) => {
    const finalOutputPath = outputPath.replace(/\.wav$/, ".mp3");
    fs.renameSync(outputPath, finalOutputPath);
    return finalOutputPath;
  });
  const runExec = vi.fn();
  const writeItemMeta = vi.fn();

  vi.doMock("got", () => ({ default: got }));
  vi.doMock("./ffmpeg.js", () => ({ runFfmpeg }));
  vi.doMock("./exec.js", () => ({ runExec }));
  vi.doMock("./meta.js", () => ({ writeItemMeta }));

  const { downloadItemsAsync } = await import("./async.js");
  return { downloadItemsAsync, got, runExec, runFfmpeg, writeItemMeta };
};

beforeEach(() => {
  testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "podcast-dl-async-"));
});

afterEach(() => {
  fs.rmSync(testDirectory, { recursive: true, force: true });
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.resetModules();
});

describe("download", () => {
  it("downloads through a temporary file and calls post-processing with the final path", async () => {
    const { download, got } = await loadDownload();
    const outputPath = path.join(testDirectory, "episode.mp3");
    const onAfterDownload = vi.fn();

    const result = await download({
      url: "https://example.com/episode.mp3",
      outputPath,
      onAfterDownload,
    });

    expect(result).toBe(outputPath);
    expect(fs.readFileSync(outputPath, "utf8")).toBe("episode audio");
    expect(fs.existsSync(`${outputPath}.tmp`)).toBe(false);
    expect(onAfterDownload).toHaveBeenCalledWith(outputPath);
    expect(got).toHaveBeenCalledWith(
      "https://example.com/episode.mp3",
      expect.objectContaining({ method: "HEAD", timeout: 30000 }),
    );
    expect(got.stream).toHaveBeenCalledWith(
      "https://example.com/episode.mp3",
      expect.objectContaining({
        timeout: {
          response: 30000,
          socket: 60000,
        },
      }),
    );
  });

  it("uses the response MIME type when choosing the final extension", async () => {
    const { download } = await loadDownload({ contentType: "audio/mp4; charset=binary" });
    const requestedPath = path.join(testDirectory, "episode.mp3");
    const correctedPath = path.join(testDirectory, "episode.m4a");
    const onAfterDownload = vi.fn();

    const result = await download({
      url: "https://example.com/episode.mp3",
      outputPath: requestedPath,
      onAfterDownload,
    });

    expect(result).toBe(correctedPath);
    expect(fs.existsSync(requestedPath)).toBe(false);
    expect(fs.readFileSync(correctedPath, "utf8")).toBe("episode audio");
    expect(onAfterDownload).toHaveBeenCalledWith(correctedPath);
  });

  it.each([
    { contentType: "audio/mp4", requestedExt: ".mp3", correctedExt: ".m4a" },
    { contentType: "video/mp4", requestedExt: ".mov", correctedExt: ".mp4" },
  ])(
    "recognizes an existing $correctedExt file after MIME correction",
    async ({ contentType, requestedExt, correctedExt }) => {
      const { download, got } = await loadDownload({ contentType });
      const requestedPath = path.join(testDirectory, `episode${requestedExt}`);
      const correctedPath = path.join(testDirectory, `episode${correctedExt}`);
      const options = {
        url: `https://example.com/episode${requestedExt}`,
        outputPath: requestedPath,
      };

      expect(await download(options)).toBe(correctedPath);
      expect(await download(options)).toBe(correctedPath);

      expect(got).toHaveBeenCalledTimes(2);
      expect(got.stream).toHaveBeenCalledOnce();
      expect(fs.existsSync(requestedPath)).toBe(false);
      expect(fs.existsSync(correctedPath)).toBe(true);
    },
  );

  it("keeps a video extension when the response incorrectly reports an audio MIME type", async () => {
    const { download } = await loadDownload({
      content: "episode video",
      contentType: "audio/mpeg",
    });
    const outputPath = path.join(testDirectory, "episode.mp4");

    const result = await download({
      url: "https://example.com/episode.mp4",
      outputPath,
    });

    expect(result).toBe(outputPath);
    expect(fs.readFileSync(outputPath, "utf8")).toBe("episode video");
    expect(fs.existsSync(path.join(testDirectory, "episode.mp3"))).toBe(false);
  });

  it("skips an existing file and only post-processes it when requested", async () => {
    const { download, got } = await loadDownload();
    const outputPath = path.join(testDirectory, "episode.mp3");
    const onAfterDownload = vi.fn();
    fs.writeFileSync(outputPath, "existing audio");

    await download({
      url: "https://example.com/episode.mp3",
      outputPath,
      onAfterDownload,
    });
    expect(onAfterDownload).not.toHaveBeenCalled();

    await download({
      url: "https://example.com/episode.mp3",
      outputPath,
      onAfterDownload,
      alwaysPostprocess: true,
    });

    expect(onAfterDownload).toHaveBeenCalledOnce();
    expect(onAfterDownload).toHaveBeenCalledWith(outputPath);
    expect(got).not.toHaveBeenCalled();
    expect(got.stream).not.toHaveBeenCalled();
  });

  it("only retries failed post-processing when explicitly requested", async () => {
    const { download, got } = await loadDownload();
    const outputPath = path.join(testDirectory, "episode.mp3");
    const onAfterDownload = vi
      .fn()
      .mockRejectedValueOnce(new Error("post-processing failed"))
      .mockResolvedValueOnce(outputPath);
    const options = {
      url: "https://example.com/episode.mp3",
      outputPath,
      onAfterDownload,
    };

    await expect(download(options)).rejects.toThrow("post-processing failed");

    expect(fs.existsSync(outputPath)).toBe(true);
    await expect(download(options)).resolves.toBe(outputPath);
    expect(onAfterDownload).toHaveBeenCalledOnce();

    await expect(download({ ...options, alwaysPostprocess: true })).resolves.toBe(outputPath);

    expect(got.stream).toHaveBeenCalledOnce();
    expect(onAfterDownload).toHaveBeenCalledTimes(2);
    expect(getTempFiles()).toEqual([]);
  });

  it("does not overwrite a path created by a concurrent download", async () => {
    const { download, got } = await loadDownload();
    const outputPath = path.join(testDirectory, "episode.mp3");
    got.stream
      .mockImplementationOnce(() => Readable.from(["first download"]))
      .mockImplementationOnce(() => Readable.from(["second download"]));

    const results = await Promise.allSettled([
      download({ url: "https://example.com/first.mp3", outputPath }),
      download({ url: "https://example.com/second.mp3", outputPath }),
    ]);

    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(1);
    expect(results.find(({ status }) => status === "rejected").reason.message).toContain(
      "Output path was created during download",
    );
    expect(["first download", "second download"]).toContain(fs.readFileSync(outputPath, "utf8"));
    expect(fs.readdirSync(testDirectory).filter((name) => name.endsWith(".tmp"))).toEqual([]);
  });

  it("supports maximum-length output filenames", async () => {
    const { download } = await loadDownload();
    const outputPath = path.join(testDirectory, `${"a".repeat(251)}.mp3`);

    await expect(
      download({
        url: "https://example.com/episode.mp3",
        outputPath,
        onAfterDownload: async (finalOutputPath) => finalOutputPath,
      }),
    ).resolves.toBe(outputPath);

    expect(fs.readFileSync(outputPath, "utf8")).toBe("episode audio");
    expect(getTempFiles()).toEqual([]);
  });

  it("removes a partial file before retrying a failed stream", async () => {
    const { download, got } = await loadDownload();
    const outputPath = path.join(testDirectory, "episode.mp3");
    const failedStream = new Readable({
      read() {
        this.push("partial");
        this.destroy(new Error("connection lost"));
      },
    });
    got.stream
      .mockImplementationOnce(() => failedStream)
      .mockImplementationOnce(() => Readable.from(["complete audio"]));

    await download({
      url: "https://example.com/episode.mp3",
      outputPath,
      maxAttempts: 2,
    });

    expect(got.stream).toHaveBeenCalledTimes(2);
    expect(fs.readFileSync(outputPath, "utf8")).toBe("complete audio");
    expect(fs.existsSync(`${outputPath}.tmp`)).toBe(false);
  });

  it("limits the total number of download attempts", async () => {
    const { download, got } = await loadDownload();
    const outputPath = path.join(testDirectory, "episode.mp3");
    got.stream.mockImplementation(
      () =>
        new Readable({
          read() {
            this.destroy(new Error("connection lost"));
          },
        }),
    );

    await expect(
      download({
        url: "https://example.com/episode.mp3",
        outputPath,
        maxAttempts: 2,
      }),
    ).rejects.toThrow("connection lost");

    expect(got.stream).toHaveBeenCalledTimes(2);
    expect(fs.existsSync(`${outputPath}.tmp`)).toBe(false);
  });
});

describe("downloadItemsAsync", () => {
  it("uses the converted path for exec and recognizes it on a later run", async () => {
    const { downloadItemsAsync, got, runExec, runFfmpeg } = await loadDownloadItems();
    const item = {
      _archiveKeys: [],
      _originalIndex: 0,
      enclosure: {
        type: "audio/wav",
        url: "https://example.com/episode.wav",
      },
      title: "An Episode",
    };
    const feed = {
      items: [item],
      title: "Example Podcast",
    };
    const options = {
      audioFormat: "mp3",
      basePath: testDirectory,
      episodeCustomTemplateOptions: [],
      episodeDigits: 1,
      episodeNumOffset: 0,
      episodeSourceOrder: ["enclosure", "link"],
      episodeTemplate: "{{title}}",
      exec: "process {{episode_path}}",
      feed,
      targetItems: [item],
    };
    const sourcePath = path.join(testDirectory, "An Episode.wav");
    const convertedPath = path.join(testDirectory, "An Episode.mp3");

    await downloadItemsAsync(options);

    expect(runFfmpeg).toHaveBeenCalledOnce();
    expect(runExec).toHaveBeenCalledWith(
      expect.objectContaining({
        episodeFilename: "An Episode.mp3",
        outputPodcastPath: convertedPath,
      }),
    );
    expect(fs.existsSync(sourcePath)).toBe(false);
    expect(fs.existsSync(convertedPath)).toBe(true);

    await downloadItemsAsync(options);

    expect(got.stream).toHaveBeenCalledOnce();
    expect(runFfmpeg).toHaveBeenCalledOnce();
    expect(runExec).toHaveBeenCalledOnce();
  });

  it("continues ffmpeg and exec when an episode artifact fails", async () => {
    const { downloadItemsAsync, got, runExec, runFfmpeg } = await loadDownloadItems();
    const archivePath = path.join(testDirectory, "archive.json");
    const outputTranscriptPath = path.join(testDirectory, "An Episode.vtt");
    const item = {
      _archiveKeys: ["episode-key"],
      _episodeTranscript: {
        archiveKeys: ["transcript-key"],
        outputPath: outputTranscriptPath,
        url: "https://example.com/transcript.vtt",
      },
      _originalIndex: 0,
      enclosure: {
        type: "audio/wav",
        url: "https://example.com/episode.wav",
      },
      title: "An Episode",
    };
    const feed = { items: [item], title: "Example Podcast" };
    const options = {
      archive: archivePath,
      attempts: 1,
      audioFormat: "mp3",
      basePath: testDirectory,
      episodeCustomTemplateOptions: [],
      episodeDigits: 1,
      episodeNumOffset: 0,
      episodeSourceOrder: ["enclosure", "link"],
      episodeTemplate: "{{title}}",
      exec: "process {{episode_path}}",
      feed,
      targetItems: [item],
    };
    const outputPodcastPath = path.join(testDirectory, "An Episode.wav");
    got.stream.mockImplementation((url) => {
      if (url.includes("transcript")) {
        return new Readable({
          read() {
            this.destroy(new Error("transcript unavailable"));
          },
        });
      }

      return Readable.from(["episode audio"]);
    });

    await expect(downloadItemsAsync(options)).resolves.toEqual({
      numEpisodesDownloaded: 1,
      hasErrors: true,
    });
    expect(fs.existsSync(outputPodcastPath)).toBe(false);
    expect(getTempFiles()).toEqual([]);
    expect(runFfmpeg).toHaveBeenCalledOnce();
    expect(runExec).toHaveBeenCalledOnce();
    expect(fs.existsSync(outputTranscriptPath)).toBe(false);
    expect(JSON.parse(fs.readFileSync(archivePath, "utf8"))).toEqual(["episode-key"]);
  });

  it("continues ffmpeg and exec when metadata fails", async () => {
    const { downloadItemsAsync, runExec, runFfmpeg, writeItemMeta } = await loadDownloadItems();
    const item = {
      _archiveKeys: [],
      _originalIndex: 0,
      enclosure: {
        type: "audio/wav",
        url: "https://example.com/episode.wav",
      },
      title: "An Episode",
    };
    const options = {
      audioFormat: "mp3",
      basePath: testDirectory,
      episodeCustomTemplateOptions: [],
      episodeDigits: 1,
      episodeNumOffset: 0,
      episodeSourceOrder: ["enclosure", "link"],
      episodeTemplate: "{{title}}",
      exec: "process {{episode_path}}",
      feed: { items: [item], title: "Example Podcast" },
      includeEpisodeMeta: true,
      targetItems: [item],
    };
    writeItemMeta.mockImplementationOnce(() => {
      throw new Error("metadata unavailable");
    });

    await expect(downloadItemsAsync(options)).resolves.toEqual({
      numEpisodesDownloaded: 1,
      hasErrors: true,
    });
    expect(writeItemMeta).toHaveBeenCalledOnce();
    expect(runFfmpeg).toHaveBeenCalledOnce();
    expect(runExec).toHaveBeenCalledOnce();
    expect(getTempFiles()).toEqual([]);
  });

  it("rejects output path collisions before starting downloads", async () => {
    const { downloadItemsAsync, got } = await loadDownloadItems();
    const items = [0, 1].map((index) => ({
      _archiveKeys: [],
      _originalIndex: index,
      enclosure: {
        type: "audio/wav",
        url: `https://example.com/episode-${index}.wav`,
      },
      title: "Same Episode",
    }));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      downloadItemsAsync({
        basePath: testDirectory,
        episodeCustomTemplateOptions: [],
        episodeDigits: 1,
        episodeNumOffset: 0,
        episodeSourceOrder: ["enclosure", "link"],
        episodeTemplate: "{{title}}",
        feed: { items, title: "Example Podcast" },
        targetItems: items,
        threads: 2,
      }),
    ).resolves.toEqual({ numEpisodesDownloaded: 0, hasErrors: true });

    expect(got.stream).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("Multiple episode artifacts resolve to the same output path"),
    );
  });
});
