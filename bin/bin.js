#!/usr/bin/env node

let _url = require("url");
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
  getLoopControls,
  getUrlExt,
  logFeedInfo,
  logItemInfo,
  logItemsList,
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
  .option("--reverse", "download episodes in reverse order")
  .option("--info", "print retrieved podcast info instead of downloading")
  .option("--list", "print episode info instead of downloading")
  .parse(process.argv);

let {
  url,
  outDir,
  includeMeta,
  includeEpisodeMeta,
  ignoreEpisodeImages,
  offset,
  limit,
  reverse,
  info,
  list,
} = commander;

let main = async () => {
  let basePath = path.resolve(process.cwd(), outDir);
  let { href } = _url.parse(url);

  let feed;
  try {
    feed = await parser.parseURL(href);
  } catch (err) {
    logErrorAndExit("Unable to parse RSS URL", err);
  }

  if (info) {
    logFeedInfo(feed);
  }

  if (list) {
    if (feed.items && feed.items.length) {
      logItemsList(feed.items);
    } else {
      logErrorAndExit("No episodes found to list");
    }
  }

  if (info || list) {
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

  let { startIndex, numItemsToDownload, limitCheck, next } = getLoopControls({
    limit,
    offset,
    reverse,
    length: feed.items.length,
  });

  let episodeText = numItemsToDownload === 1 ? "episode" : "episodes";

  console.log(`Starting download of ${numItemsToDownload} ${episodeText}\n`);

  let i = startIndex;
  let counter = 1;
  while (limitCheck(i)) {
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

    console.log(`${counter} of ${numItemsToDownload}`);
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
    counter += 1;
    i = next(i);
  }
};

main();
