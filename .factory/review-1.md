# Adversarial first-read review 1 — FAIL

Reviewed 2026-08-29 UTC against the live deployment at <https://subcontractor-margin-chain.sociobot.in> and repository commit `ab5ac4df62e5dc31f8fd8c831f27c287398a3392`. The live `/health` endpoint reports build `406f2fc4d2b2c46f95e07b772c593b9438dd633c`.

**Verdict: FAIL.** The first screen and isolated sample are clear and usable. The shipped product still cannot do the brief's real job because it has no real agency account, durable tenant data, or role-based protection. Thirty-two additional findings remain. A pass requires zero findings.

## 30-second cold read

I opened `/` in separate fresh Chromium contexts at 390×844 and 1440×900 without scrolling.

| Question | My answer from the first screen | Result |
| --- | --- | --- |
| What does it do? | It puts a client's committed amount, subcontractor costs, and invoice state together so an agency can see expected margin before work begins. | Pass |
| Who is it for? | Boutique agencies that hire subcontractors. | Pass |
| What should I click first? | **Try it with sample data** to open a filled job chain. | Pass |

The phone first screen showed the headline, audience sentence, sample action, adjacent explanation, and three facts by 781 px. The desktop first screen showed the same information by 716 px. Both loaded with status 200, no external request, and no initial console error. This clarity pass does not cure the missing real product in F-1-1.

## Findings

### Critical / blocking

#### F-1-1 — BLOCKING — the only usable product is an expiring fictional demo

- Exact live evidence: **“Demo — sample data, nothing is saved”**, **“Do not enter real client or subcontractor details in the demo”**, **“Do not rely on the demo as permanent storage”**, and **“Accounts and checkout arrive in M2.”**
- Code evidence: `src/app/App.tsx` exposes only public and `/demo` product routes; `src/api/client.ts` calls only `/api/v1/demo/*`; `server/src/routes/mod.rs` registers only demo product APIs. The planned signed-in routes in `src/app/route-manifest.ts` are not mounted.
- Why this fails: the brief requires agencies to record real jobs and protect client identities and contractor rates with roles. A visitor cannot onboard an agency, save real work, invite a team member, restrict rates, or return to durable tenant data. This repeats the unresolved critical finding in the latest `.factory/handoff.md` and `.factory/verification-3.md`.
- Concrete fix: ship organisation onboarding, durable tenant-scoped job chains, owner/finance/producer/viewer permissions enforced in API response shaping, and a working non-demo chain workflow. Keep `/demo` isolated. Add cross-tenant and role-projection claim tests.

### High

#### F-1-2 — the first screen presents an unavailable paid product as current

- Exact quote/location: landing fact **“Studio is $79 a month.”** The demo button **“Start for real”** opens a dialog titled **“Real agency work arrives next”** and says **“Accounts and checkout arrive in M2.”**
- Why this fails: the fact and button imply that a visitor can start or buy the product now. The result is only a roadmap notice. The button is not a result-naming action because it does not start real use.
- Concrete fix: implement onboarding and purchase, or change the fact to **“Planned Studio price: $79 per agency each month.”** Remove **“Start for real”** until it starts onboarding; if a roadmap dialog remains, label it **“See planned real-work features.”**

#### F-1-3 — opening either demo dialog violates the live CSP

- Exact location: `/demo`, opening **“Reset demo”** or **“Start for real.”** Chromium logs: **“Applying inline style violates the following Content Security Policy directive 'style-src 'self'' … The action has been blocked.”**
- Why this fails: the site-structure contract explicitly forbids inline-style CSP violations. The existing console test visits routes but does not open either dialog, so its green result misses a real interaction error.
- Concrete fix: replace the dialog library's runtime inline-style injection with a native or class-backed dialog/scroll lock while keeping `style-src 'self'`. Add a test that opens and closes both dialogs and asserts no console or page errors.

#### F-1-4 — “Change anything” is unlisted and false

- Exact quote/location: landing action note, **“Change anything.”**
- Why this fails: the demo can add a cost, approve one revision, update an invoice state, and create a sample chain. It cannot change every field or existing record. No `claims.json` entry tests this broad promise.
- Concrete fix: replace it with **“Add a cost, approve the pending scope, or mark an invoice sent.”**

