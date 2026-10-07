import { useState } from "react";
import { PLATFORMS, REPO_URL, activePreset, presetRule, type PresetName } from "../lib/score";
import { t } from "../lib/i18n";
import { Hero, Icon, Mark, PowerButton, PresetControl, Row, StarLink, Wordmark } from "./kit";
import { SITES, useFilterState } from "./state";

export function PopupApp() {
  const { settings, ready, skips, active, update, allowCurrent } = useFilterState();
  const [kept, setKept] = useState(false);
  const preset = activePreset(settings.rule);
  const labels: Record<PresetName, string> = { lenient: t("presetLenient"), balanced: t("presetBalanced"), strict: t("presetStrict") };
  const classes = ["popup", ready ? "ready" : "", settings.enabled ? "" : "paused"].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <header className="bar">
        <div className="brand">
          <Mark size={24} />
          <Wordmark />
        </div>
        <PowerButton on={settings.enabled} label={settings.enabled ? t("powerOn") : t("powerOff")} onChange={(enabled) => update((current) => ({ ...current, enabled }))} />
      </header>
      <div className="body">
        <Hero count={skips} />
        <PresetControl value={preset} labels={labels} onChange={(name) => update((current) => ({ ...current, rule: presetRule(name, current.rule) }))} />
        <div className="card">
          {PLATFORMS.map((platform) => (
            <Row
              key={platform}
              icon={SITES[platform].icon}
              title={SITES[platform].name}
              on={settings.platforms[platform]}
              label={SITES[platform].name}
              onToggle={(next) => update((current) => ({ ...current, platforms: { ...current.platforms, [platform]: next } }))}
            />
          ))}
        </div>
        {active?.creatorId ? (
          <button type="button" className="action" disabled={kept} onClick={() => void allowCurrent().then(() => setKept(true))}>
            <Icon name={kept ? "check" : "user"} size={14} />
            {kept ? t("creatorKept") : t("keepCreator")}
          </button>
        ) : null}
        {active?.platform === "instagram" && active.instagramSignedOut ? <p className="note">{t("signedOut")}</p> : null}
      </div>
      <footer className="foot">
        <button type="button" className="link" onClick={() => void chrome.runtime.openOptionsPage()}>
          <Icon name="sliders" size={14} />
          {t("settings")}
          {preset ? null : <span className="badge">{t("custom")}</span>}
        </button>
        <StarLink href={REPO_URL} />
      </footer>
    </div>
  );
}

