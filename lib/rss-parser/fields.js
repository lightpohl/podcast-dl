export const feed = [
  ["author", "creator"],
  ["dc:publisher", "publisher"],
  ["dc:creator", "creator"],
  ["dc:source", "source"],
  ["dc:title", "title"],
  ["dc:type", "type"],
  "title",
  "description",
  "author",
  "pubDate",
  "webMaster",
  "managingEditor",
  "generator",
  "link",
  "language",
  "copyright",
  "lastBuildDate",
  "docs",
  "generator",
  "ttl",
  "rating",
  "skipHours",
  "skipDays",
];

export const item = [
  ["author", "creator"],
  ["dc:creator", "creator"],
  ["dc:date", "date"],
  ["dc:language", "language"],
  ["dc:rights", "rights"],
  ["dc:source", "source"],
  ["dc:title", "title"],
  "title",
  "link",
  "pubDate",
  "author",
  "summary",
  ["content:encoded", "content:encoded", { includeSnippet: true }],
  "enclosure",
  "dc:creator",
  "dc:date",
  "comments",
  ["podcast:transcript", "podcastTranscripts", { keepArray: true }],
];

const mapItunesField = (f) => ["itunes:" + f, f];

export const podcastFeed = ["author", "subtitle", "summary", "explicit"].map(
  mapItunesField
);

export const podcastItem = [
  "author",
  "subtitle",
  "summary",
  "explicit",
  "duration",
  "image",
  "episode",
  "image",
  "season",
  "keywords",
  "episodeType",
].map(mapItunesField);
