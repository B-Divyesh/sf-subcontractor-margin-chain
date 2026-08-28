# Independent verification 2 — FAIL

Verified on 2026-08-28 against candidate `6a152b59916f60aa1005d8a9cd2657f559cf3682` and <https://subcontractor-margin-chain.sociobot.in>.

## Decision

**FAIL. Do not release this candidate.** The previous deployment-only workspace-loss defect is repaired: demo records now survive requests across the three live replicas. However, request limits remain process-local and therefore allow three times the documented per-client allowance. Concurrent idempotent writes to the shared store also return reproducible `503` errors below the advertised write allowance. The repository's reset claim test is nondeterministic under parallel execution.

## Release-blocking findings

### High — live per-client rate limits are multiplied by the replica count

The product claims that demo API routes enforce limits using the ingress client address. The code stores limiter buckets in each process, while production runs three replicas.

- Provisioning is documented and tested locally as 5 new workspaces per client per hour.
- From one fresh `X-Forwarded-For` address, live attempts 1–14 returned `201`. Attempts 15–19 returned `429`, attempt 20 returned `201` from the remaining unsaturated replica, and attempts 21–25 returned `429`.
- The effective deployed allowance was therefore 15 per hour, not 5. Rejections did include `Retry-After` (about 3,586 seconds).
- A fresh 180-request concurrent burst from one address produced 120 `404` responses and 60 `429` responses with `Retry-After: 1`. The intended global allowance is 40 requests per second, so production again exposed exactly three replica-local buckets.
- The `m1-api-rate-limits` claim test passes only because it constructs one in-process `AppState`; it does not prove the deployed topology.

This violates the explicit backend acceptance rule that one client receives `429` once it passes the documented allowance.

### High — shared persistence returns 503 under an allowed concurrent idempotent retry burst

Two independent live trials sent 12 simultaneous cost-create requests with the same workspace, body, and `Idempotency-Key`. Twelve requests are below the documented workspace allowance of 30 writes per minute.

- Trial 1: one `201`, eight `200`, and three `503` responses.
- Trial 2: one `201`, seven `200`, and four `503` responses.
- Every `503` was `demo_store_unavailable` with “The shared demo store could not be reached,” no `Retry-After`, and `Cache-Control: no-store`.
- Idempotency prevented duplicate records: each trial created exactly one cost.

The Azure Blob optimistic-write loop retries immediately only five times. Contending idempotent requests still rewrite the unchanged record, exhausting retries even though the store is available. Ordinary retries should not turn into availability errors at this load.

### High — the tagged reset claim test is nondeterministic

- The first complete local `npm run test:e2e` run finished **43/44**, failing mobile `@claim:m1-demo-reset` because no `smc_demo` cookie existed immediately after `page.goto`.
- A targeted five-way repeat of the same mobile claim finished **2/5 passed, 3/5 failed** at the same assertion.
- The failure snapshot still showed “Loading the job chain…”. The test reads cookies before waiting for the asynchronous workspace provision to finish.
- The exact registry command passed once in isolation, and the complete live suite passed 44/44. Those successes do not make the claim test deterministic.

The acceptance contract makes any failing claim test release-blocking. The test must wait for a user-observable ready state before inspecting the cookie.

## Other defects

### Medium — invalid committed-cost text loses keyboard focus and field association

On the live job page, submitting `$1` with blank Subcontractor and Work covered fields produced the announced error “Enter the subcontractor name.” Recovery was not accessible:

- focus moved to `BODY`, not the invalid Subcontractor field;
- the field had neither `aria-invalid` nor `aria-describedby`;
- Chromium logged the handled `422` as a failed resource.

The new-chain form handles the equivalent case correctly by showing inline errors and focusing the first invalid field. The in-chain form uses `noValidate`, sends invalid text to the server, then displays only a page-level alert.

### Medium — five mobile link targets are shorter than the 44 px contract

At 390 px, the wordmark measured 40 px high. The Job register breadcrumb and the three footer links measured 24.8 px high. Buttons and form controls met the target size. The supplied accessibility and design contracts require every interactive target to be at least 44×44 CSS pixels.

### Low — architecture documentation still conflicts with the deployed implementation

`.factory/design.md` describes sqlx/SQLite and a one-writer replica, while this M1 uses shared Azure Blob persistence and three live replicas. The latest handoff is accurate, but the design document is still identified as a source of truth.

## First-read test

**Pass.** A cold desktop and 390 px visit answer all three questions on the first screen:

- What it does: “Protect margin before work starts” and links each client promise to cost and cash.
- For whom: boutique agencies that hire subcontractors.
- What to click: the visible “Try it with sample data” action, followed by “See a filled job chain. Change anything. Reset when finished.”

The action enters a realistic, usable sample in one click with no account.

## Claims gate

`.factory/claims.json` exists and lists 17 claims. After the required clean `npm ci`, every exact registry command passed independently:

| Claims | Result |
| --- | --- |
| Eight Playwright claims (`m1-chain-math` through `m1-public-privacy`) | PASS on desktop and mobile, 16/16 executions |
| Nine Rust claims (`m1-demo-cookie` through `m1-operations`) | PASS, 9/9 commands |

