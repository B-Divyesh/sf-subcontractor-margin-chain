# M1 handoff — margin chain demo

Date: 2026-08-28

Work order: `venture-subcontractor-margin-chain-m1`

Milestone state: **built, deployed, and live-verified; ready for review → polish**

Live product: <https://subcontractor-margin-chain.sociobot.in>

Demo: <https://subcontractor-margin-chain.sociobot.in/demo>

## What shipped

- A complete public site in the layered carbon-copy ledger system: product-specific palette, self-hosted Newsreader and Recursive fonts, original SVG ledger art, responsive layout, route titles, metadata, social card, favicon, legal pages, and designed 404.
- A one-click demo for fictional Northline Studio data. Three seeded jobs show a safe margin, pending unpriced work, and a below-floor job.
- A complete job flow: list jobs, create a job chain, review the formula, add a committed cost, approve a scope revision, mark a linked client milestone sent, reload state, and reset the workspace.
- Server-authoritative integer-cent arithmetic. The rule returns inputs, expected margin, conservative upward floor rounding, amount at risk, risk state, cause, rule version, and record version.
- An isolated in-process `DemoStore`. Random workspace IDs stay in HttpOnly, SameSite=Lax cookies, expire within 24 hours, and are invalid after reset. Demo responses use `Cache-Control: no-store`.
- Idempotency keys on creates, a 64 KiB body limit, transition validation, problem responses, security headers, same-origin networking, and an hourly expiry purge.
- Rate limits on every `/api/*` endpoint. `/health` is the only exemption. Limits use the first `X-Forwarded-For` hop and every 429 includes `Retry-After`.
- Six executable claim tests plus API, unit, keyboard, routing, responsive, console, link, and axe coverage. CI installs pinned Chromium and runs the browser suite.

## Scope decision

The work-order preamble mentions real auth, tenant persistence, migrations, and billing. The milestone contract in `.factory/plan.md` explicitly assigns those to M2 and says M1 contains no account, checkout, or tenant repository. I followed that boundary and did not add a dead CIAM or payment surface. M1 persistence is the real, server-side, TTL demo store allowed by `.factory/demo.md`; it intentionally disappears on restart. No SQL migration is needed until M2 introduces SQLite.

The plan remains correct, so its milestone boundaries were not changed. Its top-level and M1 statuses now record that implementation and local verification are complete while review → polish is pending.

## Evidence

- `npm test`: 8 passed.
- `cargo test --manifest-path server/Cargo.toml --locked`: 11 passed across domain, store, health, and API integration tests.
- `npm run test:e2e`: 38 passed across desktop Chromium and a 390px Chromium profile. Every `@claim:m1-*` entry runs in both profiles.
- Live claim pass: 12 passed against the deployed URL, covering all six claims in desktop Chromium and the 390px profile. Each clean context uses a stable test-only forwarded address so claim isolation does not consume another claim's 5/hour provisioning allowance.
- `npm run build`: passed. Initial bundle: 96.46 KiB JS gzip and 5.67 KiB CSS gzip. First-choice WOFF2 fonts total 71.02 KiB. SVG hero/social assets stay below the image budget.
- `cargo build --manifest-path server/Cargo.toml --release --locked`: passed.
- Lighthouse mobile on the local production server: performance 98, accessibility 100, best practices 100, SEO 100; LCP 2.0s, CLS 0.026, total blocking time 30ms.
- Load smoke: 1,000 requests at a target 100 requests/second over 10 seconds; 354 accepted and 646 deliberately limited with 429; overall p95 response time 96ms.
- Factory ACR build completed successfully. The Azure Container App started from only `PORT=8080`; `/health` returned the injected source SHA.
- Factory live verifier: HTTPS 200, cold load 641ms, zero console/page errors, title and `lang` present, one `<h1>`, one `<main>`, no missing image alt, and no unlabeled buttons.
- `/health` reports the injected source commit. The Container App is pinned to one replica, matching the M1 process-local `DemoStore` architecture.
- Live desktop and mobile evidence is under `.factory/evidence/m1-live/`.

The local worker image had no Docker-compatible runtime, so `docker build` could not run locally. The required Dockerfile build was instead exercised by the successful Azure Container Registry build used for deployment.

## Claims delivered

1. `m1-chain-math`: $24,000 − $14,500 = $9,500 and 39.6%.
2. `m1-margin-risk`: adding a $6,000 “Location sound mix” commitment names the change and shows a $1,300 shortfall.
3. `m1-linked-status`: scope approval and the linked client milestone remain after reload.
4. `m1-demo-no-account`: the sample works without a CIAM or billing request.
5. `m1-demo-reset`: reset restores fixtures and invalidates the old HttpOnly workspace ID.
6. `m1-plan-prices`: Studio $79/25 active jobs and Portfolio $159/100 active jobs render without a purchase control.

## Known gaps and M2 needs

- M1 demo workspaces are intentionally process-local. Container restarts discard them; the UI and terms state this.
- M1 must remain at one replica. The generic deploy helper initially selected a maximum of three, which let requests for one HttpOnly workspace reach different process stores. Production was corrected to `minReplicas=1,maxReplicas=1`. A future helper rerun must preserve that setting until M2 replaces the store with SQLite/shared persistence.
- The milestone review and polish pass must complete before M2 starts.
- M2 adds Sociobot Entra CIAM, stable `oid` identity, SQLite/sqlx tenant persistence and reversible migrations, organization roles and rate projection, trial state, and the Sociobot billing adapter.
- Before M2 production sign-in, register and verify `https://subcontractor-margin-chain.sociobot.in/auth/callback` on the shared Entra SPA application.
- Before M2 live billing, register the recurring Studio product and confirm whether the Sociobot verify response exposes a trusted named Portfolio entitlement. Product code must not call Dodo directly.
- M2 must preserve the `/demo` route and all six M1 claims unchanged.

## Run it

```sh
npm ci
npm test
npm run build
cargo test --manifest-path server/Cargo.toml --locked
cargo build --manifest-path server/Cargo.toml --release --locked
npm run test:e2e
PORT=8080 STATIC_DIR=dist cargo run --manifest-path server/Cargo.toml --locked
```
