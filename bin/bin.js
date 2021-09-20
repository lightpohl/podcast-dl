#!/usr/bin/env node

import fs from "fs";
import _path from "path";
import _url from "url";
import commander from "commander";
import { createRequire } from "module";
import pluralize from "pluralize";

import { download } from "./async.js";
import {
  getArchiveKey,
  getFeed,
  getImageUrl,
  getItemsToDownload,
  getUrlExt,
  logFeedInfo,
  logItemsList,
  writeFeedMeta,
  ITEM_LIST_FORMATS,
} from "./util.js";
import { createParseNumber } from "./validate.js";
import {
  ERROR_STATUSES,
  LOG_LEVELS,
  logMessage,
  logError,
  logErrorAndExit,
} from "./logger.js";
import { getFolderName, getSafeName } from "./naming.js";
import { downloadItemsAsync } from "./async.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

commander
  .version(version)
  .option("--url <string>", "url to podcast rss feed")
  .option("--out-dir <path>", "specify output directory", "./{{podcast_title}}")
  .option(
    "--archive [path]",
    "download or write only items not listed in archive file"
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
  .option("--include-episode-images", "include found episode images")
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
    "--after <string>",
    "download episodes only after this date (inclusive)"
  )
  .option(
    "--before <string>",
    "download episodes only before this date (inclusive)"
  )
  .option(
    "--add-mp3-metadata",
    "attempts to add a base level of metadata to .mp3 files using ffmpeg"
  )
  .option(
    "--adjust-bitrate <string>",
    "attempts to adjust bitrate of .mp3 files using ffmpeg"
  )
  .option("--mono", "attempts to force .mp3 files into mono using ffmpeg")
  .option("--override", "override local files on collision")
  .option("--reverse", "download episodes in reverse order")
  .option("--info", "print retrieved podcast info instead of downloading")
  .option(
    "--list [table|json]",
    "print episode info instead of downloading",
    (value) => {
      if (
        value !== ITEM_LIST_FORMATS.table &&
        value !== ITEM_LIST_FORMATS.json
      ) {
        logErrorAndExit(
          `${value} is an invalid format for --list\nUse "table" or "json"`
        );
      }

      return value;
    }
  )
  .option(
    "--exec <string>",
    "Execute a command after each episode is downloaded"
  )
  .option(
    "--threads <number>",
    "the number of downloads that can happen concurrently",
    createParseNumber({ min: 1, name: "threads" }),
    1
  )
  .parse(process.argv);

const {
  url,
  outDir,
  episodeTemplate,
  includeMeta,
  includeEpisodeMeta,
  includeEpisodeImages,
  offset,
  limit,
  episodeRegex,
  after,
  before,
  override,
  reverse,
  info,
  list,
  exec,
  mono,
  threads,
  addMp3Metadata: addMp3MetadataFlag,
  adjustBitrate: bitrate,
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

  logFeedInfo(feed);

  if (list) {
    if (feed.items && feed.items.length) {
      const listFormat = typeof list === "boolean" ? "table" : list;
      logItemsList({
        type: listFormat,
        feed,
        limit,
        offset,
        reverse,
        after,
        before,
        episodeRegex,
      });
    } else {
      logErrorAndExit("No episodes found to list");
    }
  }

  if (info || list) {
    process.exit(0);
  }

  if (!fs.existsSync(basePath)) {
    logMessage(`${basePath} does not exist. Creating...`, LOG_LEVELS.important);
    fs.mkdirSync(basePath, { recursive: true });
  }

  if (archive) {
    archive =
      typeof archive === "boolean"
        ? "./{{podcast_title}}/archive.json"
        : archive;
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
        logMessage("\nDownloading podcast image...");
        await download({
          archive,
          override,
          marker: podcastImageUrl,
          key: getArchiveKey({ prefix: archiveUrl, name: podcastImageName }),
          outputPath: outputImagePath,
          url: podcastImageUrl,
        });
      } catch (error) {
        logError("Unable to download podcast image", error);
      }
    }

    const outputMetaName = `${feed.title ? `${feed.title}.meta` : "meta"}.json`;
    const outputMetaPath = _path.resolve(basePath, getSafeName(outputMetaName));

    try {
      logMessage("\nSaving podcast metadata...");
      writeFeedMeta({
        archive,
        override,
        feed,
        key: getArchiveKey({ prefix: archiveUrl, name: outputMetaName }),
        outputPath: outputMetaPath,
      });
    } catch (error) {
      logError("Unable to save podcast metadata", error);
    }
  }

  if (!feed.items || feed.items.length === 0) {
    logErrorAndExit("No episodes found to download");
  }

  if (offset >= feed.items.length) {
    logErrorAndExit("--offset too large. No episodes to download.");
  }

  const targetItems = getItemsToDownload({
    archive,
    archiveUrl,
    basePath,
    feed,
    limit,
    offset,
    reverse,
    after,
    before,
    episodeRegex,
    episodeTemplate,
    includeEpisodeImages,
  });

  if (!targetItems.length) {
    logErrorAndExit("No episodes found with provided criteria to download");
  }

  logMessage(
    `\nStarting download of ${pluralize("episode", targetItems.length, true)}\n`
  );

  const { numEpisodesDownloaded, hasErrors } = await downloadItemsAsync({
    addMp3MetadataFlag,
    archive,
    archiveUrl,
    basePath,
    bitrate,
    episodeTemplate,
    exec,
    feed,
    includeEpisodeMeta,
    mono,
    override,
    targetItems,
    threads,
  });

  if (numEpisodesDownloaded === 0) {
    process.exit(ERROR_STATUSES.nothingDownloaded);
  }

  if (hasErrors) {
    process.exit(ERROR_STATUSES.completedWithErrors);
  }
};

main();