### Medium — unlisted claims

#### F-1-5 — the exact three-job fictional fixture claim is not registered

- Exact quote/location: README, **“The demo contains three fictional Northline Studio jobs and keeps every edit in an isolated, expiring workspace.”** Landing also says **“The sample uses fictional names and values.”**
- Why this fails: isolation and expiry are registered, but no claim entry asserts all three seeded jobs or records provenance that proves the identities are fictional.
- Concrete fix: add `m1-demo-fixtures` with a test that asserts the exact three fixture IDs/names and a provenance fixture, or remove the exact count and unverifiable fictional-data assertion.

#### F-1-6 — “complete sample workflow” is an unbounded, unlisted claim

- Exact quote/location: README, **“M1 ships a public product page and a complete sample workflow.”** The same section says **“Creates complete sample job chains…”**
- Why this fails: “complete” does not identify an outcome and is not represented by one claim entry.
- Concrete fix: write the bounded actions instead: **“The demo creates a job chain, adds a committed cost, approves scope, updates an invoice state, and resets the sample.”** Register a tagged end-to-end test for that sentence.

#### F-1-7 — the tax and worker-status exclusion is not registered

- Exact quote/location: landing, **“We do not calculate payroll tax or decide worker status.”** Terms adds **“It does not send invoices, collect money, calculate tax, or decide worker status.”**
- Why this fails: these are product-boundary claims a visitor may rely on, but no claim entry tests the exposed UI/API schema for their absence.
- Concrete fix: add a negative-capability claim test that crawls the product controls and response schema for tax, classification, payment, and invoice-sending functions, or shorten the copy to a tested scope statement.

#### F-1-8 — the Azure production-storage claim is not tested by its registry entry

- Exact quote/location: README, **“Shared Azure Blob demo records and rate limits in production…”** and **“Production selects shared storage through its managed identity…”**
- Why this fails: `m1-shared-replica-persistence` uses two local application states and a durable store; it does not prove Azure Blob or managed-identity selection. The live `/ready` value is useful evidence but is not the registered test.
- Concrete fix: remove provider details from the public README, or add a deployment claim whose test checks the live readiness backend and replica handoff without exposing credentials.

#### F-1-9 — the container/deployment-shape claim is not registered

- Exact quote/location: README, **“One multi-stage container that serves the JSON API and built web assets on `PORT`”** and **“The factory deploys the container and supplies only `PORT`.”**
- Why this fails: the port-startup claim tests a native server process, not the multi-stage container or its runtime environment.
- Concrete fix: add a tagged OCI build/smoke claim that starts the image with only `PORT` and checks web plus API responses, or move the architecture statement to an internal handoff.

#### F-1-10 — the Vite-versus-server behavior is not registered

- Exact quote/location: README, **“Vite-only development does not provide the demo API; use the Rust command for the complete product.”**
- Why this fails: this is setup behavior a developer relies on, but no claim entry verifies it.
- Concrete fix: add a documentation contract test that confirms Vite lacks `/api/v1/demo/*` and the Rust command serves it, or state only the supported Rust run command without contrasting untested behavior.

#### F-1-11 — idempotency behavior is missing from `claims.json`

- Exact quote/location: README, **“Create operations require an `Idempotency-Key`.”** and **“Idempotent retries return the saved result without rewriting it.”**
- Why this fails: integration tests happen to exercise this, but the claim registry has no idempotency entry, so the required public-claim audit cannot discover or run it.
- Concrete fix: register `m1-idempotent-creates` and point it to the existing concurrent retry test, asserting one created cost and replayed responses.

#### F-1-12 — the problem-details response claim is missing from `claims.json`

- Exact quote/location: README, **“Errors use `application/problem+json`.”**
- Why this fails: the no-store registry entry runs a test with problem responses, but its declared claim does not cover the media type or shape.
- Concrete fix: add `m1-problem-details` with assertions for content type, stable code, plain message, request ID, and field error on a rejected request.

#### F-1-13 — integer-cent and rounding guarantees are missing from `claims.json`

