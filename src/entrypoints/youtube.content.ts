import { defineContentScript } from "wxt/utils/define-content-script";
import { startKept } from "../content/controller";
import { gridAnchors, moveUntilIdChanges, pressIn, youtubeShortId } from "../content/page";

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  runAt: "document_start",
  main() {
    startKept({
      platform: "youtube",
      readActive: () => {
        const id = youtubeShortId();
        return id ? { id, creatorId: null } : null;
      },
      advance: () => moveUntilIdChanges(() => pressIn("ytd-shorts", /next|다음/i, "ArrowDown"), youtubeShortId),
      retreat: () => moveUntilIdChanges(() => pressIn("ytd-shorts", /previous|prev|이전/i, "ArrowUp"), youtubeShortId),
      listGrid: () => gridAnchors(/\/shorts\/([^/?#]+)/),
    });
  },
});
