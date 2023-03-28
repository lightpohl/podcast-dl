import { ITEM_LIST_FORMATS } from "./util.js";
import { createParseNumber, hasFfmpeg } from "./validate.js";
import { logErrorAndExit } from "./logger.js";

export const setupCommander = (commander, argv) => {
  commander
    .version("8.0.4")
    .option("--url <string>", "url to podcast rss feed")
    .option(
      "--out-dir <path>",
      "specify output directory",
      "./{{podcast_title}}"
    )
    .option(
      "--archive [path]",
      "download or write only items not listed in archive file"
    )
    .option(
      "--episode-template <string>",
      "template for generating episode related filenames",
      "{{release_date}}-{{title}}"
    )
    .option(
      "--episode-digits <number>",
      "number of digits to use for episode numbering (leading zeros)",
      createParseNumber({ min: 0, name: "--episode-digits" }),
      1
    )
    .option("--include-meta", "write out podcast metadata to json")
    .option(
      "--include-episode-meta",
      "write out individual episode metadata to json"
    )
    .option("--include-episode-images", "download found episode images")
    .option(
      "--offset <number>",
      "offset episode to start downloading from (most recent = 0)",
      createParseNumber({ min: 0, name: "--offset" }),
      0
    )
    .option(
      "--limit <number>",
      "max amount of episodes to download",
      createParseNumber({ min: 1, name: "--limit", require: false })
    )
    .option(
      "--episode-regex <string>",
      "match episode title against regex before downloading"
    )
    .option(
      "--after <string>",
      "download episodes only after this date (inclusive)"
    )
    .option(
      "--before <string>",
      "download episodes only before this date (inclusive)"
    )
    .option(
      "--add-mp3-metadata",
      "attempts to add a base level of metadata to .mp3 files using ffmpeg",
      hasFfmpeg
    )
    .option(
      "--adjust-bitrate <string>",
      "attempts to adjust bitrate of .mp3 files using ffmpeg",
      hasFfmpeg
    )
    .option(
      "--mono",
      "attempts to force .mp3 files into mono using ffmpeg",
      hasFfmpeg
    )
    .option("--override", "override local files on collision")
    .option("--reverse", "download episodes in reverse order")
    .option("--info", "print retrieved podcast info instead of downloading")
    .option(
      "--list [table|json]",
      "print episode info instead of downloading",
      (value) => {
        if (!ITEM_LIST_FORMATS.includes(value)) {
          logErrorAndExit(
            `${value} is an invalid format for --list\nUse one of the following: ${ITEM_LIST_FORMATS.join(
              ", "
            )}`
          );
        }

        return value;
      }
    )
    .option(
      "--exec <string>",
      "Execute a command after each episode is downloaded"
    )
    .option(
      "--threads <number>",
      "the number of downloads that can happen concurrently",
      createParseNumber({ min: 1, max: 32, name: "threads" }),
      1
    )
    .option(
      "--parser-config <string>",
      "path to JSON config to override RSS parser"
    )
    .option("--proxy", "enable proxy support via global-agent")
    .parse(argv);
};
