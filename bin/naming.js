let filenamify = require("filenamify");
let dayjs = require("dayjs");

let INVALID_CHAR_REPLACE = "_";
let MAX_LENGTH_FILENAME = 255;

let getSafeName = (name) => {
  return filenamify(name, {
    replacement: INVALID_CHAR_REPLACE,
    maxLength: MAX_LENGTH_FILENAME,
  });
};

let getFilename = ({ item, ext, url, feed, template }) => {
  let formattedPubDate = item.pubDate
    ? dayjs(new Date(item.pubDate)).format("YYYYMMDD")
    : null;

  let templateReplacementsTuples = [
    ["title", item.title || ""],
    ["release_date", formattedPubDate || ""],
    ["url", url],
    ["podcast_title", feed.title || ""],
    ["podcast_link", feed.link || ""],
    ["duration", (item.itunes && item.itunes.duration) || ""],
  ];

  let name = template;
  templateReplacementsTuples.forEach((replacementTuple) => {
    let [matcher, replacement] = replacementTuple;
    let replaceRegex = new RegExp(`{{${matcher}}}`, "g");

    name = replacement
      ? name.replace(replaceRegex, replacement)
      : name.replace(replaceRegex, "");
  });

  name = `${name}${ext}`;
  return getSafeName(name);
};

let getFolderName = ({ feed, template }) => {
  let templateReplacementsTuples = [
    ["podcast_title", feed.title ? getSafeName(feed.title) : ""],
    ["podcast_link", feed.link ? getSafeName(feed.link) : ""],
  ];

  let name = template;
  templateReplacementsTuples.forEach((replacementTuple) => {
    let [matcher, replacement] = replacementTuple;
    let replaceRegex = new RegExp(`{{${matcher}}}`, "g");

    name = replacement
      ? name.replace(replaceRegex, replacement)
      : name.replace(replaceRegex, "");
  });

  return name;
};

let getArchiveFilename = ({ pubDate, name, ext }) => {
  let formattedPubDate = pubDate
    ? dayjs(new Date(pubDate)).format("YYYYMMDD")
    : null;

  let baseName = formattedPubDate ? `${formattedPubDate}-${name}` : name;
  return getSafeName(`${baseName}${ext}`);
};

module.exports = {
  getArchiveFilename,
  getFilename,
  getFolderName,
  getSafeName,
};
