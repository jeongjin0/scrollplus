import { decide, DEFAULT_SETTINGS, normalizeSettings, STORAGE_SETTINGS, type ItemKind, type Metrics, type Platform, type Settings } from "../lib/score";
import { incrementSkips, loadSettings, saveSettings } from "../lib/storage";
import { createEngine, type EngineItem } from "./engine";
import { mountChip } from "./chip";
import type { ExtractedItem } from "../platforms/extract";

export interface Adapter {
  platform: Platform;
  readActive: () => { id: string; creatorId: string | null } | null;
  advance: () => Promise<boolean>;
  retreat: () => Promise<boolean>;
  listGrid: () => Array<{ id: string; element: HTMLElement }>;
  instagramSignedOut?: () => boolean;
}

interface ItemMessage {
  source?: string;
  type?: string;
  item?: ExtractedItem & { platform?: Platform };
  items?: ExtractedItem[];
}

export function startFilter(adapter: Adapter): void {
  let settings: Settings = DEFAULT_SETTINGS;
  const cache = new Map<string, ExtractedItem>();
  let pointerDown = false;
  const chip = mountChip({
    undo: () => engine.undo(),
    keepGoing: () => engine.keepGoing(),
    lower: () => engine.lower(),
  });
  const engine = createEngine({
    getSettings: () => settings,
    now: () => Date.now(),
    advance: () => adapter.advance(),
    retreat: () => adapter.retreat(),
    onSkipped: () => {
      void incrementSkips();
    },
    setRule: (next) => {
      settings = { ...settings, rule: next };
      void saveSettings(settings);
    },
    isBlocked: () => pointerDown || typing() || menuOpen(),
    render: (model) => chip.update(model),
    schedule: (fn, ms) => window.setTimeout(fn, ms),
    cancel: (id) => window.clearTimeout(id),
  });

  function context() {
    const active = adapter.readActive();
    const cached = active ? cache.get(active.id) : undefined;
    return {
      platform: adapter.platform,
      creatorId: cached?.creatorId ?? active?.creatorId ?? null,
      instagramSignedOut: adapter.instagramSignedOut?.() === true,
    };
  }

  function showActive(): void {
    const active = adapter.readActive();
    if (!active) return;
    const cached = cache.get(active.id);
    const item: EngineItem = {
      id: active.id,
      platform: adapter.platform,
      surface: "player",
      creatorId: cached?.creatorId ?? active.creatorId,
      metrics: cached?.metrics ?? null,
      kind: cached?.kind ?? "video",
    };
    engine.onItem(item);
  }

  function scanGrids(): void {
    let cards: Array<{ id: string; element: HTMLElement }> = [];
    try {
      cards = adapter.listGrid();
    } catch {
      return;
    }
    for (const card of cards) {
      const known = cache.get(card.id);
      if (!settings.filterGrids || !known) {
        if (card.element.getAttribute("data-scrollplus-grid") === "skip") {
          card.element.removeAttribute("hidden");
          card.element.removeAttribute("data-scrollplus-grid");
        }
        continue;
      }
      const decision = decide({
        settings,
        platform: adapter.platform,
        surface: "grid",
        creatorId: known.creatorId,
        metrics: known.metrics,
        kind: known.kind,
      });
      if (decision.action === "skip") {
        card.element.setAttribute("hidden", "");
        card.element.setAttribute("data-scrollplus-grid", "skip");
      } else if (card.element.getAttribute("data-scrollplus-grid") === "skip") {
        card.element.removeAttribute("hidden");
        card.element.removeAttribute("data-scrollplus-grid");
      }
    }
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const data = event.data as ItemMessage;
    if (!data || data.source !== "scrollplus" || data.item?.platform && data.item.platform !== adapter.platform && data.type === "item") return;
    if (data.type === "item" && data.item && (!data.item.platform || data.item.platform === adapter.platform)) {
      const previous = cache.get(data.item.id);
      cache.set(data.item.id, {
        ...previous,
        ...data.item,
        creatorId: data.item.creatorId ?? previous?.creatorId ?? null,
        metrics: data.item.metrics ?? previous?.metrics ?? null,
        kind: data.item.kind ?? previous?.kind ?? "video",
      });
      showActive();
    }
    if (data.type === "cache" && Array.isArray(data.items)) {
      for (const item of data.items) cache.set(item.id, item);
      scanGrids();
    }
  });

  window.addEventListener("pointerdown", (event) => {
    if (chip.contains(event.target)) return;
    pointerDown = true;
  }, true);
  window.addEventListener("pointerup", (event) => {
    const inside = chip.contains(event.target);
    pointerDown = false;
    if (!inside) engine.poke();
  }, true);
  window.addEventListener("focusout", () => engine.poke(), true);

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "scrollplus:context") {
      sendResponse(context());
      return false;
    }
    if (message?.type === "scrollplus:allow") {
      const creatorId = context().creatorId;
      if (creatorId) {
        const id = adapter.platform === "instagram" ? creatorId.toLowerCase() : creatorId.replace(/^@/, "");
        const exists = settings.allowlist.some((entry) => entry.platform === adapter.platform && entry.id.toLowerCase() === id.toLowerCase());
        if (!exists) {
          settings = { ...settings, allowlist: [...settings.allowlist, { platform: adapter.platform, id }] };
          void saveSettings(settings);
        }
        engine.keepCurrent();
      }
      sendResponse({ ok: true });
      return false;
    }
    return false;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes[STORAGE_SETTINGS]) return;
    settings = normalizeSettings(changes[STORAGE_SETTINGS].newValue);
    scanGrids();
  });

  void loadSettings().then((next) => {
    settings = next;
    showActive();
    scanGrids();
  });
  window.setInterval(() => {
    showActive();
    scanGrids();
  }, 400);
}

function typing(): boolean {
  const element = document.activeElement;
  if (!(element instanceof HTMLElement)) return false;
  if (element.closest("#scrollplus-chip-host")) return false;
  return element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.isContentEditable;
}

function menuOpen(): boolean {
  for (const node of document.querySelectorAll("ytd-menu-popup-renderer, [role='menu']")) {
    if (!(node instanceof HTMLElement)) continue;
    if (node.getAttribute("aria-hidden") === "true") continue;
    const rect = node.getBoundingClientRect();
    if (rect.width > 8 && rect.height > 8) return true;
  }
  return false;
}

export function rememberMetrics(cache: Map<string, ExtractedItem>, item: ExtractedItem): void {
  cache.set(item.id, item);
}

export type { Metrics, ItemKind };