The browser commands cannot resolve `@playwright/test` before dependencies are installed; `npm ci` installed the pinned Playwright 1.58.2 package with no vulnerabilities. The substantive claim failures are the live multi-replica rate behavior and the repeatable reset-test race described above.

No material landing/README promise lacked a corresponding registry entry. The rate-limit promise is registered but false in production.

## Candidate and live identity

- Clean checkout started at `6a152b59916f60aa1005d8a9cd2657f559cf3682` on `main`.
- Live `/health` returned `200` with the same full build SHA.
- Building with `VITE_BUILD_SHA=6a152b59916f60aa1005d8a9cd2657f559cf3682` produced `/assets/index-CGbjHaon.js`, exactly matching the live asset at SHA-256 `d617435327964f76387bc5d721d1557f1cda9407616b1b0906f32abb9ffd92e9`.
- Live `/ready` returned `200` and `demo_store: azure-blob-shared`.

## Local build and test evidence

- `npm ci`: pass; 155 packages, 0 vulnerabilities.
- `npm test`: pass; 9/9 tests.
- `npm run build`: pass; TypeScript and Vite produced `dist/`.
- `npm run lint`: pass; Rust format and clippy with warnings denied.
- `cargo test --manifest-path server/Cargo.toml --locked`: pass; 18/18 tests.
- `npm run check`: pass.
- `BUILD_SHA=<candidate> cargo build --release --locked`: pass.
- `npm run test:e2e`: **fail once, 43/44**, due to the reset claim race. The targeted repeat reproduced 3 failures in 5 runs.
- Live `PLAYWRIGHT_BASE_URL=<production> npm run test:e2e`: pass, 44/44.
- Docker smoke was not available because this verifier image has no Docker executable. Native release build, runtime-contract tests, live identity, and byte comparison were completed instead.

## Product-flow and boundary evidence

- Normal sample math, margin-risk warning, approval, invoice-state persistence, reset, and cross-workspace isolation passed in the live suite.
- An empty new-chain submission showed seven specific errors and focused Job name.
- One-character text, zero client commitment, a 101% floor, and negative cost showed eight specific errors and focused Job name.
- A valid boundary chain with a `$0.01` client commitment, 100% floor, and `$0` cost produced a `$0.01` expected margin and `$0.01` floor, focused the new heading, and survived reload.
- A three-decimal cost (`0.001`) was rejected and focused Amount. Correcting it to `$0.01` saved, recalculated to `$9,499.99`, and survived reload.
- Eighteen consecutive reads of one live workspace all returned 200 across the deployed replicas. A second workspace did not receive the first workspace's mutation.

## Privacy, headers, and caching

- A landing → demo → create/edit flow contacted only `https://subcontractor-margin-chain.sociobot.in`.
- No tracked credential or raw Azure/Sociobot key was found. No analytics, CDN font, third-party script, CIAM, billing, or advertising request occurred.
- The live demo cookie is host-only, `HttpOnly`, `SameSite=Lax`, and `Secure`, with a 24-hour maximum age.
- Demo API success and observed 401/422/503 errors used `Cache-Control: no-store`.
- Root responses include CSP, HSTS, MIME sniffing protection, strict-origin referrer policy, permissions restrictions, and frame denial.
- Unknown routes return real HTTP 404. Hashed JavaScript and CSS return `public, max-age=31536000, immutable`.

## Accessibility, mobile, and performance

- The live 44-test suite ran axe on `/`, `/demo`, new/detail demo pages, `/privacy`, `/terms`, and `/404` in both projects with no serious or critical findings.
- `verify-url.sh` passed: 778 ms load, no console errors, title present, `lang=en`, one H1, one main, no missing image alt, and no unnamed buttons.
- Keyboard create/reset, route focus, back navigation, skip link, and visible focus passed. The focused primary action had a 3 px cyan outline with a 3 px offset.
- Reduced-motion mode left no computed nonzero transitions or animations.
- At 390 px, body text was 16 px and document width was exactly 390 px; screenshots showed no clipping or overlap. The touch-target exceptions are listed above.
- Lighthouse mobile: performance 92, accessibility 100, best practices 100, SEO 100; FCP 1.7 s, LCP 1.7 s, TBT 310 ms, CLS 0.026.
- Cold landing transfer: JS 96,004 bytes encoded, CSS 5,644 bytes, WOFF2 fonts 71,058 bytes, and 174,206 bytes total resource transfer. All stated bundle budgets pass.

## Applicability

- This is not a library or CLI; consumer pack/install checks do not apply.
- It is not a PWA and makes no offline-reload claim; service-worker checks do not apply.
- M1 intentionally has no sign-in; Entra CIAM verification does not apply yet.
- No runtime AI feature is present or useful for deterministic margin arithmetic.
- Billing and real tenant data are planned for M2 and were not treated as missing M1 functionality.

## Required fixes before re-verification

1. Make rate-limit state shared across replicas, or enforce the documented allowance at ingress; add a multi-replica/live regression.
2. Add bounded backoff or a per-workspace serialization strategy so allowed concurrent idempotent writes do not return 503.
3. Make `@claim:m1-demo-reset` await demo readiness before reading its cookie; run repeated parallel claim tests.
4. Bind in-chain validation errors to fields and focus the first invalid field.
5. Raise the five measured mobile link targets to at least 44×44 px.
6. Reconcile the design/architecture documentation with shared persistence and the supported replica topology.
