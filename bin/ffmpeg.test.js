import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let testDirectory;
let ffmpegOutputPath;

const loadRunFfmpeg = async ({ reject = false } = {}) => {
  vi.resetModules();

  const execWithPromise = vi.fn(async () => {
    fs.writeFileSync(ffmpegOutputPath, "converted audio");
    if (reject) {
      throw new Error("ffmpeg failed");
    }
  });

  vi.doMock("./exec.js", () => ({ execWithPromise }));

  const { runFfmpeg } = await import("./ffmpeg.js");
  return { runFfmpeg, execWithPromise };
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
    const { runFfmpeg, execWithPromise } = await loadRunFfmpeg();

    await runFfmpeg({
      audioFormat: "mp3",
      ext: ".wav",
      feed,
      item,
      itemIndex: 0,
      outputPath: sourcePath,
    });

    expect(execWithPromise).toHaveBeenCalledOnce();
    expect(execWithPromise.mock.calls[0][0]).toContain("-c:a libmp3lame");
    expect(execWithPromise.mock.calls[0][0]).toContain("-map 0:a");
    expect(fs.existsSync(sourcePath)).toBe(false);
    expect(fs.readFileSync(finalPath, "utf8")).toBe("converted audio");
    expect(fs.existsSync(ffmpegOutputPath)).toBe(false);
  });

  it("includes metadata and attached artwork in the ffmpeg command", async () => {
    const sourcePath = path.join(testDirectory, "episode.mp3");
    const imagePath = path.join(testDirectory, "cover.jpg");
    ffmpegOutputPath = `${sourcePath}.tmp.mp3`;
    fs.writeFileSync(sourcePath, "source audio");
    fs.writeFileSync(imagePath, "image");
    const { feed, item } = createFeedAndItem();
    const { runFfmpeg, execWithPromise } = await loadRunFfmpeg();

    await runFfmpeg({
      embedMetadata: true,
      episodeImageOutputPath: imagePath,
      ext: ".mp3",
      feed,
      item,
      itemIndex: 0,
      outputPath: sourcePath,
    });

    const command = execWithPromise.mock.calls[0][0];
    expect(command).toContain(`-i '${imagePath}'`);
    expect(command).toContain("-c copy");
    expect(command).toContain("-disposition:v:0 attached_pic");
    expect(command).toContain("-metadata album='Example Podcast'");
    expect(command).toContain("-metadata title='An Episode'");
    expect(command).toContain("-map 0:a -map 1");
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
        ext: ".mp3",
        feed,
        item,
        itemIndex: 0,
        outputPath: sourcePath,
      }),
    ).rejects.toThrow("ffmpeg failed");

    expect(fs.readFileSync(sourcePath, "utf8")).toBe("source audio");
    expect(fs.existsSync(ffmpegOutputPath)).toBe(false);
  });
});
