import rssParser from "rss-parser";
import path from "path";
import fs from "fs";
import dayjs from "dayjs";
import got from "got";
import util from "util";
import { exec } from "child_process";

import { logErrorAndExit, logMessage } from "./logger.js";
import { getArchiveFilename, getFilename } from "./naming.js";

const execWithPromise = util.promisify(exec);

const parser = new rssParser({
  defaultRSS: 2.0,
});

const getArchiveKey = ({ prefix, name }) => {
  return `${prefix}-${name}`;
};

const getArchive = (archive) => {
  const archivePath = path.resolve(process.cwd(), archive);

  if (!fs.existsSync(archivePath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(archivePath));
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

const getPossibleUrlEmbeds = (url, maxAmount = 5) => {
  const fullUrl = new URL(url);
  const possibleStartIndexes = [];

  for (let i = 0; i < fullUrl.pathname.length; i++) {
    if (fullUrl.pathname[i] === "/") {
      possibleStartIndexes.push(i);
    }
  }

  const possibleEmbedChoices = possibleStartIndexes.map((startIndex) => {
    let possibleEmbed = fullUrl.pathname.slice(startIndex + 1);

    if (!possibleEmbed.startsWith("http")) {
      possibleEmbed = `https://${possibleEmbed}`;
    }

    return decodeURIComponent(possibleEmbed);
  });

  return possibleEmbedChoices
    .slice(Math.max(possibleEmbedChoices.length - maxAmount, 0))
    .reverse();
};

const getUrlEmbed = async (url) => {
  const possibleUrlEmbeds = getPossibleUrlEmbeds(url);
  for (const possibleUrl of possibleUrlEmbeds) {
    try {
      const embeddedUrl = new URL(possibleUrl);
      await got(embeddedUrl.href, {
        timeout: 3000,
        method: "HEAD",
        responseType: "json",
        headers: {
          accept: "*/*",
        },
      });

      return embeddedUrl;
    } catch (error) {
      // do nothing
    }
  }

  return null;
};

const getLoopControls = ({ limit, offset, length, reverse }) => {
  if (reverse) {
    const startIndex = length - 1 - offset;
    const min = limit ? Math.max(startIndex - limit, -1) : -1;
    const limitCheck = (i) => i > min;
    const decrement = (i) => i - 1;

    return {
      startIndex,
      limitCheck,
      next: decrement,
    };
  }

  const startIndex = 0 + offset;
  const max = limit ? Math.min(startIndex + limit, length) : length;
  const limitCheck = (i) => i < max;
  const increment = (i) => i + 1;

  return {
    startIndex,
    limitCheck,
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
  episodeRegex,
  episodeTemplate,
  includeEpisodeImages,
}) => {
  const { startIndex, limitCheck, next } = getLoopControls({
    limit,
    offset,
    reverse,
    length: feed.items.length,
  });

  let i = startIndex;
  const items = [];

  const savedArchive = archive ? getArchive(archive) : [];

  while (limitCheck(i)) {
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
      getEpisodeAudioUrlAndExt(feed.items[i]);
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

          if (!savedArchive.includes(episodeImageArchiveKey)) {
            const episodeImageName = getFilename({
              item,
              feed,
              url: episodeAudioUrl,
              ext: episodeImageFileExt,
              template: episodeTemplate,
            });

            const outputImagePath = path.resolve(basePath, episodeImageName);
            item._extra_downloads.push({
              url: episodeImageUrl,
              outputPath: outputImagePath,
              key: episodeImageArchiveKey,
            });
          }
        }
      }

      items.push(item);
    }

    i = next(i);
  }

  return items;
};

const logFeedInfo = (feed) => {
  logMessage(feed.title);
  logMessage(feed.description);
  logMessage();
};

const ITEM_LIST_FORMATS = {
  table: "table",
  json: "json",
};

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

  const tableData = items.map((item) => {
    return {
      episodeNum: feed.items.length - item._originalIndex,
      title: item.title,
      pubDate: item.pubDate,
    };
  });

  if (!tableData.length) {
    logErrorAndExit("No episodes found with provided criteria to list");
  }

  if (type === ITEM_LIST_FORMATS.json) {
    console.log(JSON.stringify(tableData));
  } else {
    console.table(tableData);
  }
};

