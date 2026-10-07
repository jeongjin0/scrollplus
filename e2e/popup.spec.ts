import { chromium, expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function openExtensionPage(scale: number, pagePath: string) {
  const extension = path.resolve(".output/chrome-mv3");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kept-ext-"));
  const context = await chromium.launchPersistentContext(dir, {
    headless: false,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent("serviceworker");
  const id = new URL(worker.url()).host;
  const page = await context.newPage();
  await page.goto(`chrome-extension://${id}/${pagePath}`);
  const client = await context.newCDPSession(page);
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 320,
    height: 420,
    deviceScaleFactor: scale,
    mobile: false,
  });
  return { context, page };
}

test("popup fits without scrolling at 1x and 2x", async () => {
  for (const scale of [1, 2]) {
    const { context, page } = await openExtensionPage(scale, "popup.html");
    try {
      const box = await page.evaluate(() => {
        const popup = document.querySelector(".popup");
        const scrolling = document.scrollingElement;
        if (!(popup instanceof HTMLElement) || !(scrolling instanceof HTMLElement)) return null;
        return {
          scroll: scrolling.scrollHeight <= scrolling.clientHeight + 1,
          height: popup.getBoundingClientRect().height,
          star: document.querySelector("a.star")?.textContent ?? "",
          text: document.body.innerText,
        };
      });
      expect(box).not.toBeNull();
      expect(box?.scroll).toBe(true);
      expect(box?.height).toBeLessThanOrEqual(420);
      expect(box?.text).toContain("Kept");
      expect(box?.star).toContain("Star");
    } finally {
      await context.close();
    }
  }
});

test("options exposes the detail controls", async () => {
  const { context, page } = await openExtensionPage(1, "options.html");
  try {
    await expect(page.locator("body")).toContainText(/Conditions|조건/);
    await expect(page.locator("body")).toContainText(/does not collect or transmit|수집하거나 전송하지 않습니다/);
    await expect(page.locator("a.star")).toHaveAttribute("href", "https://github.com/jeongjin0/kept");
  } finally {
    await context.close();
  }
});
