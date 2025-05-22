/* eslint-disable no-console */

export const ERROR_STATUSES = {
  general: 1,
  nothingDownloaded: 2,
  completedWithErrors: 3,
};

export const LOG_LEVEL_TYPES = {
  debug: "debug",
  quiet: "quiet",
  silent: "silent",
  static: "static",
};

export const LOG_LEVELS = {
  debug: 0,
  info: 1,
  important: 2,
};

export const getShouldOutputProgressIndicator = () => {
  return (
    process.stdout.isTTY &&
    process.env.LOG_LEVEL !== LOG_LEVEL_TYPES.static &&
    process.env.LOG_LEVEL !== LOG_LEVEL_TYPES.quiet &&
    process.env.LOG_LEVEL !== LOG_LEVEL_TYPES.silent
  );
};

export const logMessage = (message = "", logLevel = 1) => {
  if (
    !process.env.LOG_LEVEL ||
    process.env.LOG_LEVEL === LOG_LEVEL_TYPES.debug ||
    process.env.LOG_LEVEL === LOG_LEVEL_TYPES.static
  ) {
    console.log(message);
    return;
  }

  if (process.env.LOG_LEVEL === LOG_LEVEL_TYPES.silent) {
    return;
  }

  if (
    process.env.LOG_LEVEL === LOG_LEVEL_TYPES.quiet &&
    logLevel > LOG_LEVELS.info
  ) {
    console.log(message);
    return;
  }
};

export const getLogMessageWithMarker = (marker) => {
  return (message, logLevel) => {
    if (marker) {
      logMessage(`${marker} | ${message}`, logLevel);
    } else {
      logMessage(message, logLevel);
    }
  };
};

export const logError = (msg, error) => {
  if (process.env.LOG_LEVEL === LOG_LEVEL_TYPES.silent) {
    return;
  }

  console.error(msg);

  if (error) {
    console.error(error.message);
  }
};

export const logErrorAndExit = (msg, error) => {
  console.error(msg);

  if (error) {
    console.error(error.message);
  }

  process.exit(ERROR_STATUSES.general);
};
