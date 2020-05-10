#!/usr/bin/env node

let _path = require("path");
let _url = require("url");
let commander = require("commander");

let { version } = require("../package.json");
let { startPrompt } = require("./prompt");
let {
  download,
  getArchiveKey,
  getEpisodeAudioUrl,
  getEpisodeFilename,
  getFeed,
  getImageUrl,
  getLoopControls,
  getUrlExt,
  logFeedInfo,
  logItemInfo,
  logItemsList,
  writeFeedMeta,
  writeItemMeta,
} = require("./util");
let {
  createParseNumber,
  logError,
  logErrorAndExit,
  parseArchivePath,
} = require("./validate");

commander
  .version(version)
  .option("--url <string>", "url to podcast rss feed")
  .option("--out-dir <path>", "specify output directory", "./")
  .option(
    "--archive <path>",
    "download or write only items not listed in archive file",
    parseArchivePath
  )
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
  .option("--prompt", "use CLI prompts to select options")
  .parse(process.argv);

let {
  archive,
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
  prompt,
} = commander;

let main = async () => {
  if (prompt) {
    await startPrompt();
    process.exit(0);
  }

  if (!url) {
    logErrorAndExit("No URL provided");
  }

  let { hostname, pathname } = _url.parse(url);
  let archiveUrl = `${hostname}${pathname}`;
  let basePath = _path.resolve(process.cwd(), outDir);
  let feed = await getFeed(url);

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
      let podcastImageName = `image${podcastImageFileExt}`;
      let outputImagePath = _path.resolve(basePath, podcastImageName);

      try {
        console.log("Saving podcast image");
        await download({
          archive,
          key: getArchiveKey({ prefix: archiveUrl, name: podcastImageName }),
          outputPath: outputImagePath,
          url: podcastImageUrl,
        });
      } catch (error) {
        logError("Unable to download episode image", error);
      }
    } else {
      logError("Unable to find podcast image");
    }

    let outputMetaName = "meta.json";
    let outputMetaPath = _path.resolve(basePath, outputMetaName);

    console.log("Saving podcast metadata");
    writeFeedMeta({
      archive,
      feed,
      key: getArchiveKey({ prefix: archiveUrl, name: outputMetaName }),
      outputPath: outputMetaPath,
    });
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
  let nextItem = () => {
    i = next(i);
    counter += 1;
    console.log("");
  };

  while (limitCheck(i)) {
    let item = feed.items[i];

    console.log(`${counter} of ${numItemsToDownload}`);
    logItemInfo(item);

    let episodeAudioUrl = getEpisodeAudioUrl(item);

    if (!episodeAudioUrl) {
      logError("Unable to find episode download URL. Skipping");
      nextItem();
      continue;
    }

    let baseSafeFilename = getEpisodeFilename(item);
    let audioFileExt = getUrlExt(episodeAudioUrl);
    let episodeName = `${baseSafeFilename}${audioFileExt}`;
    let outputPodcastPath = _path.resolve(basePath, episodeName);

    try {
      await download({
        archive,
        key: getArchiveKey({ prefix: archiveUrl, name: episodeName }),
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
          let episodeImageName = `${baseSafeFilename}${episodeImageFileExt}`;
          let outputImagePath = _path.resolve(basePath, episodeImageName);

          console.log("Saving episode image");
          try {
            await download({
              archive,
              key: getArchiveKey({
                prefix: archiveUrl,
                name: episodeImageName,
              }),
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

      let episodeMetaName = `${baseSafeFilename}.meta.json`;
      let outputEpisodeMetaPath = _path.resolve(basePath, episodeMetaName);

      console.log("Saving episode metadata");
      writeItemMeta({
        archive,
        item,
        key: getArchiveKey({ prefix: archiveUrl, name: episodeMetaName }),
        outputPath: outputEpisodeMetaPath,
      });
    }

    nextItem();
  }
};

main();
