import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";

const loadNaming = async (maxLengthFilename) => {
  vi.resetModules();
  const previousMaxLengthFilename = process.env.MAX_LENGTH_FILENAME;

  if (maxLengthFilename === undefined) {
    delete process.env.MAX_LENGTH_FILENAME;
  } else {
    process.env.MAX_LENGTH_FILENAME = `${maxLengthFilename}`;
  }

  try {
    return await import("./naming.js");
  } finally {
    if (previousMaxLengthFilename === undefined) {
      delete process.env.MAX_LENGTH_FILENAME;
    } else {
      process.env.MAX_LENGTH_FILENAME = previousMaxLengthFilename;
    }
  }
};

afterEach(() => {
  delete process.env.MAX_LENGTH_FILENAME;
});

describe("getSafeName", () => {
  it("replaces periods before sanitizing the filename", async () => {
    const { getSafeName } = await loadNaming();

    expect(getSafeName("2024.01.02.Episode.mp3")).toBe(
      "2024_01_02_Episode_mp3"
    );
  });
});

describe("getSimpleFilename", () => {
  it("reserves space for the extension when truncating", async () => {
    const { getSimpleFilename } = await loadNaming(10);

    expect(getSimpleFilename("abcdefghijk", ".mp3")).toBe("abcdef.mp3");
  });
});

describe("getItemFilename", () => {
  it("builds nested filenames from template replacements and filters", async () => {
    const { getItemFilename } = await loadNaming();

    const result = getItemFilename({
      item: {
        _originalIndex: 2,
        title: "  Great Episode! S01E02  ",
        pubDate: "2024-01-02T12:00:00.000Z",
        guid: "episode-guid",
        itunes: { duration: "42:10" },
      },
      ext: ".mp3",
      url: "https://example.com/audio.mp3",
      feed: {
        title: " My Podcast ",
        link: "https://example.com/show",
        items: new Array(15).fill(null),
      },
      template:
        "{{podcast_title|trim|dash}}/{{release_date}}-{{episode_num}}-{{title|trim|strip_special|underscore}}-{{custom_0|uppercase}}",
      width: 3,
      customTemplateOptions: ["S\\d+E\\d+"],
    });

    expect(result).toBe(
      path.join("My-Podcast", "20240102-013-Great_Episode_S01E02-S01E02.mp3")
    );
  });

  it("truncates directory and file segments independently", async () => {
    const { getItemFilename } = await loadNaming(8);

    const result = getItemFilename({
      item: {
        _originalIndex: 0,
        title: "123456789",
      },
      ext: ".mp3",
      url: "https://example.com/audio.mp3",
      feed: {
        title: "ABCDEFGHI",
        items: [null],
      },
      template: "{{podcast_title}}/{{title}}",
      width: 1,
    });

    expect(result).toBe(path.join("ABCDEFGH", "1234.mp3"));
  });
});

describe("getFolderName", () => {
  it("applies filters and then sanitizes the final folder name", async () => {
    const { getFolderName } = await loadNaming();

    expect(
      getFolderName({
        feed: { title: "  My/Podcast.Name  " },
        template: "{{podcast_title|trim|underscore}}",
      })
    ).toBe("My_Podcast_Name");
  });
});
