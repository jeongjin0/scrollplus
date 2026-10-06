import { defineBackground } from "wxt/utils/define-background";
import { ensureInstalledState } from "../lib/storage";

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    void ensureInstalledState();
  });
});