- Exact quote/location: README, **“The server stores money as signed integer cents and calculates the floor with conservative upward rounding.”** and **“It never uses a binary floating-point value as the authoritative money amount.”**
- Why this fails: the chain-math claim checks one fixture result, not storage representation, boundary rounding, or rejection of unsafe values.
- Concrete fix: register a money-integrity claim using the existing boundary unit tests plus an API round-trip that proves integer minor units and upward floor rounding.

#### F-1-14 — the build-identity claim is missing from `claims.json`

- Exact quote/location: README, **“`/health` returns the build SHA supplied at image build time.”**
- Why this fails: `health_reports_build_identity` exists, but it is not a registered claim command.
- Concrete fix: add `m1-build-identity` pointing to that test and assert a non-placeholder build SHA in the deployed smoke check.

#### F-1-15 — the “repository does not change infrastructure” claim is not sandbox-verifiable

- Exact quote/location: README, **“Repository code does not change DNS, billing, or other infrastructure directly.”**
- Why this fails: this broad negative claim has no registry entry and cannot be established by the current runtime sandbox.
- Concrete fix: replace it with an operational instruction, **“Deploy this container through the factory; do not run infrastructure changes from this repository.”**

#### F-1-16 — the README's test-coverage and claim-completeness statements are false

- Exact quote/location: README, **“It also checks … console errors…”** and **“Each public claim and its exact command is listed in `.factory/claims.json`.”**
- Why this fails: F-1-3 demonstrates an interaction console error the suite misses, and F-1-4 through F-1-15 identify public claims absent from the registry.
- Concrete fix: extend the console test through both dialogs, register or remove every claim above, then keep the completeness statement only if an automated copy-to-registry audit enforces it.

### Minor — copy

#### F-1-17 — the README opening sentence exceeds the 22-word cap

- Exact quote/location: README opening, 23 words: **“Subcontractor Margin Chain helps boutique agencies see the client promise, subcontractor cost, approval state, invoice state, and expected margin in one job chain.”**
- Concrete fix: **“Subcontractor Margin Chain shows boutique agencies each client commitment, subcontractor cost, approval, invoice, and expected margin in one job chain.”** (20 words.)

#### F-1-18 — “Commercial control” is jargon

- Exact quote/location: landing hero label, **“Commercial control for subcontracted work.”**
- Why this fails: it does not name a task in the user's words and adds no information beyond the headline and lead.
- Concrete fix: delete it, or use **“Job margin tracking for agencies.”**

#### F-1-19 — “One linked record” is a decorative heading

- Exact quote/location: landing preview label, **“One linked record.”**
- Why this fails: it does not say which record or what the section lets the reader verify.
- Concrete fix: **“Job margin preview.”**

#### F-1-20 — “From promise to invoice” is a mood label

- Exact quote/location: landing how-it-works label, **“From promise to invoice.”**
- Why this fails: “promise” is undefined here and the phrase can apply to many products.
- Concrete fix: delete it; the following section heading should carry the meaning.

#### F-1-21 — “Check the chain” does not name the task

- Exact quote/location: landing heading, **“Check the chain in three steps.”**
- Why this fails: heard out of context, “the chain” could mean a supply chain, approval chain, or blockchain.
- Concrete fix: **“Track each job's margin in three steps.”**

#### F-1-22 — “Watch the chain” is a vague step heading

- Exact quote/location: landing step heading, **“Watch the chain.”**
- Why this fails: it does not name the result or decision.
- Concrete fix: **“Check the expected margin.”**

#### F-1-23 — “Check pending work” is an ambiguous status

- Exact quote/location: landing preview stamp, **“Check pending work.”**
- Why this fails: it does not say what is pending or why it affects margin.
- Concrete fix: **“Pending scope may change margin.”**

#### F-1-24 — “Clear limits” is a decorative label

- Exact quote/location: landing limits label, **“Clear limits.”**
- Why this fails: it does not identify the limits.
- Concrete fix: delete it or use **“Demo and product limits.”**

#### F-1-25 — the limits heading compares the tool with a person

- Exact quote/location: landing heading, **“A commercial record, not another project manager.”**
- Why this fails: it is positioning copy rather than a section name, and “project manager” can mean a person.
- Concrete fix: **“What this tool does not do.”**

#### F-1-26 — “Planned agency plans” is redundant internal copy

