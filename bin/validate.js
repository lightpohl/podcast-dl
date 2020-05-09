const logError = (msg, error) => {
  console.error(msg);

  if (error) {
    console.error(error);
  }
};

const logErrorAndExit = (msg, error) => {
  logError(msg, error);
  process.exit(1);
};

const createParseNumber = ({ min, name, required = true }) => {
  return (value) => {
    if (!value && !required) {
      return undefined;
    }

    try {
      let number = parseInt(value);

      if (isNaN(number)) {
        logErrorAndExit(`${name} must be a number`);
      }

      if (number < min) {
        logErrorAndExit(`${name} must be >= ${min}`);
      }

      return number;
    } catch (error) {
      logErrorAndExit(`Unable to parse ${name}`);
    }
  };
};

const parseArchivePath = (value) => {
  if (!value.length) {
    logErrorAndExit("Must provide --archive path");
  }

  return value;
};

module.exports = {
  createParseNumber,
  logError,
  logErrorAndExit,
  parseArchivePath,
};
