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
  sampleFloor: number;
  balancedCutoff: number;
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

export const PROVISIONAL_CUTOFFS: Record<Platform, PlatformCutoff> = {
  youtube: { sampleFloor: 2000, balancedCutoff: 0.008 },
  tiktok: { sampleFloor: 3000, balancedCutoff: 0.03 },
  instagram: { sampleFloor: 2000, balancedCutoff: 0.01 },
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

export function sensitivityMultiplier(sensitivity: Sensitivity): number {
  if (sensitivity === "lenient") return 0.5;
  if (sensitivity === "strict") return 2;
  return 1;
}

export function lowerSensitivity(sensitivity: Sensitivity): Sensitivity | null {
  if (sensitivity === "strict") return "balanced";
  if (sensitivity === "balanced") return "lenient";
  return null;
}

export function cutoffFor(settings: Settings, platform: Platform): PlatformCutoff {
  return settings.advanced?.[platform] ?? PROVISIONAL_CUTOFFS[platform];
}

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function engagementScore(metrics: Metrics): number | null {
  if (!finite(metrics.views) || metrics.views <= 0) return null;
  const parts: Array<[number | null, number]> = [
    [metrics.likes, 1],
    [metrics.comments, 3],
    [metrics.shares, 4],
    [metrics.saves, 4],
  ];
  let numerator = 0;
  let any = false;
  for (const [value, weight] of parts) {
    if (!finite(value)) continue;
    numerator += value * weight;
    any = true;
  }
  if (!any) return null;
  return numerator / metrics.views;
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
  if (metrics.views >= 800 && metrics.likes === 0 && metrics.comments === 0 && metrics.shares === 0) {
    return { action: "skip", reason: "zero-engagement" };
  }
  const cutoff = cutoffFor(settings, platform);
  if (metrics.views < cutoff.sampleFloor) return { action: "keep", reason: "sample-floor" };
  const score = engagementScore(metrics);
  if (score == null) return { action: "keep", reason: "unscored" };
  const limit = cutoff.balancedCutoff * sensitivityMultiplier(settings.sensitivity);
  if (score < limit) return { action: "skip", reason: "below-cutoff" };
  return { action: "keep", reason: "above-cutoff" };
}

function isPlatform(value: unknown): value is Platform {
  return value === "youtube" || value === "tiktok" || value === "instagram";
}

function isCutoff(value: unknown): value is PlatformCutoff {
  if (!value || typeof value !== "object") return false;
  const cutoff = value as PlatformCutoff;
  return finite(cutoff.sampleFloor) && cutoff.sampleFloor >= 0 && finite(cutoff.balancedCutoff) && cutoff.balancedCutoff >= 0;
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
      if (isCutoff(cutoff)) next[platform] = { sampleFloor: cutoff.sampleFloor, balancedCutoff: cutoff.balancedCutoff };
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

