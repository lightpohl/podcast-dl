#!/usr/bin/env node

let path = require("path");
let commander = require("commander");
let rssParser = require("rss-parser");
let filenamify = require("filenamify");
let dayjs = require("dayjs");

let { version } = require("../package.json");
let {
  downloadPodcast,
  getDownloadUrl,
  getUrlExt,
  logFeedInfo,
} = require("./util");

let parser = new rssParser({
  defaultRSS: 2.0,
});

commander
  .version(version)
  .option("--url <string>", "url to podcast rss feed")
  .option("--info", "print retrieved podcast info instead of downloading")
  .option("--out-dir <path>", "specify output directory", "./")
  .parse(process.argv);

let main = async () => {
  let feed;
  try {
    let encodedUrl = encodeURI(commander.url);
    feed = await parser.parseURL(encodedUrl);
  } catch (err) {
    console.error("Unable to parse RSS URL");
    console.error(err);
    process.exit(1);
  }

  if (commander.info) {
    logFeedInfo(feed);
    process.exit(0);
  }

  if (!feed.items || feed.items.length === 0) {
    console.error("No episodes found to download");
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
