import { decide, lowerSensitivity, type ItemKind, type Metrics, type Platform, type Sensitivity, type Settings, type Surface } from "../lib/score";

export interface EngineItem {
  id: string;
  platform: Platform;
  surface: Surface;
  creatorId: string | null;
  metrics: Metrics | null;
  kind: ItemKind;
}

export interface ChipModel {
  mode: "skipped" | "paused";
  canLower: boolean;
}

export interface EngineDeps {
  getSettings: () => Settings;
  now: () => number;
  advance: () => Promise<boolean>;
  retreat: () => Promise<boolean>;
  onSkipped: () => void;
  setSensitivity: (next: Sensitivity) => void;
  isBlocked: () => boolean;
  render: (chip: ChipModel | null) => void;
  schedule: (fn: () => void, ms: number) => number;
  cancel: (id: number) => void;
}

const METRIC_WAIT_MS = 700;
const METRIC_GRACE_MS = 2000;
const ADVANCE_GAP_MS = 450;
const CHIP_HOLD_MS = 2500;
const SKIP_CAP = 6;
const RETRY_GAP_MS = 400;
const RETRY_FOR_MS = 5000;

export function createEngine(deps: EngineDeps) {
  let current: EngineItem | null = null;
  let waitTimer: number | null = null;
  let chipTimer: number | null = null;
  let gapTimer: number | null = null;
  let consecutive = 0;
  let paused = false;
  let advancing = false;
  let skipQueuedFor: string | null = null;
  const sessionKeep = new Set<string>();
  const finished = new Set<string>();
  let lastAdvanceAt = Number.NEGATIVE_INFINITY;
  let seenAt = Number.NEGATIVE_INFINITY;

  function clearWait() {
    if (waitTimer != null) deps.cancel(waitTimer);
    waitTimer = null;
  }

  function showSkipped() {
    if (chipTimer != null) deps.cancel(chipTimer);
    if (!deps.getSettings().showSkipChip) {
      deps.render(null);
      return;
    }
    deps.render({ mode: "skipped", canLower: false });
    chipTimer = deps.schedule(() => {
      chipTimer = null;
      if (!paused) deps.render(null);
    }, CHIP_HOLD_MS);
  }

  function showPaused() {
    deps.render({ mode: "paused", canLower: lowerSensitivity(deps.getSettings().sensitivity) != null });
  }

  async function performSkip(item: EngineItem) {
    if (item.id !== current?.id || sessionKeep.has(item.id) || finished.has(item.id)) return;
    if (advancing) return;
    if (deps.isBlocked()) return;
    const gap = ADVANCE_GAP_MS - (deps.now() - lastAdvanceAt);
    if (gap > 0) {
      if (skipQueuedFor === item.id) return;
      skipQueuedFor = item.id;
      if (gapTimer != null) deps.cancel(gapTimer);
      gapTimer = deps.schedule(() => {
        gapTimer = null;
        skipQueuedFor = null;
        void performSkip(item);
      }, gap);
      return;
    }
    advancing = true;
    let moved = false;
    try {
      moved = await deps.advance();
    } catch {
      moved = false;
    } finally {
      advancing = false;
    }
    if (!moved) {
      if (current?.id !== item.id) return;
      if (deps.now() - seenAt >= RETRY_FOR_MS) {
        finished.add(item.id);
        deps.render(null);
        return;
      }
      if (gapTimer != null) deps.cancel(gapTimer);
      gapTimer = deps.schedule(() => {
        gapTimer = null;
        void performSkip(item);
      }, RETRY_GAP_MS);
      return;
    }
    finished.add(item.id);
    lastAdvanceAt = deps.now();
    consecutive += 1;
    deps.onSkipped();
    if (consecutive >= SKIP_CAP) {
      paused = true;
      showPaused();
      return;
    }
    showSkipped();
  }

  function evaluate(item: EngineItem) {
    if (item.id !== current?.id || sessionKeep.has(item.id) || finished.has(item.id)) return;
    const decision = decide({
      settings: deps.getSettings(),
      platform: item.platform,
      surface: item.surface,
      creatorId: item.creatorId,
      metrics: item.metrics,
      kind: item.kind,
    });
    if (decision.action === "keep") {
      const waiting = decision.reason === "no-metrics" || decision.reason === "no-views" || decision.reason === "unscored";
      if (waiting && deps.now() - seenAt < METRIC_GRACE_MS) return;
      finished.add(item.id);
      consecutive = 0;
      paused = false;
      if (chipTimer == null) deps.render(null);
      return;
    }
    if (deps.now() - seenAt >= METRIC_GRACE_MS) {
      finished.add(item.id);
      return;
    }
    if (paused) {
      showPaused();
      return;
    }
    void performSkip(item);
  }

  function armWait(item: EngineItem) {
    if (waitTimer != null) return;
    waitTimer = deps.schedule(() => {
      waitTimer = null;
      if (current?.id === item.id && current.metrics == null) evaluate(current);
    }, METRIC_WAIT_MS);
  }

  return {
    onItem(item: EngineItem) {
      const changed = current?.id !== item.id;
      current = item;
      if (changed) seenAt = deps.now();
      if (sessionKeep.has(item.id)) {
        clearWait();
        deps.render(null);
        return;
      }
      if (changed) clearWait();
      if (finished.has(item.id)) return;
      if (item.surface === "player" && item.metrics == null) {
        armWait(item);
        return;
      }
      clearWait();
      evaluate(item);
    },
    poke() {
      if (!current || finished.has(current.id) || sessionKeep.has(current.id)) return;
      if (current.metrics == null && waitTimer != null) return;
      evaluate(current);
    },
    undo() {
      if (!current) return;
      sessionKeep.add(current.id);
      finished.delete(current.id);
      clearWait();
      if (gapTimer != null) deps.cancel(gapTimer);
      gapTimer = null;
      skipQueuedFor = null;
      if (chipTimer != null) deps.cancel(chipTimer);
      chipTimer = null;
      consecutive = Math.max(0, consecutive - 1);
      paused = false;
      deps.render(null);
      void deps.retreat();
    },
    keepGoing() {
      paused = false;
      consecutive = 0;
      deps.render(null);
      if (!current) return;
      finished.delete(current.id);
      evaluate(current);
    },
    lower() {
      const next = lowerSensitivity(deps.getSettings().sensitivity);
      if (!next) return;
      deps.setSensitivity(next);
      paused = false;
      consecutive = 0;
      if (!current) return;
      finished.delete(current.id);
      evaluate(current);
    },
    keepCurrent() {
      if (!current) return;
      sessionKeep.add(current.id);
      finished.add(current.id);
      clearWait();
      if (gapTimer != null) deps.cancel(gapTimer);
      gapTimer = null;
      skipQueuedFor = null;
      paused = false;
      deps.render(null);
    },
  };
}
