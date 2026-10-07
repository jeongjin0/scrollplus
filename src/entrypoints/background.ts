import { defineBackground } from "wxt/utils/define-background";
import { ensureInstalledState, recordSkip } from "../lib/storage";

export default defineBackground(() => {
  let pending = Promise.resolve();
  chrome.runtime.onInstalled.addListener(() => {
    void ensureInstalledState();
  });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id || message?.type !== "scrollplus:skipped") return false;
    pending = pending.then(recordSkip).then(() => { sendResponse({ ok: true }); }).catch(() => { sendResponse({ ok: false }); });
    return true;
  });
});
