import { expect, test } from "@playwright/test";
import { launch, open } from "./extension";

test("simultaneous skips are counted once each and yesterday's count is reset", async () => {
  const { context, id } = await launch();
  try {
    const page = await open(context, id, "options.html");
    const result = await page.evaluate(async () => {
      await chrome.storage.local.set({ dailySkips: { day: "2000-01-01", count: 91 } });
      const acknowledgments = await Promise.all(Array.from({ length: 12 }, () => chrome.runtime.sendMessage({ type: "scrollplus:skipped" })));
      const data = await chrome.storage.local.get(null);
      const today = new Date();
      return { acknowledgments, count: data.dailySkips.count, day: data.dailySkips.day, expectedDay: [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-"), keys: Object.keys(data).sort() };
    });
    expect(result.acknowledgments).toEqual(Array.from({ length: 12 }, () => ({ ok: true })));
    expect(result.count).toBe(12);
    expect(result.day).toBe(result.expectedDay);
    expect(result.keys).toEqual(["dailySkips", "settings"]);
  } finally {
    await context.close();
  }
});
