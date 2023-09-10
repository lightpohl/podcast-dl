#!/usr/bin/env node

import fs from "fs";
import _path from "path";
import commander from "commander";
import pluralize from "pluralize";
import { bootstrap as bootstrapProxy } from "global-agent";

import { setupCommander } from "./commander.js";
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
} from "./util.js";
import {
  ERROR_STATUSES,
  LOG_LEVELS,
  logMessage,
  logError,
  logErrorAndExit,
} from "./logger.js";
import { getFolderName, getSimpleFilename } from "./naming.js";
import { downloadItemsAsync } from "./async.js";

setupCommander(commander, process.argv);

const {
  url,
  outDir,
  episodeTemplate,
  episodeDigits,
  episodeSourceOrder,
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
  attempts,
  parserConfig,
  proxy,
  addMp3Metadata: addMp3MetadataFlag,
  adjustBitrate: bitrate,
} = commander;

let { archive } = commander;

const main = async () => {
  if (!url) {
    logErrorAndExit("No URL provided");
  }

  if (proxy) {
    bootstrapProxy();
  }

  const { hostname, pathname } = new URL(url);
  const archiveUrl = `${hostname}${pathname}`;
  const feed = await getFeed(url, parserConfig);
  const basePath = _path.resolve(
    process.cwd(),
    getFolderName({ feed, template: outDir })
  );

  if (info) {
    logFeedInfo(feed);
  }

  if (list) {
    if (feed?.items?.length) {
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

  logFeedInfo(feed);

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
      const outputImagePath = _path.resolve(
        basePath,
        getSimpleFilename(
          feed.title ? feed.title : "image",
          feed.title ? `.image${podcastImageFileExt}` : podcastImageFileExt
        )
      );

      try {
        logMessage("\nDownloading podcast image...");
        await download({
          archive,
          override,
          marker: podcastImageUrl,
          key: getArchiveKey({
            prefix: archiveUrl,
            name: `${
              feed.title ? `${feed.title}.image` : "image"
            }${podcastImageFileExt}`,
          }),
          outputPath: outputImagePath,
          url: podcastImageUrl,
          maxAttempts: attempts,
        });
      } catch (error) {
        logError("Unable to download podcast image", error);
      }
    }

    const outputMetaPath = _path.resolve(
      basePath,
      getSimpleFilename(
        feed.title ? feed.title : "meta",
        feed.title ? ".meta.json" : ".json"
      )
    );

    try {
      logMessage("\nSaving podcast metadata...");
      writeFeedMeta({
        archive,
        override,
        feed,
        key: getArchiveKey({
          prefix: archiveUrl,
          name: `${feed.title ? `${feed.title}.meta` : "meta"}.json`,
        }),
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
    episodeDigits,
    episodeRegex,
    episodeSourceOrder,
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
    attempts,
    basePath,
    bitrate,
    episodeTemplate,
    episodeDigits,
    episodeSourceOrder,
    exec,
    feed,
    includeEpisodeMeta,
    mono,
    override,
    targetItems,
    threads,
  });

  if (hasErrors && numEpisodesDownloaded !== targetItems.length) {
    logMessage(
      `\n${numEpisodesDownloaded} of ${pluralize(
        "episode",
        targetItems.length,
        true
      )} downloaded\n`
    );
  } else if (numEpisodesDownloaded > 0) {
    logMessage(
      `\nSuccessfully downloaded ${pluralize(
        "episode",
        numEpisodesDownloaded,
        true
      )}\n`
    );
  }

  if (numEpisodesDownloaded === 0) {
    process.exit(ERROR_STATUSES.nothingDownloaded);
  }

  if (hasErrors) {
    process.exit(ERROR_STATUSES.completedWithErrors);
  }
};

main();
