const ERROR_STATUSES = {
  general: 1,
  nothingDownloaded: 2,
};

const LOG_LEVEL_TYPES = {
  debug: "debug",
  quiet: "quiet",
  silent: "silent",
};

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  important: 2,
};

const getShouldOutputProgressIndicator = () => {
  return (
    process.stdout.isTTY &&
    process.env.LOG_LEVEL !== LOG_LEVEL_TYPES.quiet &&
    process.env.LOG_LEVEL !== LOG_LEVEL_TYPES.silent
  );
};

const logMessage = (message, logLevel = 1) => {
  if (!process.env.LOG_LEVEL) {
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
  } else if (process.env.LOG_LEVEL === LOG_LEVEL_TYPES.debug) {
    console.log(message);
  }
};

const logError = (msg, error) => {
  if (process.env.LOG_LEVEL === LOG_LEVEL_TYPES.silent) {
    return;
  }

  console.error(msg);

  if (error) {
    console.error(error.message);
  }
};

const logErrorAndExit = (msg, error) => {
  console.error(msg);

  if (error) {
    console.error(error.message);
  }

  process.exit(ERROR_STATUSES.general);
};

module.exports = {
  ERROR_STATUSES,
  getShouldOutputProgressIndicator,
  LOG_LEVELS,
  logMessage,
  logError,
  logErrorAndExit,
};
