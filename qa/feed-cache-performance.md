# Feed-history bridge and count refresh · 0.3.6

2026-10-09 KST. Real built extension scripts in isolated Chrome for Testing, on routed controlled TikTok and Instagram pages. Before: immutable published 0.3.5 ZIP, SHA-256 `2404780bd90de021f335551c35c03b8476ed6be214945ca21f553cc864f966fa`. After: [0.3.6 candidate](release-readiness.md#artifact). These are finite browser probes, not signed-in site or endurance results.

## Reproduced behavior

With filtering paused and 5,000 embedded items already loaded, the old MAIN scripts repeatedly cloned and sent the entire history across the page/extension boundary. TikTok also reparsed the unchanged embedded payload. Instagram's length-plus-first-40-characters key could suppress a real count change.

| Additional work during a 2.5-second idle sample | 0.3.5 TikTok | 0.3.6 TikTok | 0.3.5 Instagram | 0.3.6 Instagram |
| --- | ---: | ---: | ---: | ---: |
| Cache messages | 6 | 0 | 3 | 0 |
| Cache rows sent | 30,000 | 0 | 15,000 | 0 |
| Active-player messages | 6 | 0 | 3 | 0 |
| Embedded-payload parses | 3 | 0 | 0 | 0 |

The candidate initially sends all 5,000 known rows once. A later network response with 500 new items sends only those 500 rows, rather than the accumulated 5,500. Collected page errors were empty in both finite probes. Poll timing determines old-version totals; these sample totals are not a universal benchmark.

## Change and regression checks

The bridge retains known metrics for revisiting a video, merges changed rows into the isolated script's existing cache, and sends the active player when its identity or observed data changes. Platform detection, next/previous controls, unknown-count fail-open behavior and filter timing remain unchanged. Settings and grid rescans continue independently.

A WeakMap tracks each embedded script's exact last text. Unchanged text is not reparsed; replacement text is read even when its length and first 40 characters match. Removed script nodes can be collected. The item-history maps still retain observed items: this change does not impose a history cap or establish a memory-leak fix.

Two built-script regressions exercise idle history, a native fetch with 500 new rows, and a same-length/same-prefix likes change from 6,000 to 1,000. With default filtering then enabled, each changed video advances once and shows the 1K reason chip. Both new tests fail against the published 0.3.5 scripts and pass against the candidate. The revised baseline also observes Instagram retaining the stale 6,000 count. The full candidate suite passes 25 tests, with no skips or flaky results; unit tests pass 44.

Run `npm run build`, then `npm run test:e2e -- e2e/item-bridge.spec.ts`.

## Evidence limits

Local raw evidence: `qa/tmp/feed-cache-performance/{before-035,after-036}/report.json`, `comparison.json`, `before-tests.json`, `before-refresh-tests.json`, `after-tests.json`, `full-tests.json`, `candidate-checks-036.json` and `package-diff-036.json`. Failed baseline results are preserved. All probe contexts and finite test runs completed and closed normally.

The extracted package comparison finds 17 of 20 files byte-identical to published 0.3.5; only the manifest and TikTok/Instagram MAIN bundles changed. Earlier native and 24-hour QA remains linked in [0.3.5 readiness](release-readiness-035.md). No precise CPU/heap saving, signed-in compatibility, exact-0.3.6 endurance or explanation of the earlier YouTube stalls is claimed here.
