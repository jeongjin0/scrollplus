// A navigation replaces the page's execution context. Other errors still fail QA.
export async function readDuringNavigation(page, read, onNavigation) {
  try {
    return await read();
  } catch (error) {
    if (page.isClosed() || !/Execution context was destroyed|Cannot find context with specified id/.test(String(error))) throw error;
    await page.waitForLoadState('domcontentloaded', { timeout: 45000 });
    onNavigation(error);
    return null;
  }
}

export class FeedProgress {
  constructor(now) {
    this.current = null;
    this.changedAt = now;
    this.lastAttemptAt = -Infinity;
    this.lastRecoveryAt = -Infinity;
    this.pending = null;
    this.attemptedFrom = null;
    this.failures = 0;
    this.recoveries = 0;
  }

  observe(id, now) {
    if (id && id !== this.current) {
      const previous = this.current;
      const manualMoved = !!previous && this.attemptedFrom === previous;
      this.reset(now);
      this.current = id;
      return { changed: true, previous, manualMoved, failedAttempt: false };
    }
    if (this.pending && now - this.pending.at >= 2500) {
      this.pending = null;
      this.failures++;
      return { changed: false, manualMoved: false, failedAttempt: true };
    }
    return { changed: false, manualMoved: false, failedAttempt: false };
  }

  canAttempt(now) {
    return !!this.current && !this.pending && now - this.changedAt >= 30000 && now - this.lastAttemptAt >= 30000;
  }

  attempted(now) {
    this.pending = { at: now };
    this.attemptedFrom = this.current;
    this.lastAttemptAt = now;
  }

  recover(now) {
    if (this.recoveries >= 12 || now - this.lastRecoveryAt < 600000) throw new Error('Feed did not recover after normal reload; inspect QA evidence');
    this.recoveries++;
    this.lastRecoveryAt = now;
    this.reset(now);
  }

  reset(now) {
    this.current = null;
    this.changedAt = now;
    this.lastAttemptAt = -Infinity;
    this.pending = null;
    this.attemptedFrom = null;
    this.failures = 0;
  }
}

// Evidence for a feed that stopped answering the keyboard. Every probe is bounded and
// failure is recorded rather than thrown, so a hung page cannot stop the run.
export async function collectStallDiagnostics(page, cdp, now = () => Date.now()) {
  const diagnostics = { at: new Date().toISOString() };
  const bounded = async (name, probe) => {
    try { diagnostics[name] = await Promise.race([probe(), new Promise((_, reject) => setTimeout(() => reject(new Error('probe timed out')), 8000))]); }
    catch (error) { diagnostics[name + 'Error'] = String(error).slice(0, 200); }
  };
  await bounded('evaluateRoundTripMs', async () => { const start = now(); await page.evaluate(() => 1); return now() - start; });
  await bounded('page', () => page.evaluate(async () => {
    const playing = () => [...document.querySelectorAll('video')].find(video => !video.paused && !video.ended);
    const first = playing()?.currentTime ?? null;
    await new Promise(resolve => setTimeout(resolve, 1000));
    const second = playing()?.currentTime ?? null;
    const active = document.activeElement;
    const down = document.querySelector('#navigation-button-down button');
    const box = down?.getBoundingClientRect();
    return {
      path: location.pathname,
      visibility: document.visibilityState,
      hasFocus: document.hasFocus(),
      activeElement: active ? active.tagName + (active.id ? '#' + active.id : '') : null,
      videoAdvancedSeconds: first !== null && second !== null ? Number((second - first).toFixed(2)) : null,
      elements: document.querySelectorAll('*').length,
      reelRenderers: document.querySelectorAll('ytd-reel-video-renderer').length,
      downControls: document.querySelectorAll('#navigation-button-down').length,
      downDisabled: down ? down.disabled || down.getAttribute('aria-disabled') === 'true' : null,
      downVisible: box ? box.width > 0 && box.height > 0 : null,
    };
  }));
  if (cdp) await bounded('metrics', async () => {
    const metrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(metric => [metric.name, metric.value]));
    return { heapBytes: metrics.JSHeapUsedSize, nodes: metrics.Nodes, scriptDurationSeconds: metrics.ScriptDuration, taskDurationSeconds: metrics.TaskDuration };
  });
  // Does the page's own on-screen control still move the feed when the keyboard does not?
  await bounded('ownControl', async () => {
    const before = await page.evaluate(() => location.pathname);
    const control = page.locator('#navigation-button-down button').first();
    if (!await control.count()) return { clicked: false, reason: 'no control' };
    await control.click({ timeout: 2000 });
    await page.waitForTimeout(2500);
    const after = await page.evaluate(() => location.pathname);
    return { clicked: true, moved: after !== before };
  });
  return diagnostics;
}
