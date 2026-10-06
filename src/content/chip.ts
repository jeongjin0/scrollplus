import type { ChipModel } from "./engine";

export interface ChipLabels {
  skipped: string;
  undo: string;
  paused: string;
  keepGoing: string;
  lower: string;
}

function message(key: string, fallback: string): string {
  try {
    const value = globalThis.chrome?.i18n?.getMessage(key);
    return value || fallback;
  } catch {
    return fallback;
  }
}

export function chipLabels(): ChipLabels {
  const korean = (globalThis.chrome?.i18n?.getUILanguage?.() || navigator.language || "").toLowerCase().startsWith("ko");
  if (korean) {
    return {
      skipped: message("skipped", "넘김"),
      undo: message("undo", "되돌리기"),
      paused: message("paused", "다음 영상도 기준 아래입니다."),
      keepGoing: message("keepGoing", "이어서 보기"),
      lower: message("lowerBar", "기준 낮추기"),
    };
  }
  return {
    skipped: message("skipped", "Skipped"),
    undo: message("undo", "Undo"),
    paused: message("paused", "The next ones are under your bar."),
    keepGoing: message("keepGoing", "Keep going"),
    lower: message("lowerBar", "Lower the bar"),
  };
}

const CHIP_CSS = [
  ":host { all: initial; }",
  ".chip { font: 13px/1.3 ui-sans-serif, system-ui, sans-serif; color: #F4F1EA; background: #10110F; border: 1px solid #FF4D2E; border-radius: 999px; padding: 8px 12px; display: flex; gap: 10px; align-items: center; box-shadow: none; animation: in 120ms ease-out; }",
  ".chip.stack { border-radius: 16px; flex-direction: column; align-items: flex-start; }",
  ".row { display: flex; gap: 8px; }",
  "button { font: inherit; color: #FF4D2E; background: transparent; border: 0; padding: 0; cursor: pointer; }",
  "@keyframes in { from { opacity: 0; } to { opacity: 1; } }",
].join("\n");

function labelNode(text: string): HTMLSpanElement {
  const node = document.createElement("span");
  node.textContent = text;
  return node;
}

function actionButton(text: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });
  return button;
}

export function mountChip(actions: { undo: () => void; keepGoing: () => void; lower: () => void }) {
  let host: HTMLDivElement | null = null;
  let root: HTMLDivElement | null = null;

  function ensure(): void {
    if (host && root) return;
    host = document.createElement("div");
    host.id = "kept-chip-host";
    host.style.position = "fixed";
    host.style.left = "50%";
    host.style.bottom = "24px";
    host.style.transform = "translateX(-50%)";
    host.style.zIndex = "2147483646";
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = CHIP_CSS;
    root = document.createElement("div");
    shadow.append(style, root);
    (document.documentElement ?? document.body).append(host);
  }

  return {
    contains(target: EventTarget | null): boolean {
      return target instanceof Node && !!host?.contains(target);
    },
    update(model: ChipModel | null): void {
      if (!document.documentElement) return;
      ensure();
      if (!root) return;
      root.replaceChildren();
      if (!model) return;
      const labels = chipLabels();
      const chip = document.createElement("div");
      chip.className = model.mode === "paused" ? "chip stack" : "chip";
      if (model.mode === "skipped") {
        chip.append(labelNode(labels.skipped), actionButton(labels.undo, actions.undo));
      } else {
        chip.append(labelNode(labels.paused));
        const row = document.createElement("div");
        row.className = "row";
        row.append(actionButton(labels.keepGoing, actions.keepGoing));
        if (model.canLower) row.append(actionButton(labels.lower, actions.lower));
        chip.append(row);
      }
      root.append(chip);
    },
  };
}
