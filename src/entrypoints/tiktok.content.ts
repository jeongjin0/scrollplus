import { defineContentScript } from "wxt/utils/define-content-script";
import { startKept } from "../content/controller";
import { gridAnchors, moveUntilIdChanges, tiktokActive, visibleVideo } from "../content/page";

function press(key: "ArrowDown" | "ArrowUp", selector: string): boolean {
  if (!visibleVideo()) return false;
  const button = document.querySelector(selector);
  if (button instanceof HTMLElement) {
    button.click();
    return true;
  }
  document.dispatchEvent(new KeyboardEvent("keydown", { key, code: key, bubbles: true, cancelable: true }));
  return true;
}

export default defineContentScript({
  matches: ["https://www.tiktok.com/*"],
  runAt: "document_start",
  main() {
    startKept({
      platform: "tiktok",
      readActive: () => tiktokActive(),
      advance: () => moveUntilIdChanges(() => press("ArrowDown", 'button[data-e2e="arrow-down"], button[data-e2e="arrow-right"]'), () => tiktokActive()?.id ?? null),
      retreat: () => moveUntilIdChanges(() => press("ArrowUp", 'button[data-e2e="arrow-up"], button[data-e2e="arrow-left"]'), () => tiktokActive()?.id ?? null),
      listGrid: () => gridAnchors(/@[^/]+\/video\/(\d+)/),
    });
  },
});
