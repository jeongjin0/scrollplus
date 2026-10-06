# Kept

Scroll stays. Low-response videos do not.

Kept is a Manifest V3 extension for Chromium. After you install it, YouTube Shorts, TikTok, and Instagram Reels use a Balanced filter with no account and no setup. Videos with enough plays and a weak response are skipped. If Kept cannot read the counts, the video stays.

Kept is not affiliated with YouTube, TikTok, or Instagram.

## Install unpacked

```bash
npm install
npm run build
```

Open `chrome://extensions`, turn on Developer mode, choose Load unpacked, and select `.output/chrome-mv3`.

Chrome 120 or newer. The popup is optional. Star the repo from the popup or here: https://github.com/jeongjin0/kept

## Develop

```bash
npm test
npm run test:e2e
npm run compile
npm run dev
```

The product rules are in SPEC.md.

## Privacy

Settings and today's skip count stay on the device. See PRIVACY.md. Kept does not collect or transmit data.
