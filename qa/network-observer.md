# Network observer regression · 0.3.2

2026-10-07, real native fetch and XMLHttpRequest in isolated Chromium against controlled local HTTP responses. This checks the observer used by the TikTok and Instagram MAIN scripts; it does not establish signed-in site compatibility.

## Reproduced before the fix

One XHR was reused for four responses: three matching JSON responses and one unrelated response. The host read each response in a load handler and immediately reopened the same object for the next request. The old observer added a load listener on every `send`, so listeners accumulated. The failing browser assertion showed a missing first response, a null observation and repeated observations of the last response.

Attaching only one load listener removed duplicates but still missed the first response: the page's earlier load handler could reopen the XHR before the observer read it. The completed response is now read on `readystatechange` at `DONE`, before ordinary load handlers run, with one listener per XHR tracked in a WeakSet. Failed requests with status 0 are ignored.

The observer also used the raw input URL. A relative feed request did not match consumers that check the site hostname. Fetch and XHR now use their native `response.url` / `responseURL`, which reflects the actual absolute response URL without re-coercing or replacing the caller's request.

## Verified contracts

| Browser check | Result |
| --- | --- |
| Fetch receives the original Request method, header and body | Preserved |
| Caller gets the exact original fetch Promise and Response | Preserved |
| Observer reads/mutates a cloned JSON payload | Host body remains unconsumed and unchanged |
| Installing the observer twice | One observation |
| Reuse one native XHR across matching/nonmatching JSON/text responses | Each matching response observed once; all host statuses and bodies preserved |
| Invalid JSON, throwing matcher/ingester and failed fetch | Host results/rejection identity preserved; no uncaught observer errors |

The built TikTok fixture obtains counts through a relative `/api/item_list` request, rather than embedded JSON, to cover the shipped integration. Synthetic site DOMs remain explicitly distinct from real signed-in site QA.

Run `npm run build`, then `npm run test:e2e -- e2e/observe.spec.ts e2e/adapters.spec.ts`. The harness export exists only in the fixture bundle and is excluded from the production package.
