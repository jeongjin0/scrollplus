import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, decide, type Metrics, type Settings } from "./score";

function metrics(partial: Partial<Metrics>): Metrics {
  return { views: null, likes: null, comments: null, shares: null, saves: null, ...partial };
}

function settings(partial: Partial<Settings> = {}): Settings {
  return { ...DEFAULT_SETTINGS, platforms: { ...DEFAULT_SETTINGS.platforms }, allowlist: [], ...partial };
}

const base = { platform: "youtube" as const, surface: "player" as const, creatorId: "channel", kind: "video" as const };

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
  it("keeps when the numerator is missing", () => {
    expect(decide({ ...base, settings: settings(), metrics: metrics({ views: 5000 }) })).toEqual({ action: "keep", reason: "unscored" });
  });
  it("applies all three sensitivities", () => {
    const item = metrics({ views: 10000, likes: 100 });
    expect(decide({ ...base, settings: settings({ sensitivity: "lenient" }), metrics: item }).action).toBe("keep");
    expect(decide({ ...base, settings: settings({ sensitivity: "balanced" }), metrics: item }).reason).toBe("below-cutoff");
    expect(decide({ ...base, settings: settings({ sensitivity: "strict" }), metrics: item }).reason).toBe("below-cutoff");
  });
  it("skips when likes are under the chosen count", () => {
    expect(decide({ ...base, settings: settings(), metrics: metrics({ views: 10000, likes: 999 }) })).toEqual({ action: "skip", reason: "below-cutoff" });
    expect(decide({ ...base, settings: settings(), metrics: metrics({ views: 10000, likes: 1000 }) })).toEqual({ action: "keep", reason: "above-cutoff" });
  });
  it("uses a typed like count instead of the preset", () => {
    const custom = settings({ advanced: { youtube: { minLikes: 50 } } });
    expect(decide({ ...base, settings: custom, metrics: metrics({ views: 10000, likes: 40 }) }).reason).toBe("below-cutoff");
    expect(decide({ ...base, settings: custom, metrics: metrics({ views: 10000, likes: 50 }) }).reason).toBe("above-cutoff");
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
