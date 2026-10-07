# Contributing

Read SPEC.md before changing behavior. If a rule is not in that file, do not add the feature.

```bash
npm ci
npm run compile
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run zip
node scripts/check-package.mjs
```

Load `.output/chrome-mv3` as an unpacked extension. Do not submit a fork to the Chrome Web Store on behalf of this project.
