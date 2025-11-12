import dayjs from "dayjs";
import path from "path";
import { getArchive, getArchiveFilename, getArchiveKey } from "./archive.js";
import { logErrorAndExit } from "./logger.js";
import { getItemFilename } from "./naming.js";
import {
  getEpisodeAudioUrlAndExt,
  getImageUrl,
  getLoopControls,
  getTranscriptUrl,
  getUrlExt,
} from "./util.js";

export const ITEM_LIST_FORMATS = ["table", "json"];

export const getItemsToDownload = ({
  archive,
  archivePrefix,
  addMp3MetadataFlag,
  basePath,
  feed,
  limit,
  offset,
  reverse,
  before,
  after,
  episodeDigits,
  episodeNumOffset,
  episodeRegex,
  episodeRegexExclude,
  episodeSourceOrder,
  episodeTemplate,
  episodeCustomTemplateOptions,
  includeEpisodeImages,
  includeEpisodeTranscripts,
  episodeTranscriptTypes,
  season,
}) => {
  const { startIndex, shouldGo, next } = getLoopControls({
    offset,
    reverse,
    length: feed.items.length,
  });

  let i = startIndex;
  const items = [];

  const savedArchive = archive ? getArchive(archive) : [];

  while (shouldGo(i)) {
    const { title, pubDate, itunes } = feed.items[i];
    const actualSeasonNum = itunes?.season ? parseInt(itunes.season) : null;
    const pubDateDay = dayjs(new Date(pubDate));
    let isValid = true;

    if (episodeRegex) {
      const generatedEpisodeRegex = new RegExp(episodeRegex);
      if (title && !generatedEpisodeRegex.test(title)) {
        isValid = false;
      }
    }

    if (episodeRegexExclude) {
      const generatedEpisodeRegexExclude = new RegExp(episodeRegexExclude);
      if (title && generatedEpisodeRegexExclude.test(title)) {
        isValid = false;
      }
    }

    if (before) {
      const beforeDateDay = dayjs(new Date(before));
      if (
        !pubDateDay.isSame(beforeDateDay, "day") &&
        !pubDateDay.isBefore(beforeDateDay, "day")
      ) {
        isValid = false;
      }
    }

    if (after) {
      const afterDateDay = dayjs(new Date(after));
      if (
        !pubDateDay.isSame(afterDateDay, "day") &&
        !pubDateDay.isAfter(afterDateDay, "day")
      ) {
        isValid = false;
      }
    }

    if (season && season != actualSeasonNum) {
      isValid = false;
    }

    const { url: episodeAudioUrl, ext: audioFileExt } =
      getEpisodeAudioUrlAndExt(feed.items[i], episodeSourceOrder);

    const key = getArchiveKey({
      prefix: archivePrefix,
      name: getArchiveFilename({
        pubDate,
        name: title,
        ext: audioFileExt,
      }),
    });

    if (key && savedArchive.includes(key)) {
      isValid = false;
    }

    if (isValid) {
      const item = feed.items[i];
      item._originalIndex = i;
      item.seasonNum = actualSeasonNum;

      if (includeEpisodeImages || addMp3MetadataFlag) {
        const episodeImageUrl = getImageUrl(item);

        if (episodeImageUrl) {
          const episodeImageFileExt = getUrlExt(episodeImageUrl);
          const episodeImageArchiveKey = getArchiveKey({
            prefix: archivePrefix,
            name: getArchiveFilename({
              pubDate,
              name: title,
              ext: episodeImageFileExt,
            }),
          });

          const episodeImageName = getItemFilename({
            item,
            feed,
            url: episodeAudioUrl,
            ext: episodeImageFileExt,
            template: episodeTemplate,
            customTemplateOptions: episodeCustomTemplateOptions,
            width: episodeDigits,
            offset: episodeNumOffset,
          });

          const outputImagePath = path.resolve(basePath, episodeImageName);
          item._episodeImage = {
            url: episodeImageUrl,
            outputPath: outputImagePath,
            key: episodeImageArchiveKey,
          };
        }
      }

      if (includeEpisodeTranscripts) {
        const episodeTranscriptUrl = getTranscriptUrl(
          item,
          episodeTranscriptTypes
        );

        if (episodeTranscriptUrl) {
          const episodeTranscriptFileExt = getUrlExt(episodeTranscriptUrl);
          const episodeTranscriptArchiveKey = getArchiveKey({
            prefix: archivePrefix,
            name: getArchiveFilename({
              pubDate,
              name: title,
              ext: episodeTranscriptFileExt,
            }),
          });

          const episodeTranscriptName = getItemFilename({
            item,
            feed,
            url: episodeAudioUrl,
            ext: episodeTranscriptFileExt,
            template: episodeTemplate,
            width: episodeDigits,
            offset: episodeNumOffset,
          });

          const outputTranscriptPath = path.resolve(
            basePath,
            episodeTranscriptName
          );

          item._episodeTranscript = {
            url: episodeTranscriptUrl,
            outputPath: outputTranscriptPath,
            key: episodeTranscriptArchiveKey,
          };
        }
      }

      items.push(item);
    }

    i = next(i);
  }

  return limit ? items.slice(0, limit) : items;
};

export const logItemsList = ({
  type,
  feed,
  limit,
  offset,
  reverse,
  before,
  after,
  episodeRegex,
  episodeRegexExclude,
  season,
}) => {
  const items = getItemsToDownload({
    feed,
    limit,
    offset,
    reverse,
    before,
    after,
    episodeRegex,
    episodeRegexExclude,
    season,
  });

  if (!items.length) {
    logErrorAndExit("No episodes found with provided criteria to list");
  }

  const isJson = type === "json";

  const output = items.map((item) => {
    const data = {
      seasonNum: item.seasonNum,
      episodeNum: feed.items.length - item._originalIndex,
      title: item.title,
      pubDate: item.pubDate,
    };

    return data;
  });

  if (isJson) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(output));
    return;
  }

  // eslint-disable-next-line no-console
  console.table(output);
};
