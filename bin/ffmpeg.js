import dayjs from "dayjs";
import fs from "fs";
import { execWithPromise } from "./exec.js";
import { LOG_LEVELS, logMessage } from "./logger.js";
import { AUDIO_FORMATS, escapeArgForShell, isWin } from "./util.js";

export const runFfmpeg = async ({
  audioFormat,
  bitrate,
  embedMetadata,
  episodeImageOutputPath,
  ext,
  feed,
  item,
  itemIndex,
  mono,
  outputPath,
}) => {
  if (!fs.existsSync(outputPath)) {
    return;
  }

  const shouldEmbedImage = embedMetadata && episodeImageOutputPath;
  const targetFormat = audioFormat ? AUDIO_FORMATS[audioFormat] : null;
  const outputExt = targetFormat ? targetFormat.ext : ext;

  let command = `ffmpeg -loglevel quiet -i ${escapeArgForShell(outputPath)}`;

  if (shouldEmbedImage) {
    command += ` -i ${escapeArgForShell(episodeImageOutputPath)}`;
  }

  if (bitrate) {
    command += ` -b:a ${bitrate}`;
  }

  if (mono) {
    command += " -ac 1";
  }

  if (targetFormat) {
    command += ` -c:a ${targetFormat.codec}`;
  } else if (embedMetadata && !bitrate && !mono) {
    command += ` -c:a copy`;
  }

  if (shouldEmbedImage) {
    const supportsAttachedPic = targetFormat
      ? targetFormat.attachedPic
      : Object.values(AUDIO_FORMATS).find((f) => f.ext === ext)?.attachedPic;
    command += supportsAttachedPic
      ? ` -c:v copy -disposition:v:0 attached_pic`
      : ` -c:v copy`;
  }

  if (embedMetadata) {
    const album = feed.title || "";
    const artist = item.itunes?.author || item.author || "";
    const title = item.title || "";
    const subtitle = item.itunes?.subtitle || "";
    const comment = item.contentSnippet || item.content || "";
    const disc = item.itunes?.season || "";
    const track = item.itunes?.episode || `${feed.items.length - itemIndex}`;
    const episodeType = item.itunes?.episodeType || "";
    const date = item.pubDate
      ? dayjs(new Date(item.pubDate)).format("YYYY-MM-DD")
      : "";

    const metaKeysToValues = {
      album,
      artist,
      album_artist: artist,
      title,
      disc,
      track,
      "episode-type": episodeType,
      date,
    };

    if (!isWin) {
      // Due to limited escape options, these metadata fields often break in Windows
      metaKeysToValues.comment = comment;
      metaKeysToValues.subtitle = subtitle;
    }

    const metadataString = Object.keys(metaKeysToValues)
      .map((key) => {
        if (!metaKeysToValues[key]) {
          return null;
        }

        const argValue = escapeArgForShell(metaKeysToValues[key]);

        return argValue ? `-metadata ${key}=${argValue}` : null;
      })
      .filter((segment) => !!segment)
      .join(" ");

    command += ` -map_metadata 0 ${metadataString}`;
  }

  if (shouldEmbedImage) {
    command += ` -map 0:a -map 1`;
  } else if (targetFormat) {
    command += ` -map 0:a`;
  } else {
    command += ` -map 0`;
  }

  const tmpPath = `${outputPath}.tmp${outputExt}`;
  command += ` ${escapeArgForShell(tmpPath)}`;
  logMessage("Running command: " + command, LOG_LEVELS.debug);

  try {
    await execWithPromise(command, { stdio: "ignore" });
  } catch (error) {
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }

    throw error;
  }

  fs.unlinkSync(outputPath);

  const finalOutputPath = (() => {
    if (!targetFormat) {
      return outputPath;
    }

    const hasExt = /\.[^.]+$/.test(outputPath);
    return hasExt
      ? outputPath.replace(/\.[^.]+$/, outputExt)
      : outputPath + outputExt;
  })();

  fs.renameSync(tmpPath, finalOutputPath);
};
