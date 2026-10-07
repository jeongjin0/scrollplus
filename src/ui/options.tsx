import { DEFAULT_SETTINGS, DEFAULT_SIGNALS, cutoffFor, effectiveLimit, type Platform } from "../lib/score";
import { Knob, Mark, Master, SensitivityControl, SignalChips } from "./controls";
import { Icon } from "./icons";
import { formatPercent, useKeptState } from "./state";

const PLATFORMS: Platform[] = ["youtube", "tiktok", "instagram"];

export function OptionsApp() {
  const { settings, skips, active, copy, patch, allowCurrent } = useKeptState();
  return (
    <main className="options">
      <div className="sheet">
        <header className="top">
          <Mark />
          <div>
            <h1>Kept</h1>
            <p className="note">{copy.lead}</p>
          </div>
        </header>
        <Master enabled={settings.enabled} onLabel={copy.on} offLabel={copy.off} onToggle={() => void patch({ enabled: !settings.enabled })} />
        <SensitivityControl
          value={settings.sensitivity}
          labels={{ lenient: copy.lenient, balanced: copy.balanced, strict: copy.strict }}
          onChange={(sensitivity) => void patch({ sensitivity })}
        />
        <p className="note">{copy.presetNote}</p>
        <p className="count">{copy.skippedToday(skips)}</p>
        <section className="stack">
          <h2>{copy.conditions}</h2>
          {PLATFORMS.map((platform) => {
            const cutoff = cutoffFor(settings, platform);
            const custom = settings.advanced?.[platform] != null;
            const likes = Math.max(1, Math.round(effectiveLimit(settings, platform) * 1000));
            return (
              <article className={settings.platforms[platform] ? "panel" : "panel off"} key={platform}>
                <div className="row">
                  <h3 className="id"><Icon name={platform === "instagram" ? "reels" : platform} />{copy.platform[platform]}</h3>
                  <button type="button" className="switch" role="switch" aria-checked={settings.platforms[platform]} aria-label={copy.platform[platform]} onClick={() => void patch({ platforms: { ...settings.platforms, [platform]: !settings.platforms[platform] } })}>
                    <Knob on={settings.platforms[platform]} />
                  </button>
                </div>
                <p className="rule">{copy.liveRule(formatCount(cutoff.sampleFloor), formatPercent(effectiveLimit(settings, platform)))}</p>
                <p className="note">{copy.perThousand(likes)}</p>
                <div className="fields">
                  <label>
                    {copy.sampleFloor}
                    <input type="number" min={0} value={cutoff.sampleFloor} onChange={(event) => updateCutoff(platform, event.target.value, cutoff.balancedCutoff, "floor")} />
                  </label>
                  <label>
                    {copy.cutoff}
                    <input type="number" min={0} step={0.1} value={Number((cutoff.balancedCutoff * 100).toFixed(2))} onChange={(event) => updateCutoff(platform, event.target.value, cutoff.sampleFloor, "bar")} />
                  </label>
                </div>
                {custom ? <button type="button" className="text-button" onClick={() => clearPlatform(platform)}>{copy.useDefault}</button> : null}
              </article>
            );
          })}
        </section>
        <section className="panel">
          <h2>{copy.reactions}</h2>
          <p className="note">{copy.reactionNote}</p>
          <SignalChips
            signals={settings.signals}
            labels={copy.signal}
            onToggle={(signal) => void patch({ signals: { ...settings.signals, [signal]: !settings.signals[signal] } })}
          />
        </section>
        <div className="choices">
          <button type="button" className={settings.filterGrids ? "signal on" : "signal"} aria-pressed={settings.filterGrids} onClick={() => void patch({ filterGrids: !settings.filterGrids })}><Icon name="grid" />{copy.filterGrids}</button>
          <button type="button" className={settings.showSkipChip ? "signal on" : "signal"} aria-pressed={settings.showSkipChip} onClick={() => void patch({ showSkipChip: !settings.showSkipChip })}><Icon name="chip" />{copy.showChip}</button>
        </div>
        {active?.creatorId ? <button className="text-button" onClick={() => void allowCurrent()}>{copy.keepCreator}</button> : null}
        {active?.platform === "instagram" && active.instagramSignedOut ? <p className="note">{copy.signedOut}</p> : null}
        <section className="panel">
          <h2>{copy.allowlist}</h2>
          {settings.allowlist.length === 0 ? <p className="note">{copy.allowEmpty}</p> : settings.allowlist.map((entry) => (
            <div className="allow" key={entry.platform + entry.id}>
              <span>{copy.short[entry.platform]} · {entry.id}</span>
              <button className="text-button" onClick={() => void patch({ allowlist: settings.allowlist.filter((item) => item.platform !== entry.platform || item.id !== entry.id) })}>{copy.remove}</button>
            </div>
          ))}
        </section>
        <button className="text-button" onClick={() => void patch({ ...DEFAULT_SETTINGS, signals: { ...DEFAULT_SIGNALS }, platforms: { ...DEFAULT_SETTINGS.platforms } })}>{copy.reset}</button>
        <p className="privacy">{copy.privacy}</p>
        <a className="star icon-link" href={copy.repo} target="_blank" rel="noreferrer"><Icon name="star" />{copy.star}</a>
      </div>
    </main>
  );

  function updateCutoff(platform: Platform, raw: string, other: number, field: "floor" | "bar") {
    if (raw.trim() === "") return;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) return;
    const current = cutoffFor(settings, platform);
    const sampleFloor = field === "floor" ? value : current.sampleFloor;
    const balancedCutoff = field === "bar" ? value / 100 : other;
    void patch({
      advanced: {
        ...(settings.advanced ?? {}),
        [platform]: { sampleFloor, balancedCutoff },
      },
    });
  }

  function clearPlatform(platform: Platform) {
    const next = { ...(settings.advanced ?? {}) };
    delete next[platform];
    void patch({ advanced: Object.keys(next).length ? next : null });
  }
}

function formatCount(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}
