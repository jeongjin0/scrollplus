# Changelog

## 0.3.1 – 2026-10-07

- Undo remembers the skipped video after the next item becomes active. Settings changes apply to the current video, and Continue/Lower still work after a long pause.
- Timely counts remain usable after writing a comment. Polling preserves focus on skip-chip buttons.
- Escape cancels number edits; invalid numbers get an inline error. Switches have larger click targets, rule rows reflow in narrow settings windows, and controls have distinct accessible names.
- Compact numbers follow the actual localized labels, even when Chrome's reported UI language differs from the locale used for messages.
- Creator keep confirmations wait for storage, and an already-kept creator is shown correctly when reopening the popup.
- Ads flagged by TikTok or Instagram are kept; zero views are retained as a known count. Cross-frame and malformed advance messages are ignored.
- The background serializes daily counter updates across tabs; an open settings page refreshes at midnight. The manifest enforces Chrome 120+.
- Built-adapter regression coverage, package and asset checks, reproducible bilingual UI captures, refreshed listing copy, and English/Korean marquee images.
- Signed-in Instagram and TikTok still require live QA. Store submission remains pending.

## 0.3.0 – 2026-10-07

- Renamed to ScrollPlus.
- TikTok now actually moves to the next video. Before, the click and key press came from the extension's isolated world, which TikTok ignores, and the For You feed exposed no video id. The click now comes from the page script, For You ids are read from the player wrapper, and a move is detected by the feed item on screen.
- Instagram uses the same page-script click. It could not be tested signed in, so it stays unverified.
- A freshly loaded page judges its first video until 6 seconds after load, because counts arrive late there.
- Development dependencies updated; `npm audit` reports no vulnerabilities. CI now also runs the browser tests.

## 0.2.0 – 2026-10-07

- The rule is a plain like count. Presets: Lenient 1K, Balanced 5K (default), Strict 20K. Settings can also turn on a minimum for comments or views.
- New popup, settings page, skip chip that says why, and icon. English and Korean, with numbers shown the way each language writes them.
- YouTube Shorts: clicking Next from the page script, the skip chip stays on screen after the move.

## 0.1.0 – 2026-10-06

- First prototype with a weighted engagement rate and Lenient, Balanced, and Strict presets.
