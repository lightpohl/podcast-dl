import path from "path";
import { describe, expect, it } from "vitest";
import { getItemsToDownload } from "./items.js";

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
