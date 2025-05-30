import fs from "fs";
import { getIsInArchive, writeToArchive } from "./archive.js";
import { logMessage } from "./logger.js";
import { getPublicObject } from "./util.js";

export const writeFeedMeta = ({ outputPath, feed, key, archive, override }) => {
  if (key && archive && getIsInArchive({ key, archive })) {
    logMessage("Feed metadata exists in archive. Skipping...");
    return;
  }
  const output = getPublicObject(feed, ["items"]);

  try {
    if (override || !fs.existsSync(outputPath)) {
      fs.writeFileSync(outputPath, JSON.stringify(output, null, 4));
    } else {
      logMessage("Feed metadata exists locally. Skipping...");
    }

    if (key && archive && !getIsInArchive({ key, archive })) {
      try {
        writeToArchive({ key, archive });
      } catch (error) {
        throw new Error(`Error writing to archive: ${error.toString()}`);
      }
    }
  } catch (error) {
    throw new Error(
      `Unable to save metadata file for feed: ${error.toString()}`
    );
  }
};

export const writeItemMeta = ({
  marker,
  outputPath,
  item,
  key,
  archive,
  override,
}) => {
  if (key && archive && getIsInArchive({ key, archive })) {
    logMessage(`${marker} | Episode metadata exists in archive. Skipping...`);
    return;
  }

  const output = getPublicObject(item);

  try {
    if (override || !fs.existsSync(outputPath)) {
      fs.writeFileSync(outputPath, JSON.stringify(output, null, 4));
    } else {
      logMessage(`${marker} | Episode metadata exists locally. Skipping...`);
    }

    if (key && archive && !getIsInArchive({ key, archive })) {
      try {
        writeToArchive({ key, archive });
      } catch (error) {
        throw new Error("Error writing to archive", error);
      }
    }
  } catch (error) {
    throw new Error("Unable to save meta file for episode", error);
  }
};
