import en from "../../public/_locales/en/messages.json";

type Entry = { message: string; placeholders?: Record<string, { content: string }> };

export type MessageKey = keyof typeof en;

const BUNDLED = en as unknown as Record<string, Entry>;

function expand(key: MessageKey, values: string[]): string {
  const entry = BUNDLED[key];
  if (!entry) return key;
  let message = entry.message;
  for (const [name, holder] of Object.entries(entry.placeholders ?? {})) {
    const index = Number(holder.content.replace("$", "")) - 1;
    message = message.split("$" + name.toUpperCase() + "$").join(values[index] ?? "");
  }
  return message;
}

export function t(key: MessageKey, ...subs: Array<string | number>): string {
  const values = subs.map(String);
  try {
    const value = globalThis.chrome?.i18n?.getMessage?.(key, values);
    if (value) return value;
  } catch {
    /* use the bundled English text */
  }
  return expand(key, values);
}

