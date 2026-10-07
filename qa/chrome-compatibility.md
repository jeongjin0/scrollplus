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
