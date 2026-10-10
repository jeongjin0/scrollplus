declare global {
  interface Window {
    __scrollplus: { show: (item: { id: string; metrics: { views: number; likes: number; comments: number; shares: number; saves: null } | null }) => void };
  }
}
import { expect, test } from "@playwright/test";

const low = { views: 10000, likes: 10, comments: 0, shares: 0, saves: null };

test("fixture skips, pauses, undoes, and fails open without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/player.html");

  await page.evaluate(() => window.__scrollplus.show({ id: "quiet", metrics: null }));
  await page.waitForTimeout(800);
  await expect(page.locator("#advances")).toHaveText("0");

  await page.evaluate((metrics) => window.__scrollplus.show({ id: "low", metrics }), low);
  await expect(page.locator("#advances")).toHaveText("1");
  await expect(page.locator("#scrollplus-chip-host")).toContainText("Skipped · 10 likes");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator("#retreats")).toHaveText("1");
  await page.evaluate((metrics) => window.__scrollplus.show({ id: "low", metrics }), low);
  await expect(page.locator("#advances")).toHaveText("1");

  for (let index = 1; index <= 6; index += 1) {
    await page.evaluate(({ metrics, index }) => window.__scrollplus.show({ id: "v" + index, metrics }), { metrics: low, index });
    await page.waitForTimeout(1400);
  }
  await page.evaluate((metrics) => window.__scrollplus.show({ id: "v7", metrics }), low);
  await expect(page.locator("#advances")).toHaveText("7");
  await expect(page.locator("#scrollplus-chip-host")).toContainText("under your bar");
  expect(errors).toEqual([]);
});

// Moving on within about a second of the last move has left YouTube's Shorts feed
// unresponsive until a reload (qa/soak.md), so a skip waits for the minimum dwell
// even when the counts are known the moment the video opens.
test("a skip waits for the minimum dwell instead of firing as the video opens", async ({ page }) => {
  await page.goto("/player.html");
  const elapsed = await page.evaluate((metrics) => {
    const node = document.querySelector("#advances")!;
    const started = performance.now();
    const moved = new Promise<number>((resolve) => new MutationObserver(() => resolve(performance.now() - started)).observe(node, { childList: true, characterData: true, subtree: true }));
    window.__scrollplus.show({ id: "paced", metrics });
    return moved;
  }, low);
  expect(elapsed).toBeGreaterThanOrEqual(1100);
  expect(elapsed).toBeLessThan(2500);
});
