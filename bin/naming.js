import filenamify from "filenamify";
import dayjs from "dayjs";

const INVALID_CHAR_REPLACE = "_";
const MAX_LENGTH_FILENAME = 255;

const getSafeName = (name) => {
  return filenamify(name, {
    replacement: INVALID_CHAR_REPLACE,
    maxLength: MAX_LENGTH_FILENAME,
  });
};

const getFilename = ({ item, ext, url, feed, template }) => {
  const formattedPubDate = item.pubDate
    ? dayjs(new Date(item.pubDate)).format("YYYYMMDD")
    : null;

  const templateReplacementsTuples = [
    ["title", item.title || ""],
    ["release_date", formattedPubDate || ""],
    ["url", url],
    ["podcast_title", feed.title || ""],
    ["podcast_link", feed.link || ""],
    ["duration", (item.itunes && item.itunes.duration) || ""],
  ];

  let name = template;
  templateReplacementsTuples.forEach((replacementTuple) => {
    const [matcher, replacement] = replacementTuple;
    const replaceRegex = new RegExp(`{{${matcher}}}`, "g");

    name = replacement
      ? name.replace(replaceRegex, replacement)
      : name.replace(replaceRegex, "");
  });

  name = `${name}${ext}`;
  return getSafeName(name);
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
      ? name.replace(replaceRegex, replacement)
      : name.replace(replaceRegex, "");
  });

  return getSafeName(name);
};

const getArchiveFilename = ({ pubDate, name, ext }) => {
  const formattedPubDate = pubDate
    ? dayjs(new Date(pubDate)).format("YYYYMMDD")
    : null;

  const baseName = formattedPubDate ? `${formattedPubDate}-${name}` : name;
  return getSafeName(`${baseName}${ext}`);
};

export { getArchiveFilename, getFilename, getFolderName, getSafeName };
