import type { Platform } from "../lib/score";
import { ruleFor } from "../lib/score";
import { Master, Mark, SensitivityControl, SiteRows } from "./controls";
import { Icon } from "./icons";
import { useKeptState } from "./state";

const PLATFORMS: Platform[] = ["youtube", "tiktok", "instagram"];

export function PopupApp() {
  const { settings, skips, active, copy, patch, allowCurrent } = useKeptState();
  const likesFor = (platform: Platform) => ruleFor(settings, platform).minLikes;
  const counts = PLATFORMS.map(likesFor);
  const same = new Set(counts).size === 1;
  const detail = Object.fromEntries(PLATFORMS.map((platform) => [
    platform,
    settings.platforms[platform] ? copy.under(likesFor(platform)) : copy.off,
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
        <b>{same ? copy.under(counts[0]) : copy.approx(counts[0], counts[1], counts[2])}</b>
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
