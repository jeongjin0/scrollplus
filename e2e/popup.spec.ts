import { chromium, expect, test, type BrowserContext, type Page } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function launch() {
  const extension = path.resolve(".output/chrome-mv3");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "slf-ext-"));
  const context = await chromium.launchPersistentContext(dir, {
    headless: false,
    args: ["--disable-extensions-except=" + extension, "--load-extension=" + extension],
  });
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent("serviceworker");
  return { context, id: new URL(worker.url()).host };
}

async function open(context: BrowserContext, id: string, file: string, scale = 1) {
  const page = await context.newPage();
  await page.goto("chrome-extension://" + id + "/" + file);
  if (file === "popup.html") {
    const client = await context.newCDPSession(page);
    await client.send("Emulation.setDeviceMetricsOverride", { width: 320, height: 420, deviceScaleFactor: scale, mobile: false });
  }
  await page.waitForSelector(".ready");
  return page;
}

async function stored(page: Page) {
  return page.evaluate(async () => (await chrome.storage.local.get("settings")).settings);
}

test("popup fits without scrolling at 1x and 2x, even with the optional rows", async () => {
  const { context, id } = await launch();
  try {
    for (const scale of [1, 2]) {
      const page = await open(context, id, "popup.html", scale);
      const box = await page.evaluate(() => {
        const popup = document.querySelector(".popup");
        const scrolling = document.scrollingElement;
        if (!(popup instanceof HTMLElement) || !(scrolling instanceof HTMLElement)) return null;
        const plain = popup.getBoundingClientRect().height;
        const body = popup.querySelector(".body");
        const extra = document.createElement("button");
        extra.className = "action";
        extra.textContent = "Keep this creator";
        body?.append(extra);
        const note = document.createElement("p");
        note.className = "note";
        note.textContent = "Instagram is signed out. Nothing is hidden.";
        body?.append(note);
        return {
          plain,
          full: popup.getBoundingClientRect().height,
          fits: scrolling.scrollHeight <= scrolling.clientHeight + 1,
          star: document.querySelector("a.star")?.getAttribute("href"),
          text: document.body.innerText,
        };
      });
      expect(box).not.toBeNull();
      expect(box?.plain).toBeLessThanOrEqual(420);
      expect(box?.full).toBeLessThanOrEqual(420);
      expect(box?.fits).toBe(true);
      expect(box?.star).toBe("https://github.com/jeongjin0/short-form-like-filter");
      expect(box?.text).toMatch(/Like Filter|좋아요 필터/);
      await page.close();
    }
  } finally {
    await context.close();
  }
});

test("a fresh install already skips under 5K likes, and the popup changes the rule", async () => {
  const { context, id } = await launch();
  try {
    const page = await open(context, id, "popup.html");
    await expect(page.getByRole("radio", { name: /Balanced|기본/ })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("radio", { name: /Balanced|기본/ })).toContainText(/5K|5천/);
    await expect(page.getByRole("radio", { name: /Strict|엄격/ })).toContainText(/20K|2만/);
    expect((await stored(page)).rule.likes).toEqual({ on: true, min: 5000 });

    await page.getByRole("radio", { name: /Strict|엄격/ }).click();
    await expect.poll(async () => (await stored(page)).rule.likes.min).toBe(20000);

    await page.getByRole("switch", { name: "TikTok" }).click();
    await expect.poll(async () => (await stored(page)).platforms.tiktok).toBe(false);

    await page.getByRole("button", { name: /Filter is on|필터 켜짐/ }).click();
    await expect.poll(async () => (await stored(page)).enabled).toBe(false);
  } finally {
    await context.close();
  }
});

test("settings accept typed numbers and mark the popup as custom", async () => {
  const { context, id } = await launch();
  try {
    const options = await open(context, id, "options.html");
    await expect(options.locator("body")).toContainText(/Rules|기준/);
    await expect(options.locator("body")).toContainText(/Nothing is collected or sent|수집하거나 전송하지 않습니다/);
    await expect(options.locator("a.star")).toHaveAttribute("href", "https://github.com/jeongjin0/short-form-like-filter");

    const likes = options.getByLabel(/Minimum Likes|좋아요 최소 개수/);
    await likes.click();
    await likes.fill("2만");
    await likes.press("Enter");
    await expect.poll(async () => (await stored(options)).rule.likes.min).toBe(20000);
    await expect(options.getByRole("radio", { name: /Strict|엄격/ })).toHaveAttribute("aria-checked", "true");

    await likes.click();
    await likes.fill("700");
    await likes.press("Enter");
    await expect.poll(async () => (await stored(options)).rule.likes.min).toBe(700);
    await expect(options.getByRole("radio", { checked: true })).toHaveCount(0);

    await options.getByRole("switch", { name: /Comments|댓글/ }).click();
    await expect.poll(async () => (await stored(options)).rule.comments.on).toBe(true);

    const popup = await open(context, id, "popup.html");
    await expect(popup.locator(".badge")).toHaveText(/Custom|직접/);

    await options.getByRole("button", { name: /Reset to defaults|기본값으로 되돌리기/ }).click();
    await expect.poll(async () => (await stored(options)).rule).toEqual({
      likes: { on: true, min: 5000 },
      comments: { on: false, min: 100 },
      views: { on: false, min: 100000 },
    });
  } finally {
    await context.close();
  }
});
