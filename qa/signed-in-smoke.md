# Signed-in live QA

Each section identifies its package and browser. Later observations do not turn earlier-version checks into new results.

## Version 0.3.3 · 2026-10-07

Checked on 2026-10-07 in an existing authorized signed-in session on macOS ARM64, using Aside's Chromium 153 browser. This is actual site QA with the installed release ZIP, not routed fixtures. It does not establish the same flows in Google Chrome 154, every site experiment, or ordinary day-long use.

Package: `scrollplus-0.3.3-chrome.zip`, SHA-256 `dd2ed7042783a53044fc682cf759e674b0622301d548fedb98da6f85d331e2a1`, built from `85d8b5e74f93b1fc6ce94ea4d8b8d087694e77c5`. No adapter or UI changes were needed for these paths. Normal navigation and actual extension controls were used; no private API requests or account engagement. Account identifiers and browser profiles are excluded. Counts are observations at test time and can change.

### Instagram Reels

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

### TikTok signed-in For You

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

### Evidence and remaining scope

Local, Git-ignored evidence is retained in `qa/tmp/aside-live-033-20261007/`: `instagram-default-033.json`, `instagram-undo-033.json`, `instagram-creator-033.json`, `instagram-missing-views-033.json`, `tiktok-signed-in-default-033.json`, `tiktok-signed-in-default-more-033.json`, `tiktok-signed-in-natural-033.json`, `tiktok-signed-in-undo-033.json`, `tiktok-signed-in-creator-033.json`, `tiktok-strict-ordinary-033.json` and `tiktok-strict-ad-change-033.json`. Public-content screenshots remain local evidence; raw directories are not published wholesale.

These checks close the recorded signed-in Reels and For You core paths. Following feeds, every ad/carousel variation, other browsers and long-term reliability are not established here. The [long-feed report](soak.md) retains the interrupted 0.3.3/0.3.4 attempts and a separate completed 0.3.5 run; none upgrades this section's package scope. Ordinary human day-use remains a separate gate in [release readiness](release-readiness.md). Chrome Web Store submission has not occurred.

A later 0.3.4 [TikTok preview regression and focused live check](tiktok-previews.md) excludes creator recommendation previews and rechecks video-page skipping/Undo. The results above retain their original 0.3.3 package scope.

## Version 0.3.6 candidate · 2026-10-09

Existing authorized signed-in Aside Chromium 153 session on the Pro QA host (macOS ARM64), reached through the approved Screen Sharing route; no Air. The extension was an unpacked copy of the candidate ZIP in a task-owned directory. No account engagement, new account or private API request. Account identifiers and raw captures are excluded.

| Package | Result | Actual observation |
| --- | --- | --- |
| First candidate (SHA-256 47fa9365…) | Fail | A clearly labelled Instagram advertisement with two likes was skipped under the default 5,000 minimum, and a reason chip followed it. Held; never released |
| First advertisement guard (SHA-256 b5167ca6…) | Fail | A normal feed produced reason chips for 51 and 0 likes. With the extension off, going back identified the card before the zero-reason chip as a labelled image-style advertisement with no video and no like count. Held; never released |
| Final candidate (SHA-256 3d6325f8…, 127,157 bytes; 20 files matched the ZIP) | Partial pass | After a normal extension reload and page reload, the extension was switched on at shipped defaults (likes 5,000; comments/views off; all sites on). The settings counter went from 12 to 77 across about 70 Instagram Reels frames and 16 TikTok frames |

Final-candidate details:

- Instagram Reels: frames were captured about three seconds apart while advancing with the keyboard. Reason chips with Undo appeared for 2.9K, 3.5K, 3, 10, 52, 60 and 350 likes, and the sampled reels at or above 5,000 stayed. A 40-like reel open when the extension was switched on advanced to an 11.9万-like reel.
- TikTok For You: 16 frames. Three frames showed advertisement cards with a "Learn more" bar, each still on screen about three seconds after arrival. No page-error collector was attached to this sampling.
- Not established: no disclosed Instagram advertisement or image-style card appeared in these frames, so the advertisement fix is confirmed only by the controlled-page regressions. Individual skip counts are not attributed per reel (the counter includes unsampled outcomes). Undo, reload recovery and a genuine Following feed were not exercised on this package.

Local evidence: qa/tmp/pro-live-036/frames/ (screen captures, Git-ignored; raw captures are not published). A system permission prompt from an unrelated application was visible throughout and was left untouched.

## Version 0.3.5 · 2026-10-08

