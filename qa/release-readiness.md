# Release readiness · 0.3.6

Checked on 2026-10-09 KST, macOS ARM64. This candidate removes repeated TikTok/Instagram feed-history messages and repeated parsing of unchanged embedded JSON. It also fixes missed Instagram count changes when a replacement payload has the same length and prefix, and keeps visibly disclosed Instagram advertisements and non-video feed cards (see [Instagram advertisement exclusion](instagram-ads.md)). Defaults, filtering rules, UI, permissions and dependencies are unchanged. Chrome Web Store submission has not occurred.

| Check | Result | Evidence / scope |
| --- | --- | --- |
| TypeScript | Pass | `npm run compile` |
| Unit tests | 45 passed | `npm test` |
| Built-script browser tests | 28 passed, no skips or flaky results | `npm run test:e2e`; includes two bridge/count-refresh regressions, three Instagram advertisement layouts (wide, compact, letterbox), existing adapter, grid, UI, storage, navigation and session Undo paths |
| Minimum Chrome 120 | Pending CI for the final commit | An earlier commit of this PR ([run](https://github.com/jeongjin0/scrollplus/actions/runs/37873994663)) passed 25 tests on official Chrome for Testing 120.0.6099.109 before the advertisement guard existed; it is not a result for this package. Current signed-in websites and Chrome 120 on macOS 27 are separate checks |
| Feed-history bridge | Pass on controlled pages | [Before/after report](feed-cache-performance.md): unchanged 5,000-item history causes zero extra cache/player messages over 2.5 seconds; 500 new items send 500 rows |
| Changed embedded counts | Pass on both adapters | Same-length/same-prefix likes change from 6,000 to 1,000 reaches the player and causes one default skip; exact published 0.3.5 fails the new regressions |
| Package | Pass | `npm run zip` and `node scripts/check-package.mjs`; MV3, Chrome 120+, storage and the existing three host permissions |
| Package scope | 14 of 20 extracted files identical to published 0.3.5 | The manifest, the TikTok/Instagram MAIN bundles and the three isolated site scripts changed (the shared engine and controller are bundled into each). Background, popup/settings, locales and icons are byte-identical. A YouTube Short is always a video, so the added same-id rule has no new YouTube behavior, but the YouTube bundle is not byte-identical. This does not upgrade earlier native or endurance evidence to exact-0.3.6 evidence |
| Current signed-in TikTok / Instagram | Pending exact-candidate native check | Existing [0.3.5 native observations](signed-in-smoke.md#version-035--2026-10-08) and earlier versions remain scoped to their original packages |
| Real YouTube and long-feed QA | Historical 0.3.5 result retained | [24-hour report](soak.md) completed with two reviewed page-reload recoveries; no exact-0.3.6 24-hour run or ordinary human day-use result |
| Chrome Web Store | Not submitted | [Submission checklist](../store/submission-checklist.md) prepared |

## Artifact

`scrollplus-0.3.6-chrome.zip`, 127,157 bytes.

SHA-256: `3d6325f8ab76539e791a52e9b6f31f4e577b9c1743d33ddabc510cc4ee71a994`.

This identifies the tested local candidate. CI ZIP metadata can differ. The previous exact-package checksum and its QA remain in [0.3.5 release readiness](release-readiness-035.md#artifact).

## Remaining release gates

1. Complete native checks of the changed TikTok/Instagram adapters. The current and minimum-Chrome suites pass on the runtime change in [PR CI](https://github.com/jeongjin0/scrollplus/actions/runs/37873994663). Broader signed-in Google Chrome, Instagram Undo/reload and a genuine Following video feed remain separate checks.
2. Investigate ordinary day-use and the unresolved long-feed stalls. The bridge improvement measures message/parse work on controlled TikTok/Instagram pages; it does not establish a CPU percentage, memory-leak fix or a cause for the earlier YouTube stalls.
3. Update the listing only to match verified support. Store submission remains an owner decision.

Raw finite probes, before/after failures, full results and package comparison are retained locally under `qa/tmp/feed-cache-performance/`. They contain controlled fixtures and are not a publication of browser profiles or account data.
