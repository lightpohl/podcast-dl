let _url = require("url");
let path = require("path");
let fs = require("fs");
let got = require("got");

let logFeedInfo = (feed) => {
  console.log(`Title: ${feed.title}`);
  console.log(`Description: ${feed.description}`);
  console.log(`Total Episodes: ${feed.items ? feed.items.length : 0}`);
};

let logItemInfo = (item) => {
  let { title, pubDate } = item;

  console.log(`Title: ${title}`);
  console.log(`Publish Date: ${pubDate}`);
};

let writeFeedMeta = ({ outputPath, feed }) => {
  let title = feed.title || null;
  let description = feed.description || null;
  let link = feed.link || null;
  let feedUrl = feed.feedUrl || null;
  let managingEditor = feed.managingEditor || null;

  try {
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          title,
          description,
          link,
          feedUrl,
          managingEditor,
        },
        null,
        4
      )
    );
  } catch (error) {
    console.error("Unable to save meta file for episode");
    console.error(error);
  }
};

let writeItemMeta = ({ outputPath, item }) => {
  let title = item.title || null;
  let descriptionText = item.contentSnippet || null;
  let pubDate = item.pubDate || null;
  let creator = item.creator || null;

  try {
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          title,
          pubDate,
          creator,
          descriptionText,
        },
        null,
        4
      )
    );
  } catch (error) {
    console.error("Unable to save meta file for episode");
    console.error(error);
  }
};

let getUrlExt = (url) => {
  let pathname = _url.parse(url).pathname;
  let ext = path.extname(pathname);
  return ext;
};

let VALID_AUDIO_TYPES = [".mp3", ".aac", ".m4a", ".wav", ".ogg", ".flac"];
let isAudioUrl = (url) => {
  let ext = getUrlExt(url);
  return VALID_AUDIO_TYPES.includes(ext);
};

let getEpisodeAudioUrl = ({ enclosure, link }) => {
  if (link && isAudioUrl(link)) {
    return link;
  }

  if (enclosure && isAudioUrl(enclosure.url)) {
    return enclosure.url;
  }

  return null;
};

let getImageUrl = ({ image, itunes }) => {
  if (image && image.url) {
    return image.url;
  }

  if (image && image.link) {
    return image.link;
  }

  if (itunes && itunes.image) {
    return itunes.image;
  }

  return null;
};

let BYTES_IN_MB = 1000000;
let currentProgressLine = "";
let printProgress = ({ percent, total }) => {
  let percentRounded = (percent * 100).toFixed(0);
  let line = `downloading... ${percentRounded}%`;

  if (total) {
    let totalMBs = total / BYTES_IN_MB;
    let roundedTotalMbs = totalMBs.toFixed(2);
    line += ` of ${roundedTotalMbs} MB`;
  }

  if (line !== currentProgressLine) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(line);
    currentProgressLine = line;
  }
};

let endPrintProgress = () => {
  process.stdout.write("\n");
};

let download = async ({ url, outputPath }) => {
  return new Promise((resolve) => {
    got
      .stream(url)
      .on("downloadProgress", (progress) => {
        printProgress(progress);
      })
      .on("end", () => {
        endPrintProgress();
        resolve();
      })
      .pipe(fs.createWriteStream(outputPath));
  });
};

module.exports = {
  download,
  getEpisodeAudioUrl,
  getImageUrl,
  getUrlExt,
  logFeedInfo,
  logItemInfo,
  writeFeedMeta,
  writeItemMeta,
};
