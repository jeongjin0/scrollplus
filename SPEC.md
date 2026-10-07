# Kept specification

This file is the product spec. Implement it. Do not add features that are not written here. If a rule is missing, leave the behavior out and record the gap in qa/gaps.md. Read this file before coding and again before calling the work done.

Status: ready to implement. Decisions below are locked.

## Product

Kept is a Manifest V3 Chromium extension. After install, with no account and no setup, it skips low-response videos while the user scrolls short-form feeds.

Platforms:

- YouTube Shorts on https://www.youtube.com/shorts/
- TikTok on https://www.tiktok.com/ For You, Following, and video pages
- Instagram Reels on https://www.instagram.com/ when the user is already signed in

The scroll stays. Kept never empties a feed, never hides all shorts, and never blocks the sites.

English line: Scroll stays. Low-response videos do not.

Korean line: 설치하면 바로 적용됩니다. 쇼츠, 릴스, 틱톡에서 반응이 약한 영상만 넘깁니다.

## Repository

- Local directory: /Users/jeongjin/Developer/edgethink/kept
- Public GitHub repo: github.com/jeongjin0/kept
- If that name is taken, use kept-extension and update the Star link, README, and store copy to match
- License: MIT
- Version: 0.1.0
- Do not put this project in the Obsidian vault
- Do not submit it to the Chrome Web Store

## Non-goals

Do not build any of these:

- AI or model classification
- Keyword, topic, or channel blocklists other than the creator allowlist
- Hiding all Shorts, Reels, or TikTok
- Ad skipping, downloaders, auto-like, auto-follow, or auto-comment
- Accounts, sync, payments, analytics, servers, or remote code
- Firefox, Safari, mobile apps, or embedded players on other sites
- m.youtube.com, music.youtube.com, and non-www TikTok or Instagram hosts
- A view-count filter on shelves and grids

## Defaults

On install, write these defaults and apply them immediately. The extension must work if the user never opens the popup.

    {
      "enabled": true,
      "sensitivity": "balanced",
      "platforms": { "youtube": true, "tiktok": true, "instagram": true },
      "filterGrids": false,
      "showSkipChip": true,
      "allowlist": [],
      "advanced": null,
      "signals": { "likes": true, "comments": true, "shares": true, "saves": true }
    }

advanced null means the calibrated preset cutoffs are used. A saved advanced object replaces the cutoff and sample floor for that platform only.

There is a master switch. Default is on. Turning it off pauses every platform without deleting settings.

## Scoring

Use this score when views is a number greater than zero:

    (likes + comments * 3 + shares * 4 + saves * 4) / views

Omit a numerator field when it is null or when that reaction is turned off in settings. Do not treat null as zero. Views of zero or null cannot produce a score. All four reactions start on.

Provisional Balanced cutoffs are a starting point, not a researched constant. Public engagement averages disagree, and YouTube has counted a Shorts view at play start since 2025-03-31, so a raw view floor is the wrong default.

| Platform | Sample floor | Weighted score cutoff |
| --- | --- | --- |
| YouTube | 2,000 views | 0.8% |
| TikTok | 3,000 plays | 3.0% |
| Instagram | 2,000 plays | 1.0% |

- Lenient uses half the cutoff. Strict uses double the cutoff. The sample floor does not change with sensitivity.
- Skip when a score exists, views are at or above the sample floor, and the score is below the cutoff.
- Also skip when views are at least 800 and every enabled reaction among likes, comments, and shares is present and zero. Saves may be null. A turned-off reaction is not required.
- If views are null, keep the video.
- If the score cannot be computed, keep the video.
- If the creator is allowlisted, keep the video.
- If the platform is off or the master switch is off, keep the video.
- Ads, photo carousels, and items with no metrics are kept.

### Calibration

During live QA, save public item ids and counts only, under qa/samples/. No cookies, titles, captions, or account data.

Adjust the Balanced cutoff so that, among items at or above the sample floor, 20-30% are skipped. Do this per platform. If a platform has fewer than 40 such items, keep the provisional cutoff and write that in qa/calibration.md.

Lenient and Strict stay at 0.5x and 2x the calibrated Balanced cutoff.

