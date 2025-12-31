import dayjs from "dayjs";
import filenamify from "filenamify";
import path from "path";

const INVALID_CHAR_REPLACE = "_";

const FILTER_FUNCTIONS = {
  strip: (val) => val.replace(/\s+/g, ""),
  strip_special: (val) => val.replace(/[^a-zA-Z0-9\s]/g, ""),
  underscore: (val) => val.replace(/\s+/g, "_"),
  dash: (val) => val.replace(/\s+/g, "-"),
  camelcase: (val) =>
    val
      .split(/\s+/)
      .map((w) =>
        w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""
      )
      .join(""),
  lowercase: (val) => val.toLowerCase(),
  uppercase: (val) => val.toUpperCase(),
  trim: (val) => val.trim(),
};

const applyFilters = (value, filterStr) => {
  if (!filterStr) {
    return value;
  }

  const filters = filterStr.slice(1).split("|");
  return filters.reduce((val, filter) => {
    const filterFn = FILTER_FUNCTIONS[filter];
    return filterFn ? filterFn(val) : val;
  }, value);
};

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

  const replacementsMap = Object.fromEntries(templateReplacementsTuples);
  const templateSegments = template.trim().split(path.sep);
  const nameSegments = templateSegments.map((segment) => {
    const replaceRegex = /{{(\w+)(\|[^}]+)?}}/g;
    const name = segment.replace(replaceRegex, (match, varName, filterStr) => {
      const replacement = replacementsMap[varName] || "";
      return applyFilters(replacement, filterStr);
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
  const replacementsMap = {
    podcast_title: feed.title || "",
    podcast_link: feed.link || "",
  };

  const replaceRegex = /{{(\w+)(\|[^}]+)?}}/g;
  const name = template.replace(replaceRegex, (_, varName, filterStr) => {
    const replacement = replacementsMap[varName] || "";
    const filtered = applyFilters(replacement, filterStr);
    return getSafeName(filtered);
  });

  return name;
};