- Exact quote/location: landing pricing label, **“Planned agency plans.”**
- Why this fails: repeating “plan” does not clarify availability.
- Concrete fix: **“Planned pricing.”**

#### F-1-27 — “active work” is inconsistent with the priced unit

- Exact quote/location: landing heading, **“Price by active work, not seats.”**
- Why this fails: the plans are limited by active job chains, not an undefined quantity called “work.”
- Concrete fix: **“Planned pricing by active job chains.”**

#### F-1-28 — the same concepts use inconsistent and sometimes inaccurate terms

- Exact locations: **“client promise”** versus **“client commitment”**; **“cash”** versus **“invoice state”** and **“client milestone”**; **“active work”** versus **“active job chains.”**
- Why this fails: “cash” suggests bank/payment data that the tool does not hold, while the copy audit's own terminology table selects different terms.
- Concrete fix: use **client commitment**, **client invoice milestone**, and **active job chain** everywhere. Reserve **committed cost** for the total and **subcontractor commitment** for one cost line.

#### F-1-29 — the README test-coverage sentence exceeds the 22-word cap

- Exact quote/location: README, 23 words: **“It also checks keyboard flows, route focus, deep links, 200% text zoom, console errors, internal links, and current serious or critical axe findings.”**
- Concrete fix: **“It checks keyboard use, route focus, deep links, 200% text zoom, console errors, and internal links. It also checks serious and critical axe findings.”**

#### F-1-30 — README milestone labels are internal jargon

- Exact locations include **“M1 ships…”**, **“What M1 does”**, **“M2 work”**, **“M1 does not show dead sign-in…”**, and **“The M1 routes…”**
- Why this fails: a first-time user does not know the factory's milestone vocabulary; “dead sign-in” is also developer jargon.
- Concrete fix: use **“Current demo”**, **“What the demo does”**, **“Not available yet”**, and **“Demo API routes.”** Rewrite the controls sentence as **“Sign-in and purchase controls stay hidden until they work.”**

#### F-1-31 — the README omits the unit for the Portfolio allowance

- Exact quote/location: README, **“Shows the planned Studio price of $79 per agency each month for 25 active jobs and Portfolio price of $159 for 100.”**
- Why this fails: “100” has no noun, and “active jobs” differs from the landing page's “active job chains.”
- Concrete fix: **“Studio is planned at $79 per agency each month for 25 active job chains. Portfolio is planned at $159 for 100 active job chains.”**

### Minor — structure and missed leverage

#### F-1-32 — route-specific Twitter metadata remains the landing metadata

- Exact location: on `/demo`, `/privacy`, `/terms`, `/404`, and both chain routes, `document.title`, canonical, and Open Graph title change, but `twitter:title` stays **“Subcontractor Margin Chain — protect job margin”** and the Twitter description also stays the landing description.
- Why this fails: shared route cards describe the landing page rather than the route being shared.
- Concrete fix: update `twitter:title` and `twitter:description` alongside the Open Graph fields and add route assertions.

#### F-1-33 — spreadsheet import and data export are missing

- Exact evidence: the brief says agencies currently keep subcontractor rates in spreadsheets. The live UI and mounted API have no import or export; only future route-manifest entries mention them.
- Why this matters: importing existing jobs removes the largest adoption cost, and export is expected before an agency trusts the tool with commercial records.
- Concrete fix: add CSV import with column mapping and a dry-run validation preview, plus CSV/JSON export of job chains. The demo should import a bundled fixture and download locally without touching real data. Register both observable outcomes as claims. AI is not needed for the core arithmetic; if free-text scope extraction is later validated, use the Sociobot gateway only as an explicit, reviewable optional step.

## Demo and sandbox verification

The one-click demo passes its core sandbox checks:

- Landing **“Try it with sample data”** reaches `/demo` in one click.
- At 390 px, the first post-click screen already shows **Job margin register**, three active jobs, `$51,600` client commitments, `$33,700` committed cost, and two jobs needing a check.
- The persistent banner, **Reset demo**, and **Start for real** are visible.
- I added a one-dollar sample commitment, reset, and confirmed Autumn launch films returned to `$14,500` committed cost.
- Reset replaced the host-only `HttpOnly; Secure; SameSite=Lax` cookie and the old workspace returned 401.
- `localStorage` was empty. The entire landing → demo → mutation → reset request log used only `https://subcontractor-margin-chain.sociobot.in` and only `/api/v1/demo/*` product APIs.
- Two separate local claim workspaces remained isolated and expired within 24 hours.
- The exception is F-1-3: both demo dialogs produce a CSP console error.

