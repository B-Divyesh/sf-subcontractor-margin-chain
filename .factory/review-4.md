# Adversarial first-read review 4 — PASS

Reviewed 2026-08-29 UTC against <https://subcontractor-margin-chain.sociobot.in>, live build `6a80663c2d3fb0ecab5a117293d75bde53a30ef6`, and the matching clean checkout. Product code was not modified.

## Verdict

**PASS.** There are zero findings, no failed claim, and no untested landing-page or README claim. The product is clear on first view, opens a populated isolated demo in one click, supports the brief's saved-workspace job, and closes every earlier review finding.

## 30-second cold read

I opened `/` without prior cookies or storage in separate 390 × 844 and 1440 × 900 Chromium contexts. I did not scroll before answering.

| Question | Answer from the first screen | Result |
| --- | --- | --- |
| What does this do? | It links a client's commitment, subcontractor costs, and client invoice milestones so an agency can check job margin before work starts. | Pass |
| Who is it for? | Boutique agencies that hire subcontractors. | Pass |
| What should I click first? | **Try it with sample data** to open a filled job chain. | Pass |

The decisive text was **“Protect margin before work starts.”**, **“For boutique agencies that hire subcontractors, it links each client commitment to costs and client invoice milestones.”**, and **“Try it with sample data.”** The adjacent note says what the sample permits. All three short facts are visible without scrolling at both widths. Both cold loads returned 200, made only same-origin requests, and produced no console or page error.

## Findings

None.

## Copy audit

Counts use whitespace-delimited words; standalone symbols are not words. Hyphenated terms, paths, versions, and currency values count as one word. Headings, navigation, actions, and image alternative text are included even when they are fragments. Commands are excluded because they are code, not sentences. No item exceeds 22 words, contains a banned marketing word, uses a metaphor or mood heading, or gives a button a vague result.

### Landing page

| Location | Copy | Words | Result |
| --- | --- | ---: | --- |
| Header wordmark | Margin Chain | 2 | Pass |
| Header link | Demo | 1 | Pass |
| Header link | How it works | 3 | Pass |
| Header link | Saved workspace | 2 | Pass |
| Header link | Privacy | 1 | Pass |
| Hero label | Job margin tracking for agencies | 5 | Pass |
| H1 | Protect margin before work starts. | 5 | Pass |
| Lead | For boutique agencies that hire subcontractors, it links each client commitment to costs and client invoice milestones. | 17 | Pass |
| Primary action | Try it with sample data | 5 | Pass |
| Secondary action | See how the chain works | 5 | Pass |
| Action note | See a filled job chain. | 5 | Pass |
| Action note | Add a cost, approve scope, or mark a client invoice milestone sent. | 12 | Pass |
| Action note | Reset when finished. | 3 | Pass |
| Fact | No account for the demo. | 5 | Pass |
| Fact | Demo changes are discarded. | 4 | Pass |
| Fact | The saved workspace is a free beta. | 7 | Pass |
| Illustration alt | A layered job record links a client commitment to subcontractor cost and expected margin. | 14 | Pass |
| Preview label | Job margin preview | 3 | Pass |
| Preview heading | See commitment, cost, and client invoice milestone status together. | 9 | Pass |
| Record label | Cinder & Co. → Aster Bikes | 4 | Pass |
| Record heading | Autumn launch films | 3 | Pass |
| Record status | Pending scope may change margin | 5 | Pass |
| Record field | Client commitment | 2 | Pass |
| Record field | Committed cost | 2 | Pass |
| Record field | Expected margin | 2 | Pass |
| Preview note | A pending social cut-down remains visible before you approve more work. | 11 | Pass |
| Preview action | Open this sample job | 4 | Pass |
| Section heading | Track each job's margin in three steps. | 7 | Pass |
| Step heading | Record the client commitment. | 4 | Pass |
| Step copy | Add the approved scope, client commitment, and margin floor. | 9 | Pass |
| Step heading | Commit the cost. | 3 | Pass |
| Step copy | Link each subcontractor amount before the work starts. | 8 | Pass |
| Step heading | Check the expected margin. | 4 | Pass |
| Step copy | See the change that puts margin at risk, then fix it before invoicing. | 13 | Pass |
| Limits label | Demo and product limits | 4 | Pass |
| Limits heading | What this tool does not do. | 6 | Pass |
| Limit | Your demo workspace is isolated and expires within 24 hours. | 10 | Pass |
| Limit | The sample uses fictional names and values. | 7 | Pass |
| Guidance | Enter real data only in your agency workspace. | 8 | Pass |
| Limit | We do not calculate payroll tax or decide worker status. | 10 | Pass |
| Workspace label | Saved workspace beta | 3 | Pass |
| Workspace heading | Create a saved workspace. | 4 | Pass |
| Workspace copy | Create real job chains separately from the sample. | 8 | Pass |
| Workspace copy | This beta has no checkout or paid plan. | 8 | Pass |
| Option heading | Save real job chains | 4 | Pass |
| Workspace state | Free beta | 2 | Pass |
| Workspace action | Create your agency workspace | 4 | Pass |
| Option heading | Keep the sample separate | 4 | Pass |
| Option copy | Use the demo to test the workflow. | 7 | Pass |
| Footer name | Subcontractor Margin Chain | 3 | Pass |
| Footer line | Keep each client commitment, subcontractor cost, and margin in one job chain. | 12 | Pass |
| Footer link | Privacy | 1 | Pass |
| Footer link | Terms | 1 | Pass |
| Footer link | Built by Param Factory | 4 | Pass |

