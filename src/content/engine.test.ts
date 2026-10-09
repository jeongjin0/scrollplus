import { describe, expect, it } from "vitest";
import { createEngine, type EngineDeps, type EngineItem } from "./engine";
import { DEFAULT_SETTINGS, presetRule, type Settings } from "../lib/score";

function low(id: string): EngineItem {
  return {
    id,
    platform: "youtube",
    surface: "player",
    creatorId: "channel",
    kind: "video",
    metrics: { views: 10000, likes: 10, comments: 0, shares: 0, saves: null },
  };
}

function harness(partial: Partial<Settings> = {}, advanceResult = true, duringAdvance?: (show: (item: EngineItem) => void) => void, undoDeps: Pick<EngineDeps, "rememberUndo" | "sessionKeep"> = {}) {
  const settings: Settings = { ...DEFAULT_SETTINGS, platforms: { ...DEFAULT_SETTINGS.platforms }, rule: presetRule("balanced"), allowlist: [], ...partial };
  let clock = 0;
  let seq = 1;
  const tasks: Array<{ id: number; at: number; fn: () => void }> = [];
  const advances: string[] = [];
  const retreats: string[] = [];
  const chips: string[] = [];
  const models: unknown[] = [];
  let skips = 0;
  let blocked = false;
  let latest = "";
  let calls = 0;
  const engine = createEngine({
    getSettings: () => settings,
    now: () => clock,
    advance: async () => {
      calls += 1;
      advances.push(latest);
      duringAdvance?.((item) => {
        latest = item.id;
        engine.onItem(item);
      });
      return advanceResult;
    },
    retreat: async () => {
      retreats.push(latest);
      return true;
    },
    onSkipped: () => {
      skips += 1;
    },
    setRule: (next) => {
      settings.rule = next;
    },
    isBlocked: () => blocked,
    render: (chip) => {
      chips.push(chip ? chip.mode : "none");
      models.push(chip);
    },
    schedule: (fn, ms) => {
      const id = seq;
      seq += 1;
      tasks.push({ id, at: clock + ms, fn });
      return id;
    },
    cancel: (id) => {
      const index = tasks.findIndex((task) => task.id === id);
      if (index >= 0) tasks.splice(index, 1);
    },
    ...undoDeps,
  });

  async function drain() {
    for (let step = 0; step < 8; step += 1) await Promise.resolve();
  }

  function flush(ms: number) {
    const target = clock + ms;
    for (;;) {
      const due = tasks.filter((task) => task.at <= target).sort((a, b) => a.at - b.at);
      if (!due.length) break;
      const task = due[0];
      clock = task.at;
      const index = tasks.findIndex((item) => item.id === task.id);
      if (index >= 0) tasks.splice(index, 1);
      task.fn();
    }
    clock = target;
  }

  function show(item: EngineItem) {
    latest = item.id;
    engine.onItem(item);
  }

  return {
    engine,
    settings,
    show,
    flush,
    drain,
    advances,
    retreats,
    chips,
    models,
    get skips() { return skips; },
    get calls() { return calls; },
    setBlocked(value: boolean) { blocked = value; },
  };
}

