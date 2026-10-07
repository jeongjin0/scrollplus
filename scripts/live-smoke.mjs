import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const extension = path.join(root, ".output/chrome-mv3");
const samplesDir = path.join(root, "qa/samples");
const tmp = path.join(root, "qa/tmp/smoke-profile");
fs.mkdirSync(samplesDir, { recursive: true });
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });

function score(item) {
  if (typeof item.views !== "number" || item.views <= 0) return null;
  let numerator = 0;
  let any = false;
  const parts = [[item.likes, 1], [item.comments, 3], [item.shares, 4], [item.saves, 4]];
  for (const [value, weight] of parts) {
    if (typeof value !== "number") continue;
    numerator += value * weight;
    any = true;
  }
  return any ? numerator / item.views : null;
}

async function dismiss(page) {
  const labels = ["Reject all", "Accept all", "I agree", "Agree", "모두 거부", "모두 동의", "동의 안 함"];
  for (const label of labels) {
    const button = page.getByRole("button", { name: label });
    if (await button.count()) {
      await button.first().click({ timeout: 1200 }).catch(() => {});
    }
  }
}

async function collect(page, read, limit) {
  const seen = new Set();
  const rows = [];
  const deadline = Date.now() + 150000;
  while (rows.length < limit && Date.now() < deadline) {
    await page.waitForTimeout(1200);
    const item = await read().catch((error) => ({ error: String(error) }));
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      rows.push({ ...item, at: new Date().toISOString() });
    }
    await page.keyboard.press("ArrowDown").catch(() => {});
  }
  return rows;
}

const context = await chromium.launchPersistentContext(tmp, {
  headless: false,
  viewport: { width: 1280, height: 900 },
  args: [
    "--disable-extensions-except=" + extension,
    "--load-extension=" + extension,
    "--no-first-run",
  ],
});

