# Release readiness · 0.3.6

Checked on 2026-10-09 KST, macOS ARM64. This candidate removes repeated TikTok/Instagram feed-history messages and repeated parsing of unchanged embedded JSON. It also fixes missed Instagram count changes when a replacement payload has the same length and prefix. Defaults, filtering rules, UI, permissions and dependencies are unchanged. Chrome Web Store submission has not occurred.

| Check | Result | Evidence / scope |
| --- | --- | --- |
| TypeScript | Pass | `npm run compile` |
| Unit tests | 44 passed | `npm test` |
| Built-script browser tests | 25 passed, no skips or flaky results | `npm run test:e2e`; includes two new bridge/count-refresh regressions, existing adapter, grid, UI, storage, navigation and session Undo paths |
| Minimum Chrome 120 | Pending candidate CI | The [previous 0.3.5 report](release-readiness-035.md) records 23 tests on Linux Chrome 120.0.6099.109; it is not a result for this candidate |
| Feed-history bridge | Pass on controlled pages | [Before/after report](feed-cache-performance.md): unchanged 5,000-item history causes zero extra cache/player messages over 2.5 seconds; 500 new items send 500 rows |
| Changed embedded counts | Pass on both adapters | Same-length/same-prefix likes change from 6,000 to 1,000 reaches the player and causes one default skip; exact published 0.3.5 fails the new regressions |
| Package | Pass | `npm run zip` and `node scripts/check-package.mjs`; MV3, Chrome 120+, storage and the existing three host permissions |
| Package scope | 17 of 20 extracted files identical to published 0.3.5 | Only the manifest and TikTok/Instagram MAIN bundles changed. YouTube, isolated scripts, background, popup/settings, locales and icons are byte-identical. This does not upgrade earlier native or endurance evidence to exact-0.3.6 evidence |
| Current signed-in TikTok / Instagram | Pending exact-candidate native check | Existing [0.3.5 native observations](signed-in-smoke.md#version-035--2026-10-08) and earlier versions remain scoped to their original packages |
| Real YouTube and long-feed QA | Historical 0.3.5 result retained | [24-hour report](soak.md) completed with two reviewed page-reload recoveries; no exact-0.3.6 24-hour run or ordinary human day-use result |
| Chrome Web Store | Not submitted | [Submission checklist](../store/submission-checklist.md) prepared |

## Artifact

`scrollplus-0.3.6-chrome.zip`, 126,352 bytes.

SHA-256: `47fa9365119c1348c7435fc0b8bd205272a3237f87f1e7911c1fbb975982782c`.

This identifies the tested local candidate. CI ZIP metadata can differ. The previous exact-package checksum and its QA remain in [0.3.5 release readiness](release-readiness-035.md#artifact).

## Remaining release gates

1. Complete the current and minimum-Chrome CI suite and native checks of the changed TikTok/Instagram adapters. Broader signed-in Google Chrome, Instagram Undo/reload and a genuine Following video feed remain separate checks.
2. Investigate ordinary day-use and the unresolved long-feed stalls. The bridge improvement measures message/parse work on controlled TikTok/Instagram pages; it does not establish a CPU percentage, memory-leak fix or a cause for the earlier YouTube stalls.
3. Update the listing only to match verified support. Store submission remains an owner decision.

Raw finite probes, before/after failures, full results and package comparison are retained locally under `qa/tmp/feed-cache-performance/`. They contain controlled fixtures and are not a publication of browser profiles or account data.
