#!/usr/bin/env node

let path = require("path");
let commander = require("commander");
let rssParser = require("rss-parser");
let filenamify = require("filenamify");
let dayjs = require("dayjs");

let { version } = require("../package.json");
let {
  download,
  getEpisodeAudioUrl,
  getImageUrl,
  getUrlExt,
  logFeedInfo,
  logItemInfo,
  writeFeedMeta,
  writeItemMeta,
} = require("./util");

let parser = new rssParser({
  defaultRSS: 2.0,
});

const parseOffset = (value) => {
  try {
    let offset = parseInt(value);

    if (isNaN(offset)) {
      console.error("--offset must be a number");
      process.exit(1);
    }

    if (offset < 0) {
      console.error("--offset must be >= 0");
      process.exit(1);
    }

    return offset;
  } catch (error) {
    console.log(error);
    console.error("Unable to parse --offset");
    process.exit(1);
  }
};

const parseLimit = (value) => {
  if (!value) {
    return undefined;
  }

  try {
    let limit = parseInt(value);

    if (isNaN(limit)) {
      console.error("--limit must be a number");
      process.exit(1);
    }

    if (limit < 1) {
      console.error("--limit must be > 0");
      process.exit(1);
    }

    return limit;
  } catch (error) {
    console.error("Unable to parse --limit");
    process.exit(1);
  }
};

commander
  .version(version)
  .option("--url <string>", "url to podcast rss feed")
  .option("--out-dir <path>", "specify output directory", "./")
  .option("--include-meta", "write out podcast metadata to json")
  .option(
    "--include-episode-meta",
    "write out individual episode metadata to json"
  )
  .option(
    "--ignore-episode-images",
    "ignore downloading found images from --include-episode-meta"
  )
  .option(
    "--offset <number>",
    "offset episode to start downloading from (most recent = 0)",
    parseOffset,
    0
  )
  .option(
    "--limit <number>",
    "max amount of episodes to download",
    parseLimit,
    undefined
  )
  .option("--info", "print retrieved podcast info instead of downloading")
  .parse(process.argv);

let {
  url,
  outDir,
  includeMeta,
  includeEpisodeMeta,
  ignoreEpisodeImages,
  offset,
  limit,
  info,
} = commander;

let main = async () => {
  let basePath = path.resolve(process.cwd(), outDir);

  let feed;
  try {
    let encodedUrl = encodeURI(url);
    feed = await parser.parseURL(encodedUrl);
  } catch (err) {
    console.error("Unable to parse RSS URL");
    console.error(err);
    process.exit(1);
  }

  if (info) {
    logFeedInfo(feed);
    process.exit(0);
  }

  if (includeMeta) {
    let podcastImageUrl = getImageUrl(feed);

    if (podcastImageUrl) {
      let podcastImageFileExt = getUrlExt(podcastImageUrl);
      let outputImagePath = path.resolve(
        basePath,
        `image${podcastImageFileExt}`
      );

      try {
        console.log("Saving podcast image");
        await download({
          outputPath: outputImagePath,
          url: podcastImageUrl,
        });
      } catch (error) {
        console.error("Unable to download episode image");
        console.error(error);
      }
    } else {
      console.error("Unable to find podcast image");
    }

    let outputMetaPath = path.resolve(basePath, `meta.json`);

    console.log("Saving podcast metadata");
    writeFeedMeta({ outputPath: outputMetaPath, feed });
  }

  if (!feed.items || feed.items.length === 0) {
    console.error("No episodes found to download");
    process.exit(1);
  }

  if (offset >= feed.items.length) {
    console.error("--offset too large. No episodes to download.");
    process.exit(1);
  }

  let max = limit
    ? Math.min(offset + limit, feed.items.length)
    : feed.items.length;
  let numItemsToDownload = max - offset;
  console.log(`Starting download of ${numItemsToDownload} episodes\n`);
  for (let i = offset; i < max; i++) {
    let item = feed.items[i];
    let { title, pubDate } = item;

    let episodeAudioUrl = getEpisodeAudioUrl(item);

    if (!episodeAudioUrl) {
      console.error("Unable to find episode download URL. Skipping");
      break;
    }

    let organizeDate = pubDate
      ? dayjs(new Date(pubDate)).format("YYYYMMDD")
      : null;

    let baseFileName = organizeDate ? `${organizeDate}-${title}` : title;
    let baseSafeFilename = filenamify(baseFileName, {
      replacement: "_",
    });

    console.log(`${i + 1 - offset} of ${numItemsToDownload}`);
    logItemInfo(item);

    let audioFileExt = getUrlExt(episodeAudioUrl);
    let outputPodcastPath = path.resolve(
      basePath,
      `${baseSafeFilename}${audioFileExt}`
    );

    try {
      await download({
        outputPath: outputPodcastPath,
        url: episodeAudioUrl,
      });
    } catch (error) {
      console.error("Unable to download episode");
      console.error(error);
    }

    if (includeEpisodeMeta) {
      if (!ignoreEpisodeImages) {
        let episodeImageUrl = getImageUrl(item);

        if (episodeImageUrl) {
          let episodeImageFileExt = getUrlExt(episodeImageUrl);
          let outputImagePath = path.resolve(
            basePath,
            `${baseSafeFilename}${episodeImageFileExt}`
          );

          console.log("Saving episode image");
          try {
            await download({
              outputPath: outputImagePath,
              url: episodeImageUrl,
            });
          } catch (error) {
            console.error("Unable to download episode image");
            console.error(error);
          }
        } else {
          console.error("Unable to find episode image URL");
        }
      }

      let outputEpisodeMetaPath = path.resolve(
        basePath,
        `${baseSafeFilename}.meta.json`
      );

      console.log("Saving episode metadata");
      writeItemMeta({ outputPath: outputEpisodeMetaPath, item });
    }

    console.log("");
  }
};

main();
