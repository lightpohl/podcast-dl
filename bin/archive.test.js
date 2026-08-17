import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { writeToArchive } from "./archive.js";

const testDirectories = [];

afterEach(() => {
  testDirectories.forEach((directory) => {
    fs.rmSync(directory, { recursive: true, force: true });
  });
  testDirectories.length = 0;
});

describe("writeToArchive", () => {
  it("creates missing parent directories for a custom archive path", () => {
    const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "podcast-dl-archive-"));
    const archivePath = path.join(testDirectory, "nested", "state", "archive.json");
    testDirectories.push(testDirectory);

    writeToArchive({ archive: archivePath, archiveKeys: ["episode-key"] });

    expect(JSON.parse(fs.readFileSync(archivePath, "utf8"))).toEqual(["episode-key"]);
  });
});
