import type { Platform } from "../lib/score";
import { effectiveLimit } from "../lib/score";
import { Master, Mark, SensitivityControl, SiteChips } from "./controls";
import { formatPercent, useKeptState } from "./state";

const PLATFORMS: Platform[] = ["youtube", "tiktok", "instagram"];

export function PopupApp() {
  const { settings, skips, active, copy, patch, allowCurrent } = useKeptState();
  const bars = PLATFORMS.map((platform) => {
    const name = copy.short[platform];
    return settings.platforms[platform] ? name + " " + formatPercent(effectiveLimit(settings, platform)) : name + " " + copy.off;
  }).join(" · ");
  return (
    <div className="popup">
      <header className="top">
        <Mark />
        <h1>Kept</h1>
      </header>
      <Master enabled={settings.enabled} onLabel={copy.on} offLabel={copy.off} onToggle={() => void patch({ enabled: !settings.enabled })} />
      <SensitivityControl
        value={settings.sensitivity}
        labels={{ lenient: copy.lenient, balanced: copy.balanced, strict: copy.strict }}
        onChange={(sensitivity) => void patch({ sensitivity })}
      />
      <SiteChips
        enabled={settings.platforms}
        labels={copy.short}
        onToggle={(platform) => void patch({ platforms: { ...settings.platforms, [platform]: !settings.platforms[platform] } })}
      />
      <p className="bars">{bars}</p>
      <p className="count">{copy.skippedToday(skips)}</p>
      {active?.creatorId ? <button className="text-button" onClick={() => void allowCurrent()}>{copy.keepCreator}</button> : null}
      {active?.platform === "instagram" && active.instagramSignedOut ? <p className="note">{copy.signedOut}</p> : null}
      <button className="text-button" onClick={() => void chrome.runtime.openOptionsPage()}>{copy.conditions}</button>
      <a className="star" href={copy.repo} target="_blank" rel="noreferrer">{copy.star}</a>
    </div>
  );
}
