# podcast-dl

## A CLI for downloading podcasts with a focus on archiving.

## How to Use

### Binaries

[Visit the releases page](https://github.com/lightpohl/podcast-dl/releases) and download the latest binary for your system.

`podcast-dl --url <PODCAST_RSS_URL>`

`podcast-dl --url "http://friendsatthetable.libsyn.com/rss"`

### npx

**[Node Required](https://nodejs.org/en/)**

`npx podcast-dl --url <PODCAST_RSS_URL>`

## Options

| Option                  | Type   | Required | Description                                                                                |
| ----------------------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| --url                   | String | true     | URL to podcast RSS feed.                                                                   |
| --out-dir               | String | false    | Specify output directory for episodes and metadata. Defaults to current working directory. |
| --include-meta          |        | false    | Write out podcast metadata to JSON.                                                        |
| --include-episode-meta  |        | false    | Write out individual episode metadata to JSON.                                             |
| --ignore-episode-images |        | false    | Ignore downloading found images from --include-episode-meta.                               |
| --offset                | Number | false    | Offset starting download position. Default is 0.                                           |
| --limit                 | Number | false    | Max number of episodes to download. Downloads all by default.                              |
| --version               |        | false    | Output the version number.                                                                 |
| --help                  |        | false    | Output usage information.                                                                  |
