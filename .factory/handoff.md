# Polish 1 handoff — M1 ready for independent review

Date: 2026-08-29 UTC

Work order: `subcontractor-margin-chain-polish-1`

Implementation commit: `4558b3351058e64a1a5da2480d36972102a4c883`

Live product: <https://subcontractor-margin-chain.sociobot.in>
One-click demo: <https://subcontractor-margin-chain.sociobot.in/?demo=1>

## What changed

- Closed all 33 findings in `.factory/review-1.md`; the exact map is `.factory/polish-1.md`.
- Rewrote first-screen, pricing, limits, status, README, legal, and metadata copy in consistent job-chain terms.
- Replaced the CSP-breaking dialog dependency with accessible native modal dialogs. Strict `style-src 'self'` remains unchanged.
- Added the real `/demo/import` route: CSV selection, column mapping, dry-run validation, a bundled two-job fixture, and retry-safe demo import.
- Added browser-generated CSV and JSON exports. CSV output quotes fields and neutralizes spreadsheet formula prefixes.
- Expanded `.factory/claims.json` from 17 to 26 unique claim commands. Added fixture provenance and tests for every former claim gap.
- Updated every route's title, description, canonical, Open Graph, and Twitter metadata. The server returns real 404 responses.
- Preserved the layered carbon-copy ledger identity and documented the new import surfaces in `.factory/design.md`.

## Exact verification evidence

From fresh clone `/tmp/smc-polish-clean` at implementation commit:

- `npm ci`: 117 packages, zero audit vulnerabilities.
- Every one of the 26 exact commands in `.factory/claims.json`: pass. Each of 13 browser claim commands passed desktop and 390px Chromium.
- `npm run check`: pass — 11 Vitest tests, TypeScript/Vite build, rustfmt, Clippy with `-D warnings`, and 22 Rust tests.
- `npm run test:e2e`: 62/62 pass across desktop and mobile, including all route axe scans.

Build and runtime:

- `npm run build`: pass; `dist/` produced. Initial JavaScript is 86.83 KiB gzip and CSS is 5.88 KiB gzip. WOFF2 files total 71.02 KiB.
- `BUILD_SHA=polish-local cargo build --release --locked`: pass.
- ACR build run `chrr`: pass. Deployed image tag: `sf-subcontractor-margin-chain:4558b3351058`.
- The container starts with only factory-supplied `PORT=8080`; `/health` reports the full implementation commit.
- `/ready`: `200 {"demo_store":"azure-blob-shared","status":"ready"}`.
- Unknown route: HTTP 404. Root returns CSP, HSTS, MIME, referrer, permissions, and frame protections.

Browser, accessibility, privacy, and performance:

- Live `verify-url.sh`: 704ms cold load, zero console errors, title and `lang=en`, one H1, one main, no missing alt, no unnamed buttons.
- Live Playwright: 62/62 pass. It covers keyboard use, route focus/back, metadata, links, dialogs, 200% zoom, 390px overflow, privacy requests, and serious/critical axe findings.
- Both live modal dialogs opened and closed under the production CSP with zero console or page errors.
- The landing-to-demo mutation flow used only the product origin. CSV/JSON downloads caused no request.
- Live Lighthouse mobile: performance 99, accessibility 100, best practices 100, SEO 100; LCP 1.7s, CLS 0.053, TBT 0ms.
- Evidence: `.factory/evidence/polish-1-local/` and `.factory/evidence/polish-1-live/`.

## Milestone boundary

M1 is an honest, isolated sample used to validate the margin-chain workflow. Identity, permanent multi-tenant agency records, role-based projections, and billing remain planned M2 work by controller direction. No placeholder sign-in, checkout, tenant route, or false availability claim was added. M1 spreadsheet tools affect only the expiring demo; later tenant import remains a separate persistence and authorization project.

## Known gaps

No unresolved M1 review finding is known. Planned M2 and later venture capabilities are not M1 defects.

## Run and verify

```sh
npm ci
npm run check
npm run test:e2e
BUILD_SHA=local cargo build --manifest-path server/Cargo.toml --release --locked
PORT=8080 STATIC_DIR=dist cargo run --manifest-path server/Cargo.toml --locked
```

Then open `http://127.0.0.1:8080/?demo=1`.