const report = { youtube: [], tiktok: [], notes: [] };
try {
  const page = context.pages()[0] || await context.newPage();
  await page.addInitScript(() => {
    window.__scrollplusLast = null;
    document.addEventListener("yt-navigate-finish", (event) => {
      const player = event.detail && event.detail.response && event.detail.response.playerResponse;
      if (!player) return;
      const details = player.videoDetails || {};
      const micro = (player.microformat && player.microformat.playerMicroformatRenderer) || {};
      const views = micro.viewCount != null ? Number(micro.viewCount) : (details.viewCount != null ? Number(details.viewCount) : null);
      const likes = micro.likeCount != null ? Number(micro.likeCount) : null;
      window.__scrollplusLast = {
        id: details.videoId || null,
        views: Number.isFinite(views) ? views : null,
        likes: Number.isFinite(likes) ? likes : null,
        creatorId: details.channelId || null,
      };
    });
  });
  await page.goto("https://www.youtube.com/shorts", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2500);
  await dismiss(page);
  await page.screenshot({ path: path.join(root, "qa/tmp/youtube-start.png") });
  report.youtube = await collect(page, () => page.evaluate(() => {
    const id = location.pathname.match(/\/shorts\/([^/?#]+)/)?.[1] ?? null;
    const player = window.ytInitialPlayerResponse;
    const details = player && player.videoDetails ? player.videoDetails : {};
    let likes = null;
    let comments = null;
    const stack = [player];
    const seen = new Set();
    let nodes = 0;
    while (stack.length && nodes < 5000) {
      const current = stack.pop();
      if (!current || typeof current !== "object" || seen.has(current)) continue;
      seen.add(current);
      nodes += 1;
      if (Array.isArray(current)) {
        for (const child of current.slice(0, 30)) stack.push(child);
        continue;
      }
      for (const [key, value] of Object.entries(current)) {
        if (key === "adPlacements" || key === "playerAds" || key === "adSlots") continue;
        if (key === "likeCount" && likes == null && (typeof value === "number" || (typeof value === "string" && /^\d+$/.test(value)))) {
          likes = Number(value);
        }
        if ((key === "commentCount" || key === "commentsCount") && comments == null && (typeof value === "number" || (typeof value === "string" && /^\d+$/.test(value)))) {
          comments = Number(value);
        }
        if (value && typeof value === "object") stack.push(value);
      }
    }
    const host = document.querySelector("#scrollplus-chip-host");
    const chipNode = host && host.shadowRoot ? host.shadowRoot.querySelector(".chip") : null;
    const chip = chipNode ? (chipNode.textContent || "").trim() : "";
    const last = window.__scrollplusLast;
    const same = last && last.id === id;
    return {
      id,
      views: same ? last.views : (details.viewCount != null && details.viewCount !== "" ? Number(details.viewCount) : (player && player.microformat && player.microformat.playerMicroformatRenderer ? Number(player.microformat.playerMicroformatRenderer.viewCount) : null)),
      likes: same && last.likes != null ? last.likes : likes,
      comments,
      shares: null,
      saves: null,
      creatorId: same && last.creatorId ? last.creatorId : (typeof details.channelId === "string" ? details.channelId : null),
      chip,
    };
  }), 20);
  await page.screenshot({ path: path.join(root, "qa/tmp/youtube-end.png") });

  await page.goto("https://www.tiktok.com/explore", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(3000);
  await dismiss(page);
  const videoLink = page.locator('a[href*="/video/"]').first();
  if (await videoLink.count()) await videoLink.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(root, "qa/tmp/tiktok-start.png") });
  report.tiktok = await collect(page, () => page.evaluate(() => {
    const fromUrl = location.pathname.match(/@([^/]+)\/video\/(\d+)/);
    let id = fromUrl ? fromUrl[2] : null;
    let creatorId = fromUrl ? fromUrl[1] : null;
    const videos = [...document.querySelectorAll("video")];
    let best = null;
    let bestRatio = 0;
    for (const video of videos) {
      const rect = video.getBoundingClientRect();
      if (rect.height < 40) continue;
      const visible = Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0);
      const ratio = visible / rect.height;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = video;
      }
    }
    if (!id && best) {
      let node = best;
      for (let depth = 0; depth < 12 && node; depth += 1) {
        const link = node.querySelector && node.querySelector('a[href*="/video/"]');
        const match = link && link.href.match(/@([^/]+)\/video\/(\d+)/);
        if (match) {
          creatorId = match[1];
          id = match[2];
          break;
        }
        node = node.parentElement;
      }
    }
    const raw = document.getElementById("__UNIVERSAL_DATA_FOR_REHYDRATION__")?.textContent || document.getElementById("SIGI_STATE")?.textContent || "";
    let stats = null;
    if (raw && id && raw.includes(id)) {
      try {
        const parsed = JSON.parse(raw);
        const stack = [parsed];
        const seen = new Set();
        let nodes = 0;
        while (stack.length && nodes < 8000 && !stats) {
          const current = stack.pop();
          if (!current || typeof current !== "object" || seen.has(current)) continue;
          seen.add(current);
          nodes += 1;
          if (Array.isArray(current)) {
            for (const child of current.slice(0, 40)) stack.push(child);
            continue;
          }
          if (String(current.id || "") === id && (current.stats || current.statsV2)) stats = current.stats || current.statsV2;
          for (const value of Object.values(current)) if (value && typeof value === "object") stack.push(value);
        }
      } catch { /* ignore */ }
    }
    const host = document.querySelector("#scrollplus-chip-host");
    const chipNode = host && host.shadowRoot ? host.shadowRoot.querySelector(".chip") : null;
    const chip = chipNode ? (chipNode.textContent || "").trim() : "";
    return {
      id,
      creatorId,
      views: stats && stats.playCount != null ? Number(stats.playCount) : null,
      likes: stats && stats.diggCount != null ? Number(stats.diggCount) : null,
      comments: stats && stats.commentCount != null ? Number(stats.commentCount) : null,
      shares: stats && stats.shareCount != null ? Number(stats.shareCount) : null,
      saves: stats && stats.collectCount != null ? Number(stats.collectCount) : null,
      chip,
    };
  }), 20);
  await page.screenshot({ path: path.join(root, "qa/tmp/tiktok-end.png") });
} catch (error) {
  report.notes.push(String(error));
} finally {
  await context.close().catch(() => {});
}

