import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ICONS, type IconName } from "../lib/icons";
import { formatCount, parseCount, stepValue } from "../lib/numbers";
import { PRESETS, PRESET_LIKES, type PresetName } from "../lib/score";
import { t } from "../lib/i18n";

export function Icon(props: { name: IconName; size?: number }) {
  const size = props.size ?? 16;
  return (
    <svg className="icon" viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[props.name].map((shape, index) => {
        if (shape.t === "path") return <path key={index} d={shape.d} fill={shape.fill ? "currentColor" : undefined} stroke={shape.fill ? "none" : undefined} />;
        if (shape.t === "rect") return <rect key={index} x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.r} />;
        return <circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} fill={shape.fill ? "currentColor" : undefined} />;
      })}
    </svg>
  );
}

export function Mark(props: { size?: number }) {
  const size = props.size ?? 22;
  return (
    <svg className="mark" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <rect width="24" height="24" rx="7" fill="#FF4D2E" />
      <path d="M7 18V8.6A1.6 1.6 0 0 1 8.6 7h6.8A1.6 1.6 0 0 1 17 8.6V18" fill="none" stroke="#10110F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="1.6" fill="#10110F" />
    </svg>
  );
}

export function Switch(props: { on: boolean; label: string; onChange: (next: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={props.on} aria-label={props.label} disabled={props.disabled} className={props.on ? "switch on" : "switch"} onClick={(event) => {
      event.stopPropagation();
      props.onChange(!props.on);
    }}>
      <span className="thumb" />
    </button>
  );
}

export function PowerButton(props: { on: boolean; label: string; text?: string; onChange: (next: boolean) => void }) {
  return (
    <button type="button" className={(props.on ? "power on" : "power") + (props.text ? " wide" : "")} aria-pressed={props.on} aria-label={props.label} title={props.label} onClick={() => props.onChange(!props.on)}>
      <Icon name="power" size={16} />
      {props.text ? <span>{props.text}</span> : null}
    </button>
  );
}

export function Tile(props: { name: IconName; active?: boolean }) {
  return (
    <span className={props.active === false ? "tile off" : "tile"}>
      <Icon name={props.name} size={16} />
    </span>
  );
}

export function Row(props: { icon: IconName; title: ReactNode; on?: boolean; onToggle?: (next: boolean) => void; label: string; children?: ReactNode }) {
  return (
    <div className="row" role={props.onToggle ? "group" : undefined}>
      <Tile name={props.icon} active={props.on} />
      <span className="row-title">{props.title}</span>
      {props.children}
      {props.onToggle ? <Switch on={Boolean(props.on)} label={props.label} onChange={props.onToggle} /> : null}
    </div>
  );
}

export function PresetControl(props: { value: PresetName | null; labels: Record<PresetName, string>; onChange: (next: PresetName) => void }) {
  const index = props.value ? PRESETS.indexOf(props.value) : -1;
  const focusRef = useRef<Array<HTMLButtonElement | null>>([]);
  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const from = index < 0 ? 1 : index;
    const next = (from + (event.key === "ArrowRight" ? 1 : PRESETS.length - 1)) % PRESETS.length;
    props.onChange(PRESETS[next]);
    focusRef.current[next]?.focus();
  }
  return (
    <div className="presets" role="radiogroup" onKeyDown={onKey}>
      <span className="thumb-slide" style={{ transform: "translateX(" + Math.max(index, 0) * 100 + "%)", opacity: index < 0 ? 0 : 1 }} />
      {PRESETS.map((name, position) => (
        <button key={name} ref={(node) => { focusRef.current[position] = node; }} type="button" role="radio" title={t("presetTitle", formatCount(PRESET_LIKES[name]))} aria-checked={props.value === name} tabIndex={props.value === name || (index < 0 && position === 1) ? 0 : -1} className={props.value === name ? "preset on" : "preset"} onClick={() => props.onChange(name)}>
          <strong>{props.labels[name]}</strong>
          <span className="sub">
            <Icon name="heart" size={11} />
            {formatCount(PRESET_LIKES[name])}
          </span>
        </button>
      ))}
    </div>
  );
}

export function NumberStepper(props: { value: number; disabled?: boolean; label: string; onChange: (next: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  useEffect(() => setDraft(null), [props.value]);
  function commit() {
    if (draft == null) return;
    const parsed = parseCount(draft);
    setDraft(null);
    if (parsed != null && parsed !== props.value) props.onChange(parsed);
  }
  return (
    <div className={props.disabled ? "stepper disabled" : "stepper"}>
      <button type="button" className="step" aria-label={t("lessAria")} disabled={props.disabled} onClick={() => props.onChange(stepValue(props.value, -1))}>
        <Icon name="minus" size={14} />
      </button>
      <input
        className="amount"
        inputMode="numeric"
        aria-label={props.label}
        disabled={props.disabled}
        value={draft ?? formatCount(props.value)}
        onFocus={(event) => {
          setDraft(String(props.value));
          event.currentTarget.select();
        }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setDraft(null);
            event.currentTarget.blur();
          }
        }}
      />
      <button type="button" className="step" aria-label={t("moreAria")} disabled={props.disabled} onClick={() => props.onChange(stepValue(props.value, 1))}>
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}

export function StarLink(props: { href: string }) {
  return (
    <a className="star" href={props.href} target="_blank" rel="noreferrer">
      <Icon name="star" size={14} />
      {t("star")}
    </a>
  );
}

export function Hero(props: { count: number }) {
  return (
    <div className="hero" aria-live="polite">
      <span className="big">{props.count.toLocaleString()}</span>
      <span className="hero-label">{t("skippedToday")}</span>
    </div>
  );
}
