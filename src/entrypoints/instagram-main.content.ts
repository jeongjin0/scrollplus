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
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      const data = event.data as { source?: string; type?: string; key?: string } | null;
      if (!data || data.source !== "scrollplus" || data.type !== "advance" || (data.key !== "ArrowUp" && data.key !== "ArrowDown")) return;
      try {
        moveReel(data.key === "ArrowUp" ? "prev" : "next");
      } catch {
        /* leave the page alone */
      }
    });
    window.setInterval(() => {
      readEmbedded();
      publish();
    }, 800);
  },
});

const NEXT = { label: /next|다음/i, key: "ArrowDown", code: 40 };
const PREV = { label: /previous|prev|이전/i, key: "ArrowUp", code: 38 };

// Click the reel navigation control from the page script, because a click sent from the
// extension's isolated world is ignored on the other two sites. Press the key only as a last resort.
function moveReel(direction: "next" | "prev"): void {
  const target = direction === "next" ? NEXT : PREV;
  for (const node of document.querySelectorAll("button, [role='button']")) {
    if (target.label.test(node.getAttribute("aria-label") || "") && node instanceof HTMLElement) {
      node.click();
      return;
    }
  }
  document.dispatchEvent(new KeyboardEvent("keydown", { key: target.key, code: target.key, keyCode: target.code, which: target.code, bubbles: true, cancelable: true }));
}
