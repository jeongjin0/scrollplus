import { Master, Mark, PlatformSwitches, SensitivityControl } from "./controls";
import { useKeptState } from "./state";

export function PopupApp() {
  const { settings, skips, active, copy, patch, allowCurrent } = useKeptState();
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
      <PlatformSwitches
        settings={settings}
        labels={{ youtube: copy.youtube, tiktok: copy.tiktok, instagram: copy.instagram }}
        onToggle={(platform) => void patch({ platforms: { ...settings.platforms, [platform]: !settings.platforms[platform] } })}
      />
      <p className="count">{copy.skippedToday(skips)}</p>
      {active?.creatorId ? <button className="text-button" onClick={() => void allowCurrent()}>{copy.keepCreator}</button> : null}
      {active?.platform === "instagram" && active.instagramSignedOut ? <p className="note">{copy.signedOut}</p> : null}
      <a className="star" href={copy.repo} target="_blank" rel="noreferrer">{copy.star}</a>
    </div>
  );
}
