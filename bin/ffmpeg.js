import dayjs from "dayjs";
import fs from "fs";
import { LOG_LEVELS, logMessage } from "./logger.js";
import { spawnWithPromise } from "./spawn.js";
import { AUDIO_FORMATS, VIDEO_EXTS, escapeArgForShell } from "./util.js";

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
    return outputPath;
  }

  const shouldEmbedImage = embedMetadata && episodeImageOutputPath;
  const targetFormat = audioFormat ? AUDIO_FORMATS[audioFormat] : null;
  const sourceFormat = Object.values(AUDIO_FORMATS).find((format) => format.ext === ext);
  const outputExt = targetFormat ? targetFormat.ext : ext;
  const usedFullStreamCopy = embedMetadata && !bitrate && !mono && !targetFormat;
  const keepVideo = !targetFormat && VIDEO_EXTS.has(ext);
  const supportsAttachedPic = keepVideo || (targetFormat || sourceFormat)?.attachedPic;
  const shouldCopyVideo = shouldEmbedImage || (embedMetadata && (bitrate || mono) && !targetFormat);
  const shouldMarkAttachedPic = shouldEmbedImage && supportsAttachedPic;

  const args = ["-nostdin", "-y", "-loglevel", "quiet", "-i", outputPath];

  if (shouldEmbedImage) {
    args.push("-i", episodeImageOutputPath);
  }

  if (bitrate) {
    args.push("-b:a", bitrate);
  }

  if (mono) {
    args.push("-ac", "1");
  }

  if (targetFormat) {
    args.push("-c:a", targetFormat.codec);
  } else if (usedFullStreamCopy) {
    args.push("-c", "copy");
  }

  if (shouldCopyVideo && !usedFullStreamCopy) {
    args.push("-c:v", "copy");
  }

  if (shouldMarkAttachedPic) {
    args.push(`-disposition:v:${keepVideo ? 1 : 0}`, "attached_pic");
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
    const date = item.pubDate ? dayjs(new Date(item.pubDate)).format("YYYY-MM-DD") : "";

    const metaKeysToValues = {
      album,
      artist,
      album_artist: artist,
      title,
      subtitle,
      comment,
      disc,
      track,
      "episode-type": episodeType,
      date,
    };

    args.push("-map_metadata", "0");

    Object.keys(metaKeysToValues).forEach((key) => {
      const value = metaKeysToValues[key];
      if (value) {
        args.push("-metadata", `${key}=${value}`);
      }
    });
  }

  if (shouldEmbedImage) {
    args.push("-map", keepVideo ? "0" : "0:a", "-map", "1");
  } else if (targetFormat) {
    args.push("-map", "0:a");
  } else {
    args.push("-map", "0");
  }

  const tmpPath = `${outputPath}.tmp${outputExt}`;
  args.push(tmpPath);
  const commandForLogging = ["ffmpeg", ...args].map(escapeArgForShell).join(" ");
  logMessage("Running command: " + commandForLogging, LOG_LEVELS.debug);

  try {
    await spawnWithPromise("ffmpeg", args, { stdio: "ignore" });
  } catch (error) {
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }

    throw error;
  }

  const finalOutputPath = (() => {
    if (!targetFormat) {
      return outputPath;
    }

    const hasExt = /\.[^.]+$/.test(outputPath);
    return hasExt ? outputPath.replace(/\.[^.]+$/, outputExt) : outputPath + outputExt;
  })();

  try {
    fs.renameSync(tmpPath, finalOutputPath);
  } catch (error) {
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }

    throw error;
  }

  if (finalOutputPath !== outputPath) {
    fs.unlinkSync(outputPath);
  }

  return finalOutputPath;
};
