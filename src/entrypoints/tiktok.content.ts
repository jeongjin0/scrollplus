import { defineContentScript } from "wxt/utils/define-content-script";
import { startFilter } from "../content/controller";
import { gridAnchors, moveUntilIdChanges, tiktokActive, tiktokMarker } from "../content/page";

function requestMove(key: "ArrowDown" | "ArrowUp"): boolean {
  window.postMessage({ source: "slf", type: "advance", key }, "*");
  return true;
}

export default defineContentScript({
  matches: ["https://www.tiktok.com/*"],
  runAt: "document_start",
  main() {
    startFilter({
      platform: "tiktok",
      readActive: () => tiktokActive(),
      advance: () => moveUntilIdChanges(() => requestMove("ArrowDown"), tiktokMarker),
      retreat: () => moveUntilIdChanges(() => requestMove("ArrowUp"), tiktokMarker),
      listGrid: () => gridAnchors(/@[^/]+\/video\/(\d+)/),
    });
  },
});
