import path from "path";
import filenamify from "filenamify";
import dayjs from "dayjs";

const INVALID_CHAR_REPLACE = "_";
const MAX_LENGTH_FILENAME = process.env.MAX_LENGTH_FILENAME
  ? parseInt(process.env.MAX_LENGTH_FILENAME)
  : 255;

const getSafeName = (name, maxLength = MAX_LENGTH_FILENAME) => {
  return filenamify(name, {
    replacement: INVALID_CHAR_REPLACE,
    maxLength,
  });
};

const getSimpleFilename = (name, ext = "") => {
  return `${getSafeName(name, MAX_LENGTH_FILENAME - (ext?.length ?? 0))}${ext}`;
};

const getItemFilename = ({
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
  const formattedPubDate = item.pubDate
    ? dayjs(new Date(item.pubDate)).format("YYYYMMDD")
    : null;

  const customReplacementTuples = customTemplateOptions.map((option, i) => {
    const matchRegex = new RegExp(option);
    const match = item.title.match(matchRegex);

    return match && match[0] ? [`custom_${i}`, match[0]] : [`custom_${i}`, ""];
  });

  const templateReplacementsTuples = [
    ["title", item.title || ""],
    ["release_date", formattedPubDate || ""],
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

const getFolderName = ({ feed, template }) => {
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

const getArchiveFilename = ({ pubDate, name, ext }) => {
  const formattedPubDate = pubDate
    ? dayjs(new Date(pubDate)).format("YYYYMMDD")
    : null;

  const baseName = formattedPubDate ? `${formattedPubDate}-${name}` : name;

  return `${baseName}${ext}`;
};

export {
  getArchiveFilename,
  getFolderName,
  getItemFilename,
  getSafeName,
  getSimpleFilename,
};
