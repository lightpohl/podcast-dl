import fs from "fs";
import os from "os";
import path from "path";
import { Readable } from "stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let testDirectory;

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

  vi.doMock("got", () => ({ default: got }));
  vi.doMock("./ffmpeg.js", () => ({ runFfmpeg }));
  vi.doMock("./exec.js", () => ({ runExec }));

  const { downloadItemsAsync } = await import("./async.js");
  return { downloadItemsAsync, got, runExec, runFfmpeg };
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
    expect(got.stream).toHaveBeenCalledOnce();
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
});
