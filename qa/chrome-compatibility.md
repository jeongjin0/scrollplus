# Chrome compatibility checks · 0.3.5

The manifest declares Chrome 120 or newer. CI now runs the existing browser suite in both the current Playwright Chromium and **Chrome for Testing 120.0.6099.109** on a GitHub Ubuntu runner. The minimum-version job checks the executable's version before running the tests, and both ordinary fixture pages and persistent extension contexts use that executable.

## Verified scope

On 2026-10-08 KST, the [Chrome 120 job](https://github.com/jeongjin0/scrollplus/actions/runs/37658840405/job/112920835650) passed all 23 cases at source `fa711b28e376d90fb518e0e3e495aecd9db0159f`. They cover:

- Fresh defaults, EN/KO popup layout, typed minima, presets, platform switches and Reset.
- Built scripts on controlled YouTube, TikTok For You/Following/video and Instagram routes: skip, Undo, reload, new tab and saved creators.
- Concurrent storage writes, RAM-only Undo choices, and actual browser close/reopen clearing temporary choices while preserving local settings and counts.
- Grid restoration, network observation, TikTok preview exclusion and the QA runner's navigation/recovery behavior.

The CI job builds from source. These routed fixtures do not establish compatibility with every current website experiment or a signed-in live feed. Actual 0.3.5 YouTube evidence is recorded separately in [session-undo.md](session-undo.md); long QA and remaining release gates are in [release-readiness.md](release-readiness.md).

A local current-browser control also passed all 23 cases using the unpacked, immutable 0.3.5 release ZIP, SHA-256 `2404780bd90de021f335551c35c03b8476ed6be214945ca21f553cc864f966fa`.

## Startup and failure diagnostics

A [subsequent Chrome 120 run](https://github.com/jeongjin0/scrollplus/actions/runs/37662195506/job/112932256856) on a documentation-only change passed 21 cases and failed two: the launcher accessed `chrome.storage.local` while storage was unavailable in the worker context, and the YouTube adapter case exceeded its 30-second limit. Its counterpart PR run passed, but that does not erase the failed run. The original timeout log has no trace, so its exact phase and cause remain unestablished.

The test launcher now selects an extension worker and polls for its storage API and initialized defaults before returning it. Startup failures close the test's own context and retain the original error. Tests retain traces on failure, and CI uploads `test-results/` for diagnosis. The existing timeout and assertions remain in force.

An isolated, intentionally failed extension-page check verified that manually launched contexts retain frame snapshots and the actual error in a valid trace ZIP. This checks diagnostics, not product behavior. The current-browser release-ZIP control passed all 23 cases with the updated launcher and tracing enabled.

### Traced cold-start timeout

The [0.3.5 QA documentation main run](https://github.com/jeongjin0/scrollplus/actions/runs/37683435521/job/113005049134) passed 22 cases and timed out in the YouTube adapter case. Its retained trace shows persistent-browser launch taking 19,852ms of the 30-second test budget. Initial keeping, message rejection, creator lookup, default skip/reason/count, Undo and reload assertions passed. The timeout occurred during the 2.2-second new-tab retention observation. The cause of the slow launch, and the earlier untraced timeout, remain unestablished.

Adapter cases now launch their isolated extension browser in a fixture with its own 30-second setup budget. Their functional test budget remains 30 seconds, with every assertion and retention observation unchanged. Startup can still fail within its own bound; no retry or optional test is added. Fixture cleanup closes the test-owned context. [Playwright documents separate fixture timeout budgets](https://playwright.dev/docs/test-fixtures#fixture-timeout).

A controlled local probe inserted the same 20-second executable startup delay into a fresh current-browser launch with the immutable 0.3.5 extension. The original case timed out at 30 seconds; the fixture version completed every original action and assertion without retries. This verifies setup-budget isolation, not the cause of Chrome 120's slow launch.

### Reset and transient Undo observation

The first local full-suite run after the fixture change passed 22 cases and timed out waiting for Undo after Reset on the TikTok video route. The trace and frames show the 10-like reason/Undo chip after the actual reset click; it faded out before the test continued from the settings-page action. The chip's normal hold is 2.5 seconds. The reset action's traced API returned about 3.1 seconds after its browser click completed, so the following Undo lookup began after the affordance had expired. The underlying cause of that delay is unestablished.

The reset action and its resulting skip/count/Undo checks now run together: the test still observes the second video and count 2 before clicking actual Undo, then verifies the first video was restored. Every assertion and retention observation stays in force. No product timer or retry changes, and the failed run/trace are retained as local evidence under `qa/tmp/startup-budget-035/`.

A controlled current-browser probe added the same 3.5-second delay after the reset click to both flows. Sequential observation timed out waiting for the expired Undo; concurrent observation passed every original check without retries. The product timer and browser clock were unchanged.

### CI setup deadlines

An observed [hosted branch job](https://github.com/jeongjin0/scrollplus/actions/runs/37665127912/job/112942286446) remained in system dependency installation for over 90 minutes before any browser tests ran. Its completed counterpart installed those dependencies in 100 seconds; the current-browser install, including its download, took about eight minutes. These observations do not establish the cause of the delayed job.

Future CI jobs have a 60-minute limit, with 30 minutes for Playwright dependency/browser installation and 10 minutes for the pinned Chrome 120 download. A deadline failure remains a failed check. Every existing test, assertion and 30-second test limit remains in force; tests are neither omitted nor made optional. [GitHub documents the job and step deadline settings](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idtimeout-minutes).

The separate 24-hour real-feed check runs on the task host outside this workflow. These CI limits do not shorten or restart that check.

## macOS 27 limitation

The official mac-arm64 Chrome 120.0.6099.109 download was checked against its vendor MD5 and ZIP integrity. Its version command succeeded, but browser tests on macOS 27 ARM64 exited with `SIGTRAP` before a page opened. A separate fresh-profile, no-extension `about:blank` control reproduced the same exit without Playwright. Thus the extension is not required for this startup failure; its underlying cause was not established. This attempt is neither a Chrome 120/macOS compatibility pass nor an extension regression. No OS security settings or existing browser profiles were changed.

## Reproduce with a selected browser and release ZIP

Use an official executable from [Chrome for Testing](https://github.com/GoogleChromeLabs/chrome-for-testing). CI pins the version and download URL in [ci.yml](../.github/workflows/ci.yml).

```sh
npm ci
npm run compile
SCROLLPLUS_CHROME_EXECUTABLE="/absolute/path/to/chrome" \
SCROLLPLUS_EXTENSION_PATH="/absolute/path/to/unpacked-0.3.5" \
npm run test:e2e
```

On Linux, run the last command under Xvfb as CI does. When the variables are absent, tests use the usual Playwright browser and `.output/chrome-mv3`; run `npm run build` first in that case. These are test-only overrides, not extension settings.
