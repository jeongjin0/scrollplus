import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, decide, engagementScore, type Metrics, type Settings } from "./score";

function metrics(partial: Partial<Metrics>): Metrics {
  return { views: null, likes: null, comments: null, shares: null, saves: null, ...partial };
}

function settings(partial: Partial<Settings> = {}): Settings {
  return { ...DEFAULT_SETTINGS, platforms: { ...DEFAULT_SETTINGS.platforms }, allowlist: [], ...partial };
}

const base = { platform: "youtube" as const, surface: "player" as const, creatorId: "channel", kind: "video" as const };

describe("engagementScore", () => {
  it("omits null numerator fields", () => {
    expect(engagementScore(metrics({ views: 1000, likes: 10, comments: null, shares: 2 }))).toBe(18 / 1000);
  });
  it("returns null without views or without a numerator", () => {
    expect(engagementScore(metrics({ views: null, likes: 10 }))).toBeNull();
    expect(engagementScore(metrics({ views: 0, likes: 10 }))).toBeNull();
    expect(engagementScore(metrics({ views: 5000 }))).toBeNull();
  });
});

describe("decide", () => {
  it("keeps allowlisted creators", () => {
    expect(decide({ ...base, settings: settings({ allowlist: [{ platform: "youtube", id: "channel" }] }), metrics: metrics({ views: 10000, likes: 0, comments: 0, shares: 0 }) })).toEqual({ action: "keep", reason: "allowlist" });
  });
  it("matches instagram usernames without case", () => {
    expect(decide({ ...base, platform: "instagram", creatorId: "Kept.User", settings: settings({ allowlist: [{ platform: "instagram", id: "kept.user" }] }), metrics: metrics({ views: 9000, likes: 0, comments: 0, shares: 0 }) }).action).toBe("keep");
  });
  it("keeps when views are null", () => {
    expect(decide({ ...base, settings: settings(), metrics: metrics({ views: null, likes: 0, comments: 0, shares: 0 }) })).toEqual({ action: "keep", reason: "no-views" });
  });
  it("keeps below the sample floor", () => {
    expect(decide({ ...base, settings: settings(), metrics: metrics({ views: 1500, likes: 100, comments: 1, shares: 1 }) })).toEqual({ action: "keep", reason: "sample-floor" });
  });
  it("skips zero engagement at 800 views", () => {
    expect(decide({ ...base, settings: settings(), metrics: metrics({ views: 800, likes: 0, comments: 0, shares: 0, saves: null }) })).toEqual({ action: "skip", reason: "zero-engagement" });
  });
  it("does not treat a missing field as zero engagement", () => {
    expect(decide({ ...base, settings: settings(), metrics: metrics({ views: 900, likes: 0, comments: null, shares: 0 }) })).toEqual({ action: "keep", reason: "sample-floor" });
  });
  it("keeps when the numerator is missing", () => {
    expect(decide({ ...base, settings: settings(), metrics: metrics({ views: 5000 }) })).toEqual({ action: "keep", reason: "unscored" });
  });
  it("applies all three sensitivities", () => {
    const item = metrics({ views: 10000, likes: 100 });
    expect(decide({ ...base, settings: settings({ sensitivity: "lenient" }), metrics: item }).action).toBe("keep");
    expect(decide({ ...base, settings: settings({ sensitivity: "balanced" }), metrics: item }).action).toBe("keep");
    expect(decide({ ...base, settings: settings({ sensitivity: "strict" }), metrics: item }).reason).toBe("below-cutoff");
  });
  it("skips a weak balanced score", () => {
    expect(decide({ ...base, settings: settings(), metrics: metrics({ views: 10000, likes: 10 }) })).toEqual({ action: "skip", reason: "below-cutoff" });
  });
  it("keeps ads, carousels, disabled playback, and grids by default", () => {
    const low = metrics({ views: 9000, likes: 0, comments: 0, shares: 0 });
    expect(decide({ ...base, kind: "ad", settings: settings(), metrics: low }).reason).toBe("ad");
    expect(decide({ ...base, kind: "carousel", settings: settings(), metrics: low }).reason).toBe("carousel");
    expect(decide({ ...base, settings: settings({ enabled: false }), metrics: low }).reason).toBe("disabled");
    expect(decide({ ...base, settings: settings({ platforms: { youtube: false, tiktok: true, instagram: true } }), metrics: low }).reason).toBe("disabled");
    expect(decide({ ...base, surface: "grid", settings: settings(), metrics: low }).reason).toBe("grid-off");
  });
  it("filters grids only when asked and a score exists", () => {
    expect(decide({ ...base, surface: "grid", settings: settings({ filterGrids: true }), metrics: metrics({ views: 9000, likes: 0, comments: 0, shares: 0 }) }).action).toBe("skip");
    expect(decide({ ...base, surface: "grid", settings: settings({ filterGrids: true }), metrics: metrics({ views: 9000 }) }).reason).toBe("unscored");
  });
});