### Grids and shelves

Home shelves, channel grids, profile grids, and search grids are not filtered unless filterGrids is on. Default is off.

When filterGrids is on, use the same scorer. A card that only exposes a view count is kept, because a rate cannot be computed.

## Skip behavior

This applies to the active vertical player only.

- Wait up to 700ms for metrics. If they arrive within 2 seconds of the video opening, score them. After that, keep the video. Never skip blind.
- Advance with the site's own next control. On YouTube, click that control from the page script; an isolated-world click does not change the Short. If the control is not ready, retry until 5 seconds after the video opened, then stop. Do not delete DOM nodes. Do not restyle the host page.
- At least 450ms between automatic advances. Never advance in parallel.
- Stop after 6 consecutive skips. Show a non-modal chip: "The next ones are under your bar." Korean: "다음 영상도 기준 아래입니다."
- Actions on that chip: "Keep going" / "이어서 보기" resets the cap for another 6. "Lower the bar" / "기준 낮추기" moves Strict to Balanced, or Balanced to Lenient, then continues. On Lenient, only "Keep going" is shown.
- Do not advance while a comment field is focused, the pointer is down, or a menu is open.
- If the next control does not exist, stop and leave the current video. Do not loop.
- The extension's only host-page UI is the chip. No banner, no sidebar, and no restyling of YouTube, TikTok, or Instagram.

When a skip happens and showSkipChip is on, show "Skipped" / "넘김" with "Undo" / "되돌리기" for 2.5 seconds. Undo moves back one item and keeps that id for the browser session. Undo does not write the creator allowlist.

A session keep-set is memory only. Do not persist video ids.

## Allowlist

Empty by default. The popup action "Keep this creator" / "이 제작자는 유지" adds the current creator.

Store stable ids:

- YouTube: channelId
- TikTok: uniqueId without @
- Instagram: username, lowercased

Match on that id. The popup can remove entries. The allowlist survives restarts. The session undo set does not.

## Popup and options

The popup is 320 wide and no taller than 420. It does not scroll in the default state.

Popup contains only:

- Wordmark: Kept
- Master status, acting as the on/off switch
- Segmented control: Lenient, Balanced, Strict. Korean: 느슨, 기본, 엄격
- One row of three site chips: YouTube, TikTok, Reels. Changes apply immediately. No save button.
- One line showing the live bar for each site that is on.
- A conditions link that opens the options page.
- Today's skip count, for example "18 skipped today" / "오늘 18개 넘김"
- "Keep this creator" when a supported video is active
- Footer link: "Star on GitHub" / "GitHub에 Star"

If Instagram metrics are unavailable because the user is signed out, the popup says "Instagram is signed out. Nothing is hidden." Korean: "인스타그램에 로그인되어 있지 않습니다. 숨기지 않습니다." Do not show this as a modal on instagram.com.

Options contains the master switch, the three presets, and the conditions. Each site has its own on/off control, minimum plays, and Balanced bar. Lenient stays half of that bar and Strict stays double. The reaction chips choose which of likes, comments, shares, and saves enter the score. Options also has allowlist management, the grid filter, the chip toggle, reset to defaults, a one-line privacy statement, and the same Star link.

Reset restores the defaults in this spec, including all four reactions and the calibrated cutoffs.

The toolbar icon has no number badge.

Star on GitHub opens the public repo in a new tab. It appears in the popup, the options page, and the README. It is never injected into a host site.

## Visual system

- Background #10110F
- Surface #1A1B17
- Text #F4F1EA
- Muted text #A8A396
- Accent #FF4D2E, used only for the mark, the on state, and the skip chip

No purple gradients, glassmorphism, or runtime web fonts. UI text uses ui-sans-serif. A wordmark font is allowed only if the OFL file is bundled in the extension.

Motion is ease-out, about 180ms. The skip chip fades in over 120ms and out over 200ms. No bounce.

The icon is a vertical frame with the bottom cleanly cut away. It must be recognizable at 16px. Generate 16, 32, 48, and 128 sizes from that mark.

Store screenshots are original compositions. Do not copy the YouTube, TikTok, or Instagram logos or interfaces, and do not imply affiliation.

