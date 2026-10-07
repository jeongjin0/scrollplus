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
