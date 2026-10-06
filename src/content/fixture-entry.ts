import { createEngine, type EngineItem } from "./engine";
import { mountChip } from "./chip";
import { DEFAULT_SETTINGS, type Metrics, type Settings } from "../lib/score";

let settings: Settings = {
  ...DEFAULT_SETTINGS,
  platforms: { ...DEFAULT_SETTINGS.platforms },
  allowlist: [],
};
let advances = 0;
let retreats = 0;
const chip = mountChip({
  undo: () => engine.undo(),
  keepGoing: () => engine.keepGoing(),
  lower: () => engine.lower(),
});
const engine = createEngine({
  getSettings: () => settings,
  now: () => Date.now(),
  advance: async () => {
    const button = document.querySelector("#next");
    if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
    advances += 1;
    const node = document.querySelector("#advances");
    if (node) node.textContent = String(advances);
    const current = document.querySelector("#current");
    if (current) current.textContent = "next-" + advances;
    return true;
  },
  retreat: async () => {
    retreats += 1;
    const node = document.querySelector("#retreats");
    if (node) node.textContent = String(retreats);
    return true;
  },
  onSkipped: () => {},
  setSensitivity: (next) => {
    settings = { ...settings, sensitivity: next };
  },
  isBlocked: () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return true;
    const menu = document.querySelector("#menu");
    return menu instanceof HTMLElement && !menu.hidden;
  },
  render: (model) => chip.update(model),
  schedule: (fn, ms) => window.setTimeout(fn, ms),
  cancel: (id) => window.clearTimeout(id),
});

function show(partial: Partial<EngineItem> & { id: string; metrics: Metrics | null }): void {
  engine.onItem({
    platform: "youtube",
    surface: "player",
    creatorId: "channel",
    kind: "video",
    ...partial,
  });
}

declare global {
  interface Window {
    __kept: {
      show: typeof show;
      setBlockedMenu: (open: boolean) => void;
      settings: Settings;
    };
  }
}

window.__kept = {
  show,
  setBlockedMenu: (open: boolean) => {
    const menu = document.querySelector("#menu");
    if (menu instanceof HTMLElement) menu.hidden = !open;
  },
  settings,
};

const low = { views: 10000, likes: 10, comments: 0, shares: 0, saves: null };
document.querySelector("#run-skip")?.addEventListener("click", () => show({ id: "low", metrics: low }));
