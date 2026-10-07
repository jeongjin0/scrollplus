import { defineContentScript } from "wxt/utils/define-content-script";
import { startFilter } from "../content/controller";
import { gridAnchors, moveUntilIdChanges, youtubeShortId } from "../content/page";

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  runAt: "document_start",
  main() {
    startFilter({
      platform: "youtube",
      readActive: () => {
        const id = youtubeShortId();
        return id ? { id, creatorId: null } : null;
      },
      advance: () => moveUntilIdChanges(() => requestMove("ArrowDown"), youtubeShortId),
      retreat: () => moveUntilIdChanges(() => requestMove("ArrowUp"), youtubeShortId),
      listGrid: () => gridAnchors(/\/shorts\/([^/?#]+)/),
    });
  },
});

function requestMove(key: "ArrowDown" | "ArrowUp"): boolean {
  window.postMessage({ source: "scrollplus", type: "advance", key }, "*");
  return true;
}
