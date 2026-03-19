/* eslint-disable no-console */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ERROR_STATUSES,
  LOG_LEVELS,
  LOG_LEVEL_TYPES,
  getLogMessageWithMarker,
  getShouldOutputProgressIndicator,
  logError,
  logErrorAndExit,
  logMessage,
} from "./logger.js";

const originalLogLevel = process.env.LOG_LEVEL;
const originalIsTTY = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");

const setIsTTY = (value) => {
  Object.defineProperty(process.stdout, "isTTY", {
    value,
    configurable: true,
  });
};

beforeEach(() => {
  delete process.env.LOG_LEVEL;
  setIsTTY(true);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(() => {
    throw new Error("process.exit");
  });
});

afterEach(() => {
  if (originalLogLevel === undefined) {
    delete process.env.LOG_LEVEL;
  } else {
    process.env.LOG_LEVEL = originalLogLevel;
  }

  if (originalIsTTY) {
    Object.defineProperty(process.stdout, "isTTY", originalIsTTY);
  } else {
    delete process.stdout.isTTY;
  }

  vi.restoreAllMocks();
});

describe("getShouldOutputProgressIndicator", () => {
  it("returns true when stdout is a tty and logging is enabled", () => {
    expect(getShouldOutputProgressIndicator()).toBe(true);
  });

  it("returns false when stdout is not a tty", () => {
    setIsTTY(false);

    expect(getShouldOutputProgressIndicator()).toBe(false);
  });

  it("returns false for suppressed log levels", () => {
    process.env.LOG_LEVEL = LOG_LEVEL_TYPES.static;
    expect(getShouldOutputProgressIndicator()).toBe(false);

    process.env.LOG_LEVEL = LOG_LEVEL_TYPES.quiet;
    expect(getShouldOutputProgressIndicator()).toBe(false);

    process.env.LOG_LEVEL = LOG_LEVEL_TYPES.silent;
    expect(getShouldOutputProgressIndicator()).toBe(false);
  });
});

describe("logMessage", () => {
  it("logs when no log level is set", () => {
    logMessage("hello");

    expect(console.log).toHaveBeenCalledWith("hello");
  });

  it("logs in debug and static modes", () => {
    process.env.LOG_LEVEL = LOG_LEVEL_TYPES.debug;
    logMessage("debug");

    process.env.LOG_LEVEL = LOG_LEVEL_TYPES.static;
    logMessage("static");

    expect(console.log).toHaveBeenNthCalledWith(1, "debug");
    expect(console.log).toHaveBeenNthCalledWith(2, "static");
  });

  it("suppresses info messages in quiet mode but keeps important ones", () => {
    process.env.LOG_LEVEL = LOG_LEVEL_TYPES.quiet;

    logMessage("info", LOG_LEVELS.info);
    logMessage("important", LOG_LEVELS.important);

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith("important");
  });

  it("suppresses all messages in silent mode", () => {
    process.env.LOG_LEVEL = LOG_LEVEL_TYPES.silent;

    logMessage("hidden");

    expect(console.log).not.toHaveBeenCalled();
  });
});

describe("getLogMessageWithMarker", () => {
  it("prefixes messages when a marker is present", () => {
    getLogMessageWithMarker("ep-1")("downloaded");

    expect(console.log).toHaveBeenCalledWith("ep-1 | downloaded");
  });

  it("passes messages through when the marker is empty", () => {
    getLogMessageWithMarker("")("downloaded");

    expect(console.log).toHaveBeenCalledWith("downloaded");
  });
});

describe("logError", () => {
  it("logs the message and error details", () => {
    logError("failed", new Error("boom"));

    expect(console.error).toHaveBeenNthCalledWith(1, "failed");
    expect(console.error).toHaveBeenNthCalledWith(2, "boom");
  });

  it("does nothing in silent mode", () => {
    process.env.LOG_LEVEL = LOG_LEVEL_TYPES.silent;

    logError("failed", new Error("boom"));

    expect(console.error).not.toHaveBeenCalled();
  });
});

describe("logErrorAndExit", () => {
  it("logs and exits with the general error status", () => {
    expect(() => logErrorAndExit("failed", new Error("boom"))).toThrow(
      "process.exit"
    );

    expect(console.error).toHaveBeenNthCalledWith(1, "failed");
    expect(console.error).toHaveBeenNthCalledWith(2, "boom");
    expect(process.exit).toHaveBeenCalledWith(ERROR_STATUSES.general);
  });
});
