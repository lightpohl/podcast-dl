import { sync as commandExistsSync } from "command-exists";
import { logErrorAndExit } from "./logger.js";

export const createParseNumber = ({ min, max, name, required = true }) => {
  return (value) => {
    if (!value && !required) {
      return undefined;
    }

    try {
      let number = parseInt(value);
      if (isNaN(number)) {
        logErrorAndExit(`${name} must be a number`);
      }

      if (typeof min !== undefined && number < min) {
        logErrorAndExit(`${name} must be >= ${min}`);
      }

      if (typeof max !== undefined && number > max) {
        logErrorAndExit(
          `${name} must be <= ${
            max === Number.MAX_SAFE_INTEGER ? "Number.MAX_SAFE_INTEGER" : max
          }`
        );
      }

      return number;
    } catch (error) {
      logErrorAndExit(`Unable to parse ${name}`);
    }
  };
};

export const hasFfmpeg = () => {
  if (!commandExistsSync("ffmpeg")) {
    logErrorAndExit('option specified requires "ffmpeg" be available');
  }
};
