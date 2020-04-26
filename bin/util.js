let _url = require("url");
let path = require("path");
let fs = require("fs");
let got = require("got");

let logFeedInfo = (feed) => {
  console.log(`Title: ${feed.title}`);
  console.log(`Description: ${feed.description}`);
  console.log(`Total Episodes: ${feed.items ? feed.items.length : 0}`);
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

let getDownloadUrl = ({ enclosure, link }) => {
  if (link && isAudioUrl(link)) {
    return link;
  }

  if (enclosure && isAudioUrl(enclosure.url)) {
    return enclosure.url;
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
  process.stdout.write("\n\n");
};

let downloadPodcast = async ({ url, outputPath }) => {
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
  downloadPodcast,
  getDownloadUrl,
  getUrlExt,
  logFeedInfo,
};
