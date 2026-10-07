import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const out = path.join(root, "public/icon");
fs.mkdirSync(out, { recursive: true });

const mark = (size) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + size + '" height="' + size + '">'
  + '<rect width="24" height="24" rx="6.5" fill="#FF4D2E"/>'
  + '<path d="M7 18.2V8.6A1.6 1.6 0 0 1 8.6 7h6.8A1.6 1.6 0 0 1 17 8.6v9.6" fill="none" stroke="#10110F" stroke-width="' + (size <= 20 ? 2.8 : 2.3) + '" stroke-linecap="round" stroke-linejoin="round"/>'
  + '<circle cx="12" cy="13.2" r="' + (size <= 20 ? 1.9 : 1.6) + '" fill="#10110F"/>'
  + '</svg>';

const browser = await chromium.launch();
try {
  for (const size of [16, 32, 48, 128]) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent('<!doctype html><body style="margin:0;background:transparent">' + mark(size) + '</body>');
    await page.screenshot({ path: path.join(out, size + ".png"), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
    await page.close();
  }
} finally {
  await browser.close();
}
console.log("icons written");
