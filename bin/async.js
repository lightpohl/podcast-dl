import fs from "fs";
import got from "got";
import pLimit from "p-limit";
import _path from "path";
import stream from "stream";
import { throttle } from "throttle-debounce";
import { promisify } from "util";
import { getArchiveFilename, getArchiveKeys, getIsInArchive, writeToArchive } from "./archive.js";
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
  AUDIO_FORMATS,
  correctExtensionFromMime,
  resolveEpisodeMedia,
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
    existingOutputPath,
    archiveKeys = [],
    archive,
    override,
    alwaysPostprocess,
    onAfterDownload,
    attempt = 1,
    maxAttempts = 3,
    trustExt,
    userAgent = USER_AGENT,
  } = options;

  const logMessage = getLogMessageWithMarker(marker);
  const finishExistingDownload = async (localOutputPath) => {
    logMessage("Download exists locally. Skipping...");

    if (onAfterDownload && alwaysPostprocess) {
      return (await onAfterDownload(localOutputPath)) || localOutputPath;
    }

    return localOutputPath;
  };

  const localOutputPath =
    !override && existingOutputPath && fs.existsSync(existingOutputPath)
      ? existingOutputPath
      : outputPath;

  if (!override && fs.existsSync(localOutputPath)) {
    return finishExistingDownload(localOutputPath);
  }

  if (archive && archiveKeys.length && getIsInArchive({ archiveKeys, archive })) {
    logMessage("Download exists in archive. Skipping...");
    return null;
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
  } catch {
    // unable to retrieve head response
  }

  const correctedOutputPath = trustExt
    ? outputPath
    : correctExtensionFromMime({
        outputPath,
        contentType: headResponse?.headers?.["content-type"],
      });

  if (!override && correctedOutputPath !== outputPath && fs.existsSync(correctedOutputPath)) {
    return finishExistingDownload(correctedOutputPath);
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
      expectedSize ? ` of ${(expectedSize / BYTES_IN_MB).toFixed(2)} MB...` : "..."
    }`,
  );

  try {
    const onDownloadProgress = throttle(3000, (progress) => {
      if (getShouldOutputProgressIndicator() && progress.transferred > 0 && progress.percent < 1) {
        logMessage(
          `${(progress.percent * 100).toFixed(0)}% of ${(progress.total / BYTES_IN_MB).toFixed(
            2,
          )} MB...`,
        );
      }
    });

    await pipeline(
      got
        .stream(url, { headers: { "user-agent": userAgent } })
        .on("downloadProgress", onDownloadProgress),
      fs.createWriteStream(tempOutputPath),
    );
  } catch (error) {
    removeFile();

    if (attempt < maxAttempts) {
      logMessage(`Download attempt #${attempt} failed. Retrying...`);

      return await download({
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
    throw new Error("Downloaded file is empty");
  }

  const finalOutputPath = trustExt
    ? outputPath
    : correctExtensionFromMime({
        outputPath,
        contentType: headResponse?.headers?.["content-type"],
        onCorrect: (from, to) =>
          logMessage(`Correcting extension: ${from} --> ${to}`, LOG_LEVELS.important),
      });

  fs.renameSync(tempOutputPath, finalOutputPath);

  logMessage("Download complete!");

  const processedOutputPath = onAfterDownload
    ? (await onAfterDownload(finalOutputPath)) || finalOutputPath
    : finalOutputPath;

  if (archive && archiveKeys.length) {
    try {
      writeToArchive({ archiveKeys, archive });
    } catch (error) {
      throw new Error(`Error writing to archive: ${error.toString()}`);
    }
  }

  return processedOutputPath;
};

const replaceExtension = (outputPath, ext) => {
  const currentExt = _path.extname(outputPath);
  return currentExt ? outputPath.slice(0, -currentExt.length) + ext : outputPath + ext;
};

