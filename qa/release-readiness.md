# Release readiness · 0.3.5

Checked on 2026-10-08 KST, macOS ARM64, built Chrome MV3 extension. The 0.3.5 package fixes session-wide Undo and Reset. Exact-ZIP real YouTube checks pass in isolated Chrome for Testing and official Chrome 154; historical signed-in 0.3.3/0.3.4 checks below are not new 0.3.5 evidence. Broader compatibility, exact-version long QA and ordinary day-use remain open. Chrome Web Store submission has not occurred.

| Check | Result | Evidence / scope |
| --- | --- | --- |
| TypeScript | Pass | `npm run compile` |
| Unit tests | 44 passed | `npm test`; rules, parsing, extraction, engine regressions |
| Browser tests | 23 passed | `npm run test:e2e`; native fetch/XHR contracts, grid restoration, TikTok preview exclusion and Following/video-route coverage, actual built scripts on controlled fixtures, popup/settings, concurrent storage writes, navigation-safe QA and bounded feed recovery; Undo reload/new-tab/Strict/Reset on five adapter routes, concurrent RAM writes and actual browser restart |
| Minimum Chrome 120 | 23 passed on Linux | [Compatibility checks](chrome-compatibility.md); official Chrome for Testing 120.0.6099.109 runs the same suite in CI. Controlled fixtures establish the checked runtime/UI behavior; current signed-in websites and Chrome 120 on macOS 27 are not established |
| Grid restoration regression | Pass | [Before/after evidence](grid-filtering.md); cards return after lowering the minimum or disabling optional grid filtering; host-hidden cards are preserved |
| Network observer regression | Pass | [Before/after evidence](network-observer.md); reused XHR no longer loses/duplicates responses; relative feed requests reach the built TikTok adapter |
| Package | Pass | `npm run zip` and `node scripts/check-package.mjs`; MV3, Chrome 120+, storage permission, three host permissions, localized strings, entry files, icon bytes and image dimensions |
| Dependencies | Pass | `npm audit` reported 0 vulnerabilities; this version changes no dependency versions |
| UI | Pass for the checked flows | [Screenshot audit](ui-audit.md), plus fresh 0.3.5 EN/KO captures: popup 320×356 at 1x/2x, narrow settings without overflow, updated privacy footer; page errors empty |
| YouTube default rule | Pass in one 0.3.2 live run | 17 Shorts in 90 seconds; four below 5,000 likes (703, 244, 2,668, 818), all skipped with reason chips; no page errors |
| YouTube Undo and reload | Pass in one exact-0.3.5-ZIP live run | [Session regression](session-undo.md): 807-like Short skipped at 5,000, Undo restored it, fresh reload kept it for eight seconds, count stayed 1, empty creator allowlist and no page errors |
| Official Chrome 154 YouTube | Pass for a short signed-out native check | [Native check](session-undo.md#official-google-chrome-154-check): 986-like default skip and Undo, same video at 997 likes retained after normal refresh, count stayed 4 and no saved creators; Reset resumed filtering. Existing browser was not restarted; temporary extension and Developer Mode were restored afterward. No native page-error collector or day-use result |
| TikTok default rule, signed out | Limited pass in one exact-0.3.5-ZIP run | [Live smoke](live-smoke.md): six known-like items; 3,827-like video skipped automatically to an 8,429-like video with the reason chip, no collected page errors. A signup Terms dialog limited useful feed observation to about 30 seconds; no Undo or signed-in result |
| TikTok custom comments/views, Undo and kept creator | Pass for recorded 0.3.2 signed-out paths | [Live boundary checks](live-smoke.md); 686 comments and 3.6M views, equal minimum stays, below minimum skips, Undo restores, kept creator survives fresh page. Active-player code unchanged in 0.3.3 |
| TikTok runtime error | Reproduced without extension | `a.init is not a function` at the same TikTok login-bundle location in a fresh 90-second no-extension control. It does not require the extension to occur; the site overlay still limits signed-out QA |
| Instagram signed out | Pass for fail-open | Reels redirected to login; no filtering was claimed |
| Instagram signed in | Pass for recorded 0.3.3 paths | [Signed-in QA](signed-in-smoke.md): default, counts/navigation, Undo, persisted creator, Reset, away/back and missing views; actual Aside Chromium 153 |
| TikTok signed-in For You | Pass for recorded 0.3.3 paths | [Signed-in QA](signed-in-smoke.md): 2,639-like default skip, Undo, creator, identified Strict skip and low-like ads kept; actual Aside Chromium 153 |
| TikTok preview exclusion and video-page skip/Undo | Pass for recorded 0.3.4 paths | [Preview regression and live check](tiktok-previews.md): actual Following recommendation preview has no current creator and no skips; 2,660-like video skips at default, Undo restores the same video |
| TikTok signed-in Following feed | Not established live | The existing account showed creator recommendations instead of a video feed. Positive feed paths are covered by built-script fixtures; no account engagement was used to create a feed |
| 24-hour YouTube default-rule QA | Exact 0.3.5 result pending | [Long feed QA](soak.md); historical 0.3.4 worker was stopped as superseded after about 2h1m, with explicit interrupted-report annotations. Its midnight rollover was observed. The exact 0.3.5 successor started October 8 at 00:11 KST and ends October 9 at 00:11 KST. No 24-hour pass or ordinary day-use claimed |
| Chrome Web Store | Not submitted | [Listing and submission checklist](../store/submission-checklist.md) prepared |

## Artifact

`scrollplus-0.3.5-chrome.zip`, 125,829 bytes.

SHA-256: `2404780bd90de021f335551c35c03b8476ed6be214945ca21f553cc864f966fa`.

This identifies the local tested package. A separately built CI artifact can differ in ZIP metadata; do not substitute its checksum without checking it.

## Remaining release gates

1. Run and review the exact 0.3.5 [24-hour YouTube check](soak.md), including errors, counters and continued movement. The older version cannot establish stability for changed runtime scripts. Duration alone is not a pass.
2. Check a genuine signed-in Following video feed when available; the recommendation-card check does not establish automatic skipping on that feed.
3. Install this ZIP in a clean Chrome profile and use it on an ordinary feed for a day. Short signed-in runs in Aside establish working paths, not long-term reliability or signed-in Google Chrome compatibility with every experiment the sites run.
4. After these checks, update this report and the listing's experimental-support wording. Store submission remains an owner decision.

Detailed live observations and local recording locations are in [live-smoke.md](live-smoke.md). Fresh profiles and recordings under `qa/tmp/` are local QA evidence and are not committed or served wholesale.
