import { defineContentScript } from "wxt/utils/define-content-script";
import { startFilter } from "../content/controller";
import { gridAnchors, instagramReelId, moveUntilIdChanges, visibleVideo } from "../content/page";

function press(key: "ArrowDown" | "ArrowUp"): boolean {
  if (!visibleVideo() && !instagramReelId()) return false;
  const pattern = key === "ArrowDown" ? /next|다음/i : /previous|prev|이전/i;
  for (const button of document.querySelectorAll("button")) {
    const label = button.getAttribute("aria-label") || "";
    if (pattern.test(label)) {
      button.click();
      return true;
    }
  }
  document.dispatchEvent(new KeyboardEvent("keydown", { key, code: key, bubbles: true, cancelable: true }));
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
      advance: () => moveUntilIdChanges(() => press("ArrowDown"), instagramReelId),
      retreat: () => moveUntilIdChanges(() => press("ArrowUp"), instagramReelId),
      listGrid: () => gridAnchors(/\/reel\/([A-Za-z0-9_-]+)/),
      instagramSignedOut: signedOut,
    });
  },
});
