const { logErrorAndExit } = require("./logger");

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

module.exports = {
  createParseNumber,
};
