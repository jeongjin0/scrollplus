# Long feed QA

`scripts/soak.mjs` runs a finite YouTube Shorts check with the built extension in its own fresh, signed-out Playwright Chrome for Testing profile. It leaves the shipped defaults intact, scrolls after 30 seconds on a kept video and uses the normal Continue button at the six-skip pause. It records counts, errors and minute checkpoints, including the local daily counter across midnight. This is automated QA, not ordinary human day-use or signed-in platform endurance.

```bash
npm run zip
node scripts/soak.mjs qa/tmp/soak-new-run 86400000
```

Use a new output directory for every run; the script refuses an existing profile. The optional third argument is an immutable unpacked extension directory, or the literal `none` to run the identical schedule with no extension as a control; the optional fourth is a summary JSON path. Set `SOAK_EXTENSION_OFF=1` to load the extension but switch it off. Output contains local QA evidence and is ignored by Git. A persistent task-owned tmux session can keep it running across terminal disconnects. To stop a newly launched runner, verify the Node pid from its report against the process command and send SIGTERM to that pid only. The runner handles that signal itself so it can save its final count, screenshot and stopped report before closing its own browser. Do not signal an entire tmux process group or assume older runners have this behavior; see the signal regression below.

The runner now counts actual manual transitions separately from key attempts. After two attempts fail to change the video, it records a screenshot and reloads the same public page without resetting the profile, settings, daily count or duration. Recovery is bounded to twelve reloads, at least ten minutes apart; repeated failure after a reload stops the run for review. Page navigation can replace the execution context and is retried; unrelated errors and a closed page remain failures. Recoveries must be reviewed, never presented as uninterrupted scrolling. Before each reload the runner now records bounded diagnostics in the recovery entry: page responsiveness, focus and visibility, whether the playing video advances, element and reel-renderer counts, whether the page's own Next control still moves the feed, and Chrome's page metrics. Console errors and warnings (first 60) and a page crash are also recorded.

`completed` means the duration finished, not an automatic release approval. Review movement times, checkpoints, errors, counters, recovery records and the final frame. An error without an extension URL in its stack is not proof that ScrollPlus is uninvolved. The run complements ordinary human day-use and does not verify signed-in TikTok or Instagram.

## 0.3.3 attempt, 2026-10-07 — interrupted

The exact tested ZIP (SHA-256 `dd2ed7042783a53044fc682cf759e674b0622301d548fedb98da6f85d331e2a1`) ran for 3 hours 7 minutes. It recorded 498 distinct videos, 489 with known likes, 204 below the default minimum, 203 observed movements with a skip chip and no page errors. The sampled chip count is not an exact count of every skip.

The sample count stopped increasing. A native screenshot of the task-owned browser showed a playing 29K-like Short; normal Next also did not change its URL. A normal refresh destroyed the page execution context, which the old runner treated as fatal; its `finally` then closed its own browser. This establishes a QA-harness failure, not an extension/browser crash or the cause of the feed's earlier lack of movement. No full-duration pass is claimed. The original profile, report, process log and UI inspection journal remain under `qa/tmp/soak-033-20261007`.

## Navigation recovery validation

A real browser regression replaces the document while evaluation is pending, verifies that the navigation is retried, and confirms that other errors and a closed page still fail. A movement regression distinguishes attempts from transitions and checks recovery limits.

A separate two-minute real YouTube run completed on 0.3.4 after a normal native refresh: one navigation retry, four known-count videos, three actual manual movements, unchanged defaults/counter and no page errors. This verifies the runner's recovery path, not a long-duration pass. Local evidence: `qa/tmp/soak-navigation-smoke-034-20261007`.

## 0.3.4 successor, 2026-10-07 — superseded, not passed

The previous worker/browser ended before this run started. A new immutable extension and fresh profile use the exact 0.3.4 ZIP, SHA-256 `f214c62f29c87788d935d5d935472c2fa3577a4fac10a954b31cd17c62f28626`.

