import type { Platform, Sensitivity, Settings } from "../lib/score";

const SENSITIVITIES: Sensitivity[] = ["lenient", "balanced", "strict"];
const PLATFORMS: Platform[] = ["youtube", "tiktok", "instagram"];

export function Mark() {
  return <span className="mark" aria-hidden="true" />;
}

export function Master(props: { enabled: boolean; onLabel: string; offLabel: string; onToggle: () => void }) {
  return (
    <button className={props.enabled ? "master on" : "master"} aria-pressed={props.enabled} onClick={props.onToggle}>
      {props.enabled ? props.onLabel : props.offLabel}
    </button>
  );
}

export function SensitivityControl(props: { value: Sensitivity; labels: Record<Sensitivity, string>; onChange: (value: Sensitivity) => void }) {
  return (
    <div className="segment" role="radiogroup">
      {SENSITIVITIES.map((item) => (
        <button key={item} role="radio" aria-checked={props.value === item} className={props.value === item ? "selected" : ""} onClick={() => props.onChange(item)}>
          {props.labels[item]}
        </button>
      ))}
    </div>
  );
}

export function PlatformSwitches(props: { settings: Settings; labels: Record<Platform, string>; onToggle: (platform: Platform) => void }) {
  return (
    <div className="platforms">
      {PLATFORMS.map((platform) => (
        <button key={platform} className="switch" role="switch" aria-checked={props.settings.platforms[platform]} onClick={() => props.onToggle(platform)}>
          <span>{props.labels[platform]}</span>
          <span className={props.settings.platforms[platform] ? "track on" : "track"} />
        </button>
      ))}
    </div>
  );
}
