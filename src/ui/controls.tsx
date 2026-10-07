import type { Platform, Sensitivity } from "../lib/score";
import { Icon, type IconName } from "./icons";

const SENSITIVITIES: Sensitivity[] = ["lenient", "balanced", "strict"];
const PLATFORMS: Platform[] = ["youtube", "tiktok", "instagram"];
const PLATFORM_ICON: Record<Platform, IconName> = { youtube: "youtube", tiktok: "tiktok", instagram: "reels" };
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

export function Knob(props: { on: boolean }) {
  return <span className={props.on ? "knob on" : "knob"} aria-hidden="true" />;
}

export function SiteRows(props: { enabled: Record<Platform, boolean>; labels: Record<Platform, string>; detail: Record<Platform, string>; onToggle: (platform: Platform) => void }) {
  return (
    <div className="sites" role="group">
      {PLATFORMS.map((platform) => (
        <button key={platform} type="button" className={props.enabled[platform] ? "row-switch on" : "row-switch"} role="switch" aria-checked={props.enabled[platform]} onClick={() => props.onToggle(platform)}>
          <span className="id">
            <Icon name={PLATFORM_ICON[platform]} />
            <span>
              <strong>{props.labels[platform]}</strong>
              <small>{props.detail[platform]}</small>
            </span>
          </span>
          <Knob on={props.enabled[platform]} />
        </button>
      ))}
    </div>
  );
}
