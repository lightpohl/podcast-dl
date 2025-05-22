# podcast-dl

A humble CLI for downloading and archiving podcasts.

## How to Use

### npx

**[Node Required](https://nodejs.org/en/)**

`npx podcast-dl --url <PODCAST_RSS_URL>`

### Binaries

[Visit the releases page](https://github.com/lightpohl/podcast-dl/releases) and download the latest binary for your system.

`podcast-dl --url <PODCAST_RSS_URL>`

### [More Examples](./docs/examples.md)

## Options

Either `--url` or `--file` must be provided.

Type values surrounded in square brackets (`[]`) can be used as used as boolean options (no argument required).

| Option                            | Type                | Required | Description                                                                                                                                                            |
| --------------------------------- | ------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --url                             | String              | true\*   | URL to podcast RSS feed.                                                                                                                                               |
| --file                            | String              | true\*   | Path to local RSS file.                                                                                                                                                |
| --out-dir                         | String              | false    | Specify output directory for episodes and metadata. Defaults to "./{{podcast_title}}". See "Template Options" for more details.                                        |
| --threads                         | Number              | false    | Determines the number of downloads that will happen concurrently. Default is 1.                                                                                        |
| --attempts                        | Number              | false    | Sets the number of download attempts per individual file. Default is 3.                                                                                                |
| --episode-template                | String              | false    | Template for generating episode related filenames. See "Template Options" for details.                                                                                 |
| --episode-custom-template-options | <String...>         | false    | Provide custom options for the episode template. See "Template Options" for details.                                                                                   |
| --include-meta                    |                     | false    | Write out podcast metadata to JSON.                                                                                                                                    |
| --include-episode-meta            |                     | false    | Write out individual episode metadata **to** JSON.                                                                                                                     |
| --include-episode-images          |                     | false    | Download found episode images.                                                                                                                                         |
| --include-episode-transcripts     |                     | false    | Download found episode transcripts.                                                                                                                                    |
| --offset                          | Number              | false    | Offset starting download position. Default is 0.                                                                                                                       |
| --limit                           | Number              | false    | Max number of episodes to download. Downloads all by default.                                                                                                          |
| --after                           | String              | false    | Only download episodes after this date (i.e. MM/DD/YYY, inclusive).                                                                                                    |
| --before                          | String              | false    | Only download episodes before this date (i.e. MM/DD/YYY, inclusive)                                                                                                    |
| --episode-regex                   | String              | false    | Match episode title against provided regex before starting download.                                                                                                   |
| --episode-regex-exclude           | String              | false    | Matched episode titles against provided regex will be excluded.                                                                                                        |
| --episode-digits                  | Number              | false    | Minimum number of digits to use for episode numbering (e.g. 3 would generate "001" instead of "1"). Default is 0.                                                      |
| --episode-num-offset              | Number              | false    | Offset the acquired episode number. Default is 0.                                                                                                                      |
| --episode-source-order            | String              | false    | Attempted order to extract episode audio URL from RSS feed. Default is "enclosure,link".                                                                               |
| --episode-transcript-types        | String              | false    | List of allowed transcript types in preferred order. Default is "application/json,application/x-subrip,application/srr,application/srt,text/vtt,text/html,text/plain". |
| --add-mp3-metadata                |                     | false    | Attempts to add a base level of episode metadata to each episode. Recommended only in cases where the original metadata is of poor quality. (**ffmpeg required**)      |
| --adjust-bitrate                  | String (e.g. "48k") | false    | Attempts to adjust bitrate of episodes. (**ffmpeg required**)                                                                                                          |
| --mono                            |                     | false    | Attempts to force episodes into mono. (**ffmpeg required**)                                                                                                            |
| --override                        |                     | false    | Override local files on collision.                                                                                                                                     |
| --always-postprocess              |                     | false    | Always run additional tasks on the file regardless if the file already exists. This includes --add-mp3-metadata, --adjust-bitrate, --mono, and --exec.                 |
| --reverse                         |                     | false    | Reverse download direction and start at last RSS item.                                                                                                                 |
| --info                            |                     | false    | Print retrieved podcast info instead of downloading.                                                                                                                   |
| --list                            | [String]            | false    | Print episode list instead of downloading. Defaults to "table" when used as a boolean option. "json" is also supported.                                                |
| --exec                            | String              | false    | Execute a command after each episode is downloaded. See "Template Options" for more details.                                                                           |
| --parser-config                   | String              | false    | Path to JSON file that will be parsed and used to override the default config passed to [rss-parser](https://github.com/rbren/rss-parser#xml-options).                 |
| --proxy                           |                     | false    | Enable proxy support. Specify environment variables listed by [global-agent](https://github.com/gajus/global-agent#environment-variables).                             |
| --help                            |                     | false    | Output usage information.                                                                                                                                              |

## Template Options

Options that support templates allow users to specify a template for the generated filename(s) or option. The provided template will replace all matched keywords with the related data described below. Each keyword must be wrapped in two braces like so:

`--out-dir "./{{podcast_title}}"`

`--episode-template "{{release_date}}-{{title}}"`

### `--out-dir`

- `podcast_title`: Title of the podcast feed.
- `podcast_link`: `link` value provided for the podcast feed. Typically the homepage URL.

### `--episode-template`

- `title`: The title of the episode.
- `release_date`: The release date of the episode in `YYYYMMDD` format.
- `release_year`: The release year (`YYYY`) of the episode.
- `release_month`: The release month (`MM`) of the episode.
- `release_day`: The release day (`DD`) of the episode.
- `episode_num`: The location number of where the episodes appears in the feed.
- `url`: URL of episode audio file.
- `duration`: Provided `mm:ss` duration (if found).
- `podcast_title`: Title of the podcast feed.
- `podcast_link`: `link` value provided for the podcast feed. Typically the homepage URL.
- `guid`: The GUID of the episode.

#### `--episode-custom-template-options`

Each matcher provided will be used to extract a value from the episode `title`. Access these values in the template using the `custom_<n>` keyword where `<n>` is the index of the matcher provided (starting from `0`).

If no match is found, the `custom_<n>` keyword will be replaced with an empty string.

### `--exec`

- `episode_path`: The path to the downloaded episode.
- `episode_path_base`: The path to the folder of the downloaded episode.
- `episode_filename`: The filename of the episode.
- `episode_filename_base`: The filename of the episode without its extension.
- `url`: URL of episode audio file.

## Log Levels

By default, all logs and errors are outputted to the console. The amount of logs can be controlled using the environment variable `LOG_LEVEL` with the following options:

- `static`: All logs and errors are outputted to the console, but disables any animations.
- `quiet`: Only important info and non-critical errors will be logged (e.g. episode download started).
- `silent`: Only critical error messages will be be logged.

## OS Filename Limits

By default, the max length of a generated filename is `255`. If your OS has different limitations, or if you're running into issues with non-standard feeds, you can adjust the limit via the environment variable `MAX_LENGTH_FILENAME`.
