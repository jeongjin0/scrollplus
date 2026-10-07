# Long feed QA

`scripts/soak.mjs` runs a finite YouTube Shorts check with the built extension in its own fresh, signed-out Playwright Chrome for Testing profile. It leaves the shipped defaults intact, scrolls after 30 seconds on a kept video and uses the normal Continue button at the six-skip pause. It records counts, errors and minute checkpoints, including the local daily counter across midnight. This is automated QA, not ordinary human day-use or signed-in platform endurance.

```bash
npm run zip
node scripts/soak.mjs qa/tmp/soak-new-run 86400000
```

Use a new output directory for every run; the script refuses an existing profile. The optional third argument is an immutable unpacked extension directory; the optional fourth is a summary JSON path. Output contains local QA evidence and is ignored by Git. Ctrl-C stops the run cleanly and closes only its browser context. A persistent task-owned tmux session can keep it running across terminal disconnects.

The runner now counts actual manual transitions separately from key attempts. After two attempts fail to change the video, it records a screenshot and reloads the same public page without resetting the profile, settings, daily count or duration. Recovery is bounded to twelve reloads, at least ten minutes apart; repeated failure after a reload stops the run for review. Page navigation can replace the execution context and is retried; unrelated errors and a closed page remain failures. Recoveries must be reviewed, never presented as uninterrupted scrolling.

`completed` means the duration finished, not an automatic release approval. Review movement times, checkpoints, errors, counters, recovery records and the final frame. An error without an extension URL in its stack is not proof that ScrollPlus is uninvolved. The run complements ordinary human day-use and does not verify signed-in TikTok or Instagram.

## 0.3.3 attempt, 2026-10-07 — interrupted

The exact tested ZIP (SHA-256 `dd2ed7042783a53044fc682cf759e674b0622301d548fedb98da6f85d331e2a1`) ran for 3 hours 7 minutes. It recorded 498 distinct videos, 489 with known likes, 204 below the default minimum, 203 observed movements with a skip chip and no page errors. The sampled chip count is not an exact count of every skip.

The sample count stopped increasing. A native screenshot of the task-owned browser showed a playing 29K-like Short; normal Next also did not change its URL. A normal refresh destroyed the page execution context, which the old runner treated as fatal; its `finally` then closed its own browser. This establishes a QA-harness failure, not an extension/browser crash or the cause of the feed's earlier lack of movement. No full-duration pass is claimed. The original profile, report, process log and UI inspection journal remain under `qa/tmp/soak-033-20261007`.

## Navigation recovery validation

A real browser regression replaces the document while evaluation is pending, verifies that the navigation is retried, and confirms that other errors and a closed page still fail. A movement regression distinguishes attempts from transitions and checks recovery limits.

A separate two-minute real YouTube run completed on 0.3.4 after a normal native refresh: one navigation retry, four known-count videos, three actual manual movements, unchanged defaults/counter and no page errors. This verifies the runner's recovery path, not a long-duration pass. Local evidence: `qa/tmp/soak-navigation-smoke-034-20261007`.

## 0.3.4 successor, 2026-10-07 — running

The previous worker/browser ended before this run started. A new immutable extension and fresh profile use the exact 0.3.4 ZIP, SHA-256 `f214c62f29c87788d935d5d935472c2fa3577a4fac10a954b31cd17c62f28626`.

Started `2026-10-07T13:08:52.925Z` (22:08 KST); expected end `2026-10-08T13:08:52.925Z` (22:08 KST), with the full 24-hour duration unchanged. The final result is pending. The actual worker is retained in the task's tmux session, with its immutable extension, fresh profile, report, process log and harness fingerprints under `qa/tmp/soak-034-20261007`. The review page receives only its small summary JSON.

The 0.3.3/0.3.4 ZIP comparison found identical YouTube MAIN/isolated scripts and background counter, but the interrupted earlier run is retained only as partial evidence. The successor tests the full 0.3.4 package; it still does not replace ordinary human day-use.