## Claims results from a clean clone

I cloned commit `ab5ac4df62e5dc31f8fd8c831f27c287398a3392` into `/tmp/subcontractor-margin-chain-review-1-clean`, ran `npm ci`, then ran every exact command in `.factory/claims.json`.

| Claim | Result | Evidence |
| --- | --- | --- |
| `m1-chain-math` | Pass | 2/2 desktop and 390 px |
| `m1-margin-risk` | Pass | 2/2 desktop and 390 px |
| `m1-linked-status` | Pass | 2/2 desktop and 390 px |
| `m1-demo-no-account` | Pass | 2/2 desktop and 390 px |
| `m1-demo-reset` | Pass | 2/2 desktop and 390 px |
| `m1-plan-prices` | Pass | 2/2 desktop and 390 px |
| `m1-demo-isolation-expiry` | Pass | 2/2 desktop and 390 px |
| `m1-public-privacy` | Pass | 2/2 desktop and 390 px |
| `m1-demo-cookie` | Pass | 1 Rust integration test |
| `m1-shared-replica-persistence` | Pass | 1 Rust integration test |
| `m1-port-only-startup` | Pass | 1 Rust integration test |
| `m1-security-headers` | Pass | 1 Rust integration test |
| `m1-api-rate-limits` | Pass | 1 Rust integration test |
| `m1-demo-no-store` | Pass | 1 Rust integration test |
| `m1-true-404` | Pass | 1 Rust integration test |
| `m1-asset-cache` | Pass | 1 Rust integration test |
| `m1-operations` | Pass | 1 Rust integration test |

No registered claim test failed. `npm run check` also passed: 9 Vitest tests, production build, formatting, Clippy with warnings denied, and 20 Rust tests. The initial JavaScript bundle was 96.67 KiB gzip. The fail verdict comes from F-1-1 and the unlisted claims, not a registered-test failure.

## Earlier finding audit

There are no earlier `.factory/review-*.md` or `.factory/polish-*.md` files. I checked both handoffs and the verification findings they summarize.

| Earlier finding | Live and code confirmation | Status |
| --- | --- | --- |
| Process-local demo state lost across replicas | Live demo read/mutate/reset succeeded; shared-store claim passed; `/ready` reports `azure-blob-shared`. | Fixed |
| Cold claim command timed out | First exact Playwright claim passed from the clean clone after a 56-second cold Rust compile; config now allows 300 seconds. | Fixed |
| Public claims missing from registry | Registry grew to 17 entries, but F-1-4 through F-1-16 remain unlisted or overbroad. | **Not fully fixed** |
| Wordmark accessible-name mismatch | Live axe and explicit accessible-name test pass. | Fixed |
| Pinned Rust Docker image | Both repository and deployed source use `rust:1-slim`. | Fixed in code |
| Unknown routes returned 200 | Live unknown paths and `/404` return HTTP 404 with the designed page. | Fixed |
| Immutable asset caching missing | Registered cache claim passes. | Fixed |
| Demo errors lacked `no-store` | Registered success/error no-store claim passes. | Fixed |
| Clippy errors | `npm run check` passes with `-D warnings`. | Fixed |
| Readiness and metrics missing | Registered operations claim passes; live `/ready` returns JSON readiness. | Fixed |
| Demo cookie lacked `Secure` | Live cookie is host-only, HttpOnly, Secure, and SameSite=Lax. | Fixed |
| Public source maps | Current production build emits no source-map files. | Fixed |
| Limits multiplied by replica count | Live: five provisions returned 201, the sixth returned 429 with `Retry-After: 3600`; 40 global requests returned 401, request 41 returned 429 with `Retry-After: 1`. | Fixed |
| Concurrent allowed retries returned 503 | Live 12-way retry returned one 201 and eleven 200 responses, with exactly one matching cost. | Fixed |
| Reset claim race | Exact clean-clone claim passed in both projects; live reset also succeeded after visible readiness. | Fixed |
| Invalid cost form lost focus/association | Live quality suite verifies focused fields, `aria-invalid`, and `aria-describedby`. | Fixed |
| Mobile links below 44 px | Live quality suite's measured touch-target test passes. | Fixed |
| Architecture docs conflicted with deployment | Design, demo, and README now describe the shared demo store and three replicas. | Fixed |
| No real agency workflow or role boundary | Live and code evidence remain unchanged; see F-1-1. | **Unfixed / blocking** |

