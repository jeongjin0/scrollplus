# Release readiness · 0.3.1

Checked on 2026-10-07, macOS ARM64, built Chrome MV3 extension. This is a GitHub beta candidate. Chrome Web Store submission is still pending; signed-in Instagram support is not release-verified.

| Check | Result | Evidence / scope |
| --- | --- | --- |
| TypeScript | Pass | `npm run compile` |
| Unit tests | 42 passed | `npm test`; rules, parsing, extraction, engine regressions |
| Browser tests | 10 passed | `npm run test:e2e`; actual built scripts on controlled fixtures, popup/settings, concurrent storage writes |
| Package | Pass | `npm run zip` and `node scripts/check-package.mjs`; MV3, Chrome 120+, storage permission, three host permissions, localized strings, entry files, icon bytes and image dimensions |
| Dependencies | Pass | `npm audit` reported 0 vulnerabilities; this version changes no dependency versions |
| UI | Pass for the checked flows | [Screenshot audit](ui-audit.md); EN/KO, popup 1x/2x, narrow settings, keyboard editing |
| YouTube default rule | Pass in one live run | 15 Shorts in 90 seconds; two below 5,000 likes, both skipped; no page errors |
| YouTube Undo | Pass in one live run | A 523-like Short was skipped, then restored by the chip; stayed for four seconds; stored skip count was 1 |
| TikTok default rule, signed out | Limited pass | Six sampled items; one at 3,681 likes was skipped with a reason chip. Login overlay limited the run |
| TikTok runtime error | Reproduced without extension | `a.init is not a function` at the same TikTok login-bundle location in a fresh 90-second no-extension control. It does not require the extension to occur; the site overlay still limits signed-out QA |
| Instagram signed out | Pass for fail-open | Reels redirected to login; no filtering was claimed |
| Instagram signed in | Pending | No signed-in session available in the checked browsers. Synthetic adapter tests do not verify the site's current signed-in DOM |
| TikTok signed-in For You | Pending | No signed-in session available in the checked browsers |
| Chrome Web Store | Not submitted | [Listing and submission checklist](../store/submission-checklist.md) prepared |

## Artifact

`scrollplus-0.3.1-chrome.zip`, 122,924 bytes.

SHA-256: `7389e2e8874e16ae3b410b01cd602d0f263420ddcbca0821839cd08d05179f8a`.

This identifies the local tested package. A separately built CI artifact can differ in ZIP metadata; do not substitute its checksum without checking it.

## Remaining release gates

1. In an existing owner-authorized signed-in Instagram browser, verify actual Reels count extraction, automatic advance, Undo, missing counts, a kept creator, and navigating away/back. Record the current markup and fix the adapter if necessary.
2. Repeat the default rule on signed-in TikTok For You. The signed-out login-bundle error was reproduced without the extension, but that does not verify signed-in playback or filtering.
3. Install this ZIP in a clean Chrome profile and use it on an ordinary feed for a day. The short live runs establish working paths, not long-term reliability or compatibility with every experiment the sites run.
4. After these checks, update this report and the listing's experimental-support wording. Store submission remains an owner decision.

Detailed live observations and local recording locations are in [live-smoke.md](live-smoke.md). Fresh profiles and recordings under `qa/tmp/` are local QA evidence and are not committed or served wholesale.
