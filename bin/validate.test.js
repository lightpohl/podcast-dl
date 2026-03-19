import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadValidate = async ({ commandExists = true } = {}) => {
  vi.resetModules();

  const logErrorAndExit = vi.fn();
  const commandExistsSync = vi.fn(() => commandExists);

  vi.doMock("./logger.js", () => ({ logErrorAndExit }));
  vi.doMock("command-exists", () => ({ sync: commandExistsSync }));

  const module = await import("./validate.js");

  return {
    ...module,
    commandExistsSync,
    logErrorAndExit,
  };
};

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("createParseNumber", () => {
  it("returns undefined for missing optional values", async () => {
    const { createParseNumber, logErrorAndExit } = await loadValidate();
    const parseNumber = createParseNumber({
      min: 1,
      max: 10,
      name: "count",
      required: false,
    });

    expect(parseNumber("")).toBeUndefined();
    expect(logErrorAndExit).not.toHaveBeenCalled();
  });

  it("parses valid integers", async () => {
    const { createParseNumber, logErrorAndExit } = await loadValidate();
    const parseNumber = createParseNumber({ min: 1, max: 10, name: "count" });

    expect(parseNumber("7")).toBe(7);
    expect(logErrorAndExit).not.toHaveBeenCalled();
  });

  it("logs an error when the value is not numeric", async () => {
    const { createParseNumber, logErrorAndExit } = await loadValidate();
    const parseNumber = createParseNumber({ min: 1, max: 10, name: "count" });

    parseNumber("nope");

    expect(logErrorAndExit).toHaveBeenCalledWith("count must be a number");
  });

  it("logs an error when the value is below the minimum", async () => {
    const { createParseNumber, logErrorAndExit } = await loadValidate();
    const parseNumber = createParseNumber({ min: 3, max: 10, name: "count" });

    parseNumber("2");

    expect(logErrorAndExit).toHaveBeenCalledWith("count must be >= 3");
  });

  it("logs an error when the value is above the maximum", async () => {
    const { createParseNumber, logErrorAndExit } = await loadValidate();
    const parseNumber = createParseNumber({ min: 1, max: 5, name: "count" });

    parseNumber("6");

    expect(logErrorAndExit).toHaveBeenCalledWith("count must be <= 5");
  });

  it("uses the Number.MAX_SAFE_INTEGER label in the max error message", async () => {
    const { createParseNumber, logErrorAndExit } = await loadValidate();
    const parseNumber = createParseNumber({
      min: 1,
      max: Number.MAX_SAFE_INTEGER,
      name: "count",
    });

    parseNumber(`${Number.MAX_SAFE_INTEGER + 1}`);

    expect(logErrorAndExit).toHaveBeenCalledWith(
      "count must be <= Number.MAX_SAFE_INTEGER"
    );
  });

  it("logs a generic parse failure when parsing throws", async () => {
    const { createParseNumber, logErrorAndExit } = await loadValidate();
    const parseNumber = createParseNumber({ min: 1, max: 10, name: "count" });

    parseNumber(Symbol("count"));

    expect(logErrorAndExit).toHaveBeenCalledWith("Unable to parse count");
  });
});

describe("hasFfmpeg", () => {
  it("returns the original value when ffmpeg exists", async () => {
    const { hasFfmpeg, commandExistsSync, logErrorAndExit } =
      await loadValidate({
        commandExists: true,
      });

    expect(hasFfmpeg("copy")).toBe("copy");
    expect(commandExistsSync).toHaveBeenCalledWith("ffmpeg");
    expect(logErrorAndExit).not.toHaveBeenCalled();
  });

  it("caches the command lookup across calls", async () => {
    const { hasFfmpeg, commandExistsSync } = await loadValidate({
      commandExists: true,
    });

    expect(hasFfmpeg("first")).toBe("first");
    expect(hasFfmpeg("second")).toBe("second");
    expect(commandExistsSync).toHaveBeenCalledTimes(1);
  });

  it("logs an error when ffmpeg is unavailable", async () => {
    const { hasFfmpeg, logErrorAndExit } = await loadValidate({
      commandExists: false,
    });

    hasFfmpeg("copy");

    expect(logErrorAndExit).toHaveBeenCalledWith(
      'option specified requires "ffmpeg" be available'
    );
  });
});
