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

Type values surrounded in square brackets (`[]`) can be used as boolean options (no argument required).

| Option                            | Type                | Required | Description                                                                                                                                                                                                                   |
| --------------------------------- | ------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --url                             | String              | true\*   | URL to podcast RSS feed.                                                                                                                                                                                                      |
| --file                            | String              | true\*   | Path to local RSS file.                                                                                                                                                                                                       |
| --out-dir                         | String              | false    | Specify output directory for episodes and metadata. Defaults to `"./{{podcast_title}}"`. See "Template Options" for more details.                                                                                             |
| --threads                         | Number              | false    | Determines the number of downloads that will happen concurrently. Default is `1`.                                                                                                                                             |
| --attempts                        | Number              | false    | Sets the number of download attempts per individual file. Default is `3`.                                                                                                                                                     |
| --archive                         | [String]            | false    | Download or write out items not listed in archive file. Generates archive file at path if not found. Defaults to `"./{{podcast_title}}/archive.json"` when used as a boolean option. See "Template Options" for more details. |
| --episode-template                | String              | false    | Template for generating episode related filenames. See "Template Options" for details.                                                                                                                                        |
| --episode-custom-template-options | <String...>         | false    | Provide custom options for the episode template. See "Template Options" for details.                                                                                                                                          |
| --include-meta                    |                     | false    | Write out podcast metadata to JSON.                                                                                                                                                                                           |
| --include-episode-meta            |                     | false    | Write out individual episode metadata to JSON.                                                                                                                                                                                |
| --include-episode-images          |                     | false    | Download found episode images.                                                                                                                                                                                                |
| --include-episode-transcripts     |                     | false    | Download found episode transcripts.                                                                                                                                                                                           |
| --offset                          | Number              | false    | Offset starting download position. Default is `0`.                                                                                                                                                                            |
| --limit                           | Number              | false    | Max number of episodes to download. Downloads all by default.                                                                                                                                                                 |
| --after                           | String              | false    | Only download episodes after this date (i.e. MM/DD/YYYY, inclusive).                                                                                                                                                          |
| --before                          | String              | false    | Only download episodes before this date (i.e. MM/DD/YYYY, inclusive).                                                                                                                                                         |
| --episode-regex                   | String              | false    | Match episode title against provided regex before starting download.                                                                                                                                                          |
| --episode-regex-exclude           | String              | false    | Episode titles matching provided regex will be excluded.                                                                                                                                                                      |
| --episode-digits                  | Number              | false    | Minimum number of digits to use for episode numbering (e.g. 3 would generate "001" instead of "1"). Default is `1`.                                                                                                           |
| --episode-num-offset              | Number              | false    | Offset the acquired episode number. Default is `0`.                                                                                                                                                                           |
| --episode-source-order            | String              | false    | Attempted order to extract episode audio URL from RSS feed. Default is `"enclosure,link"`.                                                                                                                                    |
| --episode-transcript-types        | String              | false    | List of allowed transcript types in preferred order. Default is "application/json,application/x-subrip,application/srr,application/srt,text/vtt,text/html,text/plain".                                                        |
| --season                          | Number              | false    | Only download episodes from specified season. Note: this will only work if the RSS feed includes the `itunes:season` tag on episodes.                                                                                         |
| --add-mp3-metadata                |                     | false    | Attempts to add a base level of episode metadata to each episode. Recommended only in cases where the original metadata is of poor quality. (**ffmpeg required**)                                                             |
| --adjust-bitrate                  | String (e.g. "48k") | false    | Attempts to adjust bitrate of episodes. (**ffmpeg required**)                                                                                                                                                                 |
| --mono                            |                     | false    | Attempts to force episodes into mono. (**ffmpeg required**)                                                                                                                                                                   |
| --override                        |                     | false    | Override local files on collision.                                                                                                                                                                                            |
| --always-postprocess              |                     | false    | Always run additional tasks on the file regardless if the file already exists. This includes `--add-mp3-metadata`, `--adjust-bitrate`, `--mono`, and `--exec`.                                                                |
| --reverse                         |                     | false    | Reverse download direction and start at last RSS item.                                                                                                                                                                        |
| --info                            |                     | false    | Print retrieved podcast info instead of downloading.                                                                                                                                                                          |
| --list                            | [String]            | false    | Print episode list instead of downloading. Defaults to `"table"` when used as a boolean option. `"json"` is also supported.                                                                                                   |
| --exec                            | String              | false    | Execute a command after each episode is downloaded. See "Template Options" for more details.                                                                                                                                  |
| --parser-config                   | String              | false    | Path to JSON file that will be parsed and used to override the default config passed to [rss-parser](https://github.com/rbren/rss-parser#xml-options).                                                                        |
| --user-agent                      | String              | false    | Specify custom user agent string for HTTP requests. Defaults to a Chrome user agent if not specified.                                                                                                                         |
| --proxy                           |                     | false    | Enable proxy support. Specify environment variables listed by [global-agent](https://github.com/gajus/global-agent#environment-variables).                                                                                    |
| --help                            |                     | false    | Output usage information.                                                                                                                                                                                                     |

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
- `release_year`: The release year (`YYYY`) of the episode.
- `release_month`: The release month (`MM`) of the episode.
- `release_day`: The release day (`DD`) of the episode.
- `episode_num`: The position number of where the episode appears in the feed.
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

### Template Filters

Template variables can be transformed using filters. Filters are applied using the pipe (`|`) character and can be chained:

`--episode-template "{{podcast_title|underscore}}-{{title|strip_special|camelcase}}"`

For example, given `title` = "Serial- S01 E01: The Alibi":

- `{{title|strip_special|underscore}}` produces `Serial S01 E01 The Alibi` then `Serial_S01_E01_The_Alibi`
- `{{title|strip_special|camelcase}}` produces `SerialS01E01TheAlibi`

#### Available Filters

| Filter          | Description                                   | Input         | Output      |
| --------------- | --------------------------------------------- | ------------- | ----------- |
| `strip`         | Remove all whitespace                         | `"foo bar"`   | `"foobar"`  |
| `strip_special` | Remove non-alphanumeric chars (except spaces) | `"S01: E01!"` | `"S01 E01"` |
| `underscore`    | Replace whitespace with underscores           | `"foo bar"`   | `"foo_bar"` |
| `dash`          | Replace whitespace with dashes                | `"foo bar"`   | `"foo-bar"` |
| `camelcase`     | Convert to UpperCamelCase                     | `"foo bar"`   | `"FooBar"`  |
| `lowercase`     | Convert to lowercase                          | `"FOO Bar"`   | `"foo bar"` |
| `uppercase`     | Convert to UPPERCASE                          | `"foo bar"`   | `"FOO BAR"` |
| `trim`          | Remove leading/trailing whitespace            | `" foo "`     | `"foo"`     |

## Log Levels

By default, all logs and errors are outputted to the console. The amount of logs can be controlled using the environment variable `LOG_LEVEL` with the following options:

- `static`: All logs and errors are outputted to the console, but disables any animations.
- `quiet`: Only important info and non-critical errors will be logged (e.g. episode download started).
- `silent`: Only critical error messages will be logged.

## OS Filename Limits

By default, the max length of a generated filename is `255`. If your OS has different limitations, or if you're running into issues with non-standard feeds, you can adjust the limit via the environment variable `MAX_LENGTH_FILENAME`.
