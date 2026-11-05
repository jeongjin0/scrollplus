# Chrome Web Store update test instructions · 0.7.6

Use desktop Chrome 120 or later. ScrollPlus does not require an account. YouTube Shorts can be tested while signed out; Instagram Reels is experimental and requires an Instagram sign-in.

1. Install 0.7.6 in a fresh profile. Open the extension popup and check that filtering is on, Balanced is selected (500 likes), and Skip notifications is off.
2. Open YouTube Shorts and find a video under 500 likes. It should advance with no on-page notice. While still on the following video, click Undo in the toolbar popup to return to the skipped video. If that video also skips, Undo targets the latest adjacent skip.
3. After six consecutive skips the popup shows Keep going and Lower the bar, even with notifications off.
4. Turn on Skip notifications. On a subsequent skip with room left of the video, look for the count and Undo. Settings can switch the style to Detailed. Reset to defaults returns notifications to off.
5. When updating an existing installation, a saved on or off choice is preserved. No new permissions or data processing are introduced.
