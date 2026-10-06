import type { Platform } from "../lib/score";
import { Master, Mark, PlatformSwitches, SensitivityControl } from "./controls";
import { useKeptState } from "./state";

const PLATFORMS: Platform[] = ["youtube", "tiktok", "instagram"];

export function OptionsApp() {
  const { settings, skips, active, copy, patch, allowCurrent, cutoffFor } = useKeptState();
  return (
    <main className="options">
      <div className="sheet">
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
        <label className="check">
          <input type="checkbox" checked={settings.filterGrids} onChange={(event) => void patch({ filterGrids: event.target.checked })} />
          {copy.filterGrids}
        </label>
        <label className="check">
          <input type="checkbox" checked={settings.showSkipChip} onChange={(event) => void patch({ showSkipChip: event.target.checked })} />
          {copy.showChip}
        </label>
        <section className="panel">
          <h2>{copy.allowlist}</h2>
          {settings.allowlist.length === 0 ? <p className="note">—</p> : settings.allowlist.map((entry) => (
            <div className="allow" key={entry.platform + entry.id}>
              <span>{entry.platform} · {entry.id}</span>
              <button className="text-button" onClick={() => void patch({ allowlist: settings.allowlist.filter((item) => item !== entry) })}>{copy.remove}</button>
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>{copy.advanced}</h2>
          {PLATFORMS.map((platform) => {
            const cutoff = cutoffFor(settings, platform);
            return (
              <div key={platform}>
                <strong>{platform}</strong>
                <div className="fields">
                  <label>
                    {copy.sampleFloor}
                    <input type="number" min={0} value={cutoff.sampleFloor} onChange={(event) => updateCutoff(platform, Number(event.target.value), cutoff.balancedCutoff)} />
                  </label>
                  <label>
                    {copy.cutoff}
                    <input type="number" min={0} step={0.1} value={Number((cutoff.balancedCutoff * 100).toFixed(2))} onChange={(event) => updateCutoff(platform, cutoff.sampleFloor, Number(event.target.value) / 100)} />
                  </label>
                </div>
              </div>
            );
          })}
        </section>
        <button className="text-button" onClick={() => void patch({ enabled: true, sensitivity: "balanced", platforms: { youtube: true, tiktok: true, instagram: true }, filterGrids: false, showSkipChip: true, allowlist: [], advanced: null })}>{copy.reset}</button>
        <p className="privacy">{copy.privacy}</p>
        <a className="star" href={copy.repo} target="_blank" rel="noreferrer">{copy.star}</a>
      </div>
    </main>
  );

  function updateCutoff(platform: Platform, sampleFloor: number, balancedCutoff: number) {
    if (!Number.isFinite(sampleFloor) || !Number.isFinite(balancedCutoff)) return;
    void patch({
      advanced: {
        ...(settings.advanced ?? {}),
        [platform]: { sampleFloor, balancedCutoff },
      },
    });
  }
}
