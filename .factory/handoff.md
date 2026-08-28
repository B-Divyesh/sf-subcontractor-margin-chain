# Repair handoff

Work order: `subcontractor-margin-chain-repair-1`

Verifier report: `745d6e7a8f87142778f3b7790a3cb1fc1710a740`

Failed candidate: `0c32c7c7c7cc8dd0233aa966b83670d90bbc3d3f`

Date: 2026-08-28

## Outcome

All independent-verifier blockers are repaired locally. The artifact remains a React/Vite frontend served by a Rust/axum backend in one container.

The reported replica failure was reproduced before editing: replica A created a workspace and read it with `200`; replica B received the same cookie and returned `401 demo_workspace_missing`. Production now stores each demo workspace as a private Azure Blob through the Container App managed identity. Blob ETags make updates optimistic and retry-safe across replicas. The only-`PORT` local/container fallback persists JSON records under `/data/demo-workspaces`. Expired records are inaccessible immediately and are purged hourly.

## Verifier finding → repair → regression

- Replica-local demo data: added shared/durable store backends and optimistic writes. `workspace_survives_replica_handoff_in_shared_persistence` creates on one app state, reads and writes on another, then observes the write from the first.
- Cold claim timeout: raised Playwright web-server startup allowance from 60 to 300 seconds. After `cargo clean`, the exact `m1-chain-math` command passed both viewports; cold Rust compilation took 50.94 seconds.
- Missing claim coverage: expanded `.factory/claims.json` from 6 to 17 unique, executable claims and added a registry completeness test. Unsupported M1 role-access copy and unshipped plan inclusions were removed.
- Wordmark name mismatch: removed the overriding label so visible and accessible text are both “MC Margin Chain”; current experimental axe rules and an explicit role/name assertion pass.
- Rust base image and clippy: changed the builder to `rust:1-slim`, normalized numeric literals, derived `Default`, and made clippy with `-D warnings` clean.
- False 200 pages: only known SPA routes serve 200; `/404` and unknown paths serve the designed app shell with HTTP 404.
- Caching and privacy responses: hashed `/assets/*` responses use one-year immutable caching; every demo API success and error uses `no-store`; production source maps are disabled.
- Operations: `/ready` checks the selected persistence backend, and rate-limited `/internal/metrics` emits Prometheus text. `/health` remains the build-identity liveness check.
- Cookie policy: HTTPS ingress responses now add `Secure` while retaining host-only, HttpOnly, and SameSite=Lax scope.

## Local evidence

- Clean install: `npm ci` — 155 packages, 0 vulnerabilities.
- Unit/type/build: `npm test` — 9/9; `npm run build` — pass, `dist/` 532 KiB, initial JS 96.38 KiB gzip, CSS 5.67 KiB gzip, no source maps.
- Rust: `cargo test --locked` — 18/18; `cargo fmt --check` — pass; `cargo clippy --all-targets --locked -- -D warnings` — pass.
- Browser: `npm run test:e2e` — 44/44 across desktop Chromium and 390 px mobile Chromium.
- Claims: every exact command in `.factory/claims.json` passed independently (17/17).
- Accessibility: current axe serious/critical scan, experimental label-content-name mismatch, keyboard creation/reset, dialog focus, route focus, 200% text, and reduced motion passed in both browser projects.
- Visual review: 1440×900 and 390×844 full-page demo captures were inspected; no clipping, overlap, or horizontal overflow was found.
- Privacy: a landing → demo → mutation browser trace contacted only the product origin.
- Response policy: integration tests prove true 404, immutable hashed assets, no-store errors, security headers, 429 + Retry-After, readiness, metrics, and Secure demo cookies.
- Runtime: the compiled server was spawned once with a cleared environment plus `PORT`, and once with a fully cleared environment to prove the 8080 default; `/health` returned 200 both times.
- Package/consumer: not applicable; this is not a library. Offline/update: not applicable; M1 does not claim PWA/offline support. CIAM, billing, and AI live checks: not applicable to M1.
- Local Docker smoke: unavailable because this worker has no Docker daemon. The work-order ACR build is the container build gate.

## Deployment

The repair container built successfully in ACR from `rust:1-slim` and was deployed through the work-order container configuration to <https://subcontractor-margin-chain.sociobot.in>. The first repaired image reported build `2f7cfc67c98c7a7ce8b4aca4fbef70f9e45a31c7`; the final documentation-only commit was then redeployed and checked again.

Live evidence:

- `/health` returned `200` with the deployed source SHA; `/ready` returned `200` with `demo_store: azure-blob-shared`.
- A new secure cookie produced 12 consecutive cross-request reads: `200` × 12. The pre-fix reproduction was `200` on replica A and `401` on replica B.
- A missing workspace returned `401` with `Cache-Control: no-store`; `/not-a-real-page` returned HTTP 404.
- The hashed JavaScript response returned `Cache-Control: public, max-age=31536000, immutable`.
- `/internal/metrics` returned Prometheus text and `smc_demo_store_ready 1`.
- The complete live Playwright suite passed 44/44 across desktop and 390 px mobile, including all browser claims.
- Factory `verify-url.sh` returned HTTPS 200, 673 ms load, no console errors, one H1, one main landmark, `lang=en`, and no missing image/button names.
- `@axe-core/cli` 4.10.3 found 0 violations on `/` and `/demo`.
- Lighthouse mobile: performance 99, accessibility 100, best practices 100, SEO 100; FCP 1.7 s, LCP 1.7 s, TBT 10 ms, CLS 0.041.
- A 100-request concurrent `/health` smoke returned 100 × HTTP 200.

Evidence files are in `/work/evidence/live-2f7cfc6/` in the worker environment.

## Needs operator action

None for M1. The Container App managed identity already has blob-data access. The app creates and uses its private `subcontractor-margin-chain-demo` container without a secret or deployment environment setting.

## Known gaps and next steps

M1 remains the approved no-account sample milestone. Real organizations, CIAM roles, tenant records, billing, backup/export, and customer data remain M2+ scope in `.factory/plan.md`. Do not enter real client data in the demo.