Started `2026-10-07T13:08:52.925Z` (22:08 KST); expected end `2026-10-08T13:08:52.925Z` (22:08 KST), with the full 24-hour duration unchanged. This run was superseded after a reproduced Undo/reload defect required changes to the shared runtime. At the last report it had run 7,269,665ms (about 2h1m), sampled 346 videos (342 known counts), observed 112 chip movements and 234 actual manual movements, with one failed manual attempt, no recorded recoveries and no collected page errors. The count crossed local midnight and resumed on the new date; native Settings showed the new-day count with defaults unchanged. The exact zero at midnight was not observed.

The authorized stop used tmux Ctrl-C, and the run ended with status 130 before final reporting. The later Node-only SIGTERM regression below reproduced browser closure before final reporting under Playwright's default signal handling; signalling the whole process group is not required to cause this ordering. Node79521 and its browser79527 were verified absent. The raw last report still says running and is preserved alongside explicit `termination.json`/`superseded.json` annotations; the derived public summary says superseded-interrupted. There is no final screenshot or clean final report, and this is not a 24-hour pass. All local evidence remains under `qa/tmp/soak-034-20261007`.

The 0.3.3/0.3.4 ZIP comparison found identical YouTube MAIN/isolated scripts and background counter, but the interrupted earlier run is retained only as partial evidence. The successor tests the full 0.3.4 package; it still does not replace ordinary human day-use.

## 0.3.5 successor, 2026-10-08–09 KST — completed with two recoveries

The single fresh-profile successor loaded the exact tested 0.3.5 ZIP, SHA-256 `2404780bd90de021f335551c35c03b8476ed6be214945ca21f553cc864f966fa`. Started `2026-10-07T15:11:18.241Z` (October 8, 00:11 KST), finished naturally `2026-10-08T15:11:18.774Z` (October 9, 00:11 KST): 86,400,533ms against the unchanged 86,400,000ms gate. The original launch harness and extension remained unchanged; no signal, restart or duplicate run was used. Its 20 unpacked files still match the release ZIP.

| Observation | Final result |
| --- | --- |
| Sampled videos | 3,352 distinct item IDs; 3,219 with known likes; 1,083 sampled below 5,000 |
| Movement | 1,113 observed transitions with a skip chip; 2,773 successful manual transitions from 2,801 attempts; 28 failed attempts; seven Continue actions |
| Collected page errors | 0; no fatal report error or navigation retry |
| Checkpoints and defaults | 1,437 minute checkpoints; maximum gap 60.366 seconds. Exact shipped settings asserted initially, at every checkpoint and finally |
| Last movement | 24.515 seconds before the finished timestamp |
| Daily counter | Monotonic within each local date. Last October 8 checkpoint: 1,119; first October 9 checkpoint: 1; final: 3 |
| Whole-page JS heap | Initially 33.1 MiB; peak 1,091.9 MiB; last checkpoint 217.8 MiB. Includes YouTube and resets after page reloads |

Two manual attempts failed to change the feed before each recovery: normal page reload at `2026-10-08T02:27:04.755Z`, then at `2026-10-08T09:36:21.518Z`. The before/after checkpoints kept counters at 835 and 1,009 respectively, defaults stayed unchanged and movement resumed afterward. Both pre-reload screenshots and the final public Shorts frame were inspected. The first reload followed substantial whole-page heap/DOM growth; this observation does not establish the cause of either stall.

This is reviewed automated completion with two recoveries, **not uninterrupted 24-hour scrolling**. The sampled low-video count, chip movements and storage counter measure different things and are not interchangeable. Minute checkpoints do not supply a complete per-video history. The exact zero at midnight and native popup rollover were not observed. Page-error collection is not a claim that every browser, worker or console error was absent.

The final report/process output agree on completion. All 13 recorded worker/browser processes and task-profile processes were absent after natural shutdown; raw profile/evidence remain local. Evidence: `qa/tmp/soak-035-20261008`, with the manual final audit in `qa/tmp/long-qa-final-audit-035.json` in the original checkout. Only the sanitized summary is served for review. Ordinary human day-use and signed-in platform endurance remain separate checks.

