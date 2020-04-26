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

commander
  .version(version)
  .option("--url <string>", "url to podcast rss feed")
  .option("--out-dir <path>", "specify output directory", "./")
  .option("--include-meta", "write out podcast metadata")
  .option("--include-episode-meta", "write out individual episode metadata")
  .option(
    "--ignore-episode-images",
    "ignore downloading found images from --include-episode-meta"
  )
  .option("--info", "print retrieved podcast info instead of downloading")
  .parse(process.argv);

let main = async () => {
  let basePath = path.resolve(process.cwd(), commander.outDir);

  let feed;
  try {
    let encodedUrl = encodeURI(commander.url);
    feed = await parser.parseURL(encodedUrl);
  } catch (err) {
    console.error("Unable to parse RSS URL");
    console.error(err);
    process.exit(1);
  }

  if (commander.info) {
    logFeedInfo(feed);
    process.exit(0);
  }

  if (commander.includeMeta) {
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

  console.log(`Starting download of ${feed.items.length} items\n`);
  let counter = 1;
  for (let item of feed.items) {
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

    console.log(`${counter} of ${feed.items.length}`);
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

    if (commander.includeEpisodeMeta) {
      if (!commander.ignoreEpisodeImages) {
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
    counter += 1;
  }
};

main();
