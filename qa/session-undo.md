# Browser-session Undo · 0.3.5

Checked 2026-10-08 KST, macOS ARM64, built Chrome MV3 extension.

## Reproduced defect

The spec promises that Undo keeps a video for the browser session. In 0.3.4 the keep-set lived in one content-script document. Reloading cleared it and the same low-like video was skipped again. The existing test added a saved creator before reloading, which masked this defect.

A regression that reloads with an empty creator allowlist failed all five built adapter paths on 0.3.4: YouTube Shorts, TikTok For You, Following and direct video, and Instagram Reels. Local before-failure logs and screenshots are retained under `qa/tmp/undo-session-035/before-test-results`.

## Resulting behavior

The background commits an Undo choice to trusted-only `chrome.storage.session` before retreating. Each site receives only its own ids through the extension's message broker. Revisioned broadcasts share choices across current tabs; new documents load the same RAM snapshot before judging a video. Older delayed messages are ignored. No additional permissions or dependencies were added.

Choices survive reloads, new tabs and stricter rules, and clear on Reset or browser restart. Reset preserves saved creators and today's count. Video ids never enter `chrome.storage.local`. [Chrome documents session storage as memory-only and cleared by browser restart or extension reload/update/disable](https://developer.chrome.com/docs/extensions/reference/api/storage#property-session).

## Verification

- 44 unit tests, including commit-before-retreat and local Undo fallback after a failed session write.
- 23 browser tests. All five formerly failing paths now pass reload/new-tab/Strict/Reset checks. Twelve concurrent writes across two sites are retained; only settings/dailySkips exist in persistent local storage. Closing and reopening the actual test browser with the same isolated profile clears session choices and preserves local state.
- Typecheck, production ZIP and package/permission checks pass. Every extracted ZIP entry matches the tested build.
- Fresh EN/KO captures: popup 320×356 at 1x/2x, 360px settings without horizontal overflow, updated privacy footer without overlap; page errors empty. Locale override checks layouts/translations, not every OS's locale selection.

## Actual YouTube check

The exact ZIP was loaded in a new isolated signed-out Chrome for Testing profile. Started `2026-10-07T15:06:23.261Z`, finished `2026-10-07T15:06:59.333Z` (October 8 KST). Defaults remained unchanged.

An 807-like Short (`vStq3Y9i41o`) automatically advanced to `AkOsp2_8kus` and showed the 807-like reason chip. Undo restored the original; it stayed for 3.5 seconds, then through a normal reload and eight more seconds. The count stayed at 1, the creator allowlist stayed empty, and collected page errors were empty. Screenshot after reload still shows 807 likes. Playback after reload was paused by the site; this establishes retained video/filter state, not autoplay behavior.

Raw report, three screenshots and actual recording stay in `qa/tmp/undo-session-035/live`, outside the public repository. This short signed-out run does not establish signed-in 0.3.5 Instagram/TikTok compatibility, a full 24-hour pass, or ordinary human day-use. The prior 0.3.4 long run also cannot establish unchanged stability for the new runtime. See [release readiness](release-readiness.md).

Artifact: `scrollplus-0.3.5-chrome.zip`, 125,829 bytes, SHA-256 `2404780bd90de021f335551c35c03b8476ed6be214945ca21f553cc864f966fa`.
