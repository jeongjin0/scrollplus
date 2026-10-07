# Chrome Web Store submission checklist

Nothing here has been submitted. This is what to have ready when the owner decides to publish.

## Before you start

- A Chrome Web Store developer account (one-time registration fee).
- Search the store for "ScrollPlus" yourself and check the name is free and not confusingly close to another extension. A trademark search is not done.
- Install the zip on a clean Chrome profile and use it for a day on your own feed.

## Package

- Upload `scrollplus-<version>-chrome.zip` (`npm run zip`, also attached to the GitHub release).
- Manifest version 3, permissions `storage` only, host permissions for youtube.com, tiktok.com, and instagram.com.

## Store listing

- Title, summary, description, single purpose: [listing.md](listing.md), English and Korean.
- Icon: `public/icon/128.png`.
- Screenshots, 1280 by 800: `store/screenshots/` (English), `store/screenshots/ko/` (Korean).
- Small promo tile, 440 by 280: `store/tile.png` (English), `store/tile-ko.png` (Korean).
- Category: Social & Communication is the closest fit.
- Privacy policy URL: https://github.com/jeongjin0/scrollplus/blob/main/PRIVACY.md
- Support URL: https://github.com/jeongjin0/scrollplus/issues
- Website: https://github.com/jeongjin0/scrollplus

## Privacy practices tab

- Single purpose: skip YouTube Shorts, TikTok videos, and Instagram Reels that have too few likes, using counts already on the page.
- `storage` justification: keeps the user's settings (rule, site switches, creators to keep) and today's skip count on their device.
- Host permission justification: on these three sites only, the extension reads the like, comment, and view counts the page has already loaded, and presses the page's own next-video control to skip a video. It does not call any site API of its own.
- Remote code: none. All code ships in the package.
- Data collected: none. The extension does not collect, transmit, or sell user data, so leave every data-collection box unchecked.
- Certify that data is not sold, not used for unrelated purposes, and not used for creditworthiness or lending.

## After approval

- Add the store link to the README and the repo description.
- Move `store/` copy changes through pull requests like any other change.
