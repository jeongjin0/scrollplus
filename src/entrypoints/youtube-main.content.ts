import { defineContentScript } from "wxt/utils/define-content-script";
import { youtubeShortId } from "../content/page";
import { extractYouTube } from "../platforms/extract";

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  runAt: "document_start",
  world: "MAIN",
  main() {
    let last = "";
    let latest: unknown = null;
    const publish = (player?: unknown) => {
      try {
        const id = youtubeShortId();
        if (!id) return;
        const source = player ?? latest ?? (window as Window & { ytInitialPlayerResponse?: unknown }).ytInitialPlayerResponse;
        const extracted = extractYouTube(source);
        if (!extracted || extracted.id !== id) return;
        const key = JSON.stringify(extracted.metrics) + extracted.creatorId;
        if (key === last) return;
        last = key;
        window.postMessage({ source: "kept", type: "item", item: { platform: "youtube", surface: "player", ...extracted } }, "*");
      } catch {
        /* leave the page alone */
      }
    };
    document.addEventListener("yt-navigate-finish", (event) => {
      const detail = (event as CustomEvent<{ response?: { playerResponse?: unknown } }>).detail;
      latest = detail?.response?.playerResponse ?? (window as Window & { ytInitialPlayerResponse?: unknown }).ytInitialPlayerResponse;
      publish(latest);
    });
    window.setInterval(() => publish(), 500);
  },
});
