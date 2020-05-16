let filenamify = require("filenamify");
let dayjs = require("dayjs");

let INVALID_CHAR_REPLACE = "_";
let MAX_LENGTH_FILENAME = 255;

let getFilename = ({ item, ext, url, feed, template }) => {
  let formattedPubDate = item.pubDate
    ? dayjs(new Date(item.pubDate)).format("YYYYMMDD")
    : null;

  let templateReplacementsTuples = [
    ["title", item.title],
    ["release_date", formattedPubDate],
    ["url", url],
    ["podcast_title", feed.title],
    ["podcast_link", feed.link],
    ["duration", item.itunes && item.itunes.duration],
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
  return filenamify(name, {
    replacement: INVALID_CHAR_REPLACE,
    maxLength: MAX_LENGTH_FILENAME,
  });
};

let getArchiveFilename = ({ pubDate, name, ext }) => {
  let formattedPubDate = pubDate
    ? dayjs(new Date(pubDate)).format("YYYYMMDD")
    : null;

  let baseName = formattedPubDate ? `${formattedPubDate}-${name}` : name;
  return filenamify(`${baseName}${ext}`, {
    replacement: INVALID_CHAR_REPLACE,
    maxLength: MAX_LENGTH_FILENAME,
  });
};

module.exports = {
  getFilename,
  getArchiveFilename,
};
