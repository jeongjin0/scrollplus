# Live smoke

Date: 2026-10-06

Instagram Reels was not verified. The smoke browser had no signed-in Instagram session, so nothing was marked as passed there.

YouTube Shorts: 20 distinct videos. Views were read on 20. Eligible for the provisional Balanced cutoff: 19. Of those, 0 were below the cutoff. Chip text was seen on 0 samples.

TikTok: 20 distinct videos. Views were read on 0. Eligible: 0. Below the provisional cutoff: 0. Chip text was seen on 4 samples.

The browser session closed after both passes.

## 2026-10-07

The 2026-10-06 YouTube pass did not show a skip chip. Two product bugs explained that. An isolated-world click on Next did not change the Short, and a successful move cleared the chip as soon as the next video loaded.

After the fix, a fresh logged-out profile opened a low-response Short. Kept moved to the next Short and showed 넘김 with 되돌리기. The same path then skipped several more weak Shorts and stopped on one above the cutoff. Counts that arrive within 2 seconds of opening are still scored. Instagram remains unverified.

## 2026-10-07, version 0.2.0

The rule is now a like count (default: skip under 5,000 likes) and the popup, options, skip chip, and icon were rebuilt.

YouTube Shorts, fresh logged-out profile, shipped defaults, 75 seconds of scrolling. 27 distinct Shorts were opened. 21 showed a like count; 6 showed none at first sight and were left alone. 5 of the 21 were under 5,000 likes (454, 644, 123, 1,604, and 6). Kept moved on from all five without a click. For four of them the chip was captured with the reason, for example "넘김 · 좋아요 454" with "되돌리기". The fifth moved on within half a second and its chip was not captured. Every Short at or above 5,000 likes stayed.

Recording and frames are in qa/tmp (not committed). TikTok and Instagram were not re-run on this build. Instagram remains unverified.

Browser tests on the built extension cover the defaults, presets, switches, typed numbers, Custom, and Reset. Fixture tests cover the skip, the reason chip, the six-skip pause, undo, and fail-open.

Known limits: counts that load later than two seconds after a video opens are not judged. A brand-new video with few likes is skipped, as the rule says.

### Final 0.2.0 build, same day

YouTube Shorts again on the final build, logged out, 42 seconds: 18 Shorts opened, 16 showed a like count, 6 were under 5,000 (316, 3,381, 672, 83, 22, 11) and 10 were at or above it. The chip with the reason was captured for 316 and 3,381 ("넘김 · 좋아요 316", "넘김 · 좋아요 3.4천"). Shorts at or above 5,000 were left alone.

TikTok found a real bug. With the first 0.2.0 build Kept judged TikTok videos correctly but never moved the feed, so nothing was skipped. In a 21-video logged-out pass only one video was under 5,000 likes, and it was not skipped. To force the case I raised the likes minimum to 50,000 on a fresh profile and the feed still did not move. Cause: the extension sent its next-video click and key press from its isolated world, which TikTok ignores, and on Explore the button has no data-e2e attribute. On For You the active video had no id at all, because the page has no video link; the id is in the player wrapper's element id.

Fix: the click now comes from the page script, it looks for the button labelled Next video and the feed navigation button, the For You video id and creator are read from the player wrapper and author link, and the move is detected by the feed item on screen, since the next player is empty while it loads.

After the fix, with the minimum raised to 50,000 to force skips: on Explore, Kept skipped videos with 33K, 24K, and 7.4K likes with the reason chip each time, then stopped after six in a row as designed. On For You it skipped a 37K-like video with "넘김 · 좋아요 3.7만". The default 5,000 bar was not re-run on TikTok after the fix, and the logged-in For You feed was not tried. Instagram remains unverified.
