import { execFileSync } from "child_process";
import path from "path";
import { describe, expect, it } from "vitest";
import { getItemFilterArgs, getItemsToDownload } from "./items.js";

const makeItem = (title) => ({
  title,
  enclosure: {
    type: "audio/mpeg",
    url: `https://example.com/${encodeURIComponent(title || "untitled")}.mp3`,
  },
});

// Parse the args the way a POSIX shell would, then apply them as CLI options
const selectWithArgs = (feed, args, { reverse = false } = {}) => {
  const [, offset, , limit, , episodeRegex] = execFileSync("sh", ["-c", `printf '%s\\0' ${args}`])
    .toString()
    .split("\0");

  return getItemsToDownload({
    feed,
    offset: Number(offset),
    limit: Number(limit),
    episodeRegex: episodeRegex || undefined,
    reverse,
  });
};

describe("getItemsToDownload", () => {
  it("applies custom template options to transcript filenames", () => {
    const item = {
      title: "Episode S01E02",
      enclosure: {
        type: "audio/mpeg",
        url: "https://example.com/episode.mp3",
      },
      podcastTranscripts: [
        {
          $: {
            type: "text/vtt",
            url: "https://example.com/transcript.vtt",
          },
        },
      ],
    };
    const feed = { items: [item], title: "Example Podcast" };

    const [result] = getItemsToDownload({
      archivePrefix: "example",
      basePath: "/downloads",
      episodeCustomTemplateOptions: ["S\\d+E\\d+"],
      episodeDigits: 1,
      episodeNumOffset: 0,
      episodeTemplate: "{{custom_0}}-{{title}}",
      episodeTranscriptTypes: ["text/vtt"],
      feed,
      includeEpisodeTranscripts: true,
      offset: 0,
    });

    expect(result._episodeTranscript.outputPath).toBe(
      path.resolve("/downloads", "S01E02-Episode S01E02.vtt"),
    );
  });
});

describe.skipIf(process.platform === "win32")("getItemFilterArgs", () => {
  const titles = ["Newest", "Q&A: What's $NEXT? (part 2) [live]", "Oldest"];

  it.each([false, true])("selects only the target episode (reverse: %s)", (reverse) => {
    const feed = { items: titles.map(makeItem) };
    const [target] = getItemsToDownload({ feed, offset: 0, reverse }).filter(
      (item) => item.title === titles[1],
    );

    const args = getItemFilterArgs({ item: target, feed, reverse });
    const selected = selectWithArgs(feed, args, { reverse });

    expect(selected.map((item) => item.title)).toEqual([titles[1]]);
  });

  it("still selects the episode after newer episodes are published", () => {
    const feed = { items: titles.map(makeItem) };
    const [target] = getItemsToDownload({ feed, offset: 1, limit: 1 });
    const args = getItemFilterArgs({ item: target, feed, reverse: false });

    const updatedFeed = {
      items: [makeItem("Brand New"), makeItem("Also New"), ...titles.map(makeItem)],
    };

    expect(selectWithArgs(updatedFeed, args).map((item) => item.title)).toEqual([titles[1]]);
  });

  it("falls back to the offset alone for untitled episodes", () => {
    const feed = { items: [makeItem("Newest"), makeItem(undefined)] };
    const [target] = getItemsToDownload({ feed, offset: 1, limit: 1 });

    expect(getItemFilterArgs({ item: target, feed, reverse: false })).toBe("--offset 1 --limit 1");
  });
});
