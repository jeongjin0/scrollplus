# TikTok preview regression · 0.3.4

2026-10-07. The signed-in Following page in Aside Chromium 153 showed creator recommendation cards rather than a video feed. A 226 × 302 autoplay preview had a normal `xgwrapper` video ID inside `[data-e2e="recommend-card"]`. The old active-player helper treated that preview as the current video. No account was followed to manufacture a feed.

## Regression

With shipped defaults and known 10-like preview data, the built 0.3.3 scripts attempted two next-video actions on each controlled recommendation and profile preview. Both also exposed `creator` as the current creator. The expected results were zero advances and no current creator. Both tests failed before the fix.

0.3.4 restricts active TikTok players to the home/For You/Following feed routes and individual video pages, and excludes recommendation-card videos before choosing the visible player. Profile/search previews remain outside active-player filtering; optional grid filtering still uses its own setting.

The three preview cases (Following recommendations, home recommendations and profile previews) now pass with zero advances, zero skips, no current creator and no hidden grid cards at the default setting. Built MAIN/isolated-script fixtures also pass skip, Undo and saved-creator reload on For You, Following and individual video routes. These fixtures do not prove the live site's positive Following path.

## Focused live check

The exact 0.3.4 ZIP was installed through normal developer UI in the existing Pro Aside account, Chromium 153. SHA-256: `f214c62f29c87788d935d5d935472c2fa3577a4fac10a954b31cd17c62f28626`. No profiles or cookies were copied, no account engagement occurred, and Air was not used.

- The real Following recommendation preview remained playing. ScrollPlus reported `creatorId: null`, with today's skip count unchanged at zero across checks. This verifies exclusion, not Following-feed skipping.
- With the master temporarily off, an identified ordinary video had 2,660 likes. Turning it on at the shipped 5,000-like rule skipped to a 67,400-like video, showed the 2.7K reason chip, and incremented the counter from zero to one. One advance was observed; the six-second error collector was empty.
- A separate real For You visit retained its 20.1K-like player and reported its actual creator; the counter stayed three. This checks player recognition and keeping a passing video, not a new below-minimum For You skip.
- On a fresh visit the same video had 2,664 likes. A further skip was undone through the observed chip button. The original video URL stayed for four seconds; the counter remained three after the third recorded skip, with no repeat skip. An earlier role-locator wait missed the transient chip and was not counted as an Undo result. The successful check used a fresh chip snapshot/ref. No new error collector was attached for this separate Undo check.

The account's Following route contained recommendations and no vertical feed, so live below-minimum Following skipping remains unverified. Account identifiers, browser profiles and raw extension inventories are excluded from public evidence.

## Package and checks

Typecheck, 42 unit tests, 19 browser tests and final ZIP/package validation pass. Runtime scripts used by the browser suite match the final package; the manifest version was corrected to 0.3.4 before package validation and live installation. Defaults, UI and permissions are unchanged.

The 0.3.3 and 0.3.4 ZIPs were compared entry by entry. YouTube MAIN/isolated scripts and the background counter are byte-identical; the earlier [24-hour attempt](soak.md) ended early when its QA runner treated a refresh as fatal. Its partial evidence is preserved, and a new full-duration 0.3.4 run is active after runner recovery checks. No full-day pass is claimed. Remaining gates are in [release readiness](release-readiness.md).

Local evidence is retained under `qa/tmp/following-preflight-033-20261007`, `qa/tmp/tiktok-preview-regression-034` and `qa/tmp/aside-live-034-20261007`, not served wholesale or committed.
