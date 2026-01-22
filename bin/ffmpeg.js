import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import { execWithPromise } from "./exec.js";
import { LOG_LEVELS, logMessage } from "./logger.js";
import { escapeArgForShell, isWin } from "./util.js";

export const runFfmpeg = async ({
  feed,
  item,
  itemIndex,
  outputPath,
  episodeImageOutputPath,
  bitrate,
  mono,
  addMp3Metadata,
  ext,
}) => {
  if (!fs.existsSync(outputPath)) {
    return;
  }

  const shouldEmbedImage = addMp3Metadata && episodeImageOutputPath;
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

  if (addMp3Metadata) {
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

  // When adjusting bitrate, we need to re-encode. Determine codec based on extension.
  const codecMap = {
    ".mp3": "libmp3lame",
    ".m4a": "aac",
    ".aac": "aac",
    ".ogg": "libvorbis",
    ".opus": "libopus",
    ".flac": "flac",
    ".wav": "pcm_s16le",
    ".mp4": "aac",
    ".mov": "aac",
    ".m4v": "aac",
  };
  const needsReencode = bitrate || mono;
  const audioCodec = codecMap[ext?.toLowerCase()] || "libmp3lame";

  if (addMp3Metadata && !needsReencode) {
    command += ` -codec copy`;
  } else if (needsReencode) {
    command += ` -c:a ${audioCodec}`;
  }

  if (shouldEmbedImage) {
    command += ` -map 0 -map 1`;
  } else {
    command += ` -map 0`;
  }

  // Insert .tmp before the extension (e.g., file.mp3 -> file.tmp.mp3)
  const { dir, name, ext: fileExt } = path.parse(outputPath);
  const tmpMp3Path = path.format({ dir, name: `${name}.tmp`, ext: fileExt });
  command += ` ${escapeArgForShell(tmpMp3Path)}`;
  logMessage("Running command: " + command, LOG_LEVELS.debug);

  try {
    await execWithPromise(command, { stdio: "ignore" });
  } catch (error) {
    if (fs.existsSync(tmpMp3Path)) {
      fs.unlinkSync(tmpMp3Path);
    }

    throw error;
  }

  fs.unlinkSync(outputPath);
  fs.renameSync(tmpMp3Path, outputPath);
};
