import { defineContentScript } from "wxt/utils/define-content-script";
import { startFilter } from "../content/controller";
import { gridAnchors, instagramReelId, moveUntilIdChanges, visibleVideo } from "../content/page";
import { instagramHasVisibleAd } from "../platforms/instagram-player";

function requestMove(key: "ArrowDown" | "ArrowUp"): boolean {
  if (key === "ArrowDown" && (!visibleVideo() || instagramHasVisibleAd())) return false;
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
        if (!id) return null;
        // Keep non-video feed cards, including image advertisements. Preserve an
        // active identity so a preceding skip's Undo chip survives this card.
        const kind = !visibleVideo() ? "carousel" as const : instagramHasVisibleAd() ? "ad" as const : undefined;
        return { id, creatorId: null, kind };
      },
      advance: () => moveUntilIdChanges(() => requestMove("ArrowDown"), instagramReelId),
      retreat: () => moveUntilIdChanges(() => requestMove("ArrowUp"), instagramReelId),
      listGrid: () => gridAnchors(/\/reel\/([A-Za-z0-9_-]+)/),
      instagramSignedOut: signedOut,
    });
  },
});
