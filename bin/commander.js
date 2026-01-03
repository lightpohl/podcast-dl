import { ITEM_LIST_FORMATS } from "./items.js";
import { logErrorAndExit } from "./logger.js";
import { AUDIO_ORDER_TYPES, TRANSCRIPT_TYPES } from "./util.js";
import { createParseNumber, hasFfmpeg } from "./validate.js";

export const setupCommander = (program) => {
  program
    .option("--url <string>", "url to podcast rss feed")
    .option("--file <path>", "local path to podcast rss feed")
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
      "--episode-custom-template-options <patterns...>",
      "create custom options for the episode template"
    )
    .option(
      "--episode-digits <number>",
      "minimum number of digits to use for episode numbering (leading zeros)",
      createParseNumber({ min: 0, name: "--episode-digits" }),
      1
    )
    .option(
      "--episode-num-offset <number>",
      "offset the acquired episode number",
      createParseNumber({
        min: Number.MIN_SAFE_INTEGER,
        max: Number.MAX_SAFE_INTEGER,
        name: "--episode-num-offset",
      }),
      0
    )
    .option(
      "--episode-source-order <string>",
      "attempted order to extract episode audio URL from rss feed",
      (value) => {
        const parsed = value.split(",").map((type) => type.trim());
        const isValid = parsed.every((type) => !!AUDIO_ORDER_TYPES[type]);

        if (!isValid) {
          logErrorAndExit(
            `Invalid type found in --episode-source-order: ${value}\n`
          );
        }

        return parsed;
      },
      [AUDIO_ORDER_TYPES.enclosure, AUDIO_ORDER_TYPES.link]
    )
    .option("--include-meta", "write out podcast metadata to json")
    .option(
      "--include-episode-meta",
      "write out individual episode metadata to json"
    )
    .option(
      "--include-episode-transcripts",
      "download found episode transcripts"
    )
    .option(
      "--episode-transcript-types <string>",
      "list of allowed transcript types in preferred order",
      (value) => {
        const parsed = value.split(",").map((type) => type.trim());
        const isValid = parsed.every((type) => !!TRANSCRIPT_TYPES[type]);

        if (!isValid) {
          logErrorAndExit(
            `Invalid type found in --transcript-types: ${value}\n`
          );
        }

        return parsed;
      },
      [
        TRANSCRIPT_TYPES["application/json"],
        TRANSCRIPT_TYPES["application/x-subrip"],
        TRANSCRIPT_TYPES["application/srr"],
        TRANSCRIPT_TYPES["application/srt"],
        TRANSCRIPT_TYPES["text/vtt"],
        TRANSCRIPT_TYPES["text/html"],
        TRANSCRIPT_TYPES["text/plain"],
      ]
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
      "--episode-regex-exclude <string>",
      "episode titles matching regex will be excluded"
    )
    .option(
      "--season <number>",
      "download only episodes from this season",
      createParseNumber({ min: 0, name: "--season" })
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
      "attempts to add a base level of metadata to episode files using ffmpeg",
      hasFfmpeg
    )
    .option(
      "--adjust-bitrate <string>",
      "attempts to adjust bitrate of episode files using ffmpeg",
      hasFfmpeg
    )
    .option(
      "--mono",
      "attempts to force episode files into mono using ffmpeg",
      hasFfmpeg
    )
    .option("--override", "override local files on collision")
    .option(
      "--always-postprocess",
      "always run additional tasks on the file regardless of whether the file already exists"
    )
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
      "execute a command after each episode is downloaded"
    )
    .option(
      "--threads <number>",
      "the number of downloads that can happen concurrently",
      createParseNumber({
        min: 1,
        max: Number.MAX_SAFE_INTEGER,
        name: "threads",
      }),
      1
    )
    .option(
      "--attempts <number>",
      "the number of attempts for an individual download",
      createParseNumber({
        min: 1,
        max: Number.MAX_SAFE_INTEGER,
        name: "attempts",
      }),
      3
    )
    .option(
      "--parser-config <string>",
      "path to JSON config to override RSS parser"
    )
    .option("--proxy", "enable proxy support via global-agent")
    .option("--user-agent <string>", "specify custom user agent string");

  program.parse();

  return program.opts();
};
