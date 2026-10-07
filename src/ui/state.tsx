import { useEffect, useState } from "react";
import { REPO_URL, STORAGE_DAILY, STORAGE_SETTINGS, cutoffFor, normalizeSettings, type Platform, type Settings, type Signal } from "../lib/score";
import { DEFAULT_SETTINGS } from "../lib/score";
import { readSkipCount, saveSettings } from "../lib/storage";

export interface ActiveState {
  platform: Platform | null;
  creatorId: string | null;
  instagramSignedOut: boolean;
}

function message(key: string, fallback: string, substitution?: string | string[]): string {
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
    short: {
      youtube: korean ? "유튜브" : "YouTube",
      tiktok: korean ? "틱톡" : "TikTok",
      instagram: korean ? "릴스" : "Reels",
    } as Record<Platform, string>,
    platform: {
      youtube: "YouTube",
      tiktok: "TikTok",
      instagram: korean ? "인스타그램 릴스" : "Instagram Reels",
    } as Record<Platform, string>,
    signal: {
      likes: message("signalLikes", korean ? "좋아요" : "Likes"),
      comments: message("signalComments", korean ? "댓글" : "Comments"),
      shares: message("signalShares", korean ? "공유" : "Shares"),
      saves: message("signalSaves", korean ? "저장" : "Saves"),
    } as Record<Signal, string>,
    keepCreator: message("keepCreator", korean ? "이 제작자는 유지" : "Keep this creator"),
    star: message("star", korean ? "GitHub에 Star" : "Star on GitHub"),
    signedOut: message("signedOut", korean ? "인스타그램에 로그인되어 있지 않습니다. 숨기지 않습니다." : "Instagram is signed out. Nothing is hidden."),
    privacy: message("privacy", korean ? "설정과 오늘 넘긴 횟수만 이 기기에 저장합니다. 데이터는 수집하거나 전송하지 않습니다." : "Kept stores settings and today's skip count on this device. It does not collect or transmit data."),
    filterGrids: message("filterGrids", korean ? "그리드도 거르기" : "Filter grids"),
    showChip: message("showChip", korean ? "넘김 표시" : "Show skip chip"),
    reset: message("reset", korean ? "기본값으로" : "Reset"),
    allowlist: message("allowlist", korean ? "유지할 제작자" : "Creators to keep"),
    allowEmpty: message("allowEmpty", korean ? "아직 없습니다." : "None yet."),
    sampleFloor: message("sampleFloor", korean ? "최소 조회" : "Minimum plays"),
    cutoff: message("cutoff", korean ? "기본 기준 %" : "Balanced bar %"),
    conditions: message("conditions", korean ? "조건" : "Conditions"),
    reactions: message("reactions", korean ? "반응" : "Reactions"),
    reactionNote: message("reactionNote", korean ? "고른 반응만 점수에 넣습니다. 페이지에 없는 수는 0으로 보지 않습니다." : "Only selected reactions count. A missing count is not treated as zero."),
    presetNote: message("presetNote", korean ? "느슨은 기본의 절반, 엄격은 두 배입니다. 아래 숫자는 기본 기준입니다." : "Lenient is half of Balanced. Strict is double. The numbers below are the Balanced bar."),
    lead: message("lead", korean ? "설치하면 기본으로 켜집니다. 조건은 여기서만 바꿉니다." : "It is already on. Change the conditions here."),
    useDefault: message("useDefault", korean ? "이 사이트는 기본값" : "Use the preset for this site"),
    liveRule: (floor: string, percent: string) => message("liveRule", korean ? floor + "회가 넘고 " + percent + "보다 약하면 넘깁니다." : "Past " + floor + " plays, skip anything under " + percent + ".", [floor, percent]),
    remove: message("remove", korean ? "제거" : "Remove"),
    skippedToday: (count: number) => message("skippedToday", korean ? "오늘 " + count + "개 넘김" : count + " skipped today", String(count)),
    repo: REPO_URL,
  };
}

export function formatPercent(value: number): string {
  const percent = Math.round(value * 1000) / 10;
  return (Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(1)) + "%";
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
