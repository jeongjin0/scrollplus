# ScrollPlus launch roadmap

Updated 2026-11-05. The public [Store listing](https://chromewebstore.google.com/detail/bpiliaicdpeflblgjneilaphgjkgfmja) and Chrome update service both serve **0.7.5**. The owner chose Free/Public distribution with automatic publication after review.

## Current update

The owner approved a quieter default and a new Store update on 2026-11-05. Version **0.7.6** turns off in-feed skip notifications on new installs and on reset, preserves saved choices, and retains popup Undo and six-skip recovery. See the [update checkpoint](store/update-076.md) for the submission and delivery state.

## Remaining product validation

Scoped new-version YouTube checks and controlled three-site regressions do not establish all signed-in variants or ordinary day-long use. Current TikTok followed-positive relation persistence, broader ad variants and full-day human use remain open. Reels stays experimental. Historical native evidence remains in [0.7.4 QA](qa/release-readiness-074.md), [signed-in smoke](qa/signed-in-smoke.md) and [release readiness](qa/release-readiness.md).

A proposed manual-feedback beta with roughly 5–10 people for 3–7 days can ask: did it skip wanted videos, did Undo work, was the notice distracting, did the defaults filter enough, and would they keep it enabled? No telemetry or account is required. The numbers are operating suggestions, not a Google requirement or statistical validation. Contacting people, a paid domain or a separate website is outside this update.

Keep using the current GitHub introduction, privacy and support URLs. No new domain or purchase is needed for the Store update.

## Domain recommendation

**Use the existing GitHub introduction, policy and support URLs for the beta.** The owner wants to keep new spending cautious; a dedicated domain can wait for usage feedback. If an independent product address is later chosen, prefer `scroll.plus`: it spells the selected product name with the dot and works for all three sites. `scrollplus.com` being taken does not require renaming. No search-ranking or conversion uplift is assumed.

The exact `scroll.plus` search on Porkbun showed an Add-to-cart option, **$9.78 for the first year and $47.89/year renewal**, on 2026-10-13. It matched the published standard `.plus` tier; no separate premium label was shown on the result. Availability and the final checkout quote can change. The [exact search capture](qa/screenshots/launch-readiness-20261013/scroll-plus-price.png) records the quote. [Porkbun .plus pricing](https://porkbun.com/tld/plus), [renewal-price guidance](https://kb.porkbun.com/article/108-how-to-check-domain-renewal-price).

| Option | Best use | Tradeoff |
| --- | --- | --- |
| `scroll.plus` | Recommended for a product intended to continue independently | Another annual renewal; people may need the dot spelled out |
| `scrollplus.<owned personal/company domain>` | Lowest additional domain cost for an experiment | Longer address and a parent-brand association; hosting/renewal of the parent still needs maintenance |
| `scrollplus.drifty.so` | Concrete subdomain example under the existing Drifty domain, if the owner wants that association | Can imply it is part of the Drifty product family; not selected or provisioned |
| GitHub repository / GitHub Pages | Minimal public beta home and policy/support links | Less independent presentation; Pages must be configured before treating its URL as live |

Choose one canonical homepage. If the dedicated domain is bought, put the actual site there; avoid publishing one address only to immediately redirect testers to another. A subdomain can be used initially without changing the extension name. A custom domain is not a reason to delay preparation of the Store package: existing public GitHub policy/support URLs are already available.

Suggested dedicated-site routes: `/`, `/privacy`, `/support`. Keep website data handling separate from the extension policy. The simple proposed website needs no analytics or contact form; GitHub Issues can provide support.

The exact checkout/purchase and the canonical parent domain, if using a subdomain, remain the owner's choice. Other owned domains were not established by the read-only checks, so they are not invented as candidates.

## Submission issues already found

- Removed the instruction to leave every data checkbox unchecked solely because the extension has no server. Local data handling must still be disclosed. [Google User Data FAQ, questions 3 and 14](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).
- Explained the page-memory cache, temporary video identifiers, creator allowlist, aggregate counters, follow signals, retention/removal and Limited Use in the policy. These document existing behavior; they do not add storage or transmissions.
- Qualified the listing's followed-creator promise: the site must expose the relation; otherwise the count rules apply.
- Saved the draft's mapping of the inspected data categories and completed publisher contact verification. These declarations still need a final package/policy review before submission; no Google review approval is claimed.

Scope evidence: [release readiness](qa/release-readiness.md), [foreground hardening](qa/foreground-hardening-072.md), [latest beta](https://github.com/jeongjin0/scrollplus/releases/tag/v0.7.2).
