import { expect, test } from "@playwright/test";
import { launch, open } from "./extension";

// The recommendation-card markup was observed on the real signed-in Following page.
// Profile hover previews also carry video IDs but are not active feed players.
for (const surface of ["recommendations", "home-recommendations", "profile"] as const) {
  test(`TikTok ${surface}: low-like previews do not advance or expose a current creator`, async () => {
    const { context, id } = await launch();
    try {
      const url = "https://www.tiktok.com/" + (surface === "profile" ? "@creator" : surface === "home-recommendations" ? "" : "following");
      await context.route("https://www.tiktok.com/**", async route => {
        if (new URL(route.request().url()).pathname === "/api/item_list") {
          await route.fulfill({ contentType: "application/json", body: JSON.stringify({ items: [{
            id: "111", author: { uniqueId: "creator" }, stats: { diggCount: 10, playCount: 100000, commentCount: 100 },
          }] }) });
          return;
        }
        await route.fulfill({ contentType: "text/html", body: `<!doctype html><meta charset="utf-8">
          <title>TikTok preview fixture</title><style>video{width:226px;height:302px;display:block}</style>
          <main><div ${surface !== "profile" ? 'data-e2e="recommend-card" role="link"' : 'data-e2e="user-post-item"'}>
            <div id="xgwrapper-1-111"><video muted></video></div>
            <a href="/@creator">Creator</a><button>Follow</button>
          </div></main>
          <script>
            window.previewAdvanceAttempts = 0;
            window.addEventListener("message", event => {
              if (event.source === window && event.data?.source === "scrollplus" && event.data?.type === "advance") window.previewAdvanceAttempts++;
            });
            fetch("/api/item_list").then(r => r.json());
          </script>` });
      });
      const app = await open(context, id, "options.html");
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(url);
      await page.waitForTimeout(2500);
      expect.soft(await page.evaluate(() => (window as any).previewAdvanceAttempts)).toBe(0);
      const current = await app.evaluate(async () => {
        const [tab] = await chrome.tabs.query({ url: "https://www.tiktok.com/*" });
        return chrome.tabs.sendMessage(tab.id!, { type: "scrollplus:context" });
      });
      expect.soft(current.creatorId).toBeNull();
      expect(await app.evaluate(async () => (await chrome.storage.local.get("dailySkips")).dailySkips?.count ?? 0)).toBe(0);
      expect(await page.locator("[data-scrollplus-grid='skip']").count()).toBe(0);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
