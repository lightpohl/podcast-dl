import fs from "fs";
import path from "path";
import rssParser from "rss-parser";
import { logErrorAndExit, logMessage } from "./logger.js";

export const isWin = process.platform === "win32";

export const defaultRssParserConfig = {
  defaultRSS: 2.0,
  headers: {
    Accept: "*/*",
  },
  customFields: {
    item: [["podcast:transcript", "podcastTranscripts", { keepArray: true }]],
  },
};

/*
  Escape arguments for a shell command used with exec.
  Borrowed from shell-escape: https://github.com/xxorax/node-shell-escape/
  Additionally, @see https://www.robvanderwoude.com/escapechars.php for why
    we avoid trying to escape complex sequences in Windows.
*/
export const escapeArgForShell = (arg) => {
  let result = arg;

  if (/[^A-Za-z0-9_/:=-]/.test(result)) {
    if (isWin) {
      return `"${result}"`;
    } else {
      result = "'" + result.replace(/'/g, "'\\''") + "'";
      result = result
        .replace(/^(?:'')+/g, "") // unduplicate single-quote at the beginning
        .replace(/\\'''/g, "\\'"); // remove non-escaped single-quote if there are enclosed between 2 escaped
    }
  }

  return result;
};

export const getTempPath = (path) => {
  return `${path}.tmp`;
};

export const prepareOutputPath = (outputPath) => {
  const outputPathSegments = outputPath.split(path.sep);
  outputPathSegments.pop();

  const directoryOutputPath = outputPathSegments.join(path.sep);

  if (directoryOutputPath.length) {
    fs.mkdirSync(directoryOutputPath, { recursive: true });
  }
};

export const getPublicObject = (object, exclude = []) => {
  const output = {};
  Object.keys(object).forEach((key) => {
    if (!key.startsWith("_") && !exclude.includes(key) && object[key]) {
      output[key] = object[key];
    }
  });

  return output;
};

export const getFileString = (filePath) => {
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

export const getJsonFile = (filePath) => {
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

export const getLoopControls = ({ offset, length, reverse }) => {
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

export const logFeedInfo = (feed) => {
  logMessage(feed.title);
  logMessage(feed.description);
  logMessage();
};

export const getUrlExt = (url) => {
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

export const AUDIO_TYPES_TO_EXTS = {
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

export const VALID_AUDIO_EXTS = [
  ...new Set(Object.values(AUDIO_TYPES_TO_EXTS)),
];

export const getIsAudioUrl = (url) => {
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

export const AUDIO_ORDER_TYPES = {
  enclosure: "enclosure",
  link: "link",
};

export const getEpisodeAudioUrlAndExt = (
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

export const getImageUrl = ({ image, itunes }) => {
  if (image?.url && typeof image.url === "string") {
    return image.url;
  }

  if (image?.link && typeof image.link === "string") {
    return image.link;
  }

  if (itunes?.image && typeof itunes.image === "string") {
    return itunes.image;
  }

  return null;
};

export const TRANSCRIPT_TYPES = {
  "application/json": "application/json",
  "application/srr": "application/srr",
  "application/srt": "application/srt",
  "application/x-subrip": "application/x-subrip",
  "text/html": "text/html",
  "text/plain": "text/plain",
  "text/vtt": "text/vtt",
};

// @see https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#transcript
export const getTranscriptUrl = (item, transcriptTypes = []) => {
  if (!item.podcastTranscripts?.length) {
    return null;
  }

  for (const transcriptType of transcriptTypes) {
    const matchingTranscriptType = item.podcastTranscripts.find(
      (transcript) =>
        !!transcript?.["$"]?.url && transcript?.["$"]?.type === transcriptType
    );

    if (matchingTranscriptType) {
      return matchingTranscriptType?.["$"]?.url;
    }
  }

  return null;
};

export const getFileFeed = async (filePath, parserConfig) => {
  const config = parserConfig
    ? getJsonFile(parserConfig)
    : defaultRssParserConfig;
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

export const getUrlFeed = async (url, parserConfig) => {
  const config = parserConfig
    ? getJsonFile(parserConfig)
    : defaultRssParserConfig;

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
