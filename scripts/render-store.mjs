import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const build = path.join(root, ".output/chrome-mv3");
const work = path.join(root, "qa/tmp/store");
const outShots = path.join(root, "store/screenshots");
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });
fs.mkdirSync(outShots, { recursive: true });

// English build of the real extension, so the screenshots match the English listing.
const extension = path.join(work, "ext");
fs.cpSync(build, extension, { recursive: true });
fs.rmSync(path.join(extension, "_locales/ko"), { recursive: true, force: true });

const uri = (file) => "data:image/png;base64," + fs.readFileSync(file).toString("base64");

async function capture() {
  const context = await chromium.launchPersistentContext(path.join(work, "profile"), {
    headless: false,
    deviceScaleFactor: 2,
    viewport: { width: 760, height: 1100 },
    args: ["--disable-extensions-except=" + extension, "--load-extension=" + extension, "--no-first-run"],
  });
  await context.addInitScript(() => {
    try { chrome.i18n.getUILanguage = () => "en"; } catch { /* page without chrome */ }
  });
  const worker = context.serviceWorkers()[0] || await context.waitForEvent("serviceworker");
  const id = new URL(worker.url()).host;
  const popup = await context.newPage();
  await popup.setViewportSize({ width: 320, height: 420 });
  await popup.goto("chrome-extension://" + id + "/popup.html");
  await popup.waitForSelector(".ready");
  await popup.evaluate(() => chrome.storage.local.set({ dailySkips: { day: new Date().toLocaleDateString("sv"), count: 18 } }));
  await popup.reload();
  await popup.waitForSelector(".ready");
  await popup.waitForTimeout(400);
  await popup.locator(".popup").screenshot({ path: path.join(work, "popup.png") });
  const options = await context.newPage();
  await options.setViewportSize({ width: 680, height: 1100 });
  await options.goto("chrome-extension://" + id + "/options.html");
  await options.waitForSelector(".ready");
  await options.waitForTimeout(400);
  await options.locator(".sheet").screenshot({ path: path.join(work, "options-full.png") });
  const rules = await options.locator("section").first().boundingBox();
  await context.close();
  return rules;
}

async function captureChip() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 2, locale: "en-US", viewport: { width: 640, height: 240 } });
  const page = await context.newPage();
  await page.goto("file://" + path.join(root, "dist-fixture/player.html"));
  await page.evaluate(() => {
    document.body.style.visibility = "hidden";
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";
    window.__kept.show({ id: "weak", metrics: { views: 91200, likes: 312, comments: 4, shares: 0, saves: null } });
  });
  await page.waitForFunction(() => {
    const host = document.querySelector("#kept-chip-host");
    return !!host && !!host.shadowRoot && !!host.shadowRoot.querySelector(".chip");
  });
  await page.waitForTimeout(260);
  const box = await page.locator("#kept-chip-host").boundingBox();
  const pad = 36;
  await page.screenshot({ path: path.join(work, "chip.png"), omitBackground: true, clip: { x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 } });
  await browser.close();
  return { w: box.width + pad * 2, h: box.height + pad * 2 };
}

const MARK = '<svg viewBox="0 0 24 24" width="SIZE" height="SIZE"><rect width="24" height="24" rx="6.5" fill="#FF4D2E"/><path d="M7 18.2V8.6A1.6 1.6 0 0 1 8.6 7h6.8A1.6 1.6 0 0 1 17 8.6v9.6" fill="none" stroke="#10110F" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="13.2" r="1.6" fill="#10110F"/></svg>';

const BASE_CSS = [
  "*{box-sizing:border-box;margin:0}",
  "html,body{width:100%;height:100%;background:#10110F;color:#F4F1EA;font-family:ui-sans-serif,system-ui,-apple-system,'Apple SD Gothic Neo','Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}",
  ".stage{position:relative;width:1280px;height:800px;background:radial-gradient(900px 600px at 82% 12%,rgba(255,77,46,.16),transparent 60%),#10110F}",
  ".copy{position:absolute;left:96px;top:0;bottom:0;width:480px;display:flex;flex-direction:column;justify-content:center;gap:22px}",
  ".brand{display:flex;align-items:center;gap:12px;font-size:22px;font-weight:650;letter-spacing:-.02em;color:#F4F1EA}",
  "h1{font-size:68px;line-height:1.02;font-weight:700;letter-spacing:-.04em;text-wrap:balance}",
  "h1 em{font-style:normal;color:#FF4D2E}",
  "p{font-size:24px;line-height:1.4;color:#A8A396;max-width:440px;text-wrap:balance}",
  ".shot{position:absolute;filter:drop-shadow(0 30px 60px rgba(0,0,0,.55))}",
  ".shot img{display:block;border-radius:22px}",
].join("");

