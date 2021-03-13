let _url = require("url");
let rssParser = require("rss-parser");
let { promisify } = require("util");
let stream = require("stream");
let path = require("path");
let fs = require("fs");
let got = require("got");
let dayjs = require("dayjs");
let { execSync } = require("child_process");

let { logError, logErrorAndExit } = require("./validate");

let pipeline = promisify(stream.pipeline);
let parser = new rssParser({
  defaultRSS: 2.0,
});

let logFeedInfo = (feed) => {
  console.log(`Title: ${feed.title}`);
  console.log(`Description: ${feed.description}`);
  console.log(`Total Episodes: ${feed.items ? feed.items.length : 0}`);
};

let logItemsList = (items) => {
  let tableData = items.map((item) => {
    let { title, pubDate } = item;

    return {
      title,
      pubDate,
    };
  });

  console.table(tableData);
};

let logItemInfo = (item) => {
  let { title, pubDate } = item;

  console.log(`Title: ${title}`);
  console.log(`Publish Date: ${pubDate}`);
};

let getArchiveKey = ({ prefix, name }) => {
  return `${prefix}-${name}`;
};

let writeToArchive = ({ key, archive }) => {
  let archiveResult = [];
  let archivePath = path.resolve(process.cwd(), archive);

  if (fs.existsSync(archivePath)) {
    archiveResult = JSON.parse(fs.readFileSync(archivePath));
  }

  if (!archiveResult.includes(key)) {
    archiveResult.push(key);
  }

  fs.writeFileSync(archivePath, JSON.stringify(archiveResult, null, 4));
};

let getIsInArchive = ({ key, archive }) => {
  let archivePath = path.resolve(process.cwd(), archive);

  if (!fs.existsSync(archivePath)) {
    return false;
  }

  let archiveResult = JSON.parse(fs.readFileSync(archivePath));
  return archiveResult.includes(key);
};

let writeFeedMeta = ({ outputPath, feed, key, archive, override }) => {
  if (key && archive && getIsInArchive({ key, archive })) {
    console.log("Feed metadata exists in archive. Skipping write");
    return;
  }

  let title = feed.title || null;
  let description = feed.description || null;
  let link = feed.link || null;
  let feedUrl = feed.feedUrl || null;
  let managingEditor = feed.managingEditor || null;

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
      console.log("Feed metadata exists locally. Skipping write");
    }

    if (key && archive && !getIsInArchive({ key, archive })) {
      writeToArchive({ key, archive });
    }
  } catch (error) {
    logError("Unable to save metadata file for episode", error);
  }
};

let writeItemMeta = ({ outputPath, item, key, archive, override }) => {
  if (key && archive && getIsInArchive({ key, archive })) {
    console.log("Episode metadata exists in archive. Skipping write");
    return;
  }

  let title = item.title || null;
  let descriptionText = item.contentSnippet || null;
  let pubDate = item.pubDate || null;
  let creator = item.creator || null;

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
      console.log("Episode metadata exists locally. Skipping write");
    }

    if (key && archive && !getIsInArchive({ key, archive })) {
      writeToArchive({ key, archive });
    }
  } catch (error) {
    logError("Unable to save meta file for episode", error);
  }
};

let getUrlExt = (url) => {
  let { pathname } = _url.parse(url);
  let ext = path.extname(pathname);
  return ext;
};

