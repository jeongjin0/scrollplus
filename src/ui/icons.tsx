import type { ReactNode } from "react";

export type IconName = "youtube" | "tiktok" | "reels" | "heart" | "comment" | "share" | "save" | "grid" | "chip" | "sliders" | "star";

export function Icon(props: { name: IconName }) {
  return (
    <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
      {shapes[props.name]}
    </svg>
  );
}

const shapes: Record<IconName, ReactNode> = {
  youtube: <><rect x="4.2" y="2.2" width="7.6" height="11.6" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M7.3 5.6v4.8l3.4-2.4-3.4-2.4Z" fill="currentColor" /></>,
  tiktok: <path d="M6.2 13a2 2 0 1 1-1.5-1.9V4h1.6c.5 1.5 1.6 2.4 3.1 2.6V8c-.7 0-1.4-.2-2-.6v5.6Z" fill="currentColor" />,
  reels: <path d="M3 3.2h10v9.6H3V3.2Zm0 3.2h10M3 9.6h10M6 3.2v9.6M10 3.2v9.6" fill="none" stroke="currentColor" strokeWidth="1.4" />,
  heart: <path d="M8 13s-4.8-3.1-4.8-6A2.5 2.5 0 0 1 8 5.4 2.5 2.5 0 0 1 12.8 7C12.8 9.9 8 13 8 13Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />,
  comment: <path d="M3 3.2h10v6.6H6.4L3 12.4V3.2Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />,
  share: <path d="M8 2.6v7M5.2 5.2 8 2.6l2.8 2.6M3.4 8.2v4h9.2v-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />,
  save: <path d="M4 2.6h8v10.6L8 10.6 4 13.2V2.6Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />,
  grid: <path d="M3 3h4.2v4.2H3V3Zm5.8 0H13v4.2H8.8V3ZM3 8.8h4.2V13H3V8.8Zm5.8 0H13V13H8.8V8.8Z" fill="currentColor" />,
  chip: <path d="M3 6.2h10v3.6H3V6.2ZM5.2 6.2V4.4M8 6.2V4.4M10.8 6.2V4.4M5.2 9.8v1.8M8 9.8v1.8M10.8 9.8v1.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />,
  sliders: <path d="M2.8 4.2h10.4M2.8 8h10.4M2.8 11.8h10.4M6 2.8v2.8M10.2 6.6V9.4M7.2 10.4v2.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />,
  star: <path d="m8 2.2 1.4 3.1 3.4.4-2.5 2.3.7 3.4L8 9.8 4.9 11.4l.7-3.4L3.2 5.7l3.4-.4L8 2.2Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />,
};