function page(body, extra = "") {
  return '<!doctype html><meta charset="utf-8"><style>' + BASE_CSS + extra + '</style><div class="stage">' + body + "</div>";
}

const brand = '<div class="brand">' + MARK.replaceAll("SIZE", "36") + "Kept</div>";

async function compose() {
  const rules = await capture();
  const chipBox = await captureChip();
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const stage = await context.newPage();

  const jobs = [];

  // 1. Popup
  jobs.push({
    file: "popup.png",
    html: page(
      '<div class="copy">' + brand + "<h1>Weak videos <em>skip themselves.</em></h1><p>Set a like count once. Kept moves on for you.</p></div>" +
      '<div class="shot" style="left:700px;top:96px"><img src="' + uri(path.join(work, "popup.png")) + '" width="480"></div>'),
  });

  // 2. Options
  jobs.push({
    file: "options.png",
    html: page(
      '<div class="copy">' + brand + "<h1>Your numbers, <em>your rules.</em></h1><p>Pick a preset or type your own. Likes, comments, views.</p></div>" +
      '<div class="shot" style="left:640px;top:0;width:560px;height:800px;overflow:hidden;border-radius:0 0 22px 22px"><img src="' + uri(path.join(work, "options-full.png")) + '" width="560" style="border-radius:0;margin-top:56px"></div>'),
  });

  // 3. Chip
  const chipW = Math.round(chipBox.w * 1.3);
  jobs.push({
    file: "chip.png",
    html: page(
      '<div class="copy">' + brand + "<h1>Skipped. <em>Undo</em> in one tap.</h1><p>Every skip tells you why, and you can take it back.</p></div>" +
      '<div class="card"><div class="orb"></div><div class="blob"></div><div class="acts"><i></i><i></i><i></i></div><div class="who"><b></b><span></span></div><div class="chipwrap"><img src="' + uri(path.join(work, "chip.png")) + '" width="' + chipW + '"></div></div>',
      ".card{position:absolute;left:760px;top:64px;width:380px;height:672px;border-radius:30px;background:linear-gradient(160deg,#2A2B24,#171813 60%,#10110F);border:1px solid rgba(244,241,234,.08);box-shadow:0 30px 60px rgba(0,0,0,.55);overflow:hidden}" +
      ".orb{position:absolute;left:-60px;top:70px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(255,77,46,.28),transparent 68%)}" +
      ".blob{position:absolute;left:70px;top:150px;width:240px;height:240px;border-radius:44% 56% 52% 48% / 52% 44% 56% 48%;background:linear-gradient(145deg,rgba(244,241,234,.14),rgba(244,241,234,.03))}" +
      ".acts{position:absolute;right:22px;bottom:178px;display:flex;flex-direction:column;gap:16px}.acts i{display:block;width:40px;height:40px;border-radius:50%;background:rgba(244,241,234,.12)}" +
      ".who{position:absolute;left:28px;bottom:180px;display:flex;align-items:center;gap:10px}.who b{display:block;width:34px;height:34px;border-radius:50%;background:rgba(255,77,46,.55)}.who span{display:block;width:110px;height:10px;border-radius:5px;background:rgba(244,241,234,.2)}" +
      ".bar1,.bar2{position:absolute;left:28px;height:12px;border-radius:6px;background:rgba(244,241,234,.12)}.bar1{top:468px;width:220px}.bar2{top:494px;width:150px}" +
      ".chipwrap{position:absolute;left:0;right:0;bottom:44px;display:flex;justify-content:center}.chipwrap img{display:block}"),
  });

  for (const job of jobs) {
    await stage.setContent(job.html);
    await stage.waitForTimeout(150);
    await stage.screenshot({ path: path.join(outShots, job.file) });
  }

  // Tile 440x280
  const tile = await context.newPage();
  await tile.setViewportSize({ width: 440, height: 280 });
  await tile.setContent('<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0}html,body{width:440px;height:280px;background:radial-gradient(260px 200px at 90% 0%,rgba(255,77,46,.22),transparent 70%),#10110F;color:#F4F1EA;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}.t{position:absolute;left:32px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:18px}.row{display:flex;align-items:center;gap:12px;font-size:30px;font-weight:700;letter-spacing:-.03em}h2{font-size:26px;line-height:1.15;font-weight:650;letter-spacing:-.03em;max-width:330px;color:#F4F1EA;text-wrap:balance}h2 em{font-style:normal;color:#FF4D2E}</style><div class="t"><div class="row">' + MARK.replaceAll("SIZE", "44") + 'Kept</div><h2>Weak videos <em>skip themselves.</em></h2></div>');
  await tile.screenshot({ path: path.join(root, "store/tile.png") });
  await browser.close();
  return rules;
}

await compose();
console.log("store images written");