## Structure, accessibility, and visual identity

- Route titles match the required product-description pattern. Each tested route has one `h1`, one `main`, a route description, and a canonical URL.
- `/`, `/demo`, `/demo/chains/new`, all three sample job links, `/privacy`, `/terms`, and the external Param Factory link resolved as expected. `/404` intentionally returns 404. No dead navigable link was found.
- The 404 is designed in the ledger style and offers home/demo recovery.
- Deep links, back navigation, route focus, the polite announcer, keyboard creation/reset, 200% text zoom, mobile overflow, and 44 px measured targets passed live.
- Live Playwright accessibility/quality run: 32/32 passed across desktop and 390 px, including serious/critical axe scans on seven routes. F-1-3 remains because that suite does not capture dialog console output.
- The header/footer are consistent and include the wordmark, Demo, How it works, Pricing, Privacy, Terms, Param Factory, and build ID.
- The warm-paper carbon-copy ledger, offset cyan/red sheets, editorial display face, tabular money, and stamped states are distinct from a generic SaaS template and match `.factory/design.md`.
- No runtime AI feature, provider key, direct Azure OpenAI endpoint, or Dodo integration is present. Deterministic margin arithmetic does not need AI.

## Full copy audit

Counts treat a currency value, hyphenated term, version, path, or URL as one word. Symbols are not words. Code blocks are commands rather than sentences and are excluded. `Flag` points to the required finding and rewrite above.

### Landing page

