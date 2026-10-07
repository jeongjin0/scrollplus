import { defineContentScript } from "wxt/utils/define-content-script";
import { startFilter } from "../content/controller";
import { gridAnchors, instagramReelId, moveUntilIdChanges, visibleVideo } from "../content/page";

function requestMove(key: "ArrowDown" | "ArrowUp"): boolean {
  if (!visibleVideo() && !instagramReelId()) return false;
  window.postMessage({ source: "scrollplus", type: "advance", key }, "*");
  return true;
}

function signedOut(): boolean {
  if (location.pathname.startsWith("/accounts/login")) return true;
  return document.querySelector('input[name="username"]') != null;
}

export default defineContentScript({
  matches: ["https://www.instagram.com/*"],
  runAt: "document_start",
  main() {
    startFilter({
      platform: "instagram",
      readActive: () => {
        const id = instagramReelId();
        return id ? { id, creatorId: null } : null;
      },
      advance: () => moveUntilIdChanges(() => requestMove("ArrowDown"), instagramReelId),
      retreat: () => moveUntilIdChanges(() => requestMove("ArrowUp"), instagramReelId),
      listGrid: () => gridAnchors(/\/reel\/([A-Za-z0-9_-]+)/),
      instagramSignedOut: signedOut,
    });
  },
});
