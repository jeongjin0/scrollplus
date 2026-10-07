import type { Platform } from "../lib/score";
import { effectiveLimit } from "../lib/score";
import { Master, Mark, SensitivityControl, SiteRows } from "./controls";
import { Icon } from "./icons";
import { formatPercent, useKeptState } from "./state";

const PLATFORMS: Platform[] = ["youtube", "tiktok", "instagram"];

export function PopupApp() {
  const { settings, skips, active, copy, patch, allowCurrent } = useKeptState();
  const perThousand = (platform: Platform) => Math.max(1, Math.round(effectiveLimit(settings, platform) * 1000));
  const detail = Object.fromEntries(PLATFORMS.map((platform) => [
    platform,
    settings.platforms[platform] ? copy.perThousand(perThousand(platform)) : copy.off,
  ])) as Record<Platform, string>;
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
      <p className="hint">
        <span>{copy.approxLead}</span>
        <b>{copy.approx(perThousand("youtube"), perThousand("tiktok"), perThousand("instagram"))}</b>
      </p>
      <SiteRows
        enabled={settings.platforms}
        labels={copy.short}
        detail={detail}
        onToggle={(platform) => void patch({ platforms: { ...settings.platforms, [platform]: !settings.platforms[platform] } })}
      />
      <p className="count">{copy.skippedToday(skips)}</p>
      {active?.creatorId ? <button className="text-button" onClick={() => void allowCurrent()}>{copy.keepCreator}</button> : null}
      {active?.platform === "instagram" && active.instagramSignedOut ? <p className="note">{copy.signedOut}</p> : null}
      <button className="text-button icon-link" onClick={() => void chrome.runtime.openOptionsPage()}><Icon name="sliders" />{copy.conditions}</button>
      <a className="star icon-link" href={copy.repo} target="_blank" rel="noreferrer"><Icon name="star" />{copy.star}</a>
    </div>
  );
}
