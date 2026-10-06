import { DEFAULT_SETTINGS, STORAGE_DAILY, STORAGE_SETTINGS, localDay, normalizeSettings, type DailySkips, type Settings } from "./score";

export async function loadSettings(): Promise<Settings> {
  const data = await chrome.storage.local.get(STORAGE_SETTINGS);
  return normalizeSettings(data[STORAGE_SETTINGS]);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_SETTINGS]: settings });
}

export async function readSkipCount(): Promise<number> {
  const data = await chrome.storage.local.get(STORAGE_DAILY);
  const daily = data[STORAGE_DAILY] as DailySkips | undefined;
  if (!daily || daily.day !== localDay()) return 0;
  return daily.count;
}

export async function incrementSkips(): Promise<void> {
  const today = localDay();
  const data = await chrome.storage.local.get(STORAGE_DAILY);
  const daily = data[STORAGE_DAILY] as DailySkips | undefined;
  const count = daily && daily.day === today ? daily.count + 1 : 1;
  await chrome.storage.local.set({ [STORAGE_DAILY]: { day: today, count } satisfies DailySkips });
}

export async function ensureInstalledState(): Promise<void> {
  const data = await chrome.storage.local.get([STORAGE_SETTINGS, STORAGE_DAILY]);
  const next: Record<string, unknown> = {};
  if (!data[STORAGE_SETTINGS]) next[STORAGE_SETTINGS] = DEFAULT_SETTINGS;
  if (!data[STORAGE_DAILY]) next[STORAGE_DAILY] = { day: localDay(), count: 0 };
  if (Object.keys(next).length > 0) await chrome.storage.local.set(next);
}
