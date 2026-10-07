# Grid restoration regression · 0.3.3

2026-10-07, built Chrome extension against a controlled TikTok profile grid. This checks the shipped controller and shared card-discovery helper, not the site's current signed-in markup.

Before the fix, a 10-like card was hidden when the minimum was 5,000. Lowering the minimum to 5 left it hidden. Turning grid filtering off also left it hidden. All three browser assertions failed: visibility after lowering, visibility after disabling, and removal of the extension's marker.

Hidden cards have a zero-height box. Card discovery rejected them before the controller could restore them. Discovery now includes cards carrying ScrollPlus's own hide marker so the ordinary rule/settings path can recheck them.

The regression uses the actual settings UI to enable grid filtering, lower/raise the likes minimum and disable grid filtering. It also confirms that passing cards and unknown-count cards remain visible, and a card originally hidden by the site is not marked or exposed.

Run `npm run build`, then `npm run test:e2e -- e2e/grids.spec.ts`. Grid filtering remains off by default.