const publicRows = (rows) => rows.filter((row) => row.id).map((row) => ({
  id: row.id,
  creatorId: row.creatorId ?? null,
  views: row.views ?? null,
  likes: row.likes ?? null,
  comments: row.comments ?? null,
  shares: row.shares ?? null,
  saves: row.saves ?? null,
}));
fs.writeFileSync(path.join(samplesDir, "youtube.json"), JSON.stringify(publicRows(report.youtube), null, 2) + "\n");
fs.writeFileSync(path.join(samplesDir, "tiktok.json"), JSON.stringify(publicRows(report.tiktok), null, 2) + "\n");

function summarize(name, rows, floor, cutoff) {
  const eligible = rows.filter((row) => typeof row.views === "number" && row.views >= floor && score(row) != null);
  const skipped = eligible.filter((row) => {
    const value = score(row);
    const zero = row.views >= 800 && row.likes === 0 && row.comments === 0 && row.shares === 0;
    return zero || (value != null && value < cutoff);
  });
  return { name, count: rows.length, withViews: rows.filter((row) => typeof row.views === "number").length, eligible: eligible.length, skipped: skipped.length, chips: rows.filter((row) => row.chip).length };
}

const youtubeSummary = summarize("YouTube Shorts", report.youtube, 2000, 0.008);
const tiktokSummary = summarize("TikTok", report.tiktok, 3000, 0.03);
const today = new Date().toISOString().slice(0, 10);
const lines = [
  "# Live smoke",
  "",
  "Date: " + today,
  "",
  "Instagram Reels was not verified. The smoke browser had no signed-in Instagram session, so nothing was marked as passed there.",
  "",
  "YouTube Shorts: " + youtubeSummary.count + " distinct videos. Views were read on " + youtubeSummary.withViews + ". Eligible for the provisional Balanced cutoff: " + youtubeSummary.eligible + ". Of those, " + youtubeSummary.skipped + " were below the cutoff. Chip text was seen on " + youtubeSummary.chips + " samples.",
  "",
  "TikTok: " + tiktokSummary.count + " distinct videos. Views were read on " + tiktokSummary.withViews + ". Eligible: " + tiktokSummary.eligible + ". Below the provisional cutoff: " + tiktokSummary.skipped + ". Chip text was seen on " + tiktokSummary.chips + " samples.",
  "",
  report.notes.length ? "Notes: " + report.notes.join(" ") : "The browser session closed after both passes.",
  "",
];
fs.writeFileSync(path.join(root, "qa/live-smoke.md"), lines.join("\n"));
const calibration = [
  "# Calibration",
  "",
  "Date: " + today,
  "",
  "YouTube eligible sample: " + youtubeSummary.eligible + ". TikTok eligible sample: " + tiktokSummary.eligible + ".",
  "",
  "Neither platform reached 40 items at or above its sample floor, so Balanced stays on the provisional cutoffs: YouTube 2,000 views and 0.8%, TikTok 3,000 plays and 3.0%, Instagram 2,000 plays and 1.0%. Lenient remains half of Balanced and Strict remains double.",
  "",
  "Instagram had no signed-in session, so it was not sampled.",
  "",
];
fs.writeFileSync(path.join(root, "qa/calibration.md"), calibration.join("\n"));
console.log(JSON.stringify({ youtube: youtubeSummary, tiktok: tiktokSummary, notes: report.notes }, null, 2));
