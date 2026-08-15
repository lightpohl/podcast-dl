import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let testDirectory;
let ffmpegOutputPath;

const loadRunFfmpeg = async ({ reject = false } = {}) => {
  vi.resetModules();

  const spawnWithPromise = vi.fn(async () => {
    fs.writeFileSync(ffmpegOutputPath, "converted audio");
    if (reject) {
      throw new Error("ffmpeg failed");
    }
  });

  vi.doMock("./spawn.js", () => ({ spawnWithPromise }));

  const { runFfmpeg } = await import("./ffmpeg.js");
  return { runFfmpeg, spawnWithPromise };
};

const createFeedAndItem = () => ({
  feed: {
    title: "Example Podcast",
    items: [{}, {}],
  },
  item: {
    title: "An Episode",
    author: "A Host",
    pubDate: "2026-08-08T12:00:00.000Z",
  },
});

beforeEach(() => {
  testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "podcast-dl-ffmpeg-"));
});

afterEach(() => {
  fs.rmSync(testDirectory, { recursive: true, force: true });
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.resetModules();
});

describe("runFfmpeg", () => {
  it("converts to the requested format using a temporary output", async () => {
    const sourcePath = path.join(testDirectory, "episode.wav");
    const finalPath = path.join(testDirectory, "episode.mp3");
    ffmpegOutputPath = `${sourcePath}.tmp.mp3`;
    fs.writeFileSync(sourcePath, "source audio");
    const { feed, item } = createFeedAndItem();
    const { runFfmpeg, spawnWithPromise } = await loadRunFfmpeg();

    const result = await runFfmpeg({
      audioFormat: "mp3",
      feed,
      item,
      itemIndex: 0,
      outputPath: sourcePath,
    });

    expect(spawnWithPromise).toHaveBeenCalledOnce();
    expect(spawnWithPromise).toHaveBeenCalledWith(
      "ffmpeg",
      [
        "-nostdin",
        "-y",
        "-loglevel",
        "quiet",
        "-i",
        sourcePath,
        "-c:a",
        "libmp3lame",
        "-map",
        "0:a",
        ffmpegOutputPath,
      ],
      { stdio: "ignore" },
    );
    expect(fs.existsSync(sourcePath)).toBe(false);
    expect(fs.readFileSync(finalPath, "utf8")).toBe("converted audio");
    expect(fs.existsSync(ffmpegOutputPath)).toBe(false);
    expect(result).toBe(finalPath);
  });

  it("includes metadata and attached artwork in the ffmpeg command", async () => {
    const sourcePath = path.join(testDirectory, "episode.mp3");
    const imagePath = path.join(testDirectory, "cover.jpg");
    ffmpegOutputPath = `${sourcePath}.tmp.mp3`;
    fs.writeFileSync(sourcePath, "source audio");
    fs.writeFileSync(imagePath, "image");
    const { feed, item } = createFeedAndItem();
    item.contentSnippet = "It's $5 & worth it";
    item.itunes = { subtitle: "A subtitle (with punctuation)" };
    const { runFfmpeg, spawnWithPromise } = await loadRunFfmpeg();

    await runFfmpeg({
      embedMetadata: true,
      episodeImageOutputPath: imagePath,
      feed,
      item,
      itemIndex: 0,
      outputPath: sourcePath,
    });

    const args = spawnWithPromise.mock.calls[0][1];
    expect(args).toContain(imagePath);
    expect(args).toContain("copy");
    expect(args).toContain("attached_pic");
    expect(args).toContain("album=Example Podcast");
    expect(args).toContain("title=An Episode");
    expect(args).toContain("comment=It's $5 & worth it");
    expect(args).toContain("subtitle=A subtitle (with punctuation)");
    expect(args.slice(-5)).toEqual(["-map", "0:a", "-map", "1", ffmpegOutputPath]);
  });

  it("derives the temporary container from the downloaded file path", async () => {
    const sourcePath = path.join(testDirectory, "episode.m4a");
    ffmpegOutputPath = `${sourcePath}.tmp.m4a`;
    fs.writeFileSync(sourcePath, "source audio");
    const { feed, item } = createFeedAndItem();
    const { runFfmpeg, spawnWithPromise } = await loadRunFfmpeg();

    await runFfmpeg({
      embedMetadata: true,
      feed,
      item,
      itemIndex: 0,
      outputPath: sourcePath,
    });

    expect(spawnWithPromise.mock.calls[0][1].at(-1)).toBe(ffmpegOutputPath);
  });

  it("preserves the video stream when embedding metadata and artwork into a video file", async () => {
    const sourcePath = path.join(testDirectory, "episode.mp4");
    const imagePath = path.join(testDirectory, "cover.jpg");
    ffmpegOutputPath = `${sourcePath}.tmp.mp4`;
    fs.writeFileSync(sourcePath, "source video");
    fs.writeFileSync(imagePath, "image");
    const { feed, item } = createFeedAndItem();
    const { runFfmpeg, spawnWithPromise } = await loadRunFfmpeg();

    await runFfmpeg({
      embedMetadata: true,
      episodeImageOutputPath: imagePath,
      feed,
      item,
      itemIndex: 0,
      outputPath: sourcePath,
    });

    const args = spawnWithPromise.mock.calls[0][1];
    expect(args).toContain(imagePath);
    expect(args).toContain("copy");
    expect(args).toContain("-disposition:v:1");
    expect(args).toContain("attached_pic");
    expect(args).not.toContain("0:a");
    expect(args.slice(-5)).toEqual(["-map", "0", "-map", "1", ffmpegOutputPath]);
  });

  it("preserves video containers that do not support attached artwork", async () => {
    const sourcePath = path.join(testDirectory, "episode.webm");
    const imagePath = path.join(testDirectory, "cover.jpg");
    ffmpegOutputPath = `${sourcePath}.tmp.webm`;
    fs.writeFileSync(sourcePath, "source video");
    fs.writeFileSync(imagePath, "image");
    const { feed, item } = createFeedAndItem();
    const { runFfmpeg, spawnWithPromise } = await loadRunFfmpeg();

    await runFfmpeg({
      embedMetadata: true,
      episodeImageOutputPath: imagePath,
      feed,
      item,
      itemIndex: 0,
      outputPath: sourcePath,
    });

    const args = spawnWithPromise.mock.calls[0][1];
    expect(args).not.toContain(imagePath);
    expect(args).not.toContain("attached_pic");
    expect(args.slice(-3)).toEqual(["-map", "0", ffmpegOutputPath]);
  });

  it("still embeds artwork as the first video stream for audio files", async () => {
    const sourcePath = path.join(testDirectory, "episode.mp3");
    const imagePath = path.join(testDirectory, "cover.jpg");
    ffmpegOutputPath = `${sourcePath}.tmp.mp3`;
    fs.writeFileSync(sourcePath, "source audio");
    fs.writeFileSync(imagePath, "image");
    const { feed, item } = createFeedAndItem();
    const { runFfmpeg, spawnWithPromise } = await loadRunFfmpeg();

    await runFfmpeg({
      embedMetadata: true,
      episodeImageOutputPath: imagePath,
      feed,
      item,
      itemIndex: 0,
      outputPath: sourcePath,
    });

    const args = spawnWithPromise.mock.calls[0][1];
    expect(args).toContain("-disposition:v:0");
    expect(args).toContain("attached_pic");
    expect(args.slice(-5)).toEqual(["-map", "0:a", "-map", "1", ffmpegOutputPath]);
  });

  it("extracts only the audio when converting a video file to an audio format", async () => {
    const sourcePath = path.join(testDirectory, "episode.mp4");
    const imagePath = path.join(testDirectory, "cover.jpg");
    ffmpegOutputPath = `${sourcePath}.tmp.mp3`;
    fs.writeFileSync(sourcePath, "source video");
    fs.writeFileSync(imagePath, "image");
    const { feed, item } = createFeedAndItem();
    const { runFfmpeg, spawnWithPromise } = await loadRunFfmpeg();

    await runFfmpeg({
      audioFormat: "mp3",
      embedMetadata: true,
      episodeImageOutputPath: imagePath,
      feed,
      item,
      itemIndex: 0,
      outputPath: sourcePath,
    });

    const args = spawnWithPromise.mock.calls[0][1];
    expect(args).toContain("libmp3lame");
    expect(args).toContain("-disposition:v:0");
    expect(args).toContain("attached_pic");
    expect(args.slice(-5)).toEqual(["-map", "0:a", "-map", "1", ffmpegOutputPath]);
  });

  it("keeps the source and removes temporary output when ffmpeg fails", async () => {
    const sourcePath = path.join(testDirectory, "episode.mp3");
    ffmpegOutputPath = `${sourcePath}.tmp.mp3`;
    fs.writeFileSync(sourcePath, "source audio");
    const { feed, item } = createFeedAndItem();
    const { runFfmpeg } = await loadRunFfmpeg({ reject: true });

    await expect(
      runFfmpeg({
        bitrate: "128k",
        feed,
        item,
        itemIndex: 0,
        outputPath: sourcePath,
      }),
    ).rejects.toThrow("ffmpeg failed");

    expect(fs.readFileSync(sourcePath, "utf8")).toBe("source audio");
    expect(fs.existsSync(ffmpegOutputPath)).toBe(false);
  });

  it("keeps the source and removes temporary output when finalizing fails", async () => {
    const sourcePath = path.join(testDirectory, "episode.wav");
    ffmpegOutputPath = `${sourcePath}.tmp.mp3`;
    fs.writeFileSync(sourcePath, "source audio");
    const { feed, item } = createFeedAndItem();
    const { runFfmpeg } = await loadRunFfmpeg();
    vi.spyOn(fs, "renameSync").mockImplementationOnce(() => {
      throw new Error("rename failed");
    });

    await expect(
      runFfmpeg({
        audioFormat: "mp3",
        feed,
        item,
        itemIndex: 0,
        outputPath: sourcePath,
      }),
    ).rejects.toThrow("rename failed");

    expect(fs.readFileSync(sourcePath, "utf8")).toBe("source audio");
    expect(fs.existsSync(ffmpegOutputPath)).toBe(false);
  });
});
