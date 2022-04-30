# podcast-dl

A CLI for downloading podcasts with a focus on archiving.

## How to Use

### npx

**[Node Required](https://nodejs.org/en/)**

`npx podcast-dl --url <PODCAST_RSS_URL>`

### [More Examples](./docs/examples.md)

## Options

Type values surrounded in square brackets (`[]`) can be used as used as boolean options (no argument required).

| Option                   | Type                | Required | Description                                                                                                                                                                                                           |
| ------------------------ | ------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --url                    | String              | true     | URL to podcast RSS feed.                                                                                                                                                                                              |
| --out-dir                | String              | false    | Specify output directory for episodes and metadata. Defaults to "./{{podcast_title}}". See "Templating" for more details.                                                                                             |
| --threads                | Number              | false    | Determines the number of downloads that will happen concurrently. Default is 1.                                                                                                                                       |
| --archive                | [String]            | false    | Download or write out items not listed in archive file. Generates archive file at path if not found. Defaults to "./{{podcast_title}}/archive.json" when used as a boolean option. See "Templating" for more details. |
| --episode-template       | String              | false    | Template for generating episode related filenames. See "Templating" for details.                                                                                                                                      |
| --include-meta           | [String]            | false    | Write out podcast metadata. Can be repeated to choose what to fields to include (see [metadata](#metadata)). Defaults to ["title", "description", "link", "feedUrl", "managingEditor"] when used as a boolean option. |
| --include-episode-meta   | [String]            | false    | Write out individual episode metadata. Can be repeated to choose what to fields to include (see [metadata](#metadata)). Defaults to ["title", "contentSnippet", "pubDate", "creator"] when used as a boolean option.  |
| --metadata-format        | String              | false    | The format to write the feed and episode metadata in. Either "json" or "xml". Defaults to "json".                                                                                                                     |
| --include-episode-images |                     | false    | Download found episode images.                                                                                                                                                                                        |
| --offset                 | Number              | false    | Offset starting download position. Default is 0.                                                                                                                                                                      |
| --limit                  | Number              | false    | Max number of episodes to download. Downloads all by default.                                                                                                                                                         |
| --after                  | String              | false    | Only download episodes after this date (i.e. MM/DD/YYY, inclusive).                                                                                                                                                   |
| --before                 | String              | false    | Only download episodes before this date (i.e. MM/DD/YYY, inclusive)                                                                                                                                                   |
| --episode-regex          | String              | false    | Match episode title against provided regex before starting download.                                                                                                                                                  |
| --add-mp3-metadata       |                     | false    | Attempts to add a base level of MP3 metadata to each episode. Recommended only in cases where the original metadata is of poor quality. (**ffmpeg required**)                                                         |
| --adjust-bitrate         | String (e.g. "48k") | false    | Attempts to adjust bitrate of MP3s. (**ffmpeg required**)                                                                                                                                                             |
| --mono                   |                     | false    | Attempts to force MP3s into mono. (**ffmpeg required**)                                                                                                                                                               |
| --override               |                     | false    | Override local files on collision.                                                                                                                                                                                    |
| --reverse                |                     | false    | Reverse download direction and start at last RSS item.                                                                                                                                                                |
| --info                   |                     | false    | Print retrieved podcast info instead of downloading.                                                                                                                                                                  |
| --list                   | [String]            | false    | Print episode list instead of downloading. Defaults to "table" when used as a boolean option. "json" is also supported.                                                                                               |
| --exec                   | String              | false    | Execute a command after each episode is downloaded.                                                                                                                                                                   |
| --filter-url-tacking     |                     | false    | Attempts to extract the direct download link of an episode if detected (**experimental**).                                                                                                                            |
| --version                |                     | false    | Output the version number.                                                                                                                                                                                            |
| --help                   |                     | false    | Output usage information.                                                                                                                                                                                             |

## Archive

- If passed the `--archive [path]` option, `podcast-dl` will generate/use a JSON archive at the provided path.
- Before downloading an episode or writing out metadata, it'll check if the item was saved previously and abort the save if found.

## Templating

Options that support templating allow users to specify a template for the generated filename(s). The provided template will replace all matched keywords with the related data described below. Each keyword must be wrapped in two braces like so:

`--out-dir "./{{podcast_title}}"`

`--episode-template "{{release_date}}-{{title}}"`

### `--out-dir` & `--archive`

- `podcast_title`: Title of the podcast feed.
- `podcast_link`: `link` value provided for the podcast feed. Typically the homepage URL.

### `--episode-template`

- `title`: The title of the episode.
- `release_date`: The release date of the episode in `YYYYMMDD` format.
- `url`: URL of episode audio file.
- `duration`: Provided `mm:ss` duration (if found).
- `podcast_title`: Title of the podcast feed.
- `podcast_link`: `link` value provided for the podcast feed. Typically the homepage URL.

## Metadata

The metadata options allow you to specify globs to select what to include/exclude. Lets take a look at some metadata to use as an example for how this works.

Lets take the following snippet from the feed's channel info.

<details>
<summary>XML</summary>

```xml
<xml>
    <title>8-4 Play</title>
    <description><![CDATA[Every other week, tune into 8-4 Play for talk about Japan, video games, and Japanese video games, straight from the 8-4 offices in beautiful downtown Tokyo.]]></description>
    <image>
       <url>https://ssl-static.libsyn.com/p/assets/e/c/1/e/ec1e4c9c798b4df7/84playicon600x600libsyn.jpg</url>
       <title>8-4 Play</title>
       <link><![CDATA[http://www.8-4.jp/]]></link>
    </image>
    <itunes:summary><![CDATA[Every other week, tune into 8-4 Play for talk about Japan, video games, and Japanese video games, straight from the 8-4 offices in beautiful downtown Tokyo.]]></itunes:summary>
    <itunes:subtitle><![CDATA[]]></itunes:subtitle>
    <itunes:author>8-4, Ltd.</itunes:author>
    <itunes:owner>
        <itunes:name><![CDATA[8-4, Ltd.]]></itunes:name>
        <itunes:email>info@8-4.jp</itunes:email>
    </itunes:owner>
    <itunes:keywords>84,360,Games,Microsoft</itunes:keywords>
</xml>
```

</details>

This results in the following JSON if everything is included.

<details>
<summary>Unfiltered JSON</summary>

```json
{
  "title": "8-4 Play",
  "description": "Every other week, tune into 8-4 Play for talk about Japan, video games, and Japanese video games, straight from the 8-4 offices in beautiful downtown Tokyo.",
  "image": {
    "link": "http://www.8-4.jp/",
    "url": "https://ssl-static.libsyn.com/p/assets/e/c/1/e/ec1e4c9c798b4df7/84playicon600x600libsyn.jpg",
    "title": "8-4 Play"
  },
  "itunes": {
    "summary": "Every other week, tune into 8-4 Play for talk about Japan, video games, and Japanese video games, straight from the 8-4 offices in beautiful downtown Tokyo.",
    "subtitle": "",
    "owner": {
      "name": "8-4, Ltd.",
      "email": "info@8-4.jp"
    },
    "keywords": ["84", "360", "Games", "Microsoft"]
  }
}
```

</details>

Instead of including everything, you can limit what to include/exclude with the `--include-meta` option. This can be passed multiple times, providing a rule each time. A single asterix matches any field name, but not nested names. A double asterix matches and field nane and any nested name.

<details>
<summary><code>--include-meta '*'</code></summary>

```json
{
  "title": "8-4 Play",
  "description": "Every other week, tune into 8-4 Play for talk about Japan, video games, and Japanese video games, straight from the 8-4 offices in beautiful downtown Tokyo."
}
```

</details>

<details>
<summary><code>--include-meta '**'</code></summary>

```json
{
  "title": "8-4 Play",
  "description": "Every other week, tune into 8-4 Play for talk about Japan, video games, and Japanese video games, straight from the 8-4 offices in beautiful downtown Tokyo.",
  "image": {
    "link": "http://www.8-4.jp/",
    "url": "https://ssl-static.libsyn.com/p/assets/e/c/1/e/ec1e4c9c798b4df7/84playicon600x600libsyn.jpg",
    "title": "8-4 Play"
  },
  "itunes": {
    "summary": "Every other week, tune into 8-4 Play for talk about Japan, video games, and Japanese video games, straight from the 8-4 offices in beautiful downtown Tokyo.",
    "subtitle": "",
    "owner": {
      "name": "8-4, Ltd.",
      "email": "info@8-4.jp"
    },
    "keywords": ["84", "360", "Games", "Microsoft"]
  }
}
```

</details>

<details>
<summary><code>--include-meta '*' --include-meta 'image.*'</code></summary>

```json
{
  "title": "8-4 Play",
  "description": "Every other week, tune into 8-4 Play for talk about Japan, video games, and Japanese video games, straight from the 8-4 offices in beautiful downtown Tokyo.",
  "image": {
    "link": "http://www.8-4.jp/",
    "url": "https://ssl-static.libsyn.com/p/assets/e/c/1/e/ec1e4c9c798b4df7/84playicon600x600libsyn.jpg",
    "title": "8-4 Play"
  }
}
```

</details>

If a rule starts with an exclamation mark it excludes matching field instead of including them. The last rule to match a field determines whether to include or exclude it, and if no rules match it will be excluded.

<details>
<summary><code>--include-meta '**' --include-meta '!itunes.*' --include-meta 'itunes.summary'</code></summary>

```json
{
  "title": "8-4 Play",
  "description": "Every other week, tune into 8-4 Play for talk about Japan, video games, and Japanese video games, straight from the 8-4 offices in beautiful downtown Tokyo.",
  "image": {
    "link": "http://www.8-4.jp/",
    "url": "https://ssl-static.libsyn.com/p/assets/e/c/1/e/ec1e4c9c798b4df7/84playicon600x600libsyn.jpg",
    "title": "8-4 Play"
  },
  "itunes": {
    "summary": "Every other week, tune into 8-4 Play for talk about Japan, video games, and Japanese video games, straight from the 8-4 offices in beautiful downtown Tokyo."
  }
}
```

</details>

To get an overview of what fields are available (which may differ per feed), just use include everything (`--include-meta '**'` or `--include-episode-meta '**'`) and check the resulting file.

## Executing Process After Downloading Episode

Option to execute command after downloading episode with `{}` being a placeholder for the downloaded episode and `{filenameBase}` for the filename without extension.

- Example to convert all episodes to mp3 with 192k: `ffmpeg -i {} -b:a 192k -f mp3 {filenameBase}.mp3`
- Example to move all episodes to folder: `mv {} /mnt/media_server/`

## Log Levels

By default, all logs and errors are outputted to the console. The amount of logs can be controlled using the environment variable `LOG_LEVEL` with the following options:

- `static`: All logs and errors are outputted to the console, but disables any animations.
- `quiet`: Only important info and non-critical errors will be logged (e.g. episode download started).
- `silent`: Only critical error messages will be be logged.
