import { defineContentScript } from "wxt/utils/define-content-script";
import { tiktokActive } from "../content/page";
import { extractTikTok } from "../platforms/extract";
import { createEmbeddedReader, createItemBridge } from "../platforms/item-bridge";
import { observeJsonResponses } from "../platforms/observe";

export default defineContentScript({
  matches: ["https://www.tiktok.com/*"],
  runAt: "document_start",
  world: "MAIN",
  main() {
    const bridge = createItemBridge("tiktok", tiktokActive, true);
    const ingest = (data: unknown) => bridge.ingest(extractTikTok(data));
    const readJson = createEmbeddedReader(ingest);
    observeJsonResponses((url) => url.includes("tiktok.com") && (url.includes("/api/") || url.includes("item_list")), ingest);
    const readEmbedded = () => {
      for (const id of ["__UNIVERSAL_DATA_FOR_REHYDRATION__", "SIGI_STATE"]) {
        const node = document.getElementById(id);
        const text = node?.textContent;
        if (node && text) readJson(node, text);
      }
    };
    document.addEventListener("DOMContentLoaded", readEmbedded);
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      const data = event.data as { source?: string; type?: string; key?: string } | null;
      if (!data || data.source !== "scrollplus" || data.type !== "advance" || (data.key !== "ArrowUp" && data.key !== "ArrowDown")) return;
      try {
        moveFeed(data.key === "ArrowUp" ? "prev" : "next");
      } catch {
        /* leave the page alone */
      }
    });
    window.setInterval(() => {
      readEmbedded();
      bridge.publish();
    }, 700);
  },
});

const NEXT = { selectors: ['[data-e2e="feed-navigation-next"]', 'button[data-e2e="arrow-down"]', 'button[data-e2e="arrow-right"]'], label: /next video|다음 동영상|다음 비디오/i, key: "ArrowDown", code: 40 };
const PREV = { selectors: ['[data-e2e="feed-navigation-prev"]', 'button[data-e2e="arrow-up"]', 'button[data-e2e="arrow-left"]'], label: /previous video|이전 동영상|이전 비디오/i, key: "ArrowUp", code: 38 };

function moveFeed(direction: "next" | "prev"): void {
  const target = direction === "next" ? NEXT : PREV;
  for (const selector of target.selectors) {
    const node = document.querySelector(selector);
    if (node instanceof HTMLElement) {
      node.click();
      return;
    }
  }
  for (const button of document.querySelectorAll("button")) {
    if (target.label.test(button.getAttribute("aria-label") || "")) {
      button.click();
      return;
    }
  }
  document.dispatchEvent(new KeyboardEvent("keydown", { key: target.key, code: target.key, keyCode: target.code, which: target.code, bubbles: true, cancelable: true }));
}
