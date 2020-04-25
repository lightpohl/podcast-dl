#!/usr/bin/env node

let _url = require("url");
let path = require("path");
let fs = require("fs");
let commander = require("commander");
let rssParser = require("rss-parser");
let got = require("got");
let filenamify = require("filenamify");
let dayjs = require("dayjs");
let { version } = require("../package.json");

let parser = new rssParser({
  defaultRSS: 2.0,
});

commander
  .version(version)
  .option("--url <string>", "url to podcast rss feed")
  .option("--info", "print retrieved podcast info instead of downloading")
  .option("--out-dir <path>", "specify output directory", "./")
  .parse(process.argv);

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

let main = async () => {
  let feed;
  try {
    let encodedUrl = encodeURI(commander.url);
    feed = await parser.parseURL(encodedUrl);
  } catch (err) {
    console.log("Unable to parse RSS URL");
    console.log(err);
    process.exit(1);
  }

  if (commander.info) {
    console.log(`Title: ${feed.title}`);
    console.log(`Description: ${feed.description}`);
    console.log(`Total Episodes: ${feed.items.length}`);
    process.exit(0);
  }

  if (feed.items.length === 0) {
    console.log("No episodes found to download");
    process.exit(1);
  }

  console.log(`Starting download of ${feed.items.length} items`);
  let counter = 1;
  for (let item of feed.items) {
    let { enclosure, link, title, pubDate } = item;

    let url = getDownloadUrl({ enclosure, link });

    if (!url) {
      console.error("Unable to find donwload URL. Skipping");
      break;
    }

    let fileName = pubDate
      ? `${dayjs(new Date(pubDate)).format("YYYYMMDD")}-${title}`
      : title;
    let safeFilename = filenamify(fileName, { replacement: "_" });
    let fileExt = getUrlExt(url);
    let outputPath = path.resolve(
      process.cwd(),
      commander.outDir,
      `${safeFilename}${fileExt}`
    );

    console.log(`Title: ${title}`);
    console.log(`URL: ${url}`);
    console.log(`${counter} of ${feed.items.length}`);

    await downloadPodcast({
      outputPath,
      url,
    });

    counter += 1;
  }
};

main();
