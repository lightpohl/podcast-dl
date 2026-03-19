import { Command } from "commander";
import { afterEach, describe, expect, it, vi } from "vitest";

const originalArgv = [...process.argv];

const loadCommander = async ({ ffmpegExists = true } = {}) => {
  vi.resetModules();

  const logErrorAndExit = vi.fn((message) => {
    throw new Error(message);
  });
  const commandExistsSync = vi.fn(() => ffmpegExists);

  vi.doMock("./logger.js", () => ({ logErrorAndExit }));
  vi.doMock("command-exists", () => ({ sync: commandExistsSync }));

  const module = await import("./commander.js");

  return {
    ...module,
    logErrorAndExit,
    commandExistsSync,
  };
};

const parseArgs = async (args, options) => {
  process.argv = ["node", "podcast-dl", ...args];

  const { setupCommander, logErrorAndExit, commandExistsSync } =
    await loadCommander(options);
  const program = new Command();

  try {
    return {
      result: setupCommander(program),
      logErrorAndExit,
      commandExistsSync,
    };
  } catch (error) {
    return {
      error,
      logErrorAndExit,
      commandExistsSync,
    };
  }
};

afterEach(() => {
  process.argv = [...originalArgv];
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("setupCommander", () => {
  it("returns the expected defaults", async () => {
    const { result } = await parseArgs([]);

    expect(result.outDir).toBe("./{{podcast_title}}");
    expect(result.episodeTemplate).toBe("{{release_date}}-{{title}}");
    expect(result.episodeDigits).toBe(1);
    expect(result.episodeNumOffset).toBe(0);
    expect(result.episodeSourceOrder).toEqual(["enclosure", "link"]);
    expect(result.episodeTranscriptTypes).toEqual([
      "application/json",
      "application/x-subrip",
      "application/srr",
      "application/srt",
      "text/vtt",
      "text/html",
      "text/plain",
    ]);
    expect(result.includeMeta).toBe(false);
    expect(result.includeEpisodeMeta).toBe(false);
    expect(result.includeEpisodeTranscripts).toBe(false);
    expect(result.includeEpisodeImages).toBe(false);
    expect(result.embedMetadata).toBe(false);
    expect(result.addMp3Metadata).toBe(false);
    expect(result.mono).toBe(false);
    expect(result.override).toBe(false);
    expect(result.alwaysPostprocess).toBe(false);
    expect(result.reverse).toBe(false);
    expect(result.info).toBe(false);
    expect(result.proxy).toBe(false);
    expect(result.threads).toBe(1);
    expect(result.attempts).toBe(3);
    expect(result.trustExt).toBe(false);
  });

  it("parses numeric and ffmpeg-backed options", async () => {
    const { result, commandExistsSync, logErrorAndExit } = await parseArgs([
      "--episode-digits",
      "3",
      "--episode-num-offset",
      "10",
      "--embed-metadata",
      "--audio-format",
      "mp3",
      "--threads",
      "4",
      "--attempts",
      "5",
      "--list",
      "json",
    ]);

    expect(result.episodeDigits).toBe(3);
    expect(result.episodeNumOffset).toBe(10);
    expect(result.embedMetadata).toBe(true);
    expect(result.audioFormat).toBe("mp3");
    expect(result.threads).toBe(4);
    expect(result.attempts).toBe(5);
    expect(result.list).toBe("json");
    expect(commandExistsSync).toHaveBeenCalledTimes(1);
    expect(logErrorAndExit).not.toHaveBeenCalled();
  });

  it("parses and trims comma-separated option lists", async () => {
    const { result, logErrorAndExit } = await parseArgs([
      "--episode-source-order",
      "link, enclosure",
      "--episode-transcript-types",
      "text/vtt, text/plain",
    ]);

    expect(result.episodeSourceOrder).toEqual(["link", "enclosure"]);
    expect(result.episodeTranscriptTypes).toEqual(["text/vtt", "text/plain"]);
    expect(logErrorAndExit).not.toHaveBeenCalled();
  });

  it("fails on an invalid episode source order", async () => {
    const { error, logErrorAndExit } = await parseArgs([
      "--episode-source-order",
      "link, bogus",
    ]);

    expect(error.message).toBe(
      "Invalid type found in --episode-source-order: link, bogus\n"
    );
    expect(logErrorAndExit).toHaveBeenCalledWith(
      "Invalid type found in --episode-source-order: link, bogus\n"
    );
  });

  it("fails on an invalid transcript type", async () => {
    const { error, logErrorAndExit } = await parseArgs([
      "--episode-transcript-types",
      "text/vtt, bogus",
    ]);

    expect(error.message).toBe(
      "Invalid type found in --transcript-types: text/vtt, bogus\n"
    );
    expect(logErrorAndExit).toHaveBeenCalledWith(
      "Invalid type found in --transcript-types: text/vtt, bogus\n"
    );
  });

  it("fails on an invalid audio format", async () => {
    const { error, logErrorAndExit } = await parseArgs([
      "--audio-format",
      "wavv",
    ]);

    expect(error.message).toContain("Invalid audio format: wavv");
    expect(error.message).toContain("Supported formats:");
    expect(error.message).toContain("mp3");
    expect(error.message).toContain("wav");
    expect(logErrorAndExit).toHaveBeenCalledWith(error.message);
  });

  it("fails on an invalid list format", async () => {
    const { error, logErrorAndExit } = await parseArgs(["--list", "xml"]);

    expect(error.message).toBe(
      "xml is an invalid format for --list\nUse one of the following: table, json"
    );
    expect(logErrorAndExit).toHaveBeenCalledWith(
      "xml is an invalid format for --list\nUse one of the following: table, json"
    );
  });
});