let AUDIO_TYPES_TO_EXTS = {
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

let VALID_AUDIO_EXTS = [...new Set(Object.values(AUDIO_TYPES_TO_EXTS))];

let getIsAudioUrl = (url) => {
  let ext = getUrlExt(url);
  return VALID_AUDIO_EXTS.includes(ext);
};

let getEpisodeAudioUrlAndExt = ({ enclosure, link }) => {
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

let getImageUrl = ({ image, itunes }) => {
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

let BYTES_IN_MB = 1000000;
let printProgress = ({ percent, total, transferred }) => {
  if (!process.stdout.isTTY) {
    /*
      Non-TTY environments do not have access to `stdout.clearLine` and
      `stdout.cursorTo`. Skip download progress logging in these environments.
    */
    return;
  }

  let line = "downloading...";
  let percentRounded = (percent * 100).toFixed(2);

  if (transferred > 0) {
    /*
     * Got has a bug where it'll set percent to 1 when the download first starts.
     * Ignore percent until transfer has started.
     */
    line += ` ${percentRounded}%`;

    if (total) {
      let totalMBs = total / BYTES_IN_MB;
      let roundedTotalMbs = totalMBs.toFixed(2);
      line += ` of ${roundedTotalMbs} MB`;
    }
  }

  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(line);
};

let endPrintProgress = () => {
  process.stdout.write("\n");
};

let download = async ({ url, outputPath, key, archive, override }) => {
  if (key && archive && getIsInArchive({ key, archive })) {
    console.log("Download exists in archive. Skipping");
    return;
  }

  if (!override && fs.existsSync(outputPath)) {
    console.log("Download exists locally. Skipping");
    return;
  }

  let headResponse = await got(url, {
    timeout: 5000,
    method: "HEAD",
    responseType: "json",
    headers: {
      accept: "*/*",
    },
  });

  let removeFile = () => {
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  };

  try {
    await pipeline(
      got
        .stream(url)
        .on("downloadProgress", (progress) => {
          printProgress(progress);
        })
        .on("end", () => {
          endPrintProgress();
        }),
      fs.createWriteStream(outputPath)
    );
  } catch (error) {
    removeFile();
    throw error;
  }

  let fileSize = fs.statSync(outputPath).size;
  let expectedSize =
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
    logError(
      "File size differs from expected content length. Suggestion: verify file works as expected"
    );
  }

  if (key && archive && !getIsInArchive({ key, archive })) {
    writeToArchive({ key, archive });
  }
};

let getLoopControls = ({ limit, offset, length, reverse }) => {
  if (reverse) {
    let startIndex = length - 1 - offset;
    let min = limit ? Math.max(startIndex - limit, -1) : -1;
    let numItemsToDownload = min > -1 ? startIndex - min : startIndex + 1;
    let limitCheck = (i) => i > min;
    let decrement = (i) => i - 1;

    return {
      startIndex,
      numItemsToDownload,
      limitCheck,
      next: decrement,
    };
  }

  let startIndex = 0 + offset;
  let max = limit ? Math.min(startIndex + limit, length) : length;
  let numItemsToDownload = max - startIndex;
  let limitCheck = (i) => i < max;
  let increment = (i) => i + 1;

  return {
    startIndex,
    numItemsToDownload,
    limitCheck,
    next: increment,
  };
};

let getFeed = async (url) => {
  let { href } = _url.parse(url);

  let feed;
  try {
    feed = await parser.parseURL(href);
  } catch (err) {
    logErrorAndExit("Unable to parse RSS URL", err);
  }

  return feed;
};

let addMp3Metadata = ({ feed, item, itemIndex, outputPath }) => {
  if (!fs.existsSync(outputPath)) {
    return;
  }

  if (!outputPath.endsWith(".mp3")) {
    console.log("Not an .mp3 file. Unable to add metadata.");
    return;
  }

  let album = feed.title || "";
  let title = item.title || "";
  let artist =
    item.itunes && item.itunes.author ? item.itunes.author : item.author || "";
  let track =
    item.itunes && item.itunes.episode
      ? item.itunes.episode
      : `${feed.items.length - itemIndex}`;
  let date = item.pubDate
    ? dayjs(new Date(item.pubDate)).format("YYYY-MM-DD")
    : "";

  let metaKeysToVales = {
    album,
    artist,
    title,
    track,
    date,
    album_artist: album,
  };

  let metadataString = Object.keys(metaKeysToVales)
    .map((key) =>
      metaKeysToVales[key]
        ? `-metadata ${key}="${metaKeysToVales[key].replace(/"/g, '\\"')}"`
        : null
    )
    .filter((segment) => !!segment)
    .join(" ");

  let tmpMp3Path = `${outputPath}.tmp.mp3`;
  execSync(
    `ffmpeg -loglevel quiet -i "${outputPath}" -map_metadata 0 ${metadataString} -codec copy "${tmpMp3Path}"`
  );

  fs.unlinkSync(outputPath);
  fs.renameSync(tmpMp3Path, outputPath);
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
};
