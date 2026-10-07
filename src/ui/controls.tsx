import type { Platform, Sensitivity, Signal, Signals } from "../lib/score";

const SENSITIVITIES: Sensitivity[] = ["lenient", "balanced", "strict"];
const PLATFORMS: Platform[] = ["youtube", "tiktok", "instagram"];
export const SIGNALS: Array<{ id: Signal; weight: number }> = [
  { id: "likes", weight: 1 },
  { id: "comments", weight: 3 },
  { id: "shares", weight: 4 },
  { id: "saves", weight: 4 },
];

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

export function SiteChips(props: { enabled: Record<Platform, boolean>; labels: Record<Platform, string>; onToggle: (platform: Platform) => void }) {
  return (
    <div className="sites" role="group">
      {PLATFORMS.map((platform) => (
        <button key={platform} type="button" className={props.enabled[platform] ? "site on" : "site"} aria-pressed={props.enabled[platform]} onClick={() => props.onToggle(platform)}>
          {props.labels[platform]}
        </button>
      ))}
    </div>
  );
}

export function SignalChips(props: { signals: Signals; labels: Record<Signal, string>; onToggle: (signal: Signal) => void }) {
  return (
    <div className="signals" role="group">
      {SIGNALS.map((signal) => (
        <button key={signal.id} type="button" className={props.signals[signal.id] ? "signal on" : "signal"} aria-pressed={props.signals[signal.id]} onClick={() => props.onToggle(signal.id)}>
          {props.labels[signal.id]}
          <span>×{signal.weight}</span>
        </button>
      ))}
    </div>
  );
}
