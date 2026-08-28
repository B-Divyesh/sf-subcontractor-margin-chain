# Independent verification — FAIL

Verified on 2026-08-28 against candidate `0c32c7c7c7cc8dd0233aa966b83670d90bbc3d3f` and <https://subcontractor-margin-chain.sociobot.in>.

## Decision

**FAIL. Do not release this candidate.** The live demo cannot keep its workspace on ordinary consecutive requests. A successful workspace creation is routinely followed by `401 demo_workspace_missing`, so visitors cannot reliably view, edit, reload, or reset the sample. This is reproduced independently at the API layer and causes most live claim executions to fail.

The repository is otherwise clean, buildable, and substantially functional when run as one local process. The live problem is not stale frontend code: the deployed build identity and the byte hashes of the built HTML, JavaScript, and CSS match this candidate.

## Release-blocking findings

### Critical — the live process-local demo state is split across request targets

- `POST /api/v1/demo/workspaces` returned `201` and a new `smc_demo` cookie.
- Twelve immediate `GET /api/v1/demo/chains` calls with that exact cookie returned this repeating result: `200, 401, 401, 200, 401, 401, 200, 401, 401, 200, 401, 401`.
- Four independent workspace trials reproduced the same boundary; only 15 of 48 reads succeeded.
- A cold 390 px browser visit showed the first API call return `201`, followed immediately by a `401 demo_workspace_missing`. The visible screen said “The job register did not load.” The browser also logged the failed 401 resource.
- The pattern proves that requests reach multiple independent process-local stores, or an equivalent unstable persistence boundary. The repository handoff says M1 requires one replica, but the live behavior does not meet that requirement.
- Live Playwright result: **22 passed, 16 failed**. Of the 12 claim executions across desktop and mobile, only 3 passed; both `m1-chain-math`, both `m1-margin-risk`, both `m1-linked-status`, both `m1-demo-no-account`, and mobile `m1-demo-reset` failed. Failures consistently showed a missing/expired workspace or a follow-up mutation losing the workspace.

### High — a claim command fails from the clean, cold checkout

After `npm ci`, every command in `.factory/claims.json` was run separately and exactly as listed. The first command, `npx playwright test tests/e2e/m1.spec.ts --grep @claim:m1-chain-math`, failed because `playwright.config.ts` allows only 60 seconds for the web server and a cold Rust build exceeded that limit. The other five commands passed after the Rust artifacts had been warmed. A later warm full suite passed 38/38.

The claims contract says any failing claim test from a clean checkout is release-blocking. The server timeout must cover a clean build, or the build must be a separate deterministic setup step.

| Claim | Cold exact command | Warm desktop/mobile | Live desktop/mobile |
| --- | --- | --- | --- |
| `m1-chain-math` | **FAIL**, web-server timeout at 60 s | 2/2 pass | 0/2 pass |
| `m1-margin-risk` | pass | 2/2 pass | 0/2 pass |
| `m1-linked-status` | pass | 2/2 pass | 0/2 pass |
| `m1-demo-no-account` | pass | 2/2 pass | 0/2 pass |
| `m1-demo-reset` | pass | 2/2 pass | 1/2 pass |
| `m1-plan-prices` | pass | 2/2 pass | 2/2 pass |

### High — public claims are missing from the claims registry

`.factory/claims.json` lists six claims, but the live page, legal pages, and README make additional promises without a corresponding `@claim` test. Examples include:

- “Your demo workspace is isolated and expires within 24 hours.”
- “Subcontractor rates stay behind role-based access after sign-in.”
- “The public site does not track you.”
- README promises that the server starts with only `PORT`, sends security headers, accepts same-origin API calls, and limits every API route.

The role-based-access statement is especially premature: M1 has no account or role implementation. Under the supplied claims contract, an unlisted public claim fails review even when inspection suggests part of it is true.

### High — serious accessible-name mismatch

Lighthouse/axe identified the header wordmark as a serious WCAG 2.5.3 finding. Its visible label is “MC Margin Chain,” while its accessible name is replaced by `aria-label="Subcontractor Margin Chain home"`; the visible text is not contained in the accessible name. The repository's pinned axe checks did not enable this newer experimental rule, so their 38-test suite missed it.

### High — Dockerfile violates the mandatory backend image contract

`Dockerfile` uses `FROM rust:1.98-bookworm`. The supplied backend contract explicitly requires a floating stable image such as `rust:1-slim` and forbids minor-version pins. Docker was unavailable in this verifier container, so a container build could not be rerun; the native locked release build passed.

## Other findings

### Medium

- Unknown paths such as `/not-a-real-page` return HTTP `200` with SPA HTML instead of a real 404 response. The designed client page renders, but the HTTP routing contract is not met.
- Hashed JavaScript, CSS, and font responses have no `Cache-Control` header. Lighthouse's cache audit estimates 169 KiB of avoidable transfer; immutable asset caching is required by the performance contract.
- Successful demo API responses use `Cache-Control: no-store`, but error responses do not. The observed `401 demo_workspace_missing` omitted it, contradicting “Every demo response carries `Cache-Control: no-store`.”
- `cargo clippy --all-targets --locked -- -D warnings` fails with 15 errors: 14 inconsistent digit-grouping findings and one derivable `Default` implementation. Rust formatting itself passes.
- `/ready` and `/internal/metrics` return `200 text/html` SPA content, not readiness or metrics. The repository plan defers them to later milestones, but the supplied venture acceptance contract calls for operational health and metrics.

### Low