| # | Location | Copy | Words | Result |
| ---: | --- | --- | ---: | --- |
| 1 | Header wordmark | Margin Chain | 2 | Pass |
| 2 | Header link | Demo | 1 | Pass |
| 3 | Header link | How it works | 3 | Pass |
| 4 | Header link | Pricing | 1 | Pass |
| 5 | Header link | Privacy | 1 | Pass |
| 6 | Hero label | Commercial control for subcontracted work | 5 | Flag F-1-18 |
| 7 | Hero heading | Protect margin before work starts. | 5 | Pass |
| 8 | Hero lead | For boutique agencies that hire subcontractors, it links every client promise to cost and cash. | 15 | Flag F-1-28 |
| 9 | Hero action | Try it with sample data | 5 | Pass |
| 10 | Hero action | See how the chain works | 5 | Flag F-1-21 |
| 11 | Hero note | See a filled job chain. | 5 | Pass |
| 12 | Hero note | Change anything. | 2 | Flag F-1-4 |
| 13 | Hero note | Reset when finished. | 3 | Pass |
| 14 | Hero fact | No account for the demo. | 5 | Pass |
| 15 | Hero fact | Demo changes are discarded. | 4 | Pass |
| 16 | Hero fact | Studio is $79 a month. | 5 | Flag F-1-2 |
| 17 | Illustration alt | A layered job record links a client promise to subcontractor cost and expected margin. | 14 | Flag F-1-28 |
| 18 | Preview label | One linked record | 3 | Flag F-1-19 |
| 19 | Preview heading | See promise, cost, and cash together. | 6 | Flag F-1-28 |
| 20 | Preview record label | Cinder & Co. → Aster Bikes | 4 | Pass |
| 21 | Preview job | Autumn launch films | 3 | Pass |
| 22 | Preview status | Check pending work | 3 | Flag F-1-23 |
| 23 | Preview field | Client commitment | 2 | Pass |
| 24 | Preview field | Committed cost | 2 | Pass |
| 25 | Preview field | Expected margin | 2 | Pass |
| 26 | Preview note | A pending social cut-down remains visible before you approve more work. | 11 | Pass |
| 27 | Preview action | Open this sample job | 4 | Pass |
| 28 | How label | From promise to invoice | 4 | Flag F-1-20, F-1-28 |
| 29 | How heading | Check the chain in three steps. | 6 | Flag F-1-21 |
| 30 | Step heading | Record the promise. | 3 | Flag F-1-28 |
| 31 | Step copy | Add the client commitment, approved scope, and margin floor. | 9 | Pass |
| 32 | Step heading | Commit the cost. | 3 | Pass |
| 33 | Step copy | Link each subcontractor amount before the work starts. | 8 | Pass |
| 34 | Step heading | Watch the chain. | 3 | Flag F-1-22 |
| 35 | Step copy | See the change that puts margin at risk, then fix it before invoicing. | 13 | Pass |
| 36 | Limits label | Clear limits | 2 | Flag F-1-24 |
| 37 | Limits heading | A commercial record, not another project manager. | 7 | Flag F-1-25 |
| 38 | Limit | Your demo workspace is isolated and expires within 24 hours. | 10 | Pass |
| 39 | Limit | The sample uses fictional names and values. | 7 | Flag F-1-5 |
| 40 | Limit | Do not enter client data. | 5 | Pass |
| 41 | Limit | We do not calculate payroll tax or decide worker status. | 10 | Flag F-1-7 |
| 42 | Pricing label | Planned agency plans | 3 | Flag F-1-26 |
| 43 | Pricing heading | Price by active work, not seats. | 6 | Flag F-1-27, F-1-28 |
| 44 | Pricing note | Accounts and checkout arrive in the next milestone. | 8 | Flag F-1-2, F-1-30 |
| 45 | Plan heading | Studio | 1 | Pass |
| 46 | Plan price | $79 per agency each month | 5 | Pass |
| 47 | Plan limit | Keep up to 25 job chains active. | 7 | Pass |
| 48 | Plan heading | Portfolio | 1 | Pass |
| 49 | Plan price | $159 per agency each month | 5 | Pass |
| 50 | Plan limit | Keep up to 100 job chains active. | 7 | Pass |
| 51 | Footer name | Subcontractor Margin Chain | 3 | Pass |
| 52 | Footer line | Keep the client promise, subcontractor cost, and margin in one job chain. | 12 | Flag F-1-28 |
| 53 | Footer link | Privacy | 1 | Pass |
| 54 | Footer link | Terms | 1 | Pass |
| 55 | Footer link | Built by Param Factory | 4 | Pass |
| 56 | Footer build | Build 406f2fc4d2b2c46f95e07b772c593b9438dd633c | 2 | Pass |

### README

