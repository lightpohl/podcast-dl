import dayjs from "dayjs";
import filenamify from "filenamify";
import path from "path";

const INVALID_CHAR_REPLACE = "_";
const MAX_LENGTH_FILENAME = process.env.MAX_LENGTH_FILENAME
  ? parseInt(process.env.MAX_LENGTH_FILENAME)
  : 255;

export const getSafeName = (name, maxLength = MAX_LENGTH_FILENAME) => {
  return filenamify(name, {
    replacement: INVALID_CHAR_REPLACE,
    maxLength,
  });
};

export const getSimpleFilename = (name, ext = "") => {
  return `${getSafeName(name, MAX_LENGTH_FILENAME - (ext?.length ?? 0))}${ext}`;
};

export const getItemFilename = ({
  item,
  ext,
  url,
  feed,
  template,
  width,
  customTemplateOptions = [],
  offset = 0,
}) => {
  const episodeNum = feed.items.length - item._originalIndex + offset;
  const title = item.title || "";

  const releaseYear = item.pubDate
    ? dayjs(new Date(item.pubDate)).format("YYYY")
    : null;

  const releaseMonth = item.pubDate
    ? dayjs(new Date(item.pubDate)).format("MM")
    : null;

  const releaseDay = item.pubDate
    ? dayjs(new Date(item.pubDate)).format("DD")
    : null;

  const releaseDate = item.pubDate
    ? dayjs(new Date(item.pubDate)).format("YYYYMMDD")
    : null;

  const customReplacementTuples = customTemplateOptions.map((option, i) => {
    const matchRegex = new RegExp(option);
    const match = title.match(matchRegex);

    return match && match[0] ? [`custom_${i}`, match[0]] : [`custom_${i}`, ""];
  });

  const templateReplacementsTuples = [
    ["title", title],
    ["release_date", releaseDate || ""],
    ["release_year", releaseYear || ""],
    ["release_month", releaseMonth || ""],
    ["release_day", releaseDay || ""],
    ["episode_num", `${episodeNum}`.padStart(width, "0")],
    ["url", url],
    ["podcast_title", feed.title || ""],
    ["podcast_link", feed.link || ""],
    ["duration", item.itunes?.duration || ""],
    ["guid", item.guid],
    ...customReplacementTuples,
  ];

  const templateSegments = template.trim().split(path.sep);
  const nameSegments = templateSegments.map((segment) => {
    let name = segment;
    templateReplacementsTuples.forEach((replacementTuple) => {
      const [matcher, replacement] = replacementTuple;
      const replaceRegex = new RegExp(`{{${matcher}}}`, "g");

      name = replacement
        ? name.replace(replaceRegex, replacement)
        : name.replace(replaceRegex, "");
    });

    return getSimpleFilename(name);
  });

  nameSegments[nameSegments.length - 1] = getSimpleFilename(
    nameSegments[nameSegments.length - 1],
    ext
  );

  return nameSegments.join(path.sep);
};

export const getFolderName = ({ feed, template }) => {
  const templateReplacementsTuples = [
    ["podcast_title", feed.title || ""],
    ["podcast_link", feed.link || ""],
  ];

  let name = template;
  templateReplacementsTuples.forEach((replacementTuple) => {
    const [matcher, replacement] = replacementTuple;
    const replaceRegex = new RegExp(`{{${matcher}}}`, "g");

    name = replacement
      ? name.replace(replaceRegex, getSafeName(replacement))
      : name.replace(replaceRegex, "");
  });

  return name;
};
