import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  escapeArgForShell,
  getTempPath,
  getPublicObject,
  getLoopControls,
  normalizeUrl,
  getUrlExt,
  getExtFromMime,
  correctExtensionFromMime,
  getIsAudioUrl,
  AUDIO_ORDER_TYPES,
  getEpisodeAudioUrlAndExt,
  getImageUrl,
  getTranscriptUrl,
  TRANSCRIPT_TYPES,
} from "./util.js";

describe("escapeArgForShell", () => {
  describe("on Unix", () => {
    const originalPlatform = process.platform;
    beforeEach(() => {
      Object.defineProperty(process, "platform", {
        value: "linux",
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(process, "platform", {
        value: originalPlatform,
        configurable: true,
      });
    });

    it("returns arg unchanged when only safe chars", () => {
      expect(escapeArgForShell("foo")).toBe("foo");
      expect(escapeArgForShell("a1_/:=-bar")).toBe("a1_/:=-bar");
    });

    it("wraps in single quotes when unsafe chars", () => {
      expect(escapeArgForShell("foo bar")).toBe("'foo bar'");
    });

    it("escapes single quotes inside", () => {
      expect(escapeArgForShell("it's")).toBe("'it'\\''s'");
    });
  });

  describe("on Windows", () => {
    const originalPlatform = process.platform;
    beforeEach(() => {
      Object.defineProperty(process, "platform", {
        value: "win32",
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(process, "platform", {
        value: originalPlatform,
        configurable: true,
      });
    });

    it("returns arg unchanged when only safe chars", () => {
      expect(escapeArgForShell("foo")).toBe("foo");
    });

    it("wraps in double quotes when unsafe chars", () => {
      expect(escapeArgForShell("foo bar")).toBe('"foo bar"');
    });
  });
});

describe("getTempPath", () => {
  it("appends .tmp to path", () => {
    expect(getTempPath("/tmp/file.mp3")).toBe("/tmp/file.mp3.tmp");
    expect(getTempPath("out")).toBe("out.tmp");
  });
});

describe("normalizeUrl", () => {
  it("prepends https: for protocol-relative URL", () => {
    expect(normalizeUrl("//example.com/foo")).toBe("https://example.com/foo");
  });

  it("returns url unchanged otherwise", () => {
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
    expect(normalizeUrl("http://a.b")).toBe("http://a.b");
  });

  it("returns undefined for undefined", () => {
    expect(normalizeUrl(undefined)).toBeUndefined();
  });
});

describe("getUrlExt", () => {
  it("returns extension from pathname", () => {
    expect(getUrlExt("https://example.com/episode.mp3")).toBe(".mp3");
    expect(getUrlExt("https://example.com/path/file.m4a?q=1")).toBe(".m4a");
  });

  it("returns empty string for no url", () => {
    expect(getUrlExt(null)).toBe("");
    expect(getUrlExt("")).toBe("");
  });

  it("returns empty string when pathname has no ext", () => {
    expect(getUrlExt("https://example.com/")).toBe("");
  });
});

describe("getPublicObject", () => {
  it("omits keys starting with _", () => {
    expect(getPublicObject({ a: 1, _b: 2 })).toEqual({ a: 1 });
  });

  it("omits keys in exclude", () => {
    expect(getPublicObject({ a: 1, b: 2 }, ["b"])).toEqual({ a: 1 });
  });

  it("omits falsy values", () => {
    expect(getPublicObject({ a: 1, b: 0, c: null })).toEqual({ a: 1 });
  });

  it("returns empty object when all filtered", () => {
    expect(getPublicObject({ _x: 1 }, [])).toEqual({});
  });
});

describe("getLoopControls", () => {
  describe("forward", () => {
    it("starts at offset, goes to length", () => {
      const c = getLoopControls({ offset: 1, length: 5, reverse: false });
      expect(c.startIndex).toBe(1);
      expect(c.shouldGo(0)).toBe(true);
      expect(c.shouldGo(4)).toBe(true);
      expect(c.shouldGo(5)).toBe(false);
      expect(c.next(2)).toBe(3);
    });
  });

  describe("reverse", () => {
    it("starts at length - 1 - offset, goes down to 0", () => {
      const c = getLoopControls({ offset: 1, length: 5, reverse: true });
      expect(c.startIndex).toBe(3);
      expect(c.shouldGo(3)).toBe(true);
      expect(c.shouldGo(0)).toBe(true);
      expect(c.shouldGo(-1)).toBe(false);
      expect(c.next(2)).toBe(1);
    });
  });
});

describe("getExtFromMime", () => {
  it("returns extension for known MIME", () => {
    expect(getExtFromMime("audio/mpeg")).toBe(".mp3");
    expect(getExtFromMime("text/vtt")).toBe(".vtt");
  });

  it("returns null for unknown MIME", () => {
    expect(getExtFromMime("application/unknown")).toBeNull();
    expect(getExtFromMime(null)).toBeNull();
  });
});

describe("getIsAudioUrl", () => {
  it("returns true for URL with audio extension", () => {
    expect(getIsAudioUrl("https://example.com/ep.mp3")).toBe(true);
    expect(getIsAudioUrl("https://example.com/ep.m4a")).toBe(true);
  });

  it("returns false for URL without audio extension", () => {
    expect(getIsAudioUrl("https://example.com/page.html")).toBe(false);
    expect(getIsAudioUrl("https://example.com/")).toBe(false);
  });

  it("returns false for invalid URL", () => {
    expect(getIsAudioUrl("not-a-url")).toBe(false);
  });
});

describe("correctExtensionFromMime", () => {
  it("returns path unchanged when MIME ext matches current ext", () => {
    expect(
      correctExtensionFromMime({
        outputPath: "/out/episode.mp3",
        contentType: "audio/mpeg",
      })
    ).toBe("/out/episode.mp3");
  });

  it("replaces extension when MIME suggests different ext", () => {
    expect(
      correctExtensionFromMime({
        outputPath: "/out/episode.mp3",
        contentType: "audio/mp4",
      })
    ).toBe("/out/episode.m4a");
  });

  it("calls onCorrect when extension is corrected", () => {
    const onCorrect = vi.fn();
    correctExtensionFromMime({
      outputPath: "/out/ep.mp3",
      contentType: "audio/mp4",
      onCorrect,
    });
    expect(onCorrect).toHaveBeenCalledWith(".mp3", ".m4a");
  });

  it("returns path unchanged when contentType has no known MIME", () => {
    expect(
      correctExtensionFromMime({
        outputPath: "/out/ep.mp3",
        contentType: "application/octet-stream",
      })
    ).toBe("/out/ep.mp3");
  });
});

describe("getEpisodeAudioUrlAndExt", () => {
  it("prefers enclosure URL when present and audio", () => {
    const result = getEpisodeAudioUrlAndExt({
      enclosure: { url: "https://example.com/ep.mp3" },
      link: "https://example.com/other.mp3",
    });
    expect(result).toEqual({ url: "https://example.com/ep.mp3", ext: ".mp3" });
  });

  it("uses enclosure type when URL has no audio ext", () => {
    const result = getEpisodeAudioUrlAndExt({
      enclosure: { url: "https://example.com/ep", type: "audio/mpeg" },
    });
    expect(result).toEqual({ url: "https://example.com/ep", ext: ".mp3" });
  });

  it("falls back to link when enclosure not audio", () => {
    const result = getEpisodeAudioUrlAndExt({
      enclosure: { url: "https://example.com/page.html" },
      link: "https://example.com/ep.mp3",
    });
    expect(result).toEqual({ url: "https://example.com/ep.mp3", ext: ".mp3" });
  });

  it("returns null url/ext when no audio source", () => {
    const result = getEpisodeAudioUrlAndExt({
      enclosure: { url: "https://example.com/page.html" },
    });
    expect(result).toEqual({ url: null, ext: null });
  });

  it("respects order option", () => {
    const result = getEpisodeAudioUrlAndExt(
      {
        enclosure: { url: "https://example.com/ep.mp3" },
        link: "https://example.com/alt.mp3",
      },
      [AUDIO_ORDER_TYPES.link, AUDIO_ORDER_TYPES.enclosure]
    );
    expect(result).toEqual({ url: "https://example.com/alt.mp3", ext: ".mp3" });
  });
});

describe("getImageUrl", () => {
  it("prefers image.url", () => {
    expect(
      getImageUrl({
        image: { url: "https://a.com/img.jpg" },
        itunes: { image: "https://b.com/img.jpg" },
      })
    ).toBe("https://a.com/img.jpg");
  });

  it("uses image.link when image.url missing", () => {
    expect(
      getImageUrl({
        image: { link: "https://a.com/img.jpg" },
        itunes: { image: "https://b.com/img.jpg" },
      })
    ).toBe("https://a.com/img.jpg");
  });

  it("uses itunes.image when image url/link missing", () => {
    expect(getImageUrl({ itunes: { image: "https://b.com/img.jpg" } })).toBe(
      "https://b.com/img.jpg"
    );
  });

  it("returns null when no image", () => {
    expect(getImageUrl({})).toBeNull();
    expect(getImageUrl({ image: {}, itunes: {} })).toBeNull();
  });
});

describe("getTranscriptUrl", () => {
  it("returns null when no podcastTranscripts", () => {
    expect(getTranscriptUrl({})).toBeNull();
    expect(getTranscriptUrl({ podcastTranscripts: [] })).toBeNull();
  });

  it("returns URL for first matching transcript type", () => {
    const item = {
      podcastTranscripts: [
        { $: { type: "text/plain", url: "https://example.com/plain.txt" } },
        { $: { type: "text/vtt", url: "https://example.com/cc.vtt" } },
      ],
    };
    expect(
      getTranscriptUrl(item, [
        TRANSCRIPT_TYPES["text/vtt"],
        TRANSCRIPT_TYPES["text/plain"],
      ])
    ).toBe("https://example.com/cc.vtt");
  });

  it("returns null when type does not match", () => {
    const item = {
      podcastTranscripts: [
        { $: { type: "text/plain", url: "https://example.com/plain.txt" } },
      ],
    };
    expect(getTranscriptUrl(item, ["text/vtt"])).toBeNull();
  });
});
