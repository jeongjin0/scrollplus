// Local QA control: public YouTube Shorts with no extension, paced like ScrollPlus.
// Usage: node scripts/pacing-control.mjs <output-dir> [duration-ms] [fast-dwell-min-ms] [fast-dwell-max-ms]
// About 40% of videos get a click on the page's own Next control after the fast dwell, retried every
// 400 ms until 5 s after the video opened (the engine's retry), at most 5 in a row; the other
// videos are left after 30 s. Two failed 30 s attempts mean a stall: diagnostics, a screenshot, a reload.
// The default 450-700 ms matches the shortest gap ScrollPlus can click after a move.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { collectStallDiagnostics, networkRecorder } from './soak-helpers.mjs';

const output = path.resolve(process.argv[2] || '');
if (!process.argv[2]) throw new Error('Usage: node scripts/pacing-control.mjs <output-dir> [duration-ms] [fast-dwell-min-ms] [fast-dwell-max-ms]');
const duration = Number(process.argv[3] || 21600000);
const dwellMin = Number(process.argv[4] || 450);
const dwellMax = Number(process.argv[5] || 700);
if (![duration, dwellMin, dwellMax].every(Number.isFinite) || duration < 1000 || dwellMin < 0 || dwellMax < dwellMin) throw new Error('Invalid duration or dwell range');
const profile = path.join(output, 'profile');
if (fs.existsSync(profile)) throw new Error('Use a new output directory; do not start a second run on an existing profile');
fs.mkdirSync(output, { recursive: true });
const started = Date.now();
let seed = 20261009;
const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const report = {
  state: 'starting', pid: process.pid, startedAt: new Date(started).toISOString(), expectedEndAt: new Date(started + duration).toISOString(), duration,
  scope: 'No-extension YouTube Shorts control, ScrollPlus-like pacing: next click ' + dwellMin + '-' + dwellMax + ' ms after a video opens for about 40% of videos, 30 s dwell otherwise',
  fastDwellMs: [dwellMin, dwellMax], samples: 0, fastMoves: 0, fastFailures: 0, longMoves: 0, longAttempts: 0, longFailures: 0, clicks: 0, recoveries: [], checkpoints: [], pageErrors: [],
};
let stop = false, context;
process.on('SIGINT', () => { stop = true; });
process.on('SIGTERM', () => { stop = true; });
const write = () => { report.updatedAt = new Date().toISOString(); report.elapsedMs = Date.now() - started; fs.writeFileSync(path.join(output, 'report.tmp'), JSON.stringify(report, null, 2)); fs.renameSync(path.join(output, 'report.tmp'), path.join(output, 'report.json')); };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
write();
try {
  context = await chromium.launchPersistentContext(profile, { headless: false, viewport: { width: 1280, height: 800 }, args: ['--disable-extensions', '--no-first-run'], handleSIGINT: false, handleSIGTERM: false });
  const page = await context.newPage();
  page.on('pageerror', (e) => { if (report.pageErrors.length < 100) report.pageErrors.push({ at: new Date().toISOString(), message: e.message.slice(0, 300) }); });
  await page.addInitScript(networkRecorder);
  await page.goto('https://www.youtube.com/shorts/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  for (const name of ['Reject all', '모두 거부', 'Decline optional cookies']) { const button = page.getByRole('button', { name, exact: true }); if (await button.count()) await button.first().click({ timeout: 1500 }).catch(() => {}); }
  const cdp = await context.newCDPSession(page); await cdp.send('Performance.enable');
  const readId = () => page.evaluate(() => location.pathname.match(/^\/shorts\/([^/?#]+)/)?.[1] ?? null).catch(() => null);
  const click = async () => { report.clicks++; await page.evaluate(() => document.querySelector('#navigation-button-down button')?.click()).catch(() => {}); };
  const seen = new Set();
  let current = null, openedAt = Date.now(), fastRun = 0, failedLong = 0, lastCheckpoint = 0;
  let plan = { fast: false, dueAt: Date.now() + 30000, attempted: false };
  report.state = 'running'; write();
  while (!stop && Date.now() - started < duration) {
    const id = await readId();
    if (id && id !== current) {
      if (current && plan.attempted) plan.fast ? report.fastMoves++ : report.longMoves++;
      current = id; openedAt = Date.now(); failedLong = 0;
      if (!seen.has(id)) { seen.add(id); report.samples++; }
      const fast = fastRun < 5 && random() < 0.4;
      fastRun = fast ? fastRun + 1 : 0;
      plan = { fast, dueAt: Date.now() + (fast ? dwellMin + random() * (dwellMax - dwellMin) : 30000), attempted: false };
    }
    if (id && Date.now() >= plan.dueAt) {
      plan.attempted = true;
      if (plan.fast) {
        while (Date.now() < openedAt + 5000 && !stop) { await click(); await sleep(400); if ((await readId()) !== id) break; }
        if ((await readId()) === id) { report.fastFailures++; plan = { fast: false, dueAt: Date.now() + 30000, attempted: false }; }
      } else {
        report.longAttempts++;
        await click(); await sleep(2500);
        if ((await readId()) === id) {
          report.longFailures++; failedLong++;
          if (failedLong >= 2) {
            const recovery = { at: new Date().toISOString(), videoId: id, fastMovesBefore: report.fastMoves, state: 'started' };
            report.recoveries.push(recovery); write();
            recovery.diagnostics = await collectStallDiagnostics(page, cdp); write();
            await page.screenshot({ path: path.join(output, 'before-reload-' + report.recoveries.length + '.png') }).catch(() => {});
            await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
            recovery.state = 'reloaded'; failedLong = 0; current = null; write();
          } else plan.dueAt = Date.now() + 30000;
        } else plan.dueAt = Number.POSITIVE_INFINITY;
      }
    }
    if (Date.now() - lastCheckpoint > 60000) {
      const metrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
      report.checkpoints.push({ at: new Date().toISOString(), heapBytes: metrics.JSHeapUsedSize, nodes: metrics.Nodes, scriptDurationSeconds: metrics.ScriptDuration });
      lastCheckpoint = Date.now(); write();
    }
    await sleep(250);
  }
  report.state = stop ? 'stopped' : 'completed';
  await page.screenshot({ path: path.join(output, 'final.png') }).catch(() => {});
} catch (error) { report.state = 'failed'; report.error = String(error).slice(0, 1200); }
finally {
  if (context) await context.close().catch(() => {});
  report.finishedAt = new Date().toISOString(); write();
  console.log(JSON.stringify({ state: report.state, output, samples: report.samples, recoveries: report.recoveries.length, error: report.error }));
  if (report.state === 'failed') process.exitCode = 1;
}
