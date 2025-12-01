import fs from "fs";
import got from "got";
import pLimit from "p-limit";
import _path from "path";
import stream from "stream";
import { throttle } from "throttle-debounce";
import { promisify } from "util";
import {
  getArchiveFilename,
  getArchiveKey,
  getIsInArchive,
  writeToArchive,
} from "./archive.js";
import { runExec } from "./exec.js";
import { runFfmpeg } from "./ffmpeg.js";
import {
  LOG_LEVELS,
  getLogMessageWithMarker,
  getShouldOutputProgressIndicator,
  logError,
} from "./logger.js";
import { writeItemMeta } from "./meta.js";
import { getItemFilename } from "./naming.js";
import {
  getEpisodeAudioUrlAndExt,
  getTempPath,
  prepareOutputPath,
} from "./util.js";

const pipeline = promisify(stream.pipeline);

const BYTES_IN_MB = 1000000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";

export const download = async (options) => {
  const {
    marker,
    url,
    outputPath,
    key,
    archive,
    override,
    alwaysPostprocess,
    onAfterDownload,
    attempt = 1,
    maxAttempts = 3,
    userAgent = USER_AGENT,
  } = options;

  const logMessage = getLogMessageWithMarker(marker);
  if (!override && fs.existsSync(outputPath)) {
    logMessage("Download exists locally. Skipping...");

    if (onAfterDownload && alwaysPostprocess) {
      await onAfterDownload();
    }

    return;
  }

  if (key && archive && getIsInArchive({ key, archive })) {
    logMessage("Download exists in archive. Skipping...");
    return;
  }

  let headResponse = null;
  try {
    headResponse = await got(url, {
      timeout: 30000,
      method: "HEAD",
      responseType: "json",
      headers: {
        accept: "*/*",
        "user-agent": userAgent,
      },
    });
  } catch (error) {
    // unable to retrieve head response
  }

  const tempOutputPath = getTempPath(outputPath);
  const removeFile = () => {
    if (fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
    }
  };

  const expectedSize = headResponse?.headers?.["content-length"]
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
      got
        .stream(url, { headers: { "user-agent": userAgent } })
        .on("downloadProgress", onDownloadProgress),
      fs.createWriteStream(tempOutputPath)
    );
  } catch (error) {
    removeFile();

    if (attempt <= maxAttempts) {
      logMessage(`Download attempt #${attempt} failed. Retrying...`);

      await download({
        ...options,
        attempt: attempt + 1,
      });
    } else {
      throw error;
    }
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

export const downloadItemsAsync = async ({
  addMp3MetadataFlag,
  archive,
  archivePrefix,
  attempts,
  basePath,
  bitrate,
  episodeTemplate,
  episodeCustomTemplateOptions,
  episodeDigits,
  episodeNumOffset,
  episodeSourceOrder,
  exec,
  feed,
  includeEpisodeImages,
  includeEpisodeMeta,
  mono,
  override,
  alwaysPostprocess,
  targetItems,
  threads = 1,
  userAgent = USER_AGENT,
}) => {
  let numEpisodesDownloaded = 0;
  let hasErrors = false;

  const limit = pLimit(threads);
  const downloadItem = async (item, index) => {
    const threadIndex = index % threads;
    const marker = threads > 1 ? `[${threadIndex}] ${item.title}` : item.title;
    const logMessage = getLogMessageWithMarker(marker);
    const { url: episodeAudioUrl, ext: audioFileExt } =
      getEpisodeAudioUrlAndExt(item, episodeSourceOrder);

    if (!episodeAudioUrl) {
      hasErrors = true;
      logError(`${marker} | Unable to find episode download URL`);
      return;
    }

    const episodeFilename = getItemFilename({
      item,
      feed,
      url: episodeAudioUrl,
      ext: audioFileExt,
      template: episodeTemplate,
      customTemplateOptions: episodeCustomTemplateOptions,
      width: episodeDigits,
      offset: episodeNumOffset,
    });
    const outputPodcastPath = _path.resolve(basePath, episodeFilename);

    prepareOutputPath(outputPodcastPath);

    try {
      await download({
        archive,
        override,
        alwaysPostprocess,
        marker,
        userAgent,
        key: getArchiveKey({
          prefix: archivePrefix,
          name: getArchiveFilename({
            name: item.title,
            pubDate: item.pubDate,
            ext: audioFileExt,
          }),
        }),
        maxAttempts: attempts,
        outputPath: outputPodcastPath,
        url: episodeAudioUrl,
        onAfterDownload: async () => {
          if (item._episodeImage) {
            try {
              await download({
                archive,
                override,
                userAgent,
                key: item._episodeImage.key,
                marker: item._episodeImage.url,
                maxAttempts: attempts,
                outputPath: item._episodeImage.outputPath,
                url: item._episodeImage.url,
              });
            } catch (error) {
              hasErrors = true;
              logError(
                `${marker} | Error downloading ${
                  item._episodeImage.url
                }: ${error.toString()}`
              );
            }
          }

          if (item._episodeTranscript) {
            try {
              await download({
                archive,
                override,
                key: item._episodeTranscript.key,
                marker: item._episodeTranscript.url,
                maxAttempts: attempts,
                outputPath: item._episodeTranscript.outputPath,
                url: item._episodeTranscript.url,
                userAgent,
              });
            } catch (error) {
              hasErrors = true;
              logError(
                `${marker} | Error downloading ${
                  item._episodeTranscript.url
                }: ${error.toString()}`
              );
            }
          }

          const hasEpisodeImage =
            item._episodeImage && fs.existsSync(item._episodeImage.outputPath);

          if (addMp3MetadataFlag || bitrate || mono) {
            logMessage("Running ffmpeg...");
            await runFfmpeg({
              feed,
              item,
              bitrate,
              mono,
              itemIndex: item._originalIndex,
              outputPath: outputPodcastPath,
              episodeImageOutputPath: hasEpisodeImage
                ? item._episodeImage.outputPath
                : undefined,
              addMp3Metadata: addMp3MetadataFlag,
              ext: audioFileExt,
            });
          }

          if (!includeEpisodeImages && hasEpisodeImage) {
            fs.unlinkSync(item._episodeImage.outputPath);
          }

          if (exec) {
            logMessage("Running exec...");
            await runExec({
              exec,
              basePath,
              outputPodcastPath,
              episodeFilename,
              episodeAudioUrl,
            });
          }

          if (includeEpisodeMeta) {
            const episodeMetaExt = ".meta.json";
            const episodeMetaName = getItemFilename({
              item,
              feed,
              url: episodeAudioUrl,
              ext: episodeMetaExt,
              template: episodeTemplate,
              customTemplateOptions: episodeCustomTemplateOptions,
              width: episodeDigits,
              offset: episodeNumOffset,
            });
            const outputEpisodeMetaPath = _path.resolve(
              basePath,
              episodeMetaName
            );

            try {
              logMessage("Saving episode metadata...");
              writeItemMeta({
                marker,
                archive,
                override,
                item,
                key: getArchiveKey({
                  prefix: archivePrefix,
                  name: getArchiveFilename({
                    pubDate: item.pubDate,
                    name: item.title,
                    ext: episodeMetaExt,
                  }),
                }),
                outputPath: outputEpisodeMetaPath,
              });
            } catch (error) {
              hasErrors = true;
              logError(`${marker} | ${error.toString()}`);
            }
          }

          numEpisodesDownloaded += 1;
        },
      });
    } catch (error) {
      hasErrors = true;
      logError(`${marker} | Error downloading episode: ${error.toString()}`);
    }
  };

  const itemPromises = targetItems.map((item, index) =>
    limit(() => downloadItem(item, index))
  );

  await Promise.all(itemPromises);

  return { numEpisodesDownloaded, hasErrors };
};