The exact [0.3.5 release ZIP](release-readiness-035.md#artifact) was installed in the existing authorized signed-in Aside Chromium 153 session on macOS ARM64. Normal native navigation and extension controls were used. Settings stayed at the shipped defaults: on, likes minimum 5,000, comments/views off, all three sites on, grids off, skip chip on and no saved creators. No account engagement or new account was used to prepare a feed.

| Path | Actual observation | Scope |
| --- | --- | --- |
| Instagram Reels default | A 4,778-like reel advanced to a 526K-like reel without further input. A separate fresh-feed check captured `넘김 · 좋아요 60` with Undo; the next visible reel had 31K likes | Default skipping observed. The 60-like chip is not attributed to the 4,778-like reel |
| Instagram kept samples and count | Sampled 67K, 56K, 20K and 21K reels stayed. The settings count was initially 1 and later 9 | Intermediate outcomes were not all captured; this is not nine independently verified skips |
| TikTok For You default | Sampled videos above 5,000 likes stayed. A 3,366-like ordinary video advanced to a 20.4K-like advertisement without further input; count 9 → 10 | Default skipping observed. The reason chip and Undo were not captured in this path |
| TikTok advertisement sample | A separate advertisement with 51 displayed likes stayed | One observed case; the cause and all advertisement variants are not established |
| TikTok Following recommendations | The route showed creator recommendation cards; count stayed 9 → 9 | Preview exclusion observed. A genuine Following video feed was not available |
| Undo and reload retention, initial check | An Instagram Undo click did not produce an observed restoration | Inconclusive in this initial check; the later focused TikTok result below is separate. The earlier 0.3.3/0.3.4 live results above and the 0.3.5 controlled regressions remain separate evidence |

These initial checks are bounded native-screen observations. No native page-error collector or exported recording was used, and no zero-error claim is made. No creator, Reset or filtering-setting changes were made. The task-owned installation was removed, Developer mode restored to off, QA windows closed and the task-owned screen-sharing connection closed; existing extensions, windows and other QA connections were preserved.

Local evidence: `qa/tmp/pro-live-035/native-observations-035.json` and `progress.json`, plus the native screenshots in the QA tool trace. The original 0.3.5 package checksum is unchanged. This check does not establish signed-in Google Chrome compatibility, every site experiment, genuine Following skipping or ordinary human day-use. The exact-version [24-hour automated YouTube check](soak.md) subsequently completed with two reviewed reload recoveries; it does not establish signed-in endurance.

### Focused 0.3.5 TikTok Undo, reload and Reset · 2026-10-08

A separate native check used the same exact ZIP and existing signed-in Aside Chromium 153 session. Power was temporarily switched off to identify an ordinary video below the shipped minimum; power was then restored. The likes minimum stayed 5,000, comments/views stayed off and the creator allowlist stayed empty. The actual chip lifetime remained 2,500ms; no clock, page, runtime or extension patch was used to make Undo easier.

| Path | Actual observation | Scope |
| --- | --- | --- |
| Identified default skip | Public video `7693129526519303437` displayed 2,715 likes. Power on advanced to a 324.5K-like video, with the 2.7K-like reason chip; count 0 → 1 | Identified native default-rule path |
| Undo | The same low-like video was revisited with power off, then skipped again. Actual chip Undo restored the same creator, content and 2,715 likes; the chip disappeared | Restoration observed; an earlier slower Undo attempt expired and was retained as inconclusive |
| Exact-video reload retention | The video's public URL was copied through the normal Share control, opened normally and verified by video ID. Normal browser Reload retained the same playing 2,715-like video for more than eight seconds; power on, count 2, empty allowlist | Current-version signed-in TikTok session retention; no creator exception used |
| Reset | Actual Settings Reset was clicked, then the restored video advanced to a 650.1K-like video; count 2 → 3 and defaults remained intact | Reset resumed filtering. The Reset-triggered reason chip was not captured |
| Instagram follow-up | A separate 40-like reel skipped with a 40-like reason chip, but rapid subsequent low-like transitions did not establish restoration of the original reel | Current-version native Instagram Undo/reload remains inconclusive |

These are bounded native-screen observations, not a full-day result. No native page-error collector or exported recording was used; no zero-error claim is made. Creator retention, concurrent Reset behavior, genuine Following video feeds, signed-in official Google Chrome and all Instagram variants are not established by this probe. The controlled [session regressions](session-undo.md) and earlier live package results retain their own scope.

Local evidence: `qa/tmp/pro-live-035/fast-undo-035-probe.json` and native screenshots in the tool trace. This probe's temporary-installation cleanup is tracked separately from the completed initial check above; the shared QA desktop was occupied at the October 9 follow-up. Account/profile data and raw evidence directories are not published.