### README

| Location | Copy | Words | Result |
| --- | --- | ---: | --- |
| Title | Subcontractor Margin Chain | 3 | Pass |
| Opening | Subcontractor Margin Chain shows boutique agencies each client commitment, subcontractor cost, approval, client invoice milestone, and expected margin in one job chain. | 22 | Pass |
| Intro | Open the live demo without an account. | 7 | Pass |
| Intro | Its isolated workspace expires within 24 hours. | 7 | Pass |
| Heading | Current demo | 2 | Pass |
| Demo | Shows the client commitment, committed cost, expected margin, and exact floor calculation. | 12 | Pass |
| Demo | Names the cost that puts expected margin below the floor. | 10 | Pass |
| Demo | Keeps scope approval and client invoice milestones beside the same job. | 11 | Pass |
| Demo | Creates a job chain, adds a cost, approves scope, updates a client invoice milestone status, and resets the sample. | 19 | Pass |
| Demo | Maps CSV columns and previews every row before importing valid job chains. | 12 | Pass |
| Demo | Exports all current demo job chains as local CSV or JSON downloads. | 12 | Pass |
| Fixture | The demo starts with three original fictional Northline Studio jobs. | 10 | Pass |
| Fixture | Their provenance is recorded in `.factory/demo-fixtures.json`. | 6 | Pass |
| Heading | Real agency workspace | 3 | Pass |
| Workspace | Open `/start` to create a saved agency workspace. | 8 | Pass |
| Workspace | Real job chains use a separate session and never load the demo fixtures. | 13 | Pass |
| Workspace | Imports existing job chains from CSV after a column-mapping dry run. | 11 | Pass |
| Workspace | Exports the current saved register as CSV or JSON. | 9 | Pass |
| Workspace | Hides client identities, subcontractor details, costs, and derived margin totals from producer and viewer roles. | 15 | Pass |
| Workspace | The saved workspace is a free beta. | 7 | Pass |
| Workspace | This release has no checkout or paid plan. | 8 | Pass |
| Heading | Stack | 1 | Pass |
| Stack | React 19, React Router, strict TypeScript, and Vite | 8 | Pass |
| Stack | Rust 2021, axum, and tokio | 5 | Pass |
| Stack | Shared demo and saved agency records across application replicas | 9 | Pass |
| Stack | Locked filesystem storage for local containers | 6 | Pass |
| Runtime | The server starts with only `PORT`, which defaults to 8080. | 10 | Pass |
| Runtime | Readiness and Prometheus metrics are available at `/ready` and `/internal/metrics`. | 10 | Pass |
| Heading | Run locally | 2 | Pass |
| Requirements | Requirements: Node.js 22+, npm 10+, and a current stable Rust toolchain. | 11 | Pass |
| Run | Open `http://127.0.0.1:8080/?demo=1` for the supported sample path. | 7 | Pass |
| Heading | Test and verify | 3 | Pass |
| Tests | Playwright 1.58.2 runs browser claims on desktop Chromium and a 390px Chromium profile. | 13 | Pass |
| Heading | Demo API | 2 | Pass |
| API | Demo routes live under `/api/v1/demo/`. | 5 | Pass |
| API | Create operations require an `Idempotency-Key`. | 5 | Pass |
| API | A retry returns its saved result without adding another record. | 10 | Pass |
| API | Per-client limits are shared across replicas. | 6 | Pass |
| API | Every rejected limit response includes `Retry-After`. | 6 | Pass |
| API | Rejected requests use `application/problem+json` with a stable code, message, request ID, and field when relevant. | 15 | Pass |
| API | Every demo API response uses `Cache-Control: no-store`. | 7 | Pass |
| Money | The server stores money as signed integer cents. | 8 | Pass |
| Money | It rounds each percentage floor upward to the next cent when needed. | 12 | Pass |
| Heading | Build and deploy | 3 | Pass |
| Deploy | `/health` returns the build SHA supplied during the image build. | 10 | Pass |
| Deploy | Deploy this container through the factory; do not change infrastructure from this repository. | 13 | Pass |
| Heading | Privacy and license | 3 | Pass |
| Privacy | The public and demo flow makes no cross-origin requests. | 9 | Pass |
| Privacy | It has no analytics, remote fonts, third-party scripts, or advertising. | 10 | Pass |
| Privacy | CSV files stay in the browser until valid rows are sent to the selected workspace. | 15 | Pass |
| Privacy | CSV and JSON exports are generated in the browser. | 9 | Pass |
| Privacy | Choose “Reset demo” to destroy the current workspace. | 8 | Pass |
| Privacy | See Privacy and Terms. | 4 | Pass |
| License | Licensed under MIT. | 3 | Pass |
| License | Newsreader and Recursive use the SIL Open Font License in `public/fonts/OFL.txt`. | 11 | Pass |

