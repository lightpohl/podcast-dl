import dayjs from "dayjs";
import fs from "fs";
import { execWithPromise } from "./exec.js";
import { LOG_LEVELS, logMessage } from "./logger.js";
import { escapeArgForShell, isWin } from "./util.js";

const AUDIO_FORMATS = {
  m4a: { codec: "aac", ext: ".m4a" },
  aac: { codec: "aac", ext: ".aac" },
  mp3: { codec: "libmp3lame", ext: ".mp3" },
  opus: { codec: "libopus", ext: ".opus" },
  ogg: { codec: "libvorbis", ext: ".ogg" },
  flac: { codec: "flac", ext: ".flac" },
  wav: { codec: "pcm_s16le", ext: ".wav" },
};

export const runFfmpeg = async ({
  feed,
  item,
  itemIndex,
  outputPath,
  episodeImageOutputPath,
  bitrate,
  mono,
  audioFormat,
  addMetadata,
  ext,
}) => {
  if (!fs.existsSync(outputPath)) {
    return;
  }

  const formatConfig = audioFormat ? AUDIO_FORMATS[audioFormat] : null;
  const outputExt = formatConfig ? formatConfig.ext : ext;
  const finalOutputPath = formatConfig
    ? outputPath.replace(/\.[^.]+$/, outputExt)
    : null;

  const shouldEmbedImage = addMetadata && episodeImageOutputPath;

  let command = `ffmpeg -loglevel quiet -i ${escapeArgForShell(outputPath)}`;

  if (shouldEmbedImage) {
    command += ` -i ${escapeArgForShell(episodeImageOutputPath)}`;
  }

  // Build metadata if needed
  let metadataString = "";
  if (addMetadata) {
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
      metaKeysToValues.comment = comment;
      metaKeysToValues.subtitle = subtitle;
    }

    metadataString = Object.keys(metaKeysToValues)
      .map((key) => {
        if (!metaKeysToValues[key]) {
          return null;
        }
        const argValue = escapeArgForShell(metaKeysToValues[key]);
        return argValue ? `-metadata ${key}=${argValue}` : null;
      })
      .filter((segment) => !!segment)
      .join(" ");
  }

  // Map streams: always use audio stream from first input
  command += " -map 0:a:0";

  // Add image if available
  if (shouldEmbedImage) {
    command += " -map 1";
    // For m4a/mp4, mark as attached picture
    if (formatConfig && formatConfig.ext === ".m4a") {
      command += " -disposition:v:0 attached_pic";
    }
  }

  // Add metadata from first input
  command += " -map_metadata 0";
  if (metadataString) {
    command += ` ${metadataString}`;
  }

  // Set codec
  if (formatConfig) {
    command += ` -c:a ${formatConfig.codec}`;
    // For image embedded in m4a, use copy for video
    if (shouldEmbedImage) {
      command += " -c:v copy";
    }
  } else {
    command += " -c:a copy";
    if (shouldEmbedImage) {
      command += " -c:v copy -disposition:v:0 attached_pic";
    }
  }

  // Additional audio options
  if (bitrate) {
    command += ` -b:a ${bitrate}`;
  }

  if (mono) {
    command += " -ac 1";
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
  fs.renameSync(tmpPath, finalOutputPath || outputPath);

  return finalOutputPath;
};
