import { defineContentScript } from "wxt/utils/define-content-script";
import { instagramReelId } from "../content/page";
import { extractInstagram, type ExtractedItem } from "../platforms/extract";
import { observeJsonResponses } from "../platforms/observe";

export default defineContentScript({
  matches: ["https://www.instagram.com/*"],
  runAt: "document_start",
  world: "MAIN",
  main() {
    const cache = new Map<string, ExtractedItem>();
    const seenScripts = new Set<string>();
    const publish = () => {
      try {
        window.postMessage({ source: "scrollplus", type: "cache", items: [...cache.values()] }, "*");
        const id = instagramReelId();
        if (!id) return;
        const known = cache.get(id);
        if (!known) return;
        window.postMessage({ source: "scrollplus", type: "item", item: { platform: "instagram", surface: "player", ...known } }, "*");
      } catch {
        /* leave the page alone */
      }
    };
    const ingest = (data: unknown) => {
      for (const item of extractInstagram(data)) cache.set(item.id, item);
      publish();
    };
    observeJsonResponses((url) => url.includes("instagram.com") && (url.includes("graphql") || url.includes("/api/")), ingest);
    const readEmbedded = () => {
      for (const script of document.querySelectorAll("script")) {
        const text = script.textContent || "";
        if (text.length < 20 || text.length > 1500000) continue;
        if (!text.includes("like_count") && !text.includes("play_count")) continue;
        const key = String(text.length) + text.slice(0, 40);
        if (seenScripts.has(key)) continue;
        seenScripts.add(key);
        try {
          ingest(JSON.parse(text));
        } catch {
          /* not a json payload */
        }
      }
    };
    document.addEventListener("DOMContentLoaded", readEmbedded);
    window.setInterval(() => {
      readEmbedded();
      publish();
    }, 800);
  },
});