The developer-facing API and stack terms are necessary in those README sections. The landing terminology is consistent: job chain, client commitment, committed cost, subcontractor commitment, expected margin, margin floor, and client invoice milestone.

## Demo and sandbox

- **One click:** **Try it with sample data** provisions the workspace and finishes at `/demo` without an account.
- **Useful first screen:** at 390 px, the completed first screen shows the persistent demo banner, **Job margin register**, Northline Studio, 3 active jobs, `$51,600` client commitments, `$33,700` committed cost, and 2 jobs needing a check.
- **Realistic data:** the register contains Annual report microsite, Autumn launch films, and Field interview edit, with distinct clients, costs, margins, and risk states.
- **Reset:** after a demo cost mutation, **Reset demo** restores the three fixtures and invalidates the old workspace. The live and clean-clone reset tests both passed.
- **Storage boundary:** the browser holds separate host-only HttpOnly `smc_demo` and `smc_agency` cookies. Demo traffic used only `/api/v1/demo/*`; it did not call `/api/v1/app/*`. `localStorage` and `sessionStorage` stayed empty.
- **Privacy:** the recorded landing → demo → mutation flow made only same-origin requests and loaded no analytics or remote scripts. There is no offline claim to test.

## Claims

I cloned the reviewed commit into `/tmp/smc-review4-clean-LGNPf1`, ran `npm ci`, and executed every exact command in `.factory/claims.json` independently. All 34 passed.

