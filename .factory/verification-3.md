# Independent verification 3 — FAIL

- **Candidate:** `406f2fc4d2b2c46f95e07b772c593b9438dd633c`
- **Live URL:** https://subcontractor-margin-chain.sociobot.in
- **Verified:** 2026-08-29 UTC
- **Verdict:** **FAIL — not releasable against the researched brief and factory definition of done.**

## First read (cold live visit)

The first screen plainly says it protects margin before work starts, identifies boutique agencies that hire subcontractors, and offers **Try it with sample data** with an adjacent explanation. The filled chain preview immediately shows a client commitment, subcontractor cost, and expected margin. The one-click sample action is present and works. This first-screen/demo requirement **passes**.

## Release-blocking finding

### Critical — the product is only a temporary sample demo, not a real agency job-chain product

The brief's smallest useful product is a job chain agencies can use to record end-client/agency-client commitments, subcontractor cost, approval, invoice status, and margin risk. The factory DoD explicitly requires the real job-to-be-done end to end, not a demo, and the brief requires contractor rates and client identities to be protected by role-based access.

Fresh evidence shows there is no real-work path:

- The only product API namespace is `/api/v1/demo/`; live `/ready` reports `demo_store: "azure-blob-shared"`.
- The persistent banner says **“Demo — sample data, nothing is saved.”**
- The Privacy page says **“Do not enter real client or subcontractor details in the demo.”**
- The Terms page says sample edits are temporary and must not be relied upon as permanent storage.
- **Start for real** opens a dialog saying **“Accounts and checkout arrive in M2.”**
- There is no account, organisation, real-data persistence, or role-based access control for client identities and subcontractor rates.

The tested demo is honestly labelled and safely isolated, but that does not make the candidate usable by the intended paying agency. This is a product-contract failure, not a demo implementation defect.

## Required claim registry — PASS

`.factory/claims.json` is present and contains 17 claims. From the clean candidate checkout, every exact listed command passed. Browser claim commands passed in both Chromium and the 390px mobile project (two tests each); Rust commands passed their named integration test.

| Claim IDs | Evidence |
| --- | --- |
| `m1-chain-math`, `m1-margin-risk`, `m1-linked-status`, `m1-demo-no-account`, `m1-demo-reset`, `m1-plan-prices`, `m1-demo-isolation-expiry`, `m1-public-privacy` | Exact `npx playwright test tests/e2e/m1.spec.ts --grep @claim:<id>` commands: all passed, desktop + mobile. |
| `m1-demo-cookie`, `m1-shared-replica-persistence`, `m1-port-only-startup`, `m1-security-headers`, `m1-api-rate-limits`, `m1-demo-no-store`, `m1-true-404`, `m1-asset-cache`, `m1-operations` | Exact locked Cargo commands listed in the registry: all passed. |

## Local quality evidence — PASS

- `npm ci` completed: 155 packages installed; audit reported 0 vulnerabilities.
- `npm test`: 9/9 Vitest tests passed.
- `npm run build`: TypeScript and Vite production build passed. Initial JS is 96.67 KiB gzip and CSS is 5.70 KiB gzip; self-hosted WOFF2 assets total 71.02 KiB, within the applicable budgets.
- `npm run lint`: rustfmt check and Clippy with `-D warnings` passed.
- `cargo test --manifest-path server/Cargo.toml --locked`: 20/20 Rust tests passed.
- `BUILD_SHA=406f2fc4d2b2c46f95e07b772c593b9438dd633c cargo build --manifest-path server/Cargo.toml --release --locked`: passed.
- `npm run test:e2e`: Playwright's last run is `passed` with no failed tests; the suite contains 48 desktop/mobile tests, including keyboard creation/reset, focus return, 200% text zoom, offline error recovery, link crawl, touch targets, privacy request recording, and serious/critical axe scans.