## Six-hour no-extension control, 2026-10-08 KST

A separate fresh signed-out Chrome for Testing 153 profile ran without any extension for 21,600,685ms and finished naturally at `2026-10-08T03:36:15.610Z`. It sampled 1,007 distinct public Shorts IDs, with 1,074 manual attempts and 1,074 transitions; zero collected page errors and zero extension workers. All 1,435 checkpoints had zero ScrollPlus chip hosts. Only the first checkpoint was loading; all 1,434 subsequent checkpoints recorded an active playing video and a Shorts ID. Maximum checkpoint gap was 15.162 seconds. The final frame was inspected and all 12 recorded own processes were absent afterward.

| Whole-page metric, first six elapsed hours | Exact 0.3.5 | No extension |
| --- | --- | --- |
| JS heap, initial → last checkpoint | 33.1 → 562.5 MiB | 42.8 → 531.3 MiB |
| Peak JS heap | 575.3 MiB | 578.8 MiB |
| CDP metric Nodes, last checkpoint | 465,411 | 481,315 |
| Cumulative page script/task time | 883.506 / 1,334.121 seconds | 743.098 / 1,076.372 seconds |

Both runs showed whole-page heap and DOM growth. Feeds, video counts, movement schedules and checkpoint cadence differ: the extension run combines automatic skips with 30-second manual advances; the control uses 20-second manual advances. These are comparable elapsed windows, not a paired experiment for subtracting extension overhead or excluding leaks. The shorter control does not explain the two later stalls in the 24-hour run. Local evidence: `qa/tmp/youtube-memory-control-6h-035` and the same final audit; no new product version was built for this comparison.

## Signal shutdown regression, 2026-10-08 KST

The runner registered its own SIGINT/SIGTERM handlers, but Playwright also closed the browser on those signals by default. [The documented launch options](https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context-option-handle-sigterm) and the installed Playwright 1.63.0 source confirm that default. A separate exact-0.3.5-ZIP run reproduced the problem when SIGTERM was sent only to its verified Node pid: `page.waitForTimeout` failed with a closed-browser error, the final daily count was absent, and no final screenshot was saved. This is QA shutdown failure, not a spontaneous extension crash. Local evidence: `qa/tmp/soak-stop-signal-035-20261008-retry` in the original checkout.

New launches disable Playwright's SIGINT/SIGTERM handlers so the runner owns the shutdown order. Two independent fresh-profile checks on the same unchanged extension ZIP then passed: Node-only SIGTERM and Node-only SIGINT each produced `stopped`, a final daily count, a finished timestamp and a visibly valid final screenshot, exited with code 0, and left none of their recorded browser descendants running. Each had sampled one actual known-count YouTube Short; neither is a long-duration pass. Local before/after reports and signal/process journals are retained separately. Whole-group interruption and SIGKILL are not covered by these checks.

The fix was developed and tested in an isolated worktree. Node70428's subsequently completed 24-hour run kept its original script checksum `37e5c3a627069ef629c7219d80f0b1b2227e551f075982a166d7ab0620f3422c`, profile, extension, settings and timer; it was not stopped or restarted. Extension code, version, permissions and the published ZIP are unchanged.

## YouTube Shorts feed stalls (YouTube's feed request fails)

Runs of 2026-10-09 to 11 KST. Long YouTube Shorts runs intermittently reach a state where the feed ignores Next and the keyboard until the page is reloaded. The soak runner treats two failed automatic presses as a stall, records diagnostics and reloads the public page, after which the run continues normally.

**Cause.** Six stalls were diagnosed with a page-side recorder of YouTube's feed requests (three runs of 8 hours each: two with ScrollPlus 0.3.7 and one with no extension). All six look the same:

