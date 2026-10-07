export const LADDER = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000, 5000000, 10000000];

export function uiLanguage(): string {
  try {
    const lang = globalThis.chrome?.i18n?.getUILanguage?.();
    if (lang) return lang;
  } catch {
    /* use the page language */
  }
  return typeof navigator === "undefined" ? "en" : navigator.language || "en";
}

export function formatCount(value: number, lang: string = uiLanguage()): string {
  try {
    return new Intl.NumberFormat(lang, { notation: "compact", maximumFractionDigits: 1 }).format(value);
  } catch {
    return String(Math.round(value));
  }
}

const UNITS: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9, "천": 1e3, "만": 1e4, "억": 1e8 };

export function parseCount(input: string): number | null {
  const text = input.trim().toLowerCase().replace(/[,\s_]/g, "");
  const match = text.match(/^(\d+(?:\.\d+)?)(k|m|b|천|만|억)?$/);
  if (!match) return null;
  const unit = match[2] ? UNITS[match[2]] ?? 1 : 1;
  const value = Math.round(Number(match[1]) * unit);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function stepValue(value: number, direction: 1 | -1): number {
  const top = LADDER[LADDER.length - 1];
  if (direction > 0) return LADDER.find((step) => step > value) ?? Math.max(value, top);
  for (let index = LADDER.length - 1; index >= 0; index -= 1) {
    if (LADDER[index] < value) return LADDER[index];
  }
  return Math.min(value, LADDER[0]);
}

