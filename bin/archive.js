import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import { getJsonFile } from "./util.js";

export const getArchiveKey = ({ prefix, name }) => {
  return `${prefix}-${name}`;
};

export const getArchive = (archive) => {
  const archiveContent = getJsonFile(archive);
  return archiveContent === null ? [] : archiveContent;
};

export const writeToArchive = ({ key, archive }) => {
  const archivePath = path.resolve(process.cwd(), archive);
  const archiveResult = getArchive(archive);

  if (!archiveResult.includes(key)) {
    archiveResult.push(key);
  }

  fs.writeFileSync(archivePath, JSON.stringify(archiveResult, null, 4));
};

export const getIsInArchive = ({ key, archive }) => {
  const archiveResult = getArchive(archive);
  return archiveResult.includes(key);
};

export const getArchiveFilename = ({ pubDate, name, ext }) => {
  const formattedPubDate = pubDate
    ? dayjs(new Date(pubDate)).format("YYYYMMDD")
    : null;

  const baseName = formattedPubDate ? `${formattedPubDate}-${name}` : name;

  return `${baseName}${ext}`;
};
