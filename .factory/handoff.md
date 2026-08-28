# Planning handoff

Date: 2026-08-28

Work order: `venture-subcontractor-margin-chain-plan`

Role: planner

Product implementation status: **not started by design**

## What was done

- Wrote `.factory/plan.md` as the venture build contract: PRD, evidence, deterministic money rules, roles, full architecture, Entra CIAM, Sociobot/Dodo subscriptions, rate limits, privacy, operations, M1–M5 claims/tests/definitions of done, and risk experiments.
- Wrote `.factory/design.md` around the registered “layered carbon-copy ledger” direction, including palette, typography, spacing, shape, depth, motion, responsive behavior, accessibility, screen sketches, stack rationale, and original-asset provenance.
- Added `.factory/claims.json` for M1, `.factory/demo.md`, `.factory/copy-audit.md`, and `.factory/component-inventory.md`.
- Updated the researched brief to its admitted state and added the plain catalog summary.
- Added a buildable React/Vite/strict-TypeScript shell, design token file, planned route manifest, Vitest setup, and pinned Playwright 1.58.2.
- Added a minimal Rust/axum server with JSON logs, graceful shutdown, static-file shell, `/health` build identity, and an integration test. No product endpoint was stubbed.
- Added a multi-stage non-root Dockerfile, lockfiles, ignore files, optional configuration example, and GitHub Actions for frontend tests/build and backend tests/release build.

## Verified locally

- `npm test` — 2 scaffold tests passed.
- `npm run build` — passed; `dist/` produced. Current scaffold output: 61.91 KiB initial JS gzip and 1.05 KiB CSS gzip.
- `cargo test --manifest-path server/Cargo.toml --locked` — 1 integration test passed.
- `cargo build --manifest-path server/Cargo.toml --release --locked` — passed.
- `cargo fmt --manifest-path server/Cargo.toml -- --check` — passed after formatting.
- Runtime smoke on `PORT=8099` — `/health` returned `{"status":"ok","build_sha":"dev"}` and `/` served the built HTML; graceful shutdown logged cleanly.

Lighthouse, axe, live URL, claim E2E, container-runtime, and browser console checks were not run because the product was explicitly not built in this planning work order. M1 owns those gates and may not claim product completion without them.

## Known gaps and next work

M1 should replace the planning screen with the landing site and isolated sample workflow exactly as described in the plan. It must implement all six entries in `.factory/claims.json` with one `@claim:<id>` Playwright test each, preserve demo isolation, add product metadata/assets and self-hosted licensed fonts, enforce rate limits, and write `.factory/handoff-m1.md`.

The server currently exempts its only endpoint, `/health`, from rate limiting as allowed by the backend contract. M1 must add the limiter before it adds any other endpoint. SQLite/sqlx, authentication, and billing begin in their planned milestones and are intentionally absent now.

## Needs operator action later

- Before M2 production sign-in: register `https://subcontractor-margin-chain.sociobot.in/auth/callback` on the shared Entra SPA application and confirm it in the M2 handoff.
- Before M2 live billing: register recurring Studio ($79/month) and, only if the verify contract returns a trustworthy named entitlement, Portfolio ($159/month) with the Sociobot billing engine. Product code must never integrate with Dodo directly.
- Before M4 backup claims: configure durable `/data` storage and off-instance factory volume snapshots.
