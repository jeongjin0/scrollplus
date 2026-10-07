# Preset basis

This project's working name was Kept until 0.2.1. Older entries below use it.

Date: 2026-10-07

The rule is a like count, so the presets are round numbers a person can read at a glance: 1K, 5K, and 20K. They were picked by looking at how many sampled videos each would skip. These are small logged-out samples, not a study. They show the order of magnitude, nothing more.

Samples are public ids and counts only, in qa/samples/. Like counts were read from what the page itself loaded.

| Preset | Likes under | YouTube Shorts (39 with a like count) | TikTok (23) |
| --- | --- | --- | --- |
| Lenient | 1,000 | 5% | 0% |
| Balanced | 5,000 | 13% | 17% |
| Strict | 20,000 | 18% | 43% |

Balanced skips roughly one video in six to eight in these samples, which is enough to notice and light enough not to empty a feed. Lenient is a safety net. Strict is for people who want only popular videos.

Instagram was not sampled because no signed-in session was available. Its default is the same 5,000.

The rule has no minimum number of plays. That is deliberate: a brand-new video with a handful of likes is skipped like any other. The Lenient preset and the stepper are there for people who would rather give new videos room.
