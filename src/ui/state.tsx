import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SETTINGS, STORAGE_DAILY, STORAGE_SETTINGS, normalizeSettings, type Platform, type Settings } from "../lib/score";
import type { IconName } from "../lib/icons";
import { readSkipCount, saveSettings } from "../lib/storage";

export interface ActiveState {
  platform: Platform | null;
  creatorId: string | null;
  instagramSignedOut: boolean;
}

export const SITES: Record<Platform, { name: string; icon: IconName }> = {
  youtube: { name: "YouTube Shorts", icon: "youtube" },
  tiktok: { name: "TikTok", icon: "tiktok" },
  instagram: { name: "Instagram Reels", icon: "reels" },
};

export function useKeptState() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [skips, setSkips] = useState(0);
  const [active, setActive] = useState<ActiveState | null>(null);
  const latest = useRef(settings);

  useEffect(() => {
    let alive = true;
    void chrome.storage.local.get(STORAGE_SETTINGS).then((data) => {
      if (!alive) return;
      latest.current = normalizeSettings(data[STORAGE_SETTINGS]);
      setSettings(latest.current);
      setReady(true);
    });
    void readSkipCount().then((count) => {
      if (alive) setSkips(count);
    });
    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local") return;
      if (changes[STORAGE_SETTINGS]) {
        latest.current = normalizeSettings(changes[STORAGE_SETTINGS].newValue);
        setSettings(latest.current);
      }
      if (changes[STORAGE_DAILY]) void readSkipCount().then(setSkips);
    };
    chrome.storage.onChanged.addListener(listener);
    void askActive().then((next) => {
      if (alive) setActive(next);
    });
    return () => {
      alive = false;
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  const update = useCallback((change: (current: Settings) => Settings) => {
    const next = normalizeSettings(change(latest.current));
    latest.current = next;
    setSettings(next);
    void saveSettings(next);
  }, []);

  const allowCurrent = useCallback(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id == null) return;
    await chrome.tabs.sendMessage(tab.id, { type: "kept:allow" });
  }, []);

  return { settings, ready, skips, active, update, allowCurrent };
}

async function askActive(): Promise<ActiveState | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id == null) return null;
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "kept:context" });
    if (!response || typeof response !== "object") return null;
    return response as ActiveState;
  } catch {
    return null;
  }
}

