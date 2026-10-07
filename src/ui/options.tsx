import { DEFAULT_SETTINGS, ruleFor, type Platform } from "../lib/score";
import { Knob, Mark, Master, SensitivityControl } from "./controls";
import { Icon } from "./icons";
import { useKeptState } from "./state";

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
            const rule = ruleFor(settings, platform);
            const custom = settings.advanced?.[platform] != null;
            return (
              <article className={settings.platforms[platform] ? "panel" : "panel off"} key={platform}>
                <div className="row">
                  <h3 className="id"><Icon name={platform === "instagram" ? "reels" : platform} />{copy.platform[platform]}</h3>
                  <button type="button" className="switch" role="switch" aria-checked={settings.platforms[platform]} aria-label={copy.platform[platform]} onClick={() => void patch({ platforms: { ...settings.platforms, [platform]: !settings.platforms[platform] } })}>
                    <Knob on={settings.platforms[platform]} />
                  </button>
                </div>
                <p className="rule">{copy.liveRule(formatCount(rule.sampleFloor), formatCount(rule.minLikes))}</p>
                <div className="fields">
                  <label>
                    {copy.sampleFloor}
                    <input type="number" min={0} step={1} value={rule.sampleFloor} onChange={(event) => updateRule(platform, event.target.value, "floor")} />
                  </label>
                  <label>
                    {copy.cutoff}
                    <input type="number" min={0} step={1} value={rule.minLikes} onChange={(event) => updateRule(platform, event.target.value, "likes")} />
                  </label>
                </div>
                {custom ? <button type="button" className="text-button" onClick={() => clearPlatform(platform)}>{copy.useDefault}</button> : null}
              </article>
            );
          })}
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
        <button className="text-button" onClick={() => void patch({ ...DEFAULT_SETTINGS, platforms: { ...DEFAULT_SETTINGS.platforms } })}>{copy.reset}</button>
        <p className="privacy">{copy.privacy}</p>
        <a className="star icon-link" href={copy.repo} target="_blank" rel="noreferrer"><Icon name="star" />{copy.star}</a>
      </div>
    </main>
  );

  function updateRule(platform: Platform, raw: string, field: "floor" | "likes") {
    if (raw.trim() === "") return;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) return;
    const current = settings.advanced?.[platform] ?? {};
    const next = field === "floor" ? { ...current, sampleFloor: value } : { ...current, minLikes: value };
    void patch({
      advanced: {
        ...(settings.advanced ?? {}),
        [platform]: next,
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