export const downloadItemsAsync = async ({
  archive,
  archivePrefix,
  attempts,
  audioFormat,
  basePath,
  bitrate,
  embedMetadataFlag,
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
  trustExt,
  userAgent = USER_AGENT,
}) => {
  let numEpisodesDownloaded = 0;
  let hasErrors = false;

  const limit = pLimit(threads);
  const downloadItem = async (item, index) => {
    const threadIndex = index % threads;
    const marker = threads > 1 ? `[${threadIndex}] ${item.title}` : item.title;
    const logMessage = getLogMessageWithMarker(marker);
    const { url: episodeMediaUrl, ext: mediaFileExt } = resolveEpisodeMedia(
      item,
      episodeSourceOrder,
    );

    if (!episodeMediaUrl) {
      hasErrors = true;
      logError(`${marker} | Unable to find episode download URL`);
      return;
    }

    const episodeFilename = getItemFilename({
      item,
      feed,
      url: episodeMediaUrl,
      ext: mediaFileExt,
      template: episodeTemplate,
      customTemplateOptions: episodeCustomTemplateOptions,
      width: episodeDigits,
      offset: episodeNumOffset,
    });
    const outputPodcastPath = _path.resolve(basePath, episodeFilename);
    const expectedOutputPath = audioFormat
      ? replaceExtension(outputPodcastPath, AUDIO_FORMATS[audioFormat].ext)
      : outputPodcastPath;

    prepareOutputPath(outputPodcastPath);

    try {
      await download({
        archive,
        override,
        alwaysPostprocess,
        marker,
        trustExt,
        userAgent,
        archiveKeys: item._archiveKeys || [],
        maxAttempts: attempts,
        outputPath: outputPodcastPath,
        existingOutputPath: expectedOutputPath,
        url: episodeMediaUrl,
        onAfterDownload: async (finalEpisodePath) => {
          let processedEpisodePath = finalEpisodePath;

          if (item._episodeImage) {
            try {
              const finalImagePath = await download({
                archive,
                override,
                trustExt,
                userAgent,
                archiveKeys: item._episodeImage.archiveKeys || [],
                marker: item._episodeImage.url,
                maxAttempts: attempts,
                outputPath: item._episodeImage.outputPath,
                url: item._episodeImage.url,
              });

              if (finalImagePath) {
                item._episodeImage.outputPath = finalImagePath;
              }
            } catch (error) {
              hasErrors = true;
              logError(
                `${marker} | Error downloading ${item._episodeImage.url}: ${error.toString()}`,
              );
            }
          }

          if (item._episodeTranscript) {
            try {
              const finalTranscriptPath = await download({
                archive,
                override,
                archiveKeys: item._episodeTranscript.archiveKeys || [],
                marker: item._episodeTranscript.url,
                maxAttempts: attempts,
                outputPath: item._episodeTranscript.outputPath,
                trustExt,
                url: item._episodeTranscript.url,
                userAgent,
              });

              if (finalTranscriptPath) {
                item._episodeTranscript.outputPath = finalTranscriptPath;
              }
            } catch (error) {
              hasErrors = true;
              logError(
                `${marker} | Error downloading ${item._episodeTranscript.url}: ${error.toString()}`,
              );
            }
          }

          const hasEpisodeImage =
            item._episodeImage && fs.existsSync(item._episodeImage.outputPath);

          if (embedMetadataFlag || bitrate || mono || audioFormat) {
            logMessage("Running ffmpeg...");
            processedEpisodePath =
              (await runFfmpeg({
                audioFormat,
                bitrate,
                embedMetadata: embedMetadataFlag,
                episodeImageOutputPath: hasEpisodeImage ? item._episodeImage.outputPath : undefined,
                feed,
                item,
                itemIndex: item._originalIndex,
                mono,
                outputPath: processedEpisodePath,
              })) || processedEpisodePath;
          }

          if (!includeEpisodeImages && hasEpisodeImage) {
            fs.unlinkSync(item._episodeImage.outputPath);
          }

          if (exec) {
            logMessage("Running exec...");
            const processedEpisodeFilename = _path.relative(basePath, processedEpisodePath);
            await runExec({
              exec,
              basePath,
              outputPodcastPath: processedEpisodePath,
              episodeFilename: processedEpisodeFilename,
              episodeMediaUrl,
            });
          }

          if (includeEpisodeMeta) {
            const episodeMetaExt = ".meta.json";
            const episodeMetaName = getItemFilename({
              item,
              feed,
              url: episodeMediaUrl,
              ext: episodeMetaExt,
              template: episodeTemplate,
              customTemplateOptions: episodeCustomTemplateOptions,
              width: episodeDigits,
              offset: episodeNumOffset,
            });
            const outputEpisodeMetaPath = _path.resolve(basePath, episodeMetaName);

            try {
              logMessage("Saving episode metadata...");
              writeItemMeta({
                marker,
                archive,
                override,
                item,
                archiveKeys: getArchiveKeys({
                  prefix: archivePrefix,
                  name: getArchiveFilename({
                    pubDate: item.pubDate,
                    name: item.title,
                    ext: episodeMetaExt,
                  }),
                  guid: item.guid ? `${item.guid}-meta` : null,
                }),
                outputPath: outputEpisodeMetaPath,
              });
            } catch (error) {
              hasErrors = true;
              logError(`${marker} | ${error.toString()}`);
            }
          }

          numEpisodesDownloaded += 1;
          return processedEpisodePath;
        },
      });
    } catch (error) {
      hasErrors = true;
      logError(`${marker} | Error downloading episode: ${error.toString()}`);
    }
  };

  const itemPromises = targetItems.map((item, index) => limit(() => downloadItem(item, index)));

  await Promise.all(itemPromises);

  return { numEpisodesDownloaded, hasErrors };
};
