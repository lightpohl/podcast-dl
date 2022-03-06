import pLimit from "p-limit";
import _path from "path";
import { promisify } from "util";
import stream from "stream";
import fs from "fs";
import got from "got";
import { throttle } from "throttle-debounce";

import {
  logError,
  LOG_LEVELS,
  getLogMessageWithMarker,
  getShouldOutputProgressIndicator,
} from "./logger.js";
import { getArchiveFilename, getFilename } from "./naming.js";
import {
  getEpisodeAudioUrlAndExt,
  getArchiveKey,
  getTempPath,
  runFfmpeg,
  runExec,
  writeItemMeta,
  writeToArchive,
  getUrlEmbed,
} from "./util.js";

const pipeline = promisify(stream.pipeline);

const BYTES_IN_MB = 1000000;

const download = async ({
  marker,
  url,
  outputPath,
  key,
  archive,
  override,
  onAfterDownload,
  filterUrlTracking,
}) => {
  const logMessage = getLogMessageWithMarker(marker);
  if (!override && fs.existsSync(outputPath)) {
    logMessage("Download exists locally. Skipping...");
    return;
  }

  let embeddedUrl = null;
  if (filterUrlTracking) {
    logMessage("Attempting to find embedded URL...");
    embeddedUrl = await getUrlEmbed(url);

    if (!embeddedUrl) {
      logMessage("Unable to find embedded URL. Defaulting to full address");
    }
  }

  const finalUrl = embeddedUrl || url;
  const headResponse = await got(finalUrl, {
    timeout: 5000,
    method: "HEAD",
    responseType: "json",
    headers: {
      accept: "*/*",
    },
  });

  const tempOutputPath = getTempPath(outputPath);
  const removeFile = () => {
    if (fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
    }
  };

  const expectedSize =
    headResponse &&
    headResponse.headers &&
    headResponse.headers["content-length"]
      ? parseInt(headResponse.headers["content-length"])
      : 0;

  logMessage(
    `Starting download${
      expectedSize
        ? ` of ${(expectedSize / BYTES_IN_MB).toFixed(2)} MB...`
        : "..."
    }`
  );

  try {
    const onDownloadProgress = throttle(3000, (progress) => {
      if (
        getShouldOutputProgressIndicator() &&
        progress.transferred > 0 &&
        progress.percent < 1
      ) {
        logMessage(
          `${(progress.percent * 100).toFixed(0)}% of ${(
            progress.total / BYTES_IN_MB
          ).toFixed(2)} MB...`
        );
      }
    });

    await pipeline(
      got.stream(finalUrl).on("downloadProgress", onDownloadProgress),
      fs.createWriteStream(tempOutputPath)
    );
  } catch (error) {
    removeFile();
    throw error;
  }

  const fileSize = fs.statSync(tempOutputPath).size;

  if (fileSize === 0) {
    removeFile();

    logMessage(
      "Unable to write to file. Suggestion: verify permissions",
      LOG_LEVELS.important
    );

    return;
  }

  fs.renameSync(tempOutputPath, outputPath);

  if (expectedSize && !isNaN(expectedSize) && expectedSize !== fileSize) {
    logMessage(
      "File size differs from expected content length. Suggestion: verify file works as expected",
      LOG_LEVELS.important
    );
    logMessage(`${outputPath}`, LOG_LEVELS.important);
  }

  logMessage("Download complete!");

  if (onAfterDownload) {
    await onAfterDownload();
  }

  if (key && archive) {
    try {
      writeToArchive({ key, archive });
    } catch (error) {
      throw new Error(`Error writing to archive: ${error.toString()}`);
    }
  }
};

let downloadItemsAsync = async ({
  addMp3MetadataFlag,
  archive,
  archiveUrl,
  basePath,
  bitrate,
  episodeTemplate,
  exec,
  feed,
  filterUrlTracking,
  includeEpisodeMeta,
  includeEpisodeMetaFields,
  mono,
  override,
  targetItems,
  threads = 1,
}) => {
  let numEpisodesDownloaded = 0;
  let hasErrors = false;

  const limit = pLimit(threads);
  const downloadItem = async (item, index) => {
    const threadIndex = index % threads;
    const marker = threads > 1 ? `[${threadIndex}] ${item.title}` : item.title;
    const logMessage = getLogMessageWithMarker(marker);
    const { url: episodeAudioUrl, ext: audioFileExt } =
      getEpisodeAudioUrlAndExt(item);

    if (!episodeAudioUrl) {
      hasErrors = true;
      logError(`${marker} | Unable to find episode download URL`);
      return;
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
        marker,
        filterUrlTracking,
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
        onAfterDownload: async () => {
          if (addMp3MetadataFlag || bitrate || mono) {
            logMessage("Running ffmpeg...");
            await runFfmpeg({
              feed,
              item,
              bitrate,
              mono,
              itemIndex: item._originalIndex,
              outputPath: outputPodcastPath,
            });
          }

          if (exec) {
            logMessage("Running exec...");
            await runExec({ exec, outputPodcastPath, episodeFilename });
          }

          numEpisodesDownloaded += 1;
        },
      });
    } catch (error) {
      hasErrors = true;
      logError(`${marker} | Error downloading episode: ${error.toString()}`);
    }

    for (const extra of item._extra_downloads) {
      try {
        logMessage("Downloading episode image...");
        await download({
          archive,
          override,
          marker: extra.url,
          key: extra.key,
          outputPath: extra.outputPath,
          url: extra.url,
        });
      } catch (error) {
        hasErrors = true;
        logError(
          `${marker} | Error downloading ${extra.url}: ${error.toString()}`
        );
      }
    }

    if (includeEpisodeMeta) {
      const episodeMetaExt = ".meta.json";
      const episodeMetaName = getFilename({
        item,
        feed,
        url: episodeAudioUrl,
        ext: episodeMetaExt,
        template: episodeTemplate,
      });
      const outputEpisodeMetaPath = _path.resolve(basePath, episodeMetaName);

      try {
        logMessage("Saving episode metadata...");
        writeItemMeta({
          marker,
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
          extraFields: includeEpisodeMetaFields,
        });
      } catch (error) {
        hasErrors = true;
        logError(`${marker} | ${error.toString()}`);
      }
    }
  };

  const itemPromises = targetItems.map((item, index) =>
    limit(() => downloadItem(item, index))
  );

  await Promise.all(itemPromises);

  return { numEpisodesDownloaded, hasErrors };
};

export { download, downloadItemsAsync };
