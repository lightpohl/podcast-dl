#!/usr/bin/env node

const fs = require("fs");
const _path = require("path");
const _url = require("url");
const commander = require("commander");

const { version } = require("../package.json");
const {
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
  writeFeedMeta,
  writeItemMeta,
  addMp3Metadata,
  runExec,
} = require("./util");
const { createParseNumber, parseArchivePath } = require("./validate");
const {
  ERROR_STATUSES,
  LOG_LEVELS,
  logMessage,
  logError,
  logErrorAndExit,
} = require("./logger");
const {
  getFilename,
  getFolderName,
  getArchiveFilename,
  getSafeName,
} = require("./naming");

commander
  .version(version)
  .option("--url <string>", "url to podcast rss feed")
  .option("--out-dir <path>", "specify output directory", "./{{podcast_title}}")
  .option(
    "--archive <path>",
    "download or write only items not listed in archive file",
    parseArchivePath
  )
  .option(
    "--episode-template <string>",
    "template for generating episode related filenames",
    "{{release_date}}-{{title}}"
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
  .option(
    "--episode-regex <string>",
    "match episode title against regex before downloading"
  )
  .option(
    "--add-mp3-metadata",
    "attempts to add a base level of metadata to .mp3 files using ffmpeg"
  )
  .option("--override", "override local files on collision")
  .option("--reverse", "download episodes in reverse order")
  .option("--info", "print retrieved podcast info instead of downloading")
  .option("--list", "print episode info instead of downloading")
  .option(
    "--exec <string>",
    "Execute a command after each episode is downloaded"
  )
  .parse(process.argv);

const {
  url,
  outDir,
  episodeTemplate,
  includeMeta,
  includeEpisodeMeta,
  ignoreEpisodeImages,
  offset,
  limit,
  episodeRegex,
  override,
  reverse,
  info,
  list,
  exec,
  addMp3Metadata: addMp3MetadataFlag,
} = commander;

let { archive } = commander;

const main = async () => {
  if (!url) {
    logErrorAndExit("No URL provided");
  }

  const { hostname, pathname } = _url.parse(url);
  const archiveUrl = `${hostname}${pathname}`;
  const feed = await getFeed(url);
  const basePath = _path.resolve(
    process.cwd(),
    getFolderName({ feed, template: outDir })
  );

  if (!fs.existsSync(basePath)) {
    logMessage(`${basePath} does not exist. Creating...`, LOG_LEVELS.important);
    fs.mkdirSync(basePath, { recursive: true });
  }

  if (info) {
    logFeedInfo(feed);
  }

  if (list) {
    if (feed.items && feed.items.length) {
      logItemsList({
        items: feed.items,
        limit,
        offset,
        reverse,
        episodeRegex,
      });
    } else {
      logErrorAndExit("No episodes found to list");
    }
  }

  if (info || list) {
    process.exit(0);
  }

  if (archive) {
    archive = getFolderName({ feed, template: archive });
  }

  if (includeMeta) {
    const podcastImageUrl = getImageUrl(feed);

    if (podcastImageUrl) {
      const podcastImageFileExt = getUrlExt(podcastImageUrl);
      const podcastImageName = `${
        feed.title ? `${feed.title}.image` : "image"
      }${podcastImageFileExt}`;
      const outputImagePath = _path.resolve(
        basePath,
        getSafeName(podcastImageName)
      );

      try {
        logMessage("Saving podcast image");
        await download({
          archive,
          override,
          key: getArchiveKey({ prefix: archiveUrl, name: podcastImageName }),
          outputPath: outputImagePath,
          url: podcastImageUrl,
        });
      } catch (error) {
        logError("Unable to download episode image", error);
      }
    } else {
      logMessage("Unable to find podcast image");
    }

    const outputMetaName = `${feed.title ? `${feed.title}.meta` : "meta"}.json`;
    const outputMetaPath = _path.resolve(basePath, getSafeName(outputMetaName));

    logMessage("Saving podcast metadata");
    writeFeedMeta({
      archive,
      override,
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

  const { startIndex, numItemsToDownload, limitCheck, next } = getLoopControls({
    limit,
    offset,
    reverse,
    length: feed.items.length,
  });

  const episodeText = numItemsToDownload === 1 ? "episode" : "episodes";

  logMessage(`Starting download of ${numItemsToDownload} ${episodeText}\n`);

  let i = startIndex;
  let counter = 1;
  const nextItem = () => {
    i = next(i);
    counter += 1;
    logMessage("");
  };
  let episodesDownloadedCounter = 0;

  while (limitCheck(i)) {
    const item = feed.items[i];

    logMessage(`${counter} of ${numItemsToDownload}`);

    const generatedEpisodeRegex = episodeRegex
      ? new RegExp(episodeRegex)
      : null;

    if (
      generatedEpisodeRegex &&
      (!item.title || !generatedEpisodeRegex.test(item.title))
    ) {
      logItemInfo(item);
      logMessage("Episode title does not match provided regex. Skipping");
      nextItem();
      continue;
    }

    const { url: episodeAudioUrl, ext: audioFileExt } =
      getEpisodeAudioUrlAndExt(item);

    if (!episodeAudioUrl) {
      logItemInfo(item, LOG_LEVELS.critical);
      logError("Unable to find episode download URL. Skipping");
      nextItem();
      continue;
    }

    const episodeFilename = getFilename({
      item,
      feed,
      url: episodeAudioUrl,
      ext: audioFileExt,
      template: episodeTemplate,
    });
    const outputPodcastPath = _path.resolve(basePath, episodeFilename);

    try {
      await download({
        archive,
        override,
        key: getArchiveKey({
          prefix: archiveUrl,
          name: getArchiveFilename({
            name: item.title,
            pubDate: item.pubDate,
            ext: audioFileExt,
          }),
        }),
        outputPath: outputPodcastPath,
        url: episodeAudioUrl,
        onSkip: () => {
          logItemInfo(item);
        },
        onBeforeDownload: () => {
          logItemInfo(item, LOG_LEVELS.important);
        },
        onAfterDownload: () => {
          if (addMp3MetadataFlag) {
            try {
              addMp3Metadata({
                feed,
                item,
                itemIndex: i,
                outputPath: outputPodcastPath,
              });
            } catch (error) {
              logError("Unable to add episode metadata", error);
            }
          }

          if (exec) {
            runExec({ exec, outputPodcastPath, episodeFilename });
          }

          episodesDownloadedCounter += 1;
        },
      });
    } catch (error) {
      logError("Unable to download episode", error);
    }

    if (includeEpisodeMeta) {
      if (!ignoreEpisodeImages) {
        const episodeImageUrl = getImageUrl(item);

        if (episodeImageUrl) {
          const episodeImageFileExt = getUrlExt(episodeImageUrl);
          const episodeImageName = getFilename({
            item,
            feed,
            url: episodeAudioUrl,
            ext: episodeImageFileExt,
            template: episodeTemplate,
          });
          const outputImagePath = _path.resolve(basePath, episodeImageName);

          logMessage("Saving episode image");
          try {
            await download({
              archive,
              override,
              key: getArchiveKey({
                prefix: archiveUrl,
                name: getArchiveFilename({
                  pubDate: item.pubDate,
                  name: item.title,
                  ext: episodeImageFileExt,
                }),
              }),
              outputPath: outputImagePath,
              url: episodeImageUrl,
            });
          } catch (error) {
            logError("Unable to download episode image", error);
          }
        } else {
          logMessage("Unable to find episode image URL");
        }
      }

      const episodeMetaExt = ".meta.json";
      const episodeMetaName = getFilename({
        item,
        feed,
        url: episodeAudioUrl,
        ext: episodeMetaExt,
        template: episodeTemplate,
      });
      const outputEpisodeMetaPath = _path.resolve(basePath, episodeMetaName);

      logMessage("Saving episode metadata");
      writeItemMeta({
        archive,
        override,
        item,
        key: getArchiveKey({
          prefix: archiveUrl,
          name: getArchiveFilename({
            pubDate: item.pubDate,
            name: item.title,
            ext: episodeMetaExt,
          }),
        }),
        outputPath: outputEpisodeMetaPath,
      });
    }

    nextItem();
  }

  if (episodesDownloadedCounter === 0) {
    process.exit(ERROR_STATUSES.nothingDownloaded);
  }
};

main();
