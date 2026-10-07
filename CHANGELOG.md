# Changelog

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
