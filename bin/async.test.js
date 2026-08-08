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
    expect(onAfterDownload).toHaveBeenCalledWith();
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
});
