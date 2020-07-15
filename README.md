# podcast-dl

## A CLI for downloading podcasts with a focus on archiving.

![podcast-dl example gif](./docs/podcast-dl-example.gif)

<a href='https://ko-fi.com/A0A01PXDX' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi2.png?v=2' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

## How to Use

### Binaries

[Visit the releases page](https://github.com/lightpohl/podcast-dl/releases) and download the latest binary for your system.

`podcast-dl --url <PODCAST_RSS_URL>`

`podcast-dl --url "http://friendsatthetable.libsyn.com/rss"`

### npx

**[Node Required](https://nodejs.org/en/)**

`npx podcast-dl --url <PODCAST_RSS_URL>`

## Options

| Option                  | Type   | Required | Description                                                                                                               |
| ----------------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| --url                   | String | true     | URL to podcast RSS feed.                                                                                                  |
| --out-dir               | String | false    | Specify output directory for episodes and metadata. Defaults to "./{{podcast_title}}". See "Templating" for more details. |
| --archive               | String | false    | Download or write out items not listed in archive file. Generates archive file at path if not found.                      |
| --episode-template      | String | false    | Template for generating episode related filenames. See "Templating" for details.                                          |
| --include-meta          |        | false    | Write out podcast metadata to JSON.                                                                                       |
| --include-episode-meta  |        | false    | Write out individual episode metadata to JSON.                                                                            |
| --ignore-episode-images |        | false    | Ignore downloading found images from --include-episode-meta.                                                              |
| --offset                | Number | false    | Offset starting download position. Default is 0.                                                                          |
| --limit                 | Number | false    | Max number of episodes to download. Downloads all by default.                                                             |
| --override              |        | false    | Override local files on collision.                                                                                        |
| --reverse               |        | false    | Reverse download direction and start at last RSS item.                                                                    |
| --info                  |        | false    | Print retrieved podcast info instead of downloading.                                                                      |
| --list                  |        | false    | Print episode list instead of downloading.                                                                                |
| --version               |        | false    | Output the version number.                                                                                                |
| --help                  |        | false    | Output usage information.                                                                                                 |

## Archive

- If passed the `--archive <path>` option, `podcast-dl` will generate/use a JSON archive at the provided path.
- Before downloading an episode or writing out metadata, it'll check if the item was saved previously and abort the save if found.

## Templating

Options that support templating allow users to specify a template for the generated filename(s). The provided template will replace all matched keywords with the related data described below. Each keyword must be wrapped in two braces like so:

`--out-dir "./{{podcast_title}}"`

`--episode-template "{{release_date}}-{{title}}"`

### `--out-dir`

- `podcast_title`: Title of the podcast feed.
- `podcast_link`: `link` value provided for the podcast feed. Typically the homepage URL.

### `--episode-template`

- `title`: The title of the episode.
- `release_date`: The release date of the episode in `YYYYMMDD` format.
- `url`: URL of episode audio file.
- `duration`: Provided `mm:ss` duration (if found).
- `podcast_title`: Title of the podcast feed.
- `podcast_link`: `link` value provided for the podcast feed. Typically the homepage URL.
