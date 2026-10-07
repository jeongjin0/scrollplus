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

## Official Google Chrome 154 check

The same exact package was also checked through the native UI in official Google Chrome `154.0.8037.58` (ARM64) on Mini, without restarting the existing browser or changing its launch flags. A new task-owned window used the existing profile; YouTube showed its signed-out UI.

At `2026-10-07T15:50:42.608Z`, the original Short `vStq3Y9i41o` had 986 likes and automatically advanced to `1Y6inizc2Ug` (displayed 130K likes). The reason chip read `넘김 · 좋아요 986`. Clicking its Undo restored the original. The fresh default settings still showed 5,000 likes, an empty creator allowlist and 4 skips: earlier visits had skipped the same original while attempts to capture the brief chip missed it.

A normal refresh at `15:55:02.106Z` retained the original through `15:55:24.173Z`, now with 997 likes and visibly playing. Settings still showed 4 skips and no saved creators. Reset preserved the count at 4; on returning to YouTube, default filtering resumed, with a later 2.2K-like reason chip and a 7.8K-like current video. The intervening reset transitions were not fully sampled, so this is not an exact per-video reset trace.

Instagram Reels in a separate task tab redirected to login. TikTok briefly loaded videos before showing sign-up/interests UI; no complete skip/Undo result or signed-in compatibility is claimed for either site here. No login, account creation or social engagement occurred in this native check.

The temporary unpacked ScrollPlus installation was removed afterward, Developer Mode was restored to OFF, the pre-existing Google Docs Offline extension remained enabled, and only the task's window was closed. The original browser process and its three tabs remained. Local native observation notes are retained under `qa/tmp/undo-session-035/native-chrome-154`. AX/screenshot observations establish the behavior above; there was no native recording exported or page-error collector in this check. This is a short official-Chrome YouTube check, not ordinary day-use or a 24-hour pass.

Artifact: `scrollplus-0.3.5-chrome.zip`, 125,829 bytes, SHA-256 `2404780bd90de021f335551c35c03b8476ed6be214945ca21f553cc864f966fa`.