| # | Copy | Words | Result |
| ---: | --- | ---: | --- |
| 1 | Subcontractor Margin Chain | 3 | Pass |
| 2 | Subcontractor Margin Chain helps boutique agencies see the client promise, subcontractor cost, approval state, invoice state, and expected margin in one job chain. | 23 | Flag F-1-17, F-1-28 |
| 3 | M1 ships a public product page and a complete sample workflow. | 11 | Flag F-1-6, F-1-30 |
| 4 | Open the live demo without an account. | 7 | Pass |
| 5 | The demo contains three fictional Northline Studio jobs and keeps every edit in an isolated, expiring workspace. | 17 | Flag F-1-5 |
| 6 | What M1 does | 3 | Flag F-1-30 |
| 7 | Shows client commitment, committed subcontractor cost, expected margin, and the exact floor calculation. | 13 | Pass |
| 8 | Warns when a new cost puts the expected margin below the floor and names that cost. | 16 | Pass |
| 9 | Keeps a scope approval and linked client milestone beside the same job. | 12 | Pass |
| 10 | Creates complete sample job chains and resets the sample to its original state. | 13 | Flag F-1-6 |
| 11 | Shows the planned Studio price of $79 per agency each month for 25 active jobs and Portfolio price of $159 for 100. | 22 | Flag F-1-31 |
| 12 | Accounts, real agency storage, team roles, and hosted checkout are M2 work. | 12 | Flag F-1-30 |
| 13 | M1 does not show dead sign-in or purchase controls. | 9 | Flag F-1-30 |
| 14 | Stack | 1 | Pass |
| 15 | React 19, React Router, strict TypeScript, and Vite | 8 | Pass |
| 16 | Rust 2021, axum, and tokio | 5 | Pass |
| 17 | Shared Azure Blob demo records and rate limits in production, with locked filesystem storage for local containers | 17 | Flag F-1-8 |
| 18 | One multi-stage container that serves the JSON API and built web assets on PORT | 14 | Flag F-1-9 |
| 19 | The server needs only PORT, which defaults to 8080. | 9 | Pass |
| 20 | Production selects shared storage through its managed identity; local containers use /data. | 12 | Flag F-1-8 |
| 21 | Health, readiness, and Prometheus metrics are available at /health, /ready, and /internal/metrics. | 12 | Pass |
| 22 | Run locally | 2 | Pass |
| 23 | Requirements: Node.js 22+, npm 10+, and a current stable Rust toolchain. | 12 | Pass |
| 24 | Then open http://127.0.0.1:8080/demo. | 8 | Pass |
| 25 | Vite-only development does not provide the demo API; use the Rust command for the complete product. | 16 | Flag F-1-10 |
| 26 | Test and verify | 3 | Pass |
| 27 | Playwright 1.58.2 runs every claim on desktop Chromium and a 390px Chromium profile. | 15 | Pass |
| 28 | It also checks keyboard flows, route focus, deep links, 200% text zoom, console errors, internal links, and current serious or critical axe findings. | 23 | Flag F-1-16, F-1-29 |
| 29 | Each public claim and its exact command is listed in .factory/claims.json. | 12 | Flag F-1-16 |
| 30 | Demo fixtures, reset behavior, and the storage boundary are in .factory/demo.md. | 12 | Pass |
| 31 | API | 1 | Pass |
| 32 | The M1 routes are under /api/v1/demo/. | 6 | Flag F-1-30 |
| 33 | Create operations require an Idempotency-Key. | 5 | Flag F-1-11 |
| 34 | Idempotent retries return the saved result without rewriting it. | 9 | Flag F-1-11 |
| 35 | Per-client limits are shared across replicas and every 429 includes Retry-After. | 11 | Pass |
| 36 | Errors use application/problem+json. | 4 | Flag F-1-12 |
| 37 | Every demo response uses Cache-Control: no-store. | 6 | Pass |
| 38 | The server stores money as signed integer cents and calculates the floor with conservative upward rounding. | 16 | Flag F-1-13 |
| 39 | It never uses a binary floating-point value as the authoritative money amount. | 12 | Flag F-1-13 |
| 40 | Build and deploy | 3 | Pass |
| 41 | The factory deploys the container and supplies only PORT. | 9 | Flag F-1-9 |
| 42 | /health returns the build SHA supplied at image build time. | 10 | Flag F-1-14 |
| 43 | Repository code does not change DNS, billing, or other infrastructure directly. | 11 | Flag F-1-15 |
| 44 | Privacy and license | 3 | Pass |
| 45 | The public site has no analytics, remote fonts, third-party scripts, or advertising. | 12 | Pass |
| 46 | The demo is for fictional data and can be destroyed with “Reset demo.” | 13 | Flag F-1-5 |
| 47 | See /privacy and /terms in the product. | 7 | Pass |
| 48 | Licensed under MIT. | 3 | Pass |
| 49 | The self-hosted Newsreader and Recursive fonts use the SIL Open Font License; their notice is in public/fonts/OFL.txt. | 18 | Pass |

### Terminology target

| Concept | Use | Replace |
| --- | --- | --- |
| Amount the client agreed to pay | client commitment | client promise |
| One subcontractor cost line | subcontractor commitment | amount, cost when referring to one line |
| Sum of subcontractor commitments | committed cost | subcontractor cost when referring to the total |
| Scheduled client billing state | client invoice milestone | cash, invoice state, client milestone |
| Product record | job chain | chain when context is missing |
| Priced usage unit | active job chain | active work |
| Public try-out | demo | sample workflow, preview when referring to the interactive demo |

## What would make this perfect

Implement the real, role-protected agency workflow from F-1-1; make availability copy truthful; clear the dialog CSP error; register or remove every claim; apply every copy rewrite; synchronize Twitter route metadata; and add tested spreadsheet import plus export. Then rerun this entire cold-review checklist from fresh phone and desktop contexts. There is no smaller honest route to PASS because the standard is zero remaining findings.