The Docker/OCI build could not be repeated in this verifier container because `docker`, `podman`, and `buildah` are not installed. This is a verification-environment limitation, not evidence of a Dockerfile failure; the fresh live identity checks below confirm an already-running image of the candidate.

## Live deployment evidence — PASS except scope finding

### Candidate identity, health, persistence, and headers

- `/health` returned `200 {"status":"ok","build_sha":"406f2fc4d2b2c46f95e07b772c593b9438dd633c"}`. The footer reports the same SHA, so the live deployment matches the candidate.
- `/ready` returned `200 {"demo_store":"azure-blob-shared","status":"ready"}`.
- `/` returned the expected CSP, HSTS (`max-age=31536000; includeSubDomains`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, and restrictive Permissions Policy.
- A hashed JS asset returned `Cache-Control: public, max-age=31536000, immutable`.
- An unknown path returned HTTP 404 and the designed “Page not found” screen.

### Real live workflow, privacy, accessibility, and responsive checks

- A cold page read passed the required plain-language and one-click-demo gate.
- On live desktop and 390px mobile, I entered the demo, opened **Autumn launch films**, added a $6,000 commitment, and observed the written $1,300-below-floor alert. No horizontal overflow occurred.
- With `prefers-reduced-motion: reduce`, the inspected transition duration was effectively zero (`1e-05s`) and there were no active animations.
- Live axe scans of `/`, `/demo`, `/demo/chains/new`, `/demo/chains/autumn-launch-films`, `/privacy`, `/terms`, and `/404` found no serious or critical violations. Each has one `h1`, one `main`, `lang=en`, and a route-specific title.
- The normal public/demo flow produced no console or page errors. A direct intentional 404 navigation produces Chromium's expected network-console “Failed to load resource: 404” message; no JavaScript/page exception was observed.
- Request logging during the landing-to-demo-to-margin-alert flow recorded only `https://subcontractor-margin-chain.sociobot.in`; no analytics, remote font, third-party script, advertising, CIAM, or billing request appeared.
- Screenshots were manually inspected at desktop and 390px. Controls remain readable, visibly focused controls use a 3px cyan outline, and no clipping or overlap was observed.

### Live API boundaries, concurrency, and rate limits

- A real HTTPS demo provision returned a host-only `HttpOnly; SameSite=Lax; Secure` cookie and `Cache-Control: no-store`.
- With one `X-Forwarded-For` client address, five fresh workspace provisions returned 201; attempt six returned **429** with **`Retry-After: 3600`**. Observed provision allowance: **5 per client per hour**.
- With another single client address, 40 API requests in one second returned 401 (expected, because no workspace cookie); request 41 returned **429** with **`Retry-After: 1`**. Observed global API allowance: **40 requests per client per second**.
- A live 12-way concurrent, same-idempotency-key cost mutation produced one 201 and eleven 200 responses, and a later read contained exactly one matching cost. This confirms the public demo's idempotency/persistence boundary under concurrency.

## Defects by severity

| Severity | Finding |
| --- | --- |
| **Critical** | No real job-chain workflow, durable real-data storage, organisation/account boundary, or role-based protection for rates and identities. The candidate is explicitly a temporary fictional demo and therefore fails the brief and factory end-to-end DoD. |
| High | None found beyond the critical scope failure. |
| Medium | None found. |
| Low | None found. The browser's console note for an intentional HTTP 404 is documented above, not classified as an application error. |

## Applicability

This is not a library/CLI and not a PWA; package-consumer, service-worker update, and offline-reload checks do not apply. No sign-in exists, so CIAM validation does not apply to this M1 candidate. That absence is part of the critical real-product finding, rather than a clean exemption from the brief's security constraint.

## Required next step

Implement and independently verify the real agency path before release: organisation/account onboarding, durable non-demo job storage, tenant/role checks that protect client identities and subcontractor rates, and the same end-to-end chain workflow outside `/api/v1/demo/`. Retain the current isolated demo as the sample sandbox.
