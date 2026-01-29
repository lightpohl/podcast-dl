import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import { getJsonFile } from "./util.js";

export const getArchiveKey = ({ prefix, name }) => {
  return `${prefix}-${name}`;
};

export const getArchiveKeys = ({ prefix, name, guid }) => {
  const legacyKey = name ? getArchiveKey({ prefix, name }) : null;
  const guidKey = guid ? getArchiveKey({ prefix, name: guid }) : null;
  return [legacyKey, guidKey].filter(Boolean);
};

export const getArchive = (archive) => {
  const archiveContent = getJsonFile(archive);
  return archiveContent === null ? [] : archiveContent;
};

export const writeToArchive = ({ key, archiveKeys, archive }) => {
  const archivePath = path.resolve(process.cwd(), archive);
  const archiveResult = getArchive(archive);
  const keys = Array.from(
    new Set([key, ...(archiveKeys || [])].filter(Boolean))
  );

  keys.forEach((archiveKey) => {
    if (!archiveResult.includes(archiveKey)) {
      archiveResult.push(archiveKey);
    }
  });

  fs.writeFileSync(archivePath, JSON.stringify(archiveResult, null, 4));
};

export const getIsInArchive = ({ key, archiveKeys, archive }) => {
  const archiveResult = getArchive(archive);
  const keys = [key, ...(archiveKeys || [])].filter(Boolean);
  return keys.some((archiveKey) => archiveResult.includes(archiveKey));
};

export const getArchiveFilename = ({ pubDate, name, ext }) => {
  const formattedPubDate = pubDate
    ? dayjs(new Date(pubDate)).format("YYYYMMDD")
    : null;

  const baseName = formattedPubDate ? `${formattedPubDate}-${name}` : name;

  return `${baseName}${ext}`;
};
