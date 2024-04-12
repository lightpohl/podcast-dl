import rssParser from "rss-parser";
import path from "path";
import fs from "fs";
import dayjs from "dayjs";
import util from "util";
import { exec } from "child_process";

import { logErrorAndExit, logMessage, LOG_LEVELS } from "./logger.js";
import { getArchiveFilename, getItemFilename } from "./naming.js";

const execWithPromise = util.promisify(exec);
const isWin = process.platform === "win32";

/*
  Escape arguments for a shell command used with exec.
  Borrowed from shell-escape: https://github.com/xxorax/node-shell-escape/
  Additionally, @see https://www.robvanderwoude.com/escapechars.php for why
    we avoid trying tp escape complex sequences in Windows.
*/
const escapeArgForShell = (arg) => {
  let result = arg;

  if (/[^A-Za-z0-9_/:=-]/.test(result)) {
    if (isWin) {
      return null;
    } else {
      result = "'" + result.replace(/'/g, "'\\''") + "'";
      result = result
        .replace(/^(?:'')+/g, "") // unduplicate single-quote at the beginning
        .replace(/\\'''/g, "\\'"); // remove non-escaped single-quote if there are enclosed between 2 escaped
    }
  }

  return result;
};

const getTempPath = (path) => {
  return `${path}.tmp`;
};

const prepareOutputPath = (outputPath) => {
  const outputPathSegments = outputPath.split(path.sep);
  outputPathSegments.pop();

  const directoryOutputPath = outputPathSegments.join(path.sep);

  if (directoryOutputPath.length) {
    fs.mkdirSync(directoryOutputPath, { recursive: true });
  }
};

const getArchiveKey = ({ prefix, name }) => {
  return `${prefix}-${name}`;
};

const getPublicObject = (object, exclude = []) => {
  const output = {};
  Object.keys(object).forEach((key) => {
    if (!key.startsWith("_") && !exclude.includes(key) && object[key]) {
      output[key] = object[key];
    }
  });

  return output;
};

const getFileString = (filePath) => {
  const fullPath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const data = fs.readFileSync(fullPath, "utf8");

  if (!data) {
    return null;
  }

  return data;
};

const getJsonFile = (filePath) => {
  const fullPath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const data = fs.readFileSync(fullPath);

  if (!data) {
    return null;
  }

  return JSON.parse(data);
};

const getArchive = (archive) => {
  const archiveContent = getJsonFile(archive);
  return archiveContent === null ? [] : archiveContent;
};

const writeToArchive = ({ key, archive }) => {
  const archivePath = path.resolve(process.cwd(), archive);
  const archiveResult = getArchive(archive);

  if (!archiveResult.includes(key)) {
    archiveResult.push(key);
  }

  fs.writeFileSync(archivePath, JSON.stringify(archiveResult, null, 4));
};

const getIsInArchive = ({ key, archive }) => {
  const archiveResult = getArchive(archive);
  return archiveResult.includes(key);
};

const getLoopControls = ({ offset, length, reverse }) => {
  if (reverse) {
    const startIndex = length - 1 - offset;
    const min = -1;
    const shouldGo = (i) => i > min;
    const decrement = (i) => i - 1;

    return {
      startIndex,
      shouldGo,
      next: decrement,
    };
  }

  const startIndex = 0 + offset;
  const max = length;
  const shouldGo = (i) => i < max;
  const increment = (i) => i + 1;

  return {
    startIndex,
    shouldGo,
    next: increment,
  };
};

const getItemsToDownload = ({
  archive,
  archiveUrl,
  basePath,
  feed,
  limit,
  offset,
  reverse,
  before,
  after,
  episodeDigits,
  episodeRegex,
  episodeSourceOrder,
  episodeTemplate,
  includeEpisodeImages,
}) => {
  const { startIndex, shouldGo, next } = getLoopControls({
    offset,
    reverse,
    length: feed.items.length,
  });

  let i = startIndex;
  const items = [];

  const savedArchive = archive ? getArchive(archive) : [];

  while (shouldGo(i)) {
    const { title, pubDate } = feed.items[i];
    const pubDateDay = dayjs(new Date(pubDate));
    let isValid = true;

    if (episodeRegex) {
      const generatedEpisodeRegex = new RegExp(episodeRegex);
      if (title && !generatedEpisodeRegex.test(title)) {
        isValid = false;
      }
    }

    if (before) {
      const beforeDateDay = dayjs(new Date(before));
      if (
        !pubDateDay.isSame(beforeDateDay, "day") &&
        !pubDateDay.isBefore(beforeDateDay, "day")
      ) {
        isValid = false;
      }
    }

    if (after) {
      const afterDateDay = dayjs(new Date(after));
      if (
        !pubDateDay.isSame(afterDateDay, "day") &&
        !pubDateDay.isAfter(afterDateDay, "day")
      ) {
        isValid = false;
      }
    }

    const { url: episodeAudioUrl, ext: audioFileExt } =
      getEpisodeAudioUrlAndExt(feed.items[i], episodeSourceOrder);
    const key = getArchiveKey({
      prefix: archiveUrl,
      name: getArchiveFilename({
        pubDate,
        name: title,
        ext: audioFileExt,
      }),
    });

    if (key && savedArchive.includes(key)) {
      isValid = false;
    }

    if (isValid) {
      const item = feed.items[i];
      item._originalIndex = i;
      item._extra_downloads = [];

      if (includeEpisodeImages) {
        const episodeImageUrl = getImageUrl(item);

        if (episodeImageUrl) {
          const episodeImageFileExt = getUrlExt(episodeImageUrl);
          const episodeImageArchiveKey = getArchiveKey({
            prefix: archiveUrl,
            name: getArchiveFilename({
              pubDate,
              name: title,
              ext: episodeImageFileExt,
            }),
          });

          const episodeImageName = getItemFilename({
            item,
            feed,
            url: episodeAudioUrl,
            ext: episodeImageFileExt,
            template: episodeTemplate,
            width: episodeDigits,
          });

          const outputImagePath = path.resolve(basePath, episodeImageName);
          item._extra_downloads.push({
            url: episodeImageUrl,
            outputPath: outputImagePath,
            key: episodeImageArchiveKey,
          });
        }
      }

      items.push(item);
    }

    i = next(i);
  }

  return limit ? items.slice(0, limit) : items;
};

const logFeedInfo = (feed) => {
  logMessage(feed.title);
  logMessage(feed.description);
  logMessage();
};

const ITEM_LIST_FORMATS = ["table", "json"];

const logItemsList = ({
  type,
  feed,
  limit,
  offset,
  reverse,
  before,
  after,
  episodeRegex,
}) => {
  const items = getItemsToDownload({
    feed,
    limit,
    offset,
    reverse,
    before,
    after,
    episodeRegex,
  });

  if (!items.length) {
    logErrorAndExit("No episodes found with provided criteria to list");
  }

  const isJson = type === "json";

  const output = items.map((item) => {
    const data = {
      episodeNum: feed.items.length - item._originalIndex,
      title: item.title,
      pubDate: item.pubDate,
    };

    return data;
  });

  if (isJson) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(output));
    return;
  }

  // eslint-disable-next-line no-console
  console.table(output);
};

const writeFeedMeta = ({ outputPath, feed, key, archive, override }) => {
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

const writeItemMeta = ({
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

const getUrlExt = (url) => {
  if (!url) {
    return "";
  }

  const { pathname } = new URL(url);

  if (!pathname) {
    return "";
  }

  const ext = path.extname(pathname);
  return ext;
};

const AUDIO_TYPES_TO_EXTS = {
  "audio/aac": ".aac",
  "audio/flac": ".flac",
  "audio/mp3": ".mp3",
  "audio/mp4": ".m4a",
  "audio/mpeg": ".mp3",
  "audio/ogg": ".ogg",
  "audio/opus": ".opus",
  "audio/vorbis": ".ogg",
  "audio/wav": ".wav",
  "audio/x-m4a": ".m4a",
  "audio/x-wav": ".wav",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/x-m4v": ".m4v",
};

const VALID_AUDIO_EXTS = [...new Set(Object.values(AUDIO_TYPES_TO_EXTS))];

const getIsAudioUrl = (url) => {
  let ext;
  try {
    ext = getUrlExt(url);
  } catch (err) {
    return false;
  }

  if (!ext) {
    return false;
  }

  return VALID_AUDIO_EXTS.includes(ext);
};

const AUDIO_ORDER_TYPES = {
  enclosure: "enclosure",
  link: "link",
};

const getEpisodeAudioUrlAndExt = (
  { enclosure, link },
  order = [AUDIO_ORDER_TYPES.enclosure, AUDIO_ORDER_TYPES.link]
) => {
  for (const source of order) {
    if (source === AUDIO_ORDER_TYPES.link && link && getIsAudioUrl(link)) {
      return { url: link, ext: getUrlExt(link) };
    }

    if (source === AUDIO_ORDER_TYPES.enclosure && enclosure) {
      if (getIsAudioUrl(enclosure.url)) {
        return { url: enclosure.url, ext: getUrlExt(enclosure.url) };
      }

      if (enclosure.url && AUDIO_TYPES_TO_EXTS[enclosure.type]) {
        return { url: enclosure.url, ext: AUDIO_TYPES_TO_EXTS[enclosure.type] };
      }
    }
  }

  return { url: null, ext: null };
};

const getImageUrl = ({ image, itunes }) => {
  if (image?.url) {
    return image.url;
  }

  if (image?.link) {
    return image.link;
  }

  if (itunes?.image) {
    return itunes.image;
  }

  return null;
};

const getFileFeed = async (filePath, parserConfig) => {
  const defaultConfig = {
    defaultRSS: 2.0,
  };

  const config = parserConfig ? getJsonFile(parserConfig) : defaultConfig;
  const rssString = getFileString(filePath);

  if (parserConfig && !config) {
    logErrorAndExit(`Unable to load parser config: ${parserConfig}`);
  }

  const parser = new rssParser(config);

  let feed;
  try {
    feed = await parser.parseString(rssString);
  } catch (err) {
    logErrorAndExit("Unable to parse local RSS file", err);
  }

  return feed;
};

const getUrlFeed = async (url, parserConfig) => {
  const defaultConfig = {
    defaultRSS: 2.0,
  };

  const config = parserConfig ? getJsonFile(parserConfig) : defaultConfig;

  if (parserConfig && !config) {
    logErrorAndExit(`Unable to load parser config: ${parserConfig}`);
  }

  const parser = new rssParser(config);

  const { href } = new URL(url);

  let feed;
  try {
    feed = await parser.parseURL(href);
  } catch (err) {
    logErrorAndExit("Unable to parse RSS URL", err);
  }

  return feed;
};

const runFfmpeg = async ({
  feed,
  item,
  itemIndex,
  outputPath,
  bitrate,
  mono,
  addMp3Metadata,
  ext,
}) => {
  if (!fs.existsSync(outputPath)) {
    return;
  }

  let command = `ffmpeg -loglevel quiet -i "${outputPath}"`;

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
    const comment = item.content || "";
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
      subtitle,
      comment,
      disc,
      track,
      "episode-type": episodeType,
      date,
    };

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

    command += ` -map_metadata 0 ${metadataString} -codec copy`;
  }

  const tmpMp3Path = `${outputPath}.tmp${ext}`;
  command += ` "${tmpMp3Path}"`;
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

const runExec = async ({
  exec,
  basePath,
  outputPodcastPath,
  episodeFilename,
}) => {
  const episodeFilenameBase = episodeFilename.substring(
    0,
    episodeFilename.lastIndexOf(".")
  );

  const execCmd = exec
    .replace(/{{episode_path}}/g, `"${outputPodcastPath}"`)
    .replace(/{{episode_path_base}}/g, `"${basePath}"`)
    .replace(/{{episode_filename}}/g, `"${episodeFilename}"`)
    .replace(/{{episode_filename_base}}/g, `"${episodeFilenameBase}"`);

  await execWithPromise(execCmd, { stdio: "ignore" });
};

export {
  AUDIO_ORDER_TYPES,
  getArchive,
  getIsInArchive,
  getArchiveKey,
  writeToArchive,
  getEpisodeAudioUrlAndExt,
  getFileFeed,
  getImageUrl,
  getItemsToDownload,
  getTempPath,
  getUrlExt,
  getUrlFeed,
  logFeedInfo,
  ITEM_LIST_FORMATS,
  logItemsList,
  prepareOutputPath,
  writeFeedMeta,
  writeItemMeta,
  runFfmpeg,
  runExec,
};
