# Long feed QA

`scripts/soak.mjs` runs a finite YouTube Shorts check with the built extension in its own fresh, signed-out Chrome profile. It leaves the shipped defaults intact, scrolls after 30 seconds on a kept video and uses the normal Continue button at the six-skip pause. It records counts, errors and minute checkpoints, including the local daily counter across midnight.

```bash
npm run zip
node scripts/soak.mjs qa/tmp/soak-new-run 86400000
```

Use a new output directory for every run; the script refuses an existing profile. The optional third argument is an immutable unpacked extension directory; the optional fourth is a summary JSON path. Output contains local QA evidence and is ignored by Git. Ctrl-C stops the run cleanly and closes only its browser context. A persistent task-owned tmux session can keep it running across terminal disconnects.

`completed` means the duration finished, not an automatic release approval. Review the checkpoints, errors, counters and final frame. An error without an extension URL in its stack is not proof that ScrollPlus is uninvolved. This automated run complements ordinary human day-use and does not verify signed-in TikTok or Instagram.

## 0.3.3 run, 2026-10-07

Started from the exact tested ZIP (SHA-256 `dd2ed7042783a53044fc682cf759e674b0622301d548fedb98da6f85d331e2a1`) in a fresh isolated profile. Target duration: 24 hours. Initial real-feed samples and a default-rule skip were recorded with no page errors. The full-duration result is pending; no day-use pass is claimed.

The immutable extension, profile, report and process log are retained locally under `qa/tmp/soak-033-20261007`. The existing review page receives only the small summary JSON, never the profile or raw QA directory.
