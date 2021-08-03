const _url = require("url");
const rssParser = require("rss-parser");
const { promisify } = require("util");
const stream = require("stream");
const path = require("path");
const fs = require("fs");
const got = require("got");
const dayjs = require("dayjs");
const { execSync } = require("child_process");

const {
  getShouldOutputProgressIndicator,
  logMessage,
  logError,
  logErrorAndExit,
  LOG_LEVELS,
} = require("./logger");

const pipeline = promisify(stream.pipeline);
const parser = new rssParser({
  defaultRSS: 2.0,
});

const logFeedInfo = (feed) => {
  console.log(`Title: ${feed.title}`);
  console.log(`Description: ${feed.description}`);
  console.log(`Total Episodes: ${feed.items ? feed.items.length : 0}`);
};

const logItemsList = (items) => {
  const tableData = items.map((item) => {
    const { title, pubDate } = item;

    return {
      title,
      pubDate,
    };
  });

  console.table(tableData);
};

const logItemInfo = (item, logLevel) => {
  const { title, pubDate } = item;

  logMessage(`Title: ${title}`, logLevel);
  logMessage(`Publish Date: ${pubDate}`, logLevel);
};

const getArchiveKey = ({ prefix, name }) => {
  return `${prefix}-${name}`;
};

const writeToArchive = ({ key, archive }) => {
  let archiveResult = [];
  const archivePath = path.resolve(process.cwd(), archive);

  if (fs.existsSync(archivePath)) {
    archiveResult = JSON.parse(fs.readFileSync(archivePath));
  }

  if (!archiveResult.includes(key)) {
    archiveResult.push(key);
  }

  fs.writeFileSync(archivePath, JSON.stringify(archiveResult, null, 4));
};

const getIsInArchive = ({ key, archive }) => {
  const archivePath = path.resolve(process.cwd(), archive);

  if (!fs.existsSync(archivePath)) {
    return false;
  }

  const archiveResult = JSON.parse(fs.readFileSync(archivePath));
  return archiveResult.includes(key);
};

const writeFeedMeta = ({ outputPath, feed, key, archive, override }) => {
  if (key && archive && getIsInArchive({ key, archive })) {
    logMessage("Feed metadata exists in archive. Skipping write");
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
      logMessage("Feed metadata exists locally. Skipping write");
    }

    if (key && archive && !getIsInArchive({ key, archive })) {
      writeToArchive({ key, archive });
    }
  } catch (error) {
    logError("Unable to save metadata file for episode", error);
  }
};

const writeItemMeta = ({ outputPath, item, key, archive, override }) => {
  if (key && archive && getIsInArchive({ key, archive })) {
    logMessage("Episode metadata exists in archive. Skipping write");
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
      logMessage("Episode metadata exists locally. Skipping write");
    }

    if (key && archive && !getIsInArchive({ key, archive })) {
      writeToArchive({ key, archive });
    }
  } catch (error) {
    logError("Unable to save meta file for episode", error);
  }
};

