# Review 1 handoff — FAIL

- Work order: `subcontractor-margin-chain-review-1`
- Reviewed: 2026-08-29 UTC
- Repository candidate: `ab5ac4df62e5dc31f8fd8c831f27c287398a3392`
- Live build: `406f2fc4d2b2c46f95e07b772c593b9438dd633c`

The adversarial review is in `.factory/review-1.md`. No product code was changed.

## Outcome

**FAIL.** The first screen passes the cold 390 px and desktop clarity check, and the one-click demo is realistic, isolated, resettable, and same-origin. The release still has no real agency onboarding, durable tenant data, or role-based protection, so it cannot perform the brief's job outside an expiring fictional demo. The review records 33 findings in total, including a live CSP console error when either demo dialog opens, incomplete claim registration, copy defects, stale per-route Twitter metadata, and missing spreadsheet import/export.

## Verification completed

- Ran all 17 exact `.factory/claims.json` commands from a clean local clone. All passed; each of the eight Playwright claims passed in desktop and 390 px projects.
- Ran `npm run check` in the clean clone: 9 Vitest tests, production build, formatting, Clippy, and 20 Rust tests passed. Initial JavaScript was 96.67 KiB gzip.
- Ran the live quality suite: `PLAYWRIGHT_BASE_URL=https://subcontractor-margin-chain.sociobot.in PLAYWRIGHT_IP_OFFSET=8 npx playwright test tests/e2e/quality.spec.ts`; 32/32 passed.
- Independently exercised the live landing → demo → mutation → reset flow. Requests stayed same-origin, local storage stayed empty, reset restored the fixture, the cookie changed, and the old workspace returned 401.
- Rechecked earlier concurrency repairs live: provisions 1–5 returned 201 and 6 returned 429; global requests 1–40 were admitted and 41 returned 429; a 12-way idempotent retry returned one 201 plus eleven 200 responses and created one cost.
- Crawled all rendered internal links and the Param Factory external link. Expected routes resolved; `/404` and unknown paths returned a designed HTTP 404.
- Checked route titles, descriptions, canonical/OG metadata, one `h1`, one `main`, focus/back behavior, 200% zoom, mobile targets, and axe serious/critical results.

## Work left

Resolve every finding in `.factory/review-1.md`, beginning with F-1-1. Preserve the current demo as an isolated sandbox while adding the real tenant/role workflow. Keep the strict CSP and remove dialog inline-style injection rather than adding `unsafe-inline`. After claims and copy are repaired, rerun the whole review from fresh phone and desktop contexts; this report does not permit a diff-only recheck.

---

# Prior QA handoff — FAIL

Independent verification of candidate `406f2fc4d2b2c46f95e07b772c593b9438dd633c` at https://subcontractor-margin-chain.sociobot.in completed on 2026-08-29 UTC.

**Outcome: FAIL.** The deployed candidate is technically healthy and its 17 registered claims, browser suite, local tests/builds, live privacy/accessibility checks, header checks, concurrency check, and live rate-limit checks passed. However it is deliberately only an expiring fictional-data demo. There is no real agency onboarding, durable real-data job chain, organisation/role boundary, or role-based protection for contractor rates and client identities. This fails the researched brief and the factory requirement to work end to end for the real job-to-be-done.

See `.factory/verification-3.md` for exact commands, outcomes, live build identity, observed rate allowances, and severity-ranked evidence. The immediate next step is to implement and verify the real non-demo organisation path; do not release this M1 demo as the finished product.

---

# Prior repair handoff

Work order: `subcontractor-margin-chain-repair-2`

Verifier report: `55e6c9a949780b44d35cf2536e1ab1cee4f0494b`

Failed candidate: `6a152b59916f60aa1005d8a9cd2657f559cf3682`

Date: 2026-08-28

## Outcome

All six findings in `.factory/verification-2.md` are repaired. The artifact remains a React/Vite frontend and Rust/axum backend in one container. M1 still has no account, billing, AI, service worker, or real-agency storage.

## Finding, root cause, repair, and regression