- `reel/reel_watch_sequence`, the request that loads more Shorts, returned **HTTP 503** 90–121 seconds before the diagnosis; every other recorded request was 200.
- YouTube's `ytd-shorts` component reported `continuationRequestPending: true` and never left that state.
- The page was otherwise healthy: responsive, focused and visible, the video playing at normal speed, the Next control present, enabled and visible. A click on the page's own Next control and the keyboard both did nothing.

So YouTube's server rejected the request for more Shorts and its component then waits for that request forever; a reload is the only recovery. One of the six stalls was in the no-extension control, so ScrollPlus is not needed to produce it, and nothing in these recordings points at ScrollPlus's own clicks. Eight earlier stalls had page-level diagnostics only (no request recording): seven showed the same healthy page that ignored every navigation, and one was a half-rendered page with no video playing. They are consistent with the same failure but their requests were not recorded.

| Arm (signed-out public Shorts) | Hours | Stalls |
| --- | ---: | ---: |
| Extension on, 0.3.5 24 h, 0.3.6 6 h, 0.3.7 6 h and 12 h | 48 | 7 (2, 0, 1, 4) |
| Extension on, 0.3.7, with request recording (two runs) | 16 | 5 (3, 2) |
| Extension on, 1.2 s minimum dwell before every skip (unreleased 0.3.8 candidate, two runs stopped at 6 h 29 min) | 13 | 3 (2, 1) |
| No extension, one manual press every 20–30 s (6 h and 12 h) | 18 | 0 |
| No extension, first click 1.2–2.0 s after a video opens for about 40% of videos | 8 | 0 |
| No extension, first click 0.45–0.70 s after a video opens for about 40% of videos (`scripts/pacing-control.mjs`, two runs) | 14 | 2 (1, 1) |
| Extension loaded but switched off (`SOAK_EXTENSION_OFF=1`), one press every 30 s | 6 | 0 |

**Why it appears more with ScrollPlus.** With the extension on there were 15 stalls in 77 hours; with no extension 2 in 40, both under fast navigation. Two things plausibly explain the gap, and neither is measured: skipping works through about 1.5 times as many videos per hour (for example 1,979 sampled videos in 12 hours against 1,275 for the slow no-extension run), so it triggers more feed requests, and 503s cluster in time. Fourteen of the 15 stalls with the extension on occurred between 05:00 and 16:00 UTC and nine of them between 12:57 and 15:39 UTC on two different days, while the 12-hour slow no-extension control that spanned the first of those windows did not stall (it also viewed fewer videos). The arms ran at different times against different recommendation feeds, so no rate comparison here is a controlled measurement.

**What was tried.** The 0.3.7 change that stops rescanning page links is a measured CPU saving and is unrelated. A 1.2 s minimum dwell before every skip was built and soaked (3 stalls in 13 hours against 7 in 48); it did not change the outcome, which fits a server-side cause, so it was not released. Its engine change and tests stay on the unmerged branch `codex/skip-min-dwell` as evidence.

**For a person using YouTube Shorts**, the feed can occasionally stop responding to scroll and Next while the video keeps playing; reloading the page fixes it. About once per five hours of continuous automatic use here; ordinary use is much lighter. ScrollPlus could detect the stuck state and say so, but that is a new feature outside SPEC.md and is left as an owner decision. This section does not cover TikTok or Instagram, signed-in sessions or other browsers.

Reproduce (each uses a new output directory and a fresh profile):

```bash
node scripts/soak.mjs qa/tmp/run-extension 21600000 .output/chrome-mv3            # extension on
SOAK_EXTENSION_OFF=1 node scripts/soak.mjs qa/tmp/run-off 21600000 .output/chrome-mv3   # loaded, switched off
node scripts/soak.mjs qa/tmp/run-none 21600000 none                                # no extension
node scripts/pacing-control.mjs qa/tmp/run-burst 21600000 450 700                  # no extension, fast pacing
```

Each recovery entry in `report.json` holds the diagnostics (`network`, `shortsComponent`, `page`, `metrics`, `ownControl`). Raw reports and the screenshot taken before each reload stay under `qa/tmp/` and are not published. `e2e/soak.spec.ts` covers the diagnostics collector.
