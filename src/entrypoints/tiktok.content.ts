import { defineContentScript } from "wxt/utils/define-content-script";
import { startKept } from "../content/controller";
import { gridAnchors, moveUntilIdChanges, tiktokActive, tiktokMarker } from "../content/page";

function requestMove(key: "ArrowDown" | "ArrowUp"): boolean {
  window.postMessage({ source: "kept", type: "advance", key }, "*");
  return true;
}

export default defineContentScript({
  matches: ["https://www.tiktok.com/*"],
  runAt: "document_start",
  main() {
    startKept({
      platform: "tiktok",
      readActive: () => tiktokActive(),
      advance: () => moveUntilIdChanges(() => requestMove("ArrowDown"), tiktokMarker),
      retreat: () => moveUntilIdChanges(() => requestMove("ArrowUp"), tiktokMarker),
      listGrid: () => gridAnchors(/@[^/]+\/video\/(\d+)/),
    });
  },
});