- The demo cookie is host-only, HttpOnly, and SameSite=Lax, but lacks the `Secure` attribute on the HTTPS deployment.
- Source maps are emitted into `dist/` (1.64 MB). They are not loaded initially, but public production source maps increase transfer/storage exposure if requested.

## First-read test

**Pass.** On a cold 1440×900 visit, the first screen answers all three required questions in plain words:

- What: “Protect margin before work starts.”
- For whom: “For boutique agencies that hire subcontractors…”
- First action: “Try it with sample data,” followed by “See a filled job chain. Change anything. Reset when finished.”

The one-click action is visible on both desktop and 390 px mobile. However, the live click currently reaches the critical workspace failure described above.

## Candidate and deployment identity

- Checkout was clean at `0c32c7c7c7cc8dd0233aa966b83670d90bbc3d3f` before verification.
- Live `/health`: `{"status":"ok","build_sha":"0c32c7c7c7cc8dd0233aa966b83670d90bbc3d3f"}`.
- With `VITE_BUILD_SHA` set to the candidate, local and live hashes matched exactly:
  - `index.html`: `d92bd39a514daa1ce98ca216e9ce39854591582ff51196d04ab1da73d707423b`
  - `index-gXPmnlOV.js`: `3e6559d25eff9ab6133d5657959697e701411c8f338b79129f385841b6228a2d`
  - `index-CP3UaU-M.css`: `5faa9b629631f585c6e56dfc653a1aab0e9542a89f42a76e9627d1a7eeb79200`

## Local build and test evidence

- `npm ci`: pass; 155 packages installed, 0 audit vulnerabilities.
- `npm test`: pass; 8/8 tests.
- `npm run build`: pass; `dist/` produced.
- `cargo fmt --all -- --check`: pass.
- `cargo test --locked`: pass; 11/11 tests.
- `cargo build --release --locked`: pass.
- `npm run check`: pass.
- `npm run test:e2e`: pass when warm; 38/38 desktop/mobile tests.
- `cargo clippy --all-targets --locked -- -D warnings`: **fail**, 15 findings.
- Native server startup with an empty environment plus only `PORT=4181`: pass. `/health` and `/demo` both served; Ctrl-C produced a graceful shutdown log.
- Docker smoke: not run because `docker` is unavailable in the verifier container.

## Product-flow and boundary evidence

Against a single local release process:

- Normal sample chain math, below-floor alert, approval, invoice status, reset, and reload all worked.
- Submitting the new-chain form empty produced seven specific errors and focused `name`, the first invalid field.
- Boundary values of $0.01 client commitment, 100% margin floor, and $0 committed cost produced exact integer-cent math.
- A three-decimal cost (`0.001`) was rejected with a recovery instruction; correcting it to `$0.01` produced a written `$0.01 below floor` alert and persisted after reload.
- Twelve simultaneous writes with the same idempotency key returned one `201` and eleven `200` responses, and created exactly one new cost.
- Reduced-motion media matched and duration tokens resolve to zero.

## Rate limits

The live API enforces both tested allowances and supplies `Retry-After`:

- Demo provisioning: attempts 1–5 from one forwarded client returned `201`; attempts 6–7 returned `429` with `Retry-After: 3599`.
- Global API burst: 60 concurrent requests from one forwarded client returned forty `404` responses followed by twenty `429` responses with `Retry-After: 1`.
- `/health` is exempt as documented.

## Privacy, requests, and headers

- Cold landing and demo request logs used only `https://subcontractor-margin-chain.sociobot.in`; no analytics, CIAM, billing, CDN, or third-party font request occurred.
- Local successful end-to-end demo flow also used only its own origin.
- Root response includes CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and frame denial. No CSP violation occurred.
- Live demo workspace creation returned `Cache-Control: no-store`; the following 401 did not.
- No credential-like secret was found in tracked source using a targeted scan.

## Accessibility, mobile, and performance

- Desktop and 390 px layouts were visually inspected. The first action remains clear; no horizontal overflow occurred at 390 px or at the suite's 200% text check.
- Keyboard creation/reset, focus restoration, dialog behavior, route focus, skip link, reduced motion, and pinned axe serious/critical checks pass locally.
- Lighthouse mobile: performance 95, accessibility 100, best practices 100, SEO 100; FCP 1.7 s, LCP 1.7 s, TBT 240 ms, CLS 0.026. The serious wordmark rule above is present despite the rounded accessibility category score.
- Initial budgets pass: JavaScript 96.50 KiB gzip, CSS 5.65 KiB gzip, WOFF2 fonts 71.02 KiB total. There is no raster hero.
- Cold landing produced no console or page errors. The live demo produces a console error when its follow-up API request returns 401.

## Applicability notes

- This is not a library or CLI, so pack/install checks do not apply.
- This milestone is not a PWA and has no service worker, so offline reload/update checks do not apply.
- M1 intentionally has no sign-in, so CIAM authority verification does not apply yet.
- No runtime AI feature is present; none is needed for the core margin calculation.

## Required fixes before re-verification

1. Run the live demo on exactly one process/replica as its M1 architecture requires, or move demo workspaces to shared persistence; then rerun every claim live from fresh contexts.
2. Make every exact claim command pass from a cold checkout without warming Rust artifacts.
3. Register and test every public claim, or remove/present-tense-correct unsupported copy.
4. Fix the wordmark accessible name and rerun current axe/Lighthouse rules.
5. Use a contract-compliant Rust base image and make clippy clean.
6. Return real 404s, add immutable asset caching, and add `no-store` to every demo response including errors.