| Claim | Result | Evidence |
| --- | --- | --- |
| `real-agency-records` | Pass | 1/1 Rust integration test |
| `real-tenant-isolation` | Pass | 1/1 Rust integration test |
| `real-shared-replica-persistence` | Pass | 1/1 Rust integration test |
| `agency-role-projection` | Pass | 1/1 Rust integration test |
| `agency-client-identity-projection` | Pass | 1/1 Rust integration test |
| `real-csv-import` | Pass | 2/2 browser profiles |
| `real-data-export` | Pass | 2/2 browser profiles |
| `real-beta-no-billing` | Pass | 2/2 browser profiles |
| `m1-chain-math` | Pass | 2/2 browser profiles |
| `m1-margin-risk` | Pass | 2/2 browser profiles |
| `m1-linked-status` | Pass | 2/2 browser profiles |
| `m1-sample-workflow` | Pass | 2/2 browser profiles |
| `m1-demo-fixtures` | Pass | 2/2 browser profiles |
| `m1-demo-no-account` | Pass | 2/2 browser profiles |
| `m1-demo-reset` | Pass | 2/2 browser profiles |
| `m1-demo-isolation-expiry` | Pass | 2/2 browser profiles |
| `m1-public-privacy` | Pass | 2/2 browser profiles |
| `m1-csv-import` | Pass | 2/2 browser profiles |
| `m1-data-export` | Pass | 2/2 browser profiles |
| `m1-product-boundaries` | Pass | 2/2 browser profiles |
| `real-workspace-onboarding` | Pass | 2/2 browser profiles |
| `m1-demo-cookie` | Pass | 1/1 Rust integration test |
| `m1-shared-replica-persistence` | Pass | 1/1 Rust integration test |
| `m1-port-only-startup` | Pass | 1/1 Rust integration test |
| `m1-security-headers` | Pass | 1/1 Rust integration test |
| `m1-api-rate-limits` | Pass | 1/1 Rust integration test |
| `m1-idempotent-creates` | Pass | 1/1 Rust integration test |
| `m1-problem-details` | Pass | 1/1 Rust integration test |
| `m1-demo-no-store` | Pass | 1/1 Rust integration test |
| `m1-money-integrity` | Pass | 1/1 Rust unit test |
| `m1-build-identity` | Pass | 1/1 Rust integration test |
| `m1-true-404` | Pass | 1/1 Rust integration test |
| `m1-asset-cache` | Pass | 1/1 Rust integration test |
| `m1-operations` | Pass | 1/1 Rust integration test |

The landing and README claim cross-check found no unlisted claim. The local filesystem-lock statement is exercised by the shared persistence and concurrent idempotency tests. Runtime, privacy, import/export, role projection, fixture, boundary, and beta statements each map to a listed claim above.

## Earlier finding audit

I read every earlier review, polish report, and handoff. Each result below was rechecked against the live site and current code rather than accepted from its prior status.

