import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import { cwd, getJsonFile } from "./util.js";

const archiveCache = new Map();

const getArchiveData = (archivePath) => {
  if (!archiveCache.has(archivePath)) {
    const content = getJsonFile(archivePath);
    archiveCache.set(archivePath, {
      entries: new Set(content || []),
      dirty: false,
    });
  }

  return archiveCache.get(archivePath);
};

export const getArchiveKey = ({ prefix, name }) => {
  return `${prefix}-${name}`;
};

export const getArchiveKeys = ({ prefix, name, guid }) => {
  const legacyKey = name ? getArchiveKey({ prefix, name }) : null;
  const guidKey = guid ? getArchiveKey({ prefix, name: guid }) : null;
  return [legacyKey, guidKey].filter(Boolean);
};

export const getArchive = (archive) => {
  const { entries } = getArchiveData(archive);
  return [...entries];
};

export const writeToArchive = ({ archiveKeys, archive }) => {
  const data = getArchiveData(archive);

  archiveKeys.forEach((archiveKey) => {
    if (!data.entries.has(archiveKey)) {
      data.entries.add(archiveKey);
      data.dirty = true;
    }
  });

  if (data.dirty) {
    fs.writeFileSync(
      path.resolve(cwd, archive),
      JSON.stringify([...data.entries], null, 4)
    );
    data.dirty = false;
  }
};

export const getIsInArchive = ({ archiveKeys, archive }) => {
  const { entries } = getArchiveData(archive);
  return archiveKeys.some((archiveKey) => entries.has(archiveKey));
};

export const getArchiveFilename = ({ pubDate, name, ext }) => {
  const formattedPubDate = pubDate
    ? dayjs(new Date(pubDate)).format("YYYYMMDD")
    : null;

  const baseName = formattedPubDate ? `${formattedPubDate}-${name}` : name;

  return `${baseName}${ext}`;
};
