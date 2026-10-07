import { defineBackground } from "wxt/utils/define-background";
import { ensureInstalledState, recordSkip, loadSettings, saveSettings } from "../lib/storage";
import { DEFAULT_SETTINGS, PLATFORMS, presetRule, type Platform, type Settings } from "../lib/score";
import { SESSION_UNDO, readUndoSnapshot, undoView, validVideoId, type UndoSnapshot } from "../lib/session-keep";

const HOSTS: Record<Platform, string> = { youtube: "www.youtube.com", tiktok: "www.tiktok.com", instagram: "www.instagram.com" };
function platformAt(url?: string): Platform | undefined {
  try { const parsed = new URL(url!); return parsed.protocol === "https:" ? PLATFORMS.find(p => HOSTS[p] === parsed.hostname) : undefined; } catch { return undefined; }
}

async function broadcast(snapshot: UndoSnapshot, settings?: Settings): Promise<void> {
  const tabs = await chrome.tabs.query({ url: Object.values(HOSTS).map(host => `https://${host}/*`) });
  await Promise.allSettled(tabs.map(tab => {
    const platform = platformAt(tab.url);
    if (tab.id == null || !platform) return Promise.resolve();
    return chrome.tabs.sendMessage(tab.id, { type: "scrollplus:session", ...undoView(snapshot, platform), ...(settings ? { reset: true, settings } : {}) });
  }));
}

export default defineBackground(() => {
  let pending = Promise.resolve();
  chrome.runtime.onInstalled.addListener(() => {
    void ensureInstalledState();
  });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id) return false;
    const trusted = sender.url?.startsWith(chrome.runtime.getURL("")) === true;
    const platform = PLATFORMS.includes(message?.platform) ? message.platform as Platform : undefined;
    const sessionRequest = message?.type === "scrollplus:session:get" || message?.type === "scrollplus:session:keep";
    if (sessionRequest && (!platform || !trusted && platformAt(sender.url ?? sender.tab?.url) !== platform)) return false;
    if (message?.type === "scrollplus:session:keep" && !validVideoId(message.id)) return false;
    if (message?.type === "scrollplus:reset" && !trusted) return false;
    if (message?.type !== "scrollplus:skipped" && message?.type !== "scrollplus:reset" && !sessionRequest) return false;
    pending = pending.then(async () => {
      if (message.type === "scrollplus:skipped") {
        await recordSkip(); sendResponse({ ok: true }); return;
      }
      const snapshot = await readUndoSnapshot();
      if (message.type === "scrollplus:reset") {
        const current = await loadSettings();
        const settings = { ...DEFAULT_SETTINGS, platforms: { ...DEFAULT_SETTINGS.platforms }, rule: presetRule("balanced"), allowlist: current.allowlist };
        await saveSettings(settings);
        const cleared = { revision: snapshot.revision + 1, items: {} };
        await chrome.storage.session.set({ [SESSION_UNDO]: cleared });
        void broadcast(cleared, settings).catch(() => {});
        sendResponse({ ok: true, settings }); return;
      }
      if (message.type === "scrollplus:session:keep" && !snapshot.items[platform!]?.includes(message.id)) {
        snapshot.items[platform!] = [...(snapshot.items[platform!] ?? []), message.id];
        snapshot.revision++;
        await chrome.storage.session.set({ [SESSION_UNDO]: snapshot });
        void broadcast(snapshot).catch(() => {});
      }
      sendResponse({ ok: true, view: undoView(snapshot, platform!) });
    }).catch(() => { sendResponse({ ok: false }); });
    return true;
  });
});
