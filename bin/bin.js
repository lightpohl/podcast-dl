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
let { createParseNumber, logError, logErrorAndExit } = require("./validate");

let parser = new rssParser({
  defaultRSS: 2.0,
});

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
    createParseNumber({ min: 0, name: "--offset" }),
    0
  )
  .option(
    "--limit <number>",
    "max amount of episodes to download",
    createParseNumber({ min: 1, name: "--limit", require: false })
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
    logErrorAndExit("Unable to parse RSS URL", err);
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
        logError("Unable to download episode image", error);
      }
    } else {
      logError("Unable to find podcast image");
    }

    let outputMetaPath = path.resolve(basePath, `meta.json`);

    console.log("Saving podcast metadata");
    writeFeedMeta({ outputPath: outputMetaPath, feed });
  }

  if (!feed.items || feed.items.length === 0) {
    logErrorAndExit("No episodes found to download");
  }

  if (offset >= feed.items.length) {
    logErrorAndExit("--offset too large. No episodes to download.");
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
      logError("Unable to find episode download URL. Skipping");
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
      logError("Unable to download episode", error);
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
            logError("Unable to download episode image", error);
          }
        } else {
          logError("Unable to find episode image URL");
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