const getUrlExt = (url) => {
  const { pathname } = _url.parse(url);

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

const BYTES_IN_MB = 1000000;
const printProgress = ({ percent, total, transferred }) => {
  if (!getShouldOutputProgressIndicator()) {
    /*
      Non-TTY environments do not have access to `stdout.clearLine` and
      `stdout.cursorTo`. Skip download progress logging in these environments.
    */
    return;
  }

  let line = "downloading...";
  const percentRounded = (percent * 100).toFixed(2);

  if (transferred > 0) {
    /*
     * Got has a bug where it'll set percent to 1 when the download first starts.
     * Ignore percent until transfer has started.
     */
    line += ` ${percentRounded}%`;

    if (total) {
      const totalMBs = total / BYTES_IN_MB;
      const roundedTotalMbs = totalMBs.toFixed(2);
      line += ` of ${roundedTotalMbs} MB`;
    }
  }

  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(line);
};

const download = async ({
  url,
  outputPath,
  key,
  archive,
  override,
  onSkip,
  onBeforeDownload,
  onAfterDownload,
}) => {
  if (key && archive && getIsInArchive({ key, archive })) {
    if (onSkip) {
      onSkip();
    }

    logMessage("Download exists in archive. Skipping");
    return;
  }

  if (!override && fs.existsSync(outputPath)) {
    if (onSkip) {
      onSkip();
    }

    logMessage("Download exists locally. Skipping");
    return;
  }

  if (onBeforeDownload) {
    onBeforeDownload();
  }

  const headResponse = await got(url, {
    timeout: 5000,
    method: "HEAD",
    responseType: "json",
    headers: {
      accept: "*/*",
    },
  });

  const removeFile = () => {
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  };

  try {
    await pipeline(
      got.stream(url).on("downloadProgress", (progress) => {
        printProgress(progress);
      }),
      fs.createWriteStream(outputPath)
    );
  } catch (error) {
    removeFile();

    throw error;
  } finally {
    if (getShouldOutputProgressIndicator()) {
      console.log();
    }
  }

  const fileSize = fs.statSync(outputPath).size;
  const expectedSize =
    headResponse &&
    headResponse.headers &&
    headResponse.headers["content-length"]
      ? parseInt(headResponse.headers["content-length"])
      : 0;

  if (fileSize === 0) {
    removeFile();
    throw new Error("Unable to write to file. Suggestion: verify permissions");
  }

  if (expectedSize && !isNaN(expectedSize) && expectedSize !== fileSize) {
    logMessage(
      "File size differs from expected content length. Suggestion: verify file works as expected",
      LOG_LEVELS.important
    );
    logMessage(outputPath, LOG_LEVELS.important);
  }

  if (onAfterDownload) {
    onAfterDownload();
  }

  if (key && archive && !getIsInArchive({ key, archive })) {
    writeToArchive({ key, archive });
  }
};

const getLoopControls = ({ limit, offset, length, reverse }) => {
  if (reverse) {
    const startIndex = length - 1 - offset;
    const min = limit ? Math.max(startIndex - limit, -1) : -1;
    const numItemsToDownload = min > -1 ? startIndex - min : startIndex + 1;
    const limitCheck = (i) => i > min;
    const decrement = (i) => i - 1;

    return {
      startIndex,
      numItemsToDownload,
      limitCheck,
      next: decrement,
    };
  }

  const startIndex = 0 + offset;
  const max = limit ? Math.min(startIndex + limit, length) : length;
  const numItemsToDownload = max - startIndex;
  const limitCheck = (i) => i < max;
  const increment = (i) => i + 1;

  return {
    startIndex,
    numItemsToDownload,
    limitCheck,
    next: increment,
  };
};

const getFeed = async (url) => {
  const { href } = _url.parse(url);

  let feed;
  try {
    feed = await parser.parseURL(href);
  } catch (err) {
    logErrorAndExit("Unable to parse RSS URL", err);
  }

  return feed;
};

const addMp3Metadata = ({ feed, item, itemIndex, outputPath }) => {
  if (!fs.existsSync(outputPath)) {
    return;
  }

  if (!outputPath.endsWith(".mp3")) {
    logError("Not an .mp3 file. Unable to add metadata.");
    return;
  }

  const album = feed.title || "";
  const title = item.title || "";
  const artist =
    item.itunes && item.itunes.author ? item.itunes.author : item.author || "";
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

  const tmpMp3Path = `${outputPath}.tmp.mp3`;
  execSync(
    `ffmpeg -loglevel quiet -i "${outputPath}" -map_metadata 0 ${metadataString} -codec copy "${tmpMp3Path}"`
  );

  fs.unlinkSync(outputPath);
  fs.renameSync(tmpMp3Path, outputPath);
};

const runExec = ({ exec, outputPodcastPath, episodeFilename }) => {
  const filenameBase = episodeFilename.substring(
    0,
    episodeFilename.lastIndexOf(".")
  );
  const execCmd = exec
    .replace(/{}/g, `"${outputPodcastPath}"`)
    .replace(/{filenameBase}/g, `"${filenameBase}"`);
  try {
    execSync(execCmd, { stdio: "ignore" });
  } catch (error) {
    logError(`--exec process error: exit code ${error.status}`, error);
  }
};

module.exports = {
  download,
  getArchiveKey,
  getEpisodeAudioUrlAndExt,
  getFeed,
  getImageUrl,
  getLoopControls,
  getUrlExt,
  logFeedInfo,
  logItemInfo,
  logItemsList,
  addMp3Metadata,
  writeFeedMeta,
  writeItemMeta,
  runExec,
};
