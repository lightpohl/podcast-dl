# podcast-dl

A CLI for downloading podcasts with a focus on archiving.

## How to Use

### npx

**[Node Required](https://nodejs.org/en/)**

`npx podcast-dl --url <PODCAST_RSS_URL>`

### Binaries

[Visit the releases page](https://github.com/lightpohl/podcast-dl/releases) and download the latest binary for your system.

`podcast-dl --url <PODCAST_RSS_URL>`

### [More Examples](./docs/examples.md)

## Options

Type values surrounded in square brackets (`[]`) can be used as used as boolean options (no argument required).

| Option                   | Type                | Required | Description                                                                                                                                                                                                                 |
| ------------------------ | ------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --url                    | String              | true     | URL to podcast RSS feed.                                                                                                                                                                                                    |
| --out-dir                | String              | false    | Specify output directory for episodes and metadata. Defaults to "./{{podcast_title}}". See "Template Options" for more details.                                                                                             |
| --threads                | Number              | false    | Determines the number of downloads that will happen concurrently. Default is 1.                                                                                                                                             |
| --archive                | [String]            | false    | Download or write out items not listed in archive file. Generates archive file at path if not found. Defaults to "./{{podcast_title}}/archive.json" when used as a boolean option. See "Template Options" for more details. |
| --episode-template       | String              | false    | Template for generating episode related filenames. See "Template Options" for details.                                                                                                                                      |
| --include-meta           |                     | false    | Write out podcast metadata to JSON.                                                                                                                                                                                         |
| --include-episode-meta   |                     | false    | Write out individual episode metadata to JSON.                                                                                                                                                                              |
| --include-episode-images |                     | false    | Download found episode images.                                                                                                                                                                                              |
| --offset                 | Number              | false    | Offset starting download position. Default is 0.                                                                                                                                                                            |
| --limit                  | Number              | false    | Max number of episodes to download. Downloads all by default.                                                                                                                                                               |
| --after                  | String              | false    | Only download episodes after this date (i.e. MM/DD/YYY, inclusive).                                                                                                                                                         |
| --before                 | String              | false    | Only download episodes before this date (i.e. MM/DD/YYY, inclusive)                                                                                                                                                         |
| --episode-regex          | String              | false    | Match episode title against provided regex before starting download.                                                                                                                                                        |
| --episode-digits         | Number              | false    | Minimum number of digits to use for episode numbering (e.g. 3 would generate "001" instead of "1"). Default is 0.                                                                                                           |
| --add-mp3-metadata       |                     | false    | Attempts to add a base level of MP3 metadata to each episode. Recommended only in cases where the original metadata is of poor quality. (**ffmpeg required**)                                                               |
| --adjust-bitrate         | String (e.g. "48k") | false    | Attempts to adjust bitrate of MP3s. (**ffmpeg required**)                                                                                                                                                                   |
| --mono                   |                     | false    | Attempts to force MP3s into mono. (**ffmpeg required**)                                                                                                                                                                     |
| --override               |                     | false    | Override local files on collision.                                                                                                                                                                                          |
| --reverse                |                     | false    | Reverse download direction and start at last RSS item.                                                                                                                                                                      |
| --info                   |                     | false    | Print retrieved podcast info instead of downloading.                                                                                                                                                                        |
| --list                   | [String]            | false    | Print episode list instead of downloading. Defaults to "table" when used as a boolean option. "json" is also supported.                                                                                                     |
| --exec                   | String              | false    | Execute a command after each episode is downloaded. See "Template Options" for more details.                                                                                                                                |
| --parser-config          | String              | false    | Path to JSON file that will be parsed and used to override the default config passed to [rss-parser](https://github.com/rbren/rss-parser#xml-options).                                                                      |
| --proxy                  |                     | false    | Enable proxy support. Specify environment variables listed by [global-agent](https://github.com/gajus/global-agent#environment-variables).                                                                                  |
| --version                |                     | false    | Output the version number.                                                                                                                                                                                                  |
| --help                   |                     | false    | Output usage information.                                                                                                                                                                                                   |

## Archive

- If passed the `--archive [path]` option, `podcast-dl` will generate/use a JSON archive at the provided path.
- Before downloading an episode or writing out metadata, it'll check if the item was saved previously and abort the save if found.

## Template Options

Options that support templates allow users to specify a template for the generated filename(s) or option. The provided template will replace all matched keywords with the related data described below. Each keyword must be wrapped in two braces like so:

`--out-dir "./{{podcast_title}}"`

`--episode-template "{{release_date}}-{{title}}"`

### `--out-dir` & `--archive`

- `podcast_title`: Title of the podcast feed.
- `podcast_link`: `link` value provided for the podcast feed. Typically the homepage URL.

### `--episode-template`

- `title`: The title of the episode.
- `release_date`: The release date of the episode in `YYYYMMDD` format.
- `episode_num`: The location number of where the episodes appears in the feed.
- `url`: URL of episode audio file.
- `duration`: Provided `mm:ss` duration (if found).
- `podcast_title`: Title of the podcast feed.
- `podcast_link`: `link` value provided for the podcast feed. Typically the homepage URL.

### `--exec`

- `episode_path`: The path to the downloaded episode.
- `episode_path_base`: The path to the folder of the downloaded episode.
- `episode_filname`: The filename of the episode.
- `episode_filename_base`: The filename of the episode without its extension.

## Log Levels

By default, all logs and errors are outputted to the console. The amount of logs can be controlled using the environment variable `LOG_LEVEL` with the following options:

- `static`: All logs and errors are outputted to the console, but disables any animations.
- `quiet`: Only important info and non-critical errors will be logged (e.g. episode download started).
- `silent`: Only critical error messages will be be logged.
