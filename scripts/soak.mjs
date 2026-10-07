// Finite real-feed QA in its own fresh profile. This is not signed-in or human day-use QA.
import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const output = path.resolve(process.argv[2] || `qa/tmp/soak-${Date.now()}`);
const duration = Number(process.argv[3] || 86400000);
const extension = path.resolve(process.argv[4] || '.output/chrome-mv3');
const statusFile = process.argv[5] && path.resolve(process.argv[5]);
if (!Number.isFinite(duration) || duration < 1000 || duration > 86400000) throw new Error('Duration must be 1 second to 24 hours');
if (fs.existsSync(path.join(output, 'profile'))) throw new Error('Use a new output directory; do not start a second run on an existing profile');
fs.mkdirSync(output, { recursive: true });
const started = Date.now();
const report = {
  state: 'starting', startedAt: new Date(started).toISOString(), expectedEndAt: new Date(started + duration).toISOString(), duration,
  version: JSON.parse(fs.readFileSync(path.join(extension, 'manifest.json'))).version,
  scope: 'Automated YouTube Shorts on a fresh signed-out profile, shipped defaults; complements ordinary day-use and does not verify Instagram/TikTok sign-in',
  pid: process.pid, samples: 0, knownLikes: 0, belowMinimum: 0, movesWithSkipChip: 0, manualMoves: 0, continues: 0, checkpoints: [], pageErrors: [],
};
let stop = false, context;
process.on('SIGINT', () => { stop = true; });
process.on('SIGTERM', () => { stop = true; });
const seen = new Set();
const known = new Set();
const low = new Set();
const write = () => {
  report.updatedAt = new Date().toISOString(); report.elapsedMs = Date.now() - started;
  fs.writeFileSync(path.join(output, 'report.tmp'), JSON.stringify(report, null, 2));
  fs.renameSync(path.join(output, 'report.tmp'), path.join(output, 'report.json'));
  if (statusFile) {
    const summary = { state: report.state, startedAt: report.startedAt, expectedEndAt: report.expectedEndAt, updatedAt: report.updatedAt, duration, elapsedMs: report.elapsedMs, version: report.version, samples: report.samples, knownLikes: report.knownLikes, belowMinimum: report.belowMinimum, movesWithSkipChip: report.movesWithSkipChip, manualMoves: report.manualMoves, continues: report.continues, pageErrorCount: report.pageErrors.length, lastDailyCount: report.checkpoints.at(-1)?.dailySkips, error: report.error };
    fs.writeFileSync(statusFile + '.tmp', JSON.stringify(summary, null, 2)); fs.renameSync(statusFile + '.tmp', statusFile);
  }
};
write();
try {
  context = await chromium.launchPersistentContext(path.join(output, 'profile'), { headless: false, viewport: { width: 1280, height: 800 }, args: ['--disable-extensions-except=' + extension, '--load-extension=' + extension, '--no-first-run'] });
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  await expect.poll(() => worker.evaluate(async () => (await chrome.storage.local.get('settings')).settings?.enabled)).toBe(true);
  const settingsPage = await context.newPage();
  await settingsPage.goto('chrome-extension://' + new URL(worker.url()).host + '/options.html'); await settingsPage.waitForSelector('.ready');
  const checkDefaults = async () => {
    const data = await settingsPage.evaluate(() => chrome.storage.local.get(null));
    expect(data.settings).toEqual({ enabled: true, rule: { likes: { on: true, min: 5000 }, comments: { on: false, min: 100 }, views: { on: false, min: 100000 } }, platforms: { youtube: true, tiktok: true, instagram: true }, filterGrids: false, showSkipChip: true, allowlist: [] });
    return data.dailySkips;
  };
  report.initialDailyCount = await checkDefaults();
  const page = await context.newPage();
  page.on('pageerror', e => { if (report.pageErrors.length < 500) report.pageErrors.push({ at: new Date().toISOString(), message: e.message.slice(0, 300), extensionFrame: /chrome-extension:\/\//.test(e.stack || '') }); });
  await page.addInitScript(() => {
    window.__scrollplusSoakEvents = [];
    window.addEventListener('message', e => {
      if (e.source !== window || e.data?.source !== 'scrollplus' || e.data.type !== 'item' || !e.data.item) return;
      const events = window.__scrollplusSoakEvents;
      events.push({ id: e.data.item.id, likes: e.data.item.metrics?.likes });
      if (events.length > 64) events.shift();
    });
  });
  await page.goto('https://www.youtube.com/shorts/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  for (const label of ['Reject all', '모두 거부', 'Decline optional cookies']) { const button = page.getByRole('button', { name: label, exact: true }); if (await button.count()) await button.first().click({ timeout: 1500 }).catch(() => {}); }
  const performance = await context.newCDPSession(page); await performance.send('Performance.enable');
  let current = null, changedAt = Date.now(), manualFrom = null, lastContinue = 0, lastWrite = 0, lastCheckpoint = 0;
  report.state = 'running'; write();
  while (!stop && Date.now() - started < duration) {
    const snap = await page.evaluate(() => {
      const chip = document.querySelector('#scrollplus-chip-host')?.shadowRoot?.querySelector('.chip');
      return { id: location.pathname.match(/^\/shorts\/([^/?#]+)/)?.[1], events: window.__scrollplusSoakEvents.splice(0), chip: chip && !chip.classList.contains('leaving') ? chip.textContent : '', paused: chip?.classList.contains('stack') || false };
    });
    for (const event of snap.events) {
      if (!seen.has(event.id)) { seen.add(event.id); report.samples++; }
      if (typeof event.likes === 'number' && !known.has(event.id)) { known.add(event.id); report.knownLikes++; }
      if (typeof event.likes === 'number' && event.likes < 5000 && !low.has(event.id)) { low.add(event.id); report.belowMinimum++; }
    }
    if (snap.id && snap.id !== current) {
      if (current && manualFrom !== current && snap.chip && !snap.paused) report.movesWithSkipChip++;
      current = snap.id; changedAt = Date.now(); manualFrom = null;
    }
    if (snap.paused && Date.now() - lastContinue > 3000) {
      await page.getByRole('button', { name: /Keep going|이어서 보기/ }).click({ timeout: 2000 });
      report.continues++; lastContinue = Date.now();
    } else if (!snap.chip && current && Date.now() - changedAt > 30000) {
      manualFrom = current; await page.keyboard.press('ArrowDown'); report.manualMoves++; changedAt = Date.now();
    }
    if (Date.now() - lastCheckpoint > 60000) {
      const metrics = Object.fromEntries((await performance.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
      report.checkpoints.push({ at: new Date().toISOString(), dailySkips: await checkDefaults(), heapBytes: metrics.JSHeapUsedSize, nodes: metrics.Nodes, scriptDurationSeconds: metrics.ScriptDuration, taskDurationSeconds: metrics.TaskDuration });
      lastCheckpoint = Date.now();
    }
    if (Date.now() - lastWrite > 10000) { write(); lastWrite = Date.now(); }
    await page.waitForTimeout(250);
  }
  report.finalDailyCount = await checkDefaults();
  report.state = stop ? 'stopped' : report.pageErrors.some(e => e.extensionFrame) ? 'completed-with-extension-errors' : 'completed';
  await page.screenshot({ path: path.join(output, 'final.png') });
} catch (e) { report.state = 'failed'; report.error = String(e).slice(0, 1600); }
finally {
  if (context) await context.close().catch(() => {});
  report.finishedAt = new Date().toISOString(); write();
  console.log(JSON.stringify({ state: report.state, output, elapsedMs: report.elapsedMs, samples: report.samples, pageErrors: report.pageErrors.length, error: report.error }));
  if (report.state === 'failed' || report.state === 'completed-with-extension-errors') process.exitCode = 1;
}
