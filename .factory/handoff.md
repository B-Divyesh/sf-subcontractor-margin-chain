# Polish 3 handoff

Date: 2026-08-29 UTC

Work order: `subcontractor-margin-chain-polish-3`

Live URL: <https://subcontractor-margin-chain.sociobot.in>

Application repair commit: `daeafcd9b980ae6881ccb45d6860caba61d84a81`

## What shipped

- Producer and viewer responses now redact contracting client, end client, subcontractor records, cost totals, margin values, and risk causes. The server enforces permissions on list, detail, and write routes.
- A session gate sends fresh `/app/*` deep links to `/start`, preserves the requested path, avoids a failing API request, and restores route focus.
- Saved agencies can map, dry-run, confirm, and import CSV rows through `/app/import`, then export their saved chains as local CSV or JSON files.
- The product is described honestly as a free beta. Pricing navigation, planned-price claims, and checkout implications were removed.
- The sitemap lists `/start` and no longer lists the intentionally failing `/404` URL.
- Titles, metadata, canonical URLs, focus, the designed 404, legal links, small-screen first view, 200% zoom, and the compact wordmark were rechecked.
- Public language now consistently uses “client invoice milestone” and “client invoice milestone status.”
- Demo and saved-agency production records use separate shared Azure Blob containers, while only-`PORT` local startup falls back to separate durable directories.
- `.factory/claims.json` now has 34 executable claims. The catalog description is verb-first and 116 characters.

The carbon-copy ledger identity remains intact: warm paper, ruled records, cyan duplicate sheets, red/yellow risk marks, Newsreader headings, and Recursive body text.

## Exact verification evidence

- Clean clone: `/tmp/smc-polish3-clean-Xm9XpK` at `daeafcd9b980ae6881ccb45d6860caba61d84a81`.
- Claim gate: all 34 exact commands from `.factory/claims.json` passed independently.
- `npm run check`: passed 11 Vitest tests, a production Vite build, rustfmt, Clippy with warnings denied, and 28 Rust tests.
- `npm run test:e2e`: passed 78/78 from the clean clone across desktop and 390px Chromium.
- Live `PLAYWRIGHT_BASE_URL=https://subcontractor-margin-chain.sociobot.in npm run test:e2e`: passed 78/78.
- Accessibility: all nine public/demo routes and the restricted producer state had zero serious or critical axe findings; keyboard, focus, visible-name, zoom, and touch-target tests passed.
- Privacy: `@claim:m1-public-privacy` recorded only same-origin requests; `@claim:real-beta-no-billing` recorded no billing or checkout traffic.
- Offline/error state: `the demo explains a failed or offline load` passed in both browser projects.
- Production build: 89.20 KiB gzip JavaScript and 5.97 KiB gzip CSS.
- Local Lighthouse: performance 98, accessibility 100, best practices 100, SEO 100; LCP 2.071s, CLS 0.027, TBT 21.5ms.
- Live Lighthouse: performance 99, accessibility 100, best practices 100, SEO 100; LCP 1.651s, CLS 0.027, TBT 4ms.
- Factory container build/deploy: Azure Container Registry run `chu1` succeeded.
- Cold live check: `/health` returned `daeafcd9b980ae6881ccb45d6860caba61d84a81`; `/ready` returned both stores as `azure-blob-shared`; `/`, `/demo`, `/start`, `/privacy`, and `/terms` returned 200; an unknown path returned 404.
- Factory URL verifier: 672ms load, no console errors, one H1 and main, `lang=en`, no missing alt text, and no unnamed buttons.

Evidence is in `.factory/evidence/polish-3-local/` and `.factory/evidence/polish-3-live/`. The finding-by-finding record is `.factory/polish-3.md`.

## Run and verify

```sh
npm ci
npm run check
npm run test:e2e
PORT=8080 STATIC_DIR=dist cargo run --manifest-path server/Cargo.toml --locked
```

The supported direct sample entry is `http://127.0.0.1:8080/?demo=1`.

## Known gaps and operator action

No review finding or required operator action remains. Accounts and paid plans are intentionally not advertised in this free beta; adding them is a later product milestone, not a hidden or incomplete current feature.