const writeFeedMeta = ({ outputPath, feed, key, archive, override }) => {
  if (key && archive && getIsInArchive({ key, archive })) {
    logMessage("Feed metadata exists in archive. Skipping write...");
    return;
  }

  const title = feed.title || null;
  const description = feed.description || null;
  const link = feed.link || null;
  const feedUrl = feed.feedUrl || null;
  const managingEditor = feed.managingEditor || null;

  try {
    if (override || !fs.existsSync(outputPath)) {
      fs.writeFileSync(
        outputPath,
        JSON.stringify(
          {
            title,
            description,
            link,
            feedUrl,
            managingEditor,
          },
          null,
          4
        )
      );
    } else {
      logMessage("Feed metadata exists locally. Skipping write...");
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
    logMessage(
      `${marker} | Episode metadata exists in archive. Skipping write...`
    );
    return;
  }

  const title = item.title || null;
  const descriptionText = item.contentSnippet || null;
  const pubDate = item.pubDate || null;
  const creator = item.creator || null;

  try {
    if (override || !fs.existsSync(outputPath)) {
      fs.writeFileSync(
        outputPath,
        JSON.stringify(
          {
            title,
            pubDate,
            creator,
            descriptionText,
          },
          null,
          4
        )
      );
    } else {
      logMessage(
        `${marker} | Episode metadata exists locally. Skipping write...`
      );
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
  const { pathname } = new URL(url);

  if (!pathname) {
    return "";
  }

  const ext = path.extname(pathname);
  return ext;
};

const AUDIO_TYPES_TO_EXTS = {
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/flac": ".flac",
  "audio/ogg": ".ogg",
  "audio/vorbis": ".ogg",
  "audio/mp4": ".m4a",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/aac": ".aac",
};

const VALID_AUDIO_EXTS = [...new Set(Object.values(AUDIO_TYPES_TO_EXTS))];

const getIsAudioUrl = (url) => {
  const ext = getUrlExt(url);

  if (!ext) {
    return false;
  }

  return VALID_AUDIO_EXTS.includes(ext);
};

const getEpisodeAudioUrlAndExt = ({ enclosure, link }) => {
  if (link && getIsAudioUrl(link)) {
    return { url: link, ext: getUrlExt(link) };
  }

  if (enclosure && getIsAudioUrl(enclosure.url)) {
    return { url: enclosure.url, ext: getUrlExt(enclosure.url) };
  }

  if (enclosure && enclosure.url && AUDIO_TYPES_TO_EXTS[enclosure.type]) {
    return { url: enclosure.url, ext: AUDIO_TYPES_TO_EXTS[enclosure.type] };
  }

  return { url: null, ext: null };
};

const getImageUrl = ({ image, itunes }) => {
  if (image && image.url) {
    return image.url;
  }

  if (image && image.link) {
    return image.link;
  }

  if (itunes && itunes.image) {
    return itunes.image;
  }

  return null;
};

const getFeed = async (url) => {
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
}) => {
  if (!fs.existsSync(outputPath)) {
    return;
  }

  if (!outputPath.endsWith(".mp3")) {
    throw new Error("Not an .mp3 file. Unable to run ffmpeg.");
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
    const title = item.title || "";
    const artist =
      item.itunes && item.itunes.author
        ? item.itunes.author
        : item.author || "";
    const track =
      item.itunes && item.itunes.episode
        ? item.itunes.episode
        : `${feed.items.length - itemIndex}`;
    const date = item.pubDate
      ? dayjs(new Date(item.pubDate)).format("YYYY-MM-DD")
      : "";

    const metaKeysToValues = {
      album,
      artist,
      title,
      track,
      date,
      album_artist: album,
    };

    const metadataString = Object.keys(metaKeysToValues)
      .map((key) =>
        metaKeysToValues[key]
          ? `-metadata ${key}="${metaKeysToValues[key].replace(/"/g, '\\"')}"`
          : null
      )
      .filter((segment) => !!segment)
      .join(" ");

    command += ` -map_metadata 0 ${metadataString} -codec copy`;
  }

  const tmpMp3Path = `${outputPath}.tmp.mp3`;
  command += ` "${tmpMp3Path}"`;

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

const runExec = async ({ exec, outputPodcastPath, episodeFilename }) => {
  const filenameBase = episodeFilename.substring(
    0,
    episodeFilename.lastIndexOf(".")
  );
  const execCmd = exec
    .replace(/{}/g, `"${outputPodcastPath}"`)
    .replace(/{filenameBase}/g, `"${filenameBase}"`);

  await execWithPromise(execCmd, { stdio: "ignore" });
};

export {
  getArchive,
  getIsInArchive,
  getArchiveKey,
  writeToArchive,
  getEpisodeAudioUrlAndExt,
  getFeed,
  getImageUrl,
  getItemsToDownload,
  getUrlExt,
  getUrlEmbed,
  logFeedInfo,
  ITEM_LIST_FORMATS,
  logItemsList,
  writeFeedMeta,
  writeItemMeta,
  runFfmpeg,
  runExec,
};
