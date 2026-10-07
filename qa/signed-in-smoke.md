# Signed-in live QA · 0.3.3

Checked on 2026-10-07 in an existing authorized signed-in session on macOS ARM64, using Aside's Chromium 153 browser. This is actual site QA with the installed release ZIP, not routed fixtures. It does not establish the same flows in Google Chrome 154, every site experiment, or ordinary day-long use.

Package: `scrollplus-0.3.3-chrome.zip`, SHA-256 `dd2ed7042783a53044fc682cf759e674b0622301d548fedb98da6f85d331e2a1`, built from `85d8b5e74f93b1fc6ce94ea4d8b8d087694e77c5`. No adapter or UI changes were needed for these paths. Normal navigation and actual extension controls were used; no private API requests or account engagement. Account identifiers and browser profiles are excluded. Counts are observations at test time and can change.

## Instagram Reels

| Path | Result | Actual observation |
| --- | --- | --- |
| Shipped default | Pass for the recorded flow | Likes on at 5,000; comments/views off; all sites on; grids off; empty allowlist. Counter 0 → 7. A 35-second sampler captured six low-like reason chips; it did not capture every short-lived item or all seven increments |
| Counts and navigation | Pass | MAIN-world messages supplied actual likes/comments. Next was a `div[role="button"]` labeled `다음 릴스로 이동`; real reel URLs changed |
| Undo | Pass | `DeJgKOexrdo`, 72 likes, skipped with a chip. Actual Undo restored the same reel for four seconds. Counter 7 → 8, with no second increment |
| Keep creator | Pass | Real popup saved public creator `hantoben`. Full reload kept the 72-like reel; counter still 8 |
| Reset and away/back | Pass | Reset preserved the creator. Navigating to that public profile and back kept the reel; counter still 8 |
| Missing views only | Pass | Likes/comments off, views on at 100,000. Unallowlisted `DeHU4P1zIXL` had 3 likes and no known views. It stayed for 6.5 seconds; counter still 8 |
| Page errors | None recorded | Default, Undo, creator and missing-view checks |

The missing-count result covers views only, not every hidden-like/comment variant. An exploratory ad search did not establish a visible active ad, so no Instagram live ad-safety pass is claimed.

## TikTok signed-in For You

| Path | Result | Actual observation |
| --- | --- | --- |
| Default keep paths | Pass | Initial 80-second sampling covered 16 distinct items: 12 ordinary videos at or above 5,000 likes and four ads. All had known metrics in the recorded history. Counter remained 24 |
| Default skip | Pass | Additional sampling reached ordinary video `7693115495989415176`, public creator `dosodk09`, 2,639 likes. It advanced with `넘김 · 좋아요 2.6천`; counter 25 → 26 |
| Undo | Pass | Same video revisited with power off, then skipped when power was restored. Actual chip Undo restored it for 4.2 seconds. Counter 27 → 28, with no repeated skip |
| Keep creator on fresh page | Pass | Actual popup saved `dosodk09`. Fresh direct page for the same video stayed below the default minimum (visible count now 2,642); counter remained 28 |
| Strict preset | Pass in a separate controlled live path | Power off: ordinary video `7677176414419815700` identified at 9,931 likes. Power on at Strict 20,000: advanced with `넘김 · 좋아요 9.9천`; counter 29 → 30. Next 54,100-like video stayed |
| Ads under the minimum | Pass for observed cases | Default run kept ads at 786 and 51 likes. Separate 159-like ad stayed through Balanced → Strict for eight seconds; counter 29 unchanged, no chip |
| Signed-in playback | Pass for sampled flow | Actual player and `feed-navigation-next`/`feed-navigation-prev` controls worked; no login overlay limited the run |
| Page errors | None recorded in core checks | Default, Undo and creator. Later focused preset/ad probes had no new error collector, so no separate zero-error claim is made for those probes |

The first exploratory Strict trace showed an approximately 11K chip and a counter increment, but its item-only sampler did not identify the skipped video. It is retained as inconclusive evidence and is not counted as a Strict or ad-safety pass. The separately identified 9,931-like video and stationary 159-like ad are the evidence used above. Counter baselines include earlier tests; differences describe individual checks, not every daily skip.

## Evidence and remaining scope

Local, Git-ignored evidence is retained in `qa/tmp/aside-live-033-20261007/`: `instagram-default-033.json`, `instagram-undo-033.json`, `instagram-creator-033.json`, `instagram-missing-views-033.json`, `tiktok-signed-in-default-033.json`, `tiktok-signed-in-default-more-033.json`, `tiktok-signed-in-natural-033.json`, `tiktok-signed-in-undo-033.json`, `tiktok-signed-in-creator-033.json`, `tiktok-strict-ordinary-033.json` and `tiktok-strict-ad-change-033.json`. Public-content screenshots remain local evidence; raw directories are not published wholesale.

These checks close the recorded signed-in Reels and For You core paths. Following feeds, every ad/carousel variation, other browsers and long-term reliability are not established here. The independent [24-hour YouTube run](soak.md) is still running. Ordinary human day-use remains a separate gate in [release readiness](release-readiness.md). Chrome Web Store submission has not occurred.

A later 0.3.4 [TikTok preview regression and focused live check](tiktok-previews.md) excludes creator recommendation previews and rechecks video-page skipping/Undo. The results above retain their original 0.3.3 package scope.
