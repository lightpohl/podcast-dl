import fs from "fs";
import { logMessage } from "./logger.js";
import { getPublicObject } from "./util.js";

export const writeFeedMeta = ({ outputPath, feed, override }) => {
  const output = getPublicObject(feed, ["items"]);

  try {
    if (override || !fs.existsSync(outputPath)) {
      fs.writeFileSync(outputPath, JSON.stringify(output, null, 4));
    } else {
      logMessage("Feed metadata exists locally. Skipping...");
    }
  } catch (error) {
    throw new Error(
      `Unable to save metadata file for feed: ${error.toString()}`
    );
  }
};

export const writeItemMeta = ({ marker, outputPath, item, override }) => {
  const output = getPublicObject(item);

  try {
    if (override || !fs.existsSync(outputPath)) {
      fs.writeFileSync(outputPath, JSON.stringify(output, null, 4));
    } else {
      logMessage(`${marker} | Episode metadata exists locally. Skipping...`);
    }
  } catch (error) {
    throw new Error("Unable to save meta file for episode", error);
  }
};