## Data and permissions

All scoring is local. Do not add a backend.

Permissions:

- storage
- host access limited to https://www.youtube.com/*, https://www.tiktok.com/*, and https://www.instagram.com/*

No all-urls permission, and no tabs, cookies, webRequest, history, or identity permission.

Persist only settings and a daily skip count in chrome.storage.local. Reset the count at local midnight. Do not persist watch history or video ids.

Read metrics the page has already loaded. Do not call private APIs yourself.

- YouTube: read player and reel data YouTube already placed on the page, including ytInitialPlayerResponse and reel renderers updated on navigation. Ignore ad requests.
- TikTok: read __UNIVERSAL_DATA_FOR_REHYDRATION__, SIGI_STATE when present, and feed JSON the page itself requested. Use playCount, diggCount, commentCount, shareCount, and collectCount.
- Instagram: read reel counts in responses Instagram already requested for the page. Use like, comment, and play or view counts. If counts are hidden or the user is signed out, keep every reel.

A fetch observer must call the original fetch and return the original response untouched. Errors in Kept must not break the host page.

PRIVACY.md states that Kept does not collect, transmit, or sell user data, lists the storage keys, and gives the GitHub repo as the contact. The same statement belongs in the options page and store/listing.md.

README and the store listing say Kept is not affiliated with YouTube, TikTok, or Instagram.

## Implementation

- WXT, TypeScript, React for the popup and options, and hand-written CSS
- No UI component library
- Vitest for the scorer
- Playwright against local fixture pages, not live sites, for extension behavior
- Content scripts are static. A MAIN-world script may read page data and pass metrics to the isolated world.
- Platform adapters live separately for YouTube, TikTok, and Instagram
- The scorer is a pure function with no DOM access
- Discover current selectors during implementation. A selector miss means keep. Never skip because parsing failed.
- Chrome 120 or newer

Repository files:

- README.md with what it does, unpacked install, development, privacy, the affiliation disclaimer, and the Star link
- LICENSE, MIT
- PRIVACY.md
- CONTRIBUTING.md
- SECURITY.md
- .github/ISSUE_TEMPLATE/
- .github/workflows/ci.yml running typecheck, test, and zip build
- .gitignore
- store/listing.md in English and Korean
- qa/live-smoke.md
- qa/calibration.md

Store title: Kept — Quality filter for Shorts, Reels & TikTok

Store assets:

- icons at 16, 32, 48, and 128
- one 440 by 280 tile
- three 1280 by 800 screenshots
- English and Korean listing copy, including the single-purpose sentence used for review

Single purpose: skip low-response YouTube Shorts, TikTok videos, and Instagram Reels using counts already on the page.

## Acceptance

The work is done only when all of these are true:

1. npm test passes. Scorer tests cover allowlist, null views, sample floor, zero engagement, missing numerator fields, and all three sensitivities.
2. Playwright fixture tests prove a skip, the 6-skip pause, undo, and fail-open when metrics are missing.
3. The production build is green, the unpacked extension loads, and a zip exists.
4. qa/live-smoke.md records a dated YouTube Shorts smoke of 20 items and a TikTok smoke of 20 items. Instagram is 20 items only if a signed-in session exists. If it does not, the file says Instagram was not verified. Do not mark it passed.
5. YouTube live smoke has actually been run. A fixture-only run is not done.
6. Popup and options match this spec at 1x and 2x, with no default popup scroll.
7. Fixture pages show no Kept-caused console errors.
8. Store copy and images exist, and no image implies affiliation.
9. The public GitHub repo exists and contains this spec, the source, the license, and the privacy policy.
10. Nothing in the non-goals list was shipped.

## Start prompt

This block is for the human starting the Codex goal. It is not an extra product requirement.

    Build Kept from /Users/jeongjin/Developer/edgethink/kept/SPEC.md. That file is the spec. Read it before coding and again before you call the work done. Create the public MIT repo github.com/jeongjin0/kept. Do not submit to the Chrome Web Store. Done means npm test and the production build are green, the zip and store assets exist, and qa/live-smoke.md records a real YouTube Shorts smoke. If a rule is missing from SPEC.md, do not invent a feature.
