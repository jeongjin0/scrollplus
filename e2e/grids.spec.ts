import { expect, test } from "@playwright/test";
import { launch, open } from "./extension";

test("hidden grid cards return when the minimum is lowered or grid filtering is turned off", async () => {
  const { context, id } = await launch();
  try {
    await context.route("https://www.tiktok.com/**", async (route) => {
      await route.fulfill({ contentType: "text/html", body: `<!doctype html>
        <style>a{display:inline-block;width:180px;height:200px}a[hidden]{display:none}</style>
        <a id="low" href="/@creator/video/111">Low likes</a>
        <a id="passing" href="/@creator/video/222">Above minimum</a>
        <a id="unknown" href="/@creator/video/999">Missing counts</a>
        <a id="host-hidden" hidden href="/@creator/video/1110">Hidden by the site</a>
        <script type="application/json" id="__UNIVERSAL_DATA_FOR_REHYDRATION__">${JSON.stringify({ items: [
          { id: "111", author: { uniqueId: "creator" }, stats: { diggCount: 10, playCount: 100000 } },
          { id: "222", author: { uniqueId: "creator" }, stats: { diggCount: 8000, playCount: 100000 } },
          { id: "1110", author: { uniqueId: "creator" }, stats: { diggCount: 10, playCount: 100000 } },
        ] })}</script>` });
    });
    const app = await open(context, id, "options.html");
    const labels = await app.evaluate(() => ({ grid: chrome.i18n.getMessage("filterGrids"), likes: chrome.i18n.getMessage("amount", chrome.i18n.getMessage("likes")) }));
    const page = await context.newPage();
    await page.goto("https://www.tiktok.com/@creator");
    const low = page.locator("#low");
    await expect(low).toBeVisible();
    await app.getByRole("switch", { name: labels.grid, exact: true }).click();
    await expect(low).toBeHidden();
    await expect(page.locator("#passing")).toBeVisible();
    await expect(page.locator("#unknown")).toBeVisible();
    const minimum = app.getByRole("textbox", { name: labels.likes, exact: true });
    await minimum.fill("5"); await minimum.press("Tab");
    await expect.soft(low).toBeVisible({ timeout: 2500 });
    await minimum.fill("5000"); await minimum.press("Tab");
    await expect(low).toBeHidden();
    await app.getByRole("switch", { name: labels.grid, exact: true }).click();
    await expect.soft(low).toBeVisible({ timeout: 2500 });
    await expect(page.locator("#host-hidden")).toBeHidden();
    await expect(page.locator("#host-hidden")).not.toHaveAttribute("data-scrollplus-grid", "skip");
    await expect(low).not.toHaveAttribute("data-scrollplus-grid", "skip");
  } finally {
    await context.close();
  }
});