describe("engine", () => {
  it("reconsiders a mounted player at the same id and preserves its session Undo across kind changes", async () => {
    const box = harness();
    box.show({ ...low("mounted"), kind: "carousel" });
    await box.drain();
    expect(box.advances).toEqual([]);
    box.flush(500);
    box.show(low("mounted"));
    await box.drain();
    expect(box.advances).toEqual(["mounted"]);
    box.engine.undo();
    await box.drain();
    box.show({ ...low("mounted"), kind: "carousel" });
    box.show(low("mounted"));
    await box.drain();
    expect(box.advances).toEqual(["mounted"]);
    expect(box.skips).toBe(1);
  });

  it("keeps a video when metrics never arrive", async () => {
    const box = harness();
    box.show({ ...low("a"), metrics: null });
    box.flush(699);
    expect(box.advances).toEqual([]);
    box.flush(1);
    await box.drain();
    expect(box.advances).toEqual([]);
  });

  it("skips when metrics arrive during the grace period", async () => {
    const box = harness();
    box.show({ ...low("a"), metrics: null });
    box.flush(900);
    box.show(low("a"));
    await box.drain();
    expect(box.advances).toEqual(["a"]);
  });

  it("still judges late counts on a freshly loaded page", async () => {
    const box = harness();
    box.show({ ...low("a"), metrics: null });
    box.flush(3300);
    box.show(low("a"));
    await box.drain();
    expect(box.advances).toEqual(["a"]);
  });

  it("does not skip when counts arrive long after the video opened", async () => {
    const box = harness();
    box.flush(10000);
    box.show({ ...low("b"), metrics: null });
    box.flush(2100);
    box.show(low("b"));
    await box.drain();
    expect(box.advances).toEqual([]);
  });

  it("skips once metrics arrive", async () => {
    const box = harness();
    box.show({ ...low("a"), metrics: null });
    box.flush(200);
    box.show(low("a"));
    await box.drain();
    expect(box.advances).toEqual(["a"]);
    expect(box.chips.at(-1)).toBe("skipped");
  });

  it("keeps the skip chip after the next video stays", async () => {
    const box = harness({}, true, (show) => {
      show({
        ...low("b"),
        metrics: { views: 900000, likes: 40000, comments: 200, shares: 10, saves: null },
      });
    });
    box.show(low("a"));
    await box.drain();
    expect(box.advances).toEqual(["a"]);
    expect(box.skips).toBe(1);
    expect(box.chips.at(-1)).toBe("skipped");
    expect(box.models.at(-1)).toEqual({ mode: "skipped", metric: "likes", value: 10 });
    box.flush(2500);
    expect(box.chips.at(-1)).toBe("none");
  });

  it("pauses after six consecutive skips", async () => {
    const box = harness();
    for (let index = 1; index <= 7; index += 1) {
      box.show(low("v" + index));
      await box.drain();
      if (index < 6) box.flush(450);
    }
    expect(box.advances).toEqual(["v1", "v2", "v3", "v4", "v5", "v6"]);
    expect(box.chips.at(-1)).toBe("paused");
  });

  it("undo keeps the current video for the session", async () => {
    const box = harness();
    box.show(low("a"));
    await box.drain();
    box.engine.undo();
    await box.drain();
    expect(box.retreats).toEqual(["a"]);
    box.show(low("a"));
    await box.drain();
    expect(box.advances).toEqual(["a"]);
  });

  it("commits Undo before a retreat can replace the document", async () => {
    let commit!: () => void;
    const saved: string[] = [];
    const box = harness({}, true, undefined, { rememberUndo: id => {
      saved.push(id);
      return new Promise<void>(resolve => { commit = resolve; });
    } });
    box.show(low("a"));
    await box.drain();
    box.engine.undo();
    await box.drain();
    expect(saved).toEqual(["a"]);
    expect(box.retreats).toEqual([]);
    commit();
    await box.drain();
    expect(box.retreats).toEqual(["a"]);
  });

  it("a failed session write still restores and keeps the video in this document", async () => {
    const box = harness({}, true, undefined, { rememberUndo: async () => { throw new Error("Worker unavailable"); } });
    box.show(low("a"));
    await box.drain();
    box.engine.undo();
    await box.drain();
    expect(box.retreats).toEqual(["a"]);
    box.show(low("a"));
    await box.drain();
    expect(box.advances).toEqual(["a"]);
  });

  it("undo keeps the skipped id when the page already shows the next video", async () => {
    const box = harness({}, true, (show) => show(low("next")));
    box.show(low("skipped"));
    await box.drain();
    box.engine.undo();
    await box.drain();
    box.show(low("skipped"));
    await box.drain();
    expect(box.advances).toEqual(["skipped"]);
    box.flush(450);
    box.show(low("next"));
    await box.drain();
    expect(box.advances).toEqual(["skipped", "next"]);
  });

  it("applies changed settings to a video previously kept while paused", async () => {
    const box = harness({ enabled: false });
    box.show(low("a"));
    await box.drain();
    box.flush(10000);
    box.settings.enabled = true;
    box.engine.settingsChanged();
    await box.drain();
    expect(box.advances).toEqual(["a"]);
  });

  it("keep going works after the six-skip chip has waited for a decision", async () => {
    const box = harness();
    for (let index = 1; index <= 6; index += 1) {
      box.show(low("v" + index));
      await box.drain();
      box.flush(450);
    }
    box.show(low("v7"));
    box.flush(10000);
    box.engine.keepGoing();
    await box.drain();
    expect(box.advances).toHaveLength(7);
  });

  it("lowering the bar works after a long pause", async () => {
    const box = harness();
    for (let index = 1; index <= 6; index += 1) {
      box.show(low("v" + index));
      await box.drain();
      box.flush(450);
    }
    box.show({ ...low("v7"), metrics: { ...low("v7").metrics!, likes: 3000 } });
    box.flush(10000);
    box.engine.lower();
    await box.drain();
    expect(box.settings.rule.likes.min).toBe(2000);
    expect(box.advances).toHaveLength(6);
    expect(box.chips.at(-1)).toBe("none");
  });

  it("keeps timely metrics usable while a comment is being written", async () => {
    const box = harness();
    box.flush(10000);
    box.setBlocked(true);
    box.show(low("a"));
    box.flush(10000);
    box.setBlocked(false);
    box.engine.poke();
    await box.drain();
    expect(box.advances).toEqual(["a"]);
  });

  it("does not advance while blocked, then skips when free", async () => {
    const box = harness();
    box.setBlocked(true);
    box.show(low("a"));
    await box.drain();
    expect(box.calls).toBe(0);
    box.setBlocked(false);
    box.engine.poke();
    await box.drain();
    expect(box.advances).toEqual(["a"]);
  });

  it("does not loop when the page cannot advance", async () => {
    const box = harness({}, false);
    box.show(low("a"));
    await box.drain();
    expect(box.calls).toBe(1);
    box.flush(400);
    await box.drain();
    box.flush(400);
    await box.drain();
    box.flush(5200);
    await box.drain();
    const calls = box.calls;
    expect(calls).toBeGreaterThan(1);
    box.engine.poke();
    await box.drain();
    box.flush(1000);
    await box.drain();
    expect(box.calls).toBe(calls);
  });
});
