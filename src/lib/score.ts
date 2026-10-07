export type Platform = "youtube" | "tiktok" | "instagram";
export type Sensitivity = "lenient" | "balanced" | "strict";
export type Surface = "player" | "grid";
export type ItemKind = "video" | "ad" | "carousel" | "unknown";

export interface Metrics {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
}

export interface PlatformCutoff {
  sampleFloor?: number;
  minLikes?: number;
}

export interface AllowEntry {
  platform: Platform;
  id: string;
}

export interface AdvancedSettings {
  youtube?: PlatformCutoff;
  tiktok?: PlatformCutoff;
  instagram?: PlatformCutoff;
}

export interface Settings {
  enabled: boolean;
  sensitivity: Sensitivity;
  platforms: Record<Platform, boolean>;
  filterGrids: boolean;
  showSkipChip: boolean;
  allowlist: AllowEntry[];
  advanced: AdvancedSettings | null;
}

export const REPO_URL = "https://github.com/jeongjin0/kept";
export const STORAGE_SETTINGS = "settings";
export const STORAGE_DAILY = "dailySkips";
export const STORAGE_ACTIVE = "keptActive";

export const PLATFORM_FLOORS: Record<Platform, number> = {
  youtube: 2000,
  tiktok: 3000,
  instagram: 2000,
};

export const PRESET_MIN_LIKES: Record<Sensitivity, number> = {
  lenient: 100,
  balanced: 1000,
  strict: 5000,
};

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  sensitivity: "balanced",
  platforms: { youtube: true, tiktok: true, instagram: true },
  filterGrids: false,
  showSkipChip: true,
  allowlist: [],
  advanced: null,
};

export interface DailySkips {
  day: string;
  count: number;
}

export interface ActiveContext {
  platform: Platform | null;
  creatorId: string | null;
  instagramSignedOut: boolean;
  updatedAt: number;
}

export function localDay(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

export function lowerSensitivity(sensitivity: Sensitivity): Sensitivity | null {
  if (sensitivity === "strict") return "balanced";
  if (sensitivity === "balanced") return "lenient";
  return null;
}

export function ruleFor(settings: Settings, platform: Platform): { sampleFloor: number; minLikes: number } {
  const custom = settings.advanced?.[platform];
  return {
    sampleFloor: custom?.sampleFloor ?? PLATFORM_FLOORS[platform],
    minLikes: custom?.minLikes ?? PRESET_MIN_LIKES[settings.sensitivity],
  };
}

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeId(platform: Platform, id: string): string {
  const trimmed = id.trim();
  if (platform === "instagram") return trimmed.toLowerCase();
  return trimmed.replace(/^@/, "");
}

export function isAllowlisted(settings: Settings, platform: Platform, creatorId: string | null): boolean {
  if (!creatorId) return false;
  const id = normalizeId(platform, creatorId);
  return settings.allowlist.some((entry) => entry.platform === platform && normalizeId(entry.platform, entry.id) === id);
}

export interface DecideInput {
  settings: Settings;
  platform: Platform;
  surface: Surface;
  creatorId: string | null;
  metrics: Metrics | null;
  kind: ItemKind;
}

export type KeepReason =
  | "disabled"
  | "allowlist"
  | "ad"
  | "carousel"
  | "no-metrics"
  | "grid-off"
  | "no-views"
  | "unscored"
  | "sample-floor"
  | "above-cutoff";

export type Decision =
  | { action: "keep"; reason: KeepReason }
  | { action: "skip"; reason: "zero-engagement" | "below-cutoff" };

export function decide(input: DecideInput): Decision {
  const { settings, platform, surface, creatorId, metrics, kind } = input;
  if (!settings.enabled || !settings.platforms[platform]) return { action: "keep", reason: "disabled" };
  if (isAllowlisted(settings, platform, creatorId)) return { action: "keep", reason: "allowlist" };
  if (kind === "ad") return { action: "keep", reason: "ad" };
  if (kind === "carousel") return { action: "keep", reason: "carousel" };
  if (!metrics) return { action: "keep", reason: "no-metrics" };
  if (surface === "grid" && !settings.filterGrids) return { action: "keep", reason: "grid-off" };
  if (!finite(metrics.views)) return { action: "keep", reason: "no-views" };
  if (metrics.views <= 0) return { action: "keep", reason: "unscored" };
  const rule = ruleFor(settings, platform);
  if (metrics.views < rule.sampleFloor) return { action: "keep", reason: "sample-floor" };
  if (!finite(metrics.likes)) return { action: "keep", reason: "unscored" };
  if (metrics.likes < rule.minLikes) return { action: "skip", reason: "below-cutoff" };
  return { action: "keep", reason: "above-cutoff" };
}

function isPlatform(value: unknown): value is Platform {
  return value === "youtube" || value === "tiktok" || value === "instagram";
}

function isCutoff(value: unknown): value is PlatformCutoff {
  if (!value || typeof value !== "object") return false;
  const cutoff = value as PlatformCutoff;
  const floorOk = cutoff.sampleFloor == null || (finite(cutoff.sampleFloor) && cutoff.sampleFloor >= 0);
  const likesOk = cutoff.minLikes == null || (finite(cutoff.minLikes) && cutoff.minLikes >= 0);
  return floorOk && likesOk && (cutoff.sampleFloor != null || cutoff.minLikes != null);
}

export function normalizeSettings(value: unknown): Settings {
  const raw = value && typeof value === "object" ? (value as Partial<Settings>) : {};
  const platforms = raw.platforms ?? DEFAULT_SETTINGS.platforms;
  const sensitivity = raw.sensitivity === "lenient" || raw.sensitivity === "strict" || raw.sensitivity === "balanced"
    ? raw.sensitivity
    : "balanced";
  const allowlist = Array.isArray(raw.allowlist)
    ? raw.allowlist.filter((entry): entry is AllowEntry => {
        if (!entry || typeof entry !== "object") return false;
        const candidate = entry as AllowEntry;
        return isPlatform(candidate.platform) && typeof candidate.id === "string" && candidate.id.trim().length > 0;
      })
    : [];
  let advanced: AdvancedSettings | null = null;
  if (raw.advanced && typeof raw.advanced === "object") {
    const next: AdvancedSettings = {};
    for (const platform of ["youtube", "tiktok", "instagram"] as const) {
      const cutoff = raw.advanced[platform];
      if (isCutoff(cutoff)) {
        next[platform] = {};
        if (finite(cutoff.sampleFloor)) next[platform].sampleFloor = cutoff.sampleFloor;
        if (finite(cutoff.minLikes)) next[platform].minLikes = cutoff.minLikes;
      }
    }
    advanced = Object.keys(next).length ? next : null;
  }
  return {
    enabled: raw.enabled !== false,
    sensitivity,
    platforms: {
      youtube: platforms.youtube !== false,
      tiktok: platforms.tiktok !== false,
      instagram: platforms.instagram !== false,
    },
    filterGrids: raw.filterGrids === true,
    showSkipChip: raw.showSkipChip !== false,
    allowlist,
    advanced,
  };
}

export function emptyMetrics(): Metrics {
  return { views: null, likes: null, comments: null, shares: null, saves: null };
}