| Earlier ID | Current confirmation | Status |
| --- | --- | --- |
| F-1-1 | `/start`, saved records, tenant isolation, team roles, client/rate projection, real import, and real export all work and have passing claims. | Fixed |
| F-1-2 | The page says **free beta**, exposes working setup, and makes no price or checkout promise. | Fixed |
| F-1-3 | Both native demo dialogs open without CSP, console, or page errors in the live suite. | Fixed |
| F-1-4 | The action note names add-cost, approve-scope, milestone-status, and reset actions. | Fixed |
| F-1-5 | Three exact fictional fixtures and provenance are registered and tested. | Fixed |
| F-1-6 | The README names a bounded workflow and `m1-sample-workflow` performs every action. | Fixed |
| F-1-7 | Tax, worker status, collection, and invoice-sending exclusions are covered by `m1-product-boundaries`. | Fixed |
| F-1-8 | Provider-specific public claims are absent; observable shared persistence is tested for both stores. | Fixed |
| F-1-9 | Visitor copy makes no container-topology promise; the documented server command and build work. | Fixed |
| F-1-10 | The unsupported Vite comparison remains removed. | Fixed |
| F-1-11 | `m1-idempotent-creates` passed its 12-retry concurrency test. | Fixed |
| F-1-12 | `m1-problem-details` passed media-type, code, request-ID, field, and size assertions. | Fixed |
| F-1-13 | `m1-money-integrity` passed integer-cent and upward-rounding assertions. | Fixed |
| F-1-14 | `/health` reports the deployed SHA and the supplied-build-SHA claim passed. | Fixed |
| F-1-15 | The old negative infrastructure claim is now a deployment instruction. | Fixed |
| F-1-16 | Unsupported coverage/completeness prose remains removed; this review found no unlisted public claim. | Fixed |
| F-1-17 | The README opening is exactly 22 words. | Fixed |
| F-1-18 | The label is the concrete **Job margin tracking for agencies**. | Fixed |
| F-1-19 | The preview label is **Job margin preview**. | Fixed |
| F-1-20 | The mood heading is absent. | Fixed |
| F-1-21 | The section heading is **Track each job's margin in three steps.** | Fixed |
| F-1-22 | The third step is **Check the expected margin.** | Fixed |
| F-1-23 | Pending and risk states name scope or margin status in words. | Fixed |
| F-1-24 | The section label is **Demo and product limits**. | Fixed |
| F-1-25 | The heading is **What this tool does not do.** | Fixed |
| F-1-26 | The section is the honest **Saved workspace beta**. | Fixed |
| F-1-27 | The undefined “active work” and unavailable allowances are absent. | Fixed |
| F-1-28 | Landing, demo, and README use the documented product terms consistently. | Fixed |
| F-1-29 | No README sentence exceeds 22 words. | Fixed |
| F-1-30 | Visitor copy contains no M1/M2 labels or “dead sign-in” wording. | Fixed |
| F-1-31 | Unavailable plan allowances are absent. | Fixed |
| F-1-32 | Route-specific Twitter metadata changes with title, description, canonical, and Open Graph metadata. | Fixed |
| F-1-33 | CSV mapping/dry-run and local CSV/JSON export work in both demo and saved workspaces. | Fixed |
| F-2-1 | The saved agency product is live end to end and separate from the demo. | Fixed |
| F-2-2 | The unsupported README coverage/completeness claims remain absent. | Fixed |
| F-3-1 | Producer/viewer API list and detail responses omit both client identities, rates, costs, margins, and risk causes. | Fixed |
| F-3-2 | A fresh `/app/chains` deep link replace-routes to `/start` without an API 401 or console error. | Fixed |
| F-3-3 | Pricing navigation and unverified prices are absent; the working state is labelled **Free beta** with no checkout. | Fixed |
| F-3-4 | `/app/import` maps, previews, confirms, and persists CSV jobs in the saved workspace. | Fixed |
| F-3-5 | The sitemap includes `/start`, excludes `/404`, and every listed URL returns 200; unknown routes return a designed 404. | Fixed |
| F-3-6 | Public copy consistently uses **client invoice milestone** and **client invoice milestone status**. | Fixed |

## Structure, accessibility, and visual identity

- The live 78-test suite passed in desktop Chromium and the 390px project. It covers route semantics, serious/critical axe findings, keyboard operation, focus, back navigation, deep links, 200% zoom, touch targets, dialogs, console errors, metadata, sitemap URLs, and internal links.
- Every reviewed route has one H1, one main landmark, a route-specific title and description, canonical, Open Graph/Twitter metadata, favicon, consistent header/footer, Privacy, and Terms. Unknown addresses return HTTP 404 with designed recovery links.
- The landing title is **Subcontractor Margin Chain — protect job margin**. Route titles follow the required route-first pattern.
- The production JavaScript bundle is 89.24 KiB gzip, below the 150 KiB site-structure limit. Fonts and scripts are self-hosted. Reduced motion and visible focus are implemented.
- The warm-paper carbon-copy ledger, offset cyan/red sheets, ruled records, registration marks, stamps, Newsreader display type, and Recursive body type are specific to margin chains. This is not a generic centered SaaS hero or three-card template.

## Missed leverage and AI

No missing obvious feature remains from the brief. Both demo and saved workspaces support CSV mapping/dry-run import and local CSV/JSON export. Saved records use shared persistence and role-limited team access. The core margin calculation is deterministic; adding AI would not improve the job enough to justify sending commercial data. No decorative AI control, provider key, Azure model endpoint, or direct payment-provider integration exists.

## What would make this perfect

Nothing remains from this checklist. Preserve the current claims, sandbox boundary, concise terminology, route tests, and carbon-copy visual identity as future features are added.
