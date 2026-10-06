import { useEffect, useState } from "react";
import { REPO_URL, STORAGE_DAILY, STORAGE_SETTINGS, cutoffFor, normalizeSettings, type Platform, type Settings } from "../lib/score";
import { DEFAULT_SETTINGS } from "../lib/score";
import { readSkipCount, saveSettings } from "../lib/storage";

export interface ActiveState {
  platform: Platform | null;
  creatorId: string | null;
  instagramSignedOut: boolean;
}

function message(key: string, fallback: string, substitution?: string): string {
  try {
    const value = substitution == null ? chrome.i18n.getMessage(key) : chrome.i18n.getMessage(key, substitution);
    return value || fallback;
  } catch {
    return fallback;
  }
}

export function useCopy() {
  const korean = (chrome.i18n.getUILanguage() || "").toLowerCase().startsWith("ko");
  return {
    on: message("on", korean ? "켜짐" : "On"),
    off: message("off", korean ? "꺼짐" : "Off"),
    lenient: message("lenient", korean ? "느슨" : "Lenient"),
    balanced: message("balanced", korean ? "기본" : "Balanced"),
    strict: message("strict", korean ? "엄격" : "Strict"),
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram: "Instagram",
    keepCreator: message("keepCreator", korean ? "이 제작자는 유지" : "Keep this creator"),
    star: message("star", korean ? "GitHub에 Star" : "Star on GitHub"),
    signedOut: message("signedOut", korean ? "인스타그램에 로그인되어 있지 않습니다. 숨기지 않습니다." : "Instagram is signed out. Nothing is hidden."),
    privacy: message("privacy", korean ? "설정과 오늘 넘긴 횟수만 이 기기에 저장합니다. 데이터는 수집하거나 전송하지 않습니다." : "Kept stores settings and today's skip count on this device. It does not collect or transmit data."),
    filterGrids: message("filterGrids", korean ? "그리드도 거르기" : "Filter grids"),
    showChip: message("showChip", korean ? "넘김 표시" : "Show skip chip"),
    reset: message("reset", korean ? "기본값으로" : "Reset"),
    allowlist: message("allowlist", korean ? "유지할 제작자" : "Creators to keep"),
    sampleFloor: message("sampleFloor", korean ? "최소 조회" : "Sample floor"),
    cutoff: message("cutoff", korean ? "기준 %" : "Cutoff %"),
    advanced: message("advanced", korean ? "세부 기준" : "Advanced cutoffs"),
    remove: message("remove", korean ? "제거" : "Remove"),
    skippedToday: (count: number) => message("skippedToday", korean ? "오늘 " + count + "개 넘김" : count + " skipped today", String(count)),
    repo: REPO_URL,
  };
}

export function useKeptState() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [skips, setSkips] = useState(0);
  const [active, setActive] = useState<ActiveState | null>(null);
  const copy = useCopy();

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      void chrome.storage.local.get(STORAGE_SETTINGS).then((data) => {
        if (alive) setSettings(normalizeSettings(data[STORAGE_SETTINGS]));
      });
      void readSkipCount().then((count) => {
        if (alive) setSkips(count);
      });
    };
    refresh();
    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local") return;
      if (changes[STORAGE_SETTINGS]) setSettings(normalizeSettings(changes[STORAGE_SETTINGS].newValue));
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

  async function patch(partial: Partial<Settings>) {
    const next = normalizeSettings({ ...settings, ...partial, platforms: partial.platforms ?? settings.platforms });
    setSettings(next);
    await saveSettings(next);
  }

  async function allowCurrent() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id == null) return;
    await chrome.tabs.sendMessage(tab.id, { type: "kept:allow" });
  }

  return { settings, skips, active, copy, patch, allowCurrent, cutoffFor };
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