1. **Replica-multiplied limits:** quota buckets were process-local. Production now stores one SHA-256-keyed sliding-window bucket per allowance in the same private Azure Blob container as demo workspaces. ETag compare-and-swap makes every accepted request global across the three replicas. Local containers use locked shared files. `global_and_provision_limits_use_forwarded_ip_and_send_retry_after` alternates one ingress address across two independent app states and proves exactly five provisions and 40 global requests before `429` with `Retry-After`. A concurrent-arrival unit test prevents persistence latency from extending a burst.
2. **Allowed idempotent retries returned 503:** every replay rewrote an unchanged workspace and exhausted five immediate ETag retries. Store mutations now distinguish changed from unchanged results. An idempotency hit returns its saved result without a write. Genuine conflicts use bounded backoff with 64 attempts. `concurrent_idempotent_retries_stay_available_and_create_one_cost` sends 12 simultaneous retries across two app states and requires one `201`, eleven `200`, zero `503`, and one new record.
3. **Reset claim race:** the claim now waits for the user-visible “Autumn launch films” heading before reading the HttpOnly cookie. Each Playwright server run gets an explicit isolated filesystem directory, even in a worker environment that exposes managed-identity variables. The claim passed 20/20 repeated desktop/mobile executions.
4. **In-chain validation lost focus and field association:** the form validates subcontractor, work, and money before sending. Inline errors use stable `aria-describedby`, invalid controls use `aria-invalid`, and the first invalid field receives focus. Server field errors map back to the same controls. The browser regression enters `$1` with both text fields blank, proves no cost request is sent, checks both associations and focus, then corrects and saves.
5. **Five short mobile link targets:** the wordmark, breadcrumb link, and three footer links now have a 44px minimum height. The 390px browser regression measures all five rendered boxes.
6. **Architecture documentation conflict:** `.factory/design.md`, `.factory/plan.md`, `.factory/demo.md`, and `README.md` now describe shared Azure Blob demo records and quota buckets, three supported M1 replicas, local locked-file fallback, and the M2 database topology gate.

## Local verification

- Clean install: `npm ci` — 155 packages, 0 vulnerabilities.
- Clean Rust rebuild: `cargo clean`, followed by `npm run check` — 9/9 Vitest tests, TypeScript/Vite production build, rustfmt, clippy with warnings denied, and 20/20 Rust tests passed.
- Release build: `BUILD_SHA=repair-local cargo build --release --locked` passed from a clean target.
- Browser: `npm run test:e2e` — 48/48 across desktop Chromium and the 390px mobile project. This includes every browser claim, seven-route axe serious/critical scans, keyboard create/reset, dialogs, route focus/back, console errors, privacy requests, 200% text, responsive overflow, form recovery, and touch targets.
- Reset stress: the tagged reset claim passed 20/20 parallel/repeated executions after the readiness fix. Its exact registry command also passed desktop and mobile from a new server sandbox.
- Claims: every one of the 17 exact commands in `.factory/claims.json` passed. Browser claims execute in both projects; Rust claim commands execute the named integration test.
- Shared-limit regression: two independent application states sharing one store returned five `201` provisions then one `429`; the 41st global request returned `429`; both rejections carried `Retry-After`.
- Concurrent retry regression: 12 requests below the 30/minute write allowance returned one `201` and eleven `200`; the final job had exactly one added cost.
- Local URL verifier: 778 ms load, zero console/page errors, title and `lang=en`, one H1, one main, no missing image alt, and no unnamed buttons. Desktop and 390px full-page captures were inspected without clipping or overlap.
- Bundle: initial JS 96.67 KiB gzip, CSS 5.70 KiB gzip, and WOFF2 fonts 71.02 KiB total.

## Container and live verification

- ACR built the multi-stage Dockerfile from a `.git`-excluded source archive using `rust:1-slim`, then pushed the image successfully. The runtime remains non-root and exposes only port 8080.
- The existing Container App deployment configuration was preserved: managed identity, one-to-three replicas, custom domain, and only `PORT=8080`. No DNS, certificate, billing, or other infrastructure was changed.
- `/health` returned the deployed source commit; `/ready` returned `200` with `demo_store: azure-blob-shared`.
- Live provisioning from one fresh ingress address returned `201` five times, then `429` with `Retry-After: 3600` on attempt six.
- A fresh concurrent live global burst admitted exactly the shared allowance and returned `429` with `Retry-After` for every excess request.
- A live 12-way retry with one workspace/body/idempotency key returned one `201`, eleven `200`, zero `503`, and exactly one added cost.
- Live Playwright passed all 48 tests in desktop and 390px projects. The URL verifier reported no console errors or missing semantic basics.
- Lighthouse mobile: performance 99, accessibility 100, best practices 100, SEO 100; FCP 1.7 s, LCP 1.7 s, TBT 30 ms, CLS 0.026.
- Evidence is under `/work/evidence/repair-2-local`, `/work/evidence/repair-2-live`, and `/work/evidence/repair-2-lighthouse.json` in the worker environment.

## Applicability and known gaps

- Package/consumer checks do not apply because this is not a library.
- Offline/update checks do not apply because M1 is not a PWA and makes no offline claim.
- CIAM, billing, and AI live checks do not apply to the deliberately public, deterministic M1 demo.
- Real organizations, role-based access, tenant storage, billing, exports/backups, and customer data remain M2+ work in `.factory/plan.md`. The M2 architecture gate must resolve its planned SQLite writer topology before implementation.
- No release-blocking repair gap remains.
