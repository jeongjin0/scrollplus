import { defineContentScript } from "wxt/utils/define-content-script";
import { tiktokActive } from "../content/page";
import { extractTikTok, type ExtractedItem } from "../platforms/extract";
import { observeJsonResponses } from "../platforms/observe";

export default defineContentScript({
  matches: ["https://www.tiktok.com/*"],
  runAt: "document_start",
  world: "MAIN",
  main() {
    const cache = new Map<string, ExtractedItem>();
    const publish = () => {
      try {
        const active = tiktokActive();
        const items = [...cache.values()];
        window.postMessage({ source: "kept", type: "cache", items }, "*");
        if (!active) return;
        const known = cache.get(active.id);
        window.postMessage({
          source: "kept",
          type: "item",
          item: known
            ? { platform: "tiktok", surface: "player", ...known, creatorId: known.creatorId ?? active.creatorId }
            : { platform: "tiktok", surface: "player", id: active.id, creatorId: active.creatorId, metrics: null, kind: "video" },
        }, "*");
      } catch {
        /* leave the page alone */
      }
    };
    const ingest = (data: unknown) => {
      for (const item of extractTikTok(data)) cache.set(item.id, item);
      publish();
    };
    observeJsonResponses((url) => url.includes("tiktok.com") && (url.includes("/api/") || url.includes("item_list")), ingest);
    const readEmbedded = () => {
      for (const id of ["__UNIVERSAL_DATA_FOR_REHYDRATION__", "SIGI_STATE"]) {
        const node = document.getElementById(id);
        if (!node?.textContent) continue;
        try {
          ingest(JSON.parse(node.textContent));
        } catch {
          /* ignore */
        }
      }
    };
    document.addEventListener("DOMContentLoaded", readEmbedded);
    window.setInterval(() => {
      readEmbedded();
      publish();
    }, 700);
  },
});
