import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { LOG_LEVELS, logMessage } from "./logger.js";
import { spawnWithPromise } from "./spawn.js";
import {
  AUDIO_FORMATS,
  VIDEO_EXTS,
  escapeArgForShell,
  getTempPath,
  publishTempFile,
} from "./util.js";

const VIDEO_ATTACHED_PIC_EXTS = new Set([".mov", ".mp4"]);

export const runFfmpeg = async ({
  audioFormat,
  bitrate,
  embedMetadata,
  episodeImageOutputPath,
  feed,
  item,
  itemIndex,
  mono,
  outputPath,
  override,
}) => {
  if (!fs.existsSync(outputPath)) {
    return outputPath;
  }

  const sourceExt = path.extname(outputPath).toLowerCase();
  const targetFormat = audioFormat ? AUDIO_FORMATS[audioFormat] : null;
  const sourceFormat = Object.values(AUDIO_FORMATS).find((format) => format.ext === sourceExt);
  const outputExt = targetFormat ? targetFormat.ext : sourceExt;
  const usedFullStreamCopy = embedMetadata && !bitrate && !mono && !targetFormat;
  const keepVideo = !targetFormat && VIDEO_EXTS.has(sourceExt);
  const supportsAttachedPic = keepVideo
    ? VIDEO_ATTACHED_PIC_EXTS.has(sourceExt)
    : (targetFormat || sourceFormat)?.attachedPic;
  const shouldEmbedImage = embedMetadata && episodeImageOutputPath && supportsAttachedPic;
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

  const tmpPath = getTempPath({
    outputPath,
    id: randomUUID(),
    type: "ffmpeg",
    ext: outputExt,
  });
  const removeTempOutput = () => {
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
  };

  args.push(tmpPath);
  const commandForLogging = ["ffmpeg", ...args].map(escapeArgForShell).join(" ");
  logMessage("Running command: " + commandForLogging, LOG_LEVELS.debug);

  try {
    await spawnWithPromise("ffmpeg", args, { stdio: "ignore" });
  } catch (error) {
    removeTempOutput();
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
    publishTempFile({
      tempPath: tmpPath,
      outputPath: finalOutputPath,
      override: override || finalOutputPath === outputPath,
    });
  } catch (error) {
    removeTempOutput();
    throw error;
  }

  if (finalOutputPath !== outputPath) {
    fs.unlinkSync(outputPath);
  }

  return finalOutputPath;
};
