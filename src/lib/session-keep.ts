import { PLATFORMS, type Platform, type Settings } from "./score";

// Chrome keeps storage.session in RAM, including while the MV3 worker sleeps.
// Content scripts use the background broker; session access stays trusted-only.
export const SESSION_UNDO = "undoKeeps";
export interface UndoSnapshot { revision: number; items: Partial<Record<Platform, string[]>> }
export interface UndoView { platform: Platform; revision: number; ids: string[]; reset?: boolean; settings?: Settings }
export const validVideoId = (id: unknown): id is string => typeof id === "string" && /^[\w-]{1,200}$/.test(id);

export function normalizeUndoSnapshot(value: unknown): UndoSnapshot {
  const source = value && typeof value === "object" ? value as Partial<UndoSnapshot> : {};
  const items: UndoSnapshot["items"] = {};
  for (const platform of PLATFORMS) {
    const ids = source.items?.[platform];
    if (Array.isArray(ids)) items[platform] = [...new Set(ids.filter(validVideoId))];
  }
  return { revision: Number.isSafeInteger(source.revision) && source.revision! >= 0 ? source.revision! : 0, items };
}

export async function readUndoSnapshot(): Promise<UndoSnapshot> {
  return normalizeUndoSnapshot((await chrome.storage.session.get(SESSION_UNDO))[SESSION_UNDO]);
}

export function undoView(snapshot: UndoSnapshot, platform: Platform): UndoView {
  return { platform, revision: snapshot.revision, ids: snapshot.items[platform] ?? [] };
}

async function request(platform: Platform, id?: string): Promise<UndoView> {
  const response = await chrome.runtime.sendMessage({ type: id == null ? "scrollplus:session:get" : "scrollplus:session:keep", platform, id });
  if (response?.ok !== true || response.view?.platform !== platform || !Number.isSafeInteger(response.view.revision) || !Array.isArray(response.view.ids)) throw new Error("Session state unavailable");
  return { ...response.view, ids: response.view.ids.filter(validVideoId) };
}

export const loadUndoKeeps = (platform: Platform) => request(platform);
export const rememberUndo = (platform: Platform, id: string) => request(platform, id);

export async function resetFilterSettings(): Promise<Settings> {
  const response = await chrome.runtime.sendMessage({ type: "scrollplus:reset" });
  if (response?.ok !== true || !response.settings) throw new Error("Reset failed");
  return response.settings;
}
