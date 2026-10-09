import { expect, test } from "@playwright/test";
import { launch } from "./extension";

// Grid filtering is off by default. An idle page must then not pay to list every
// link on it every 400ms: with 20,000 links that was about 8% of a core.
test("idle pages with grid filtering off do not rescan their links", async () => {
  const { context } = await launch();
  try {
    await context.route("https://www.youtube.com/**", (route) => route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><meta charset=utf-8><style>body{margin:0}a{display:block;width:160px;height:120px;float:left}</style>"
        + Array.from({ length: 20000 }, (_, index) => `<a href="/shorts/id${index}">Short ${index}</a>`).join(""),
    }));
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/shorts/first");
    await page.waitForTimeout(2500);
    const client = await context.newCDPSession(page);
    await client.send("Performance.enable");
    const script = async () => (await client.send("Performance.getMetrics")).metrics.find((metric) => metric.name === "ScriptDuration")?.value ?? 0;
    const before = await script();
    await page.waitForTimeout(3000);
    expect(await script() - before).toBeLessThan(0.1);
  } finally {
    await context.close();
  }
});
