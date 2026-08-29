# Adversarial first-read review 2 — FAIL

Reviewed 2026-08-29 UTC against `https://subcontractor-margin-chain.sociobot.in` and repository commit `201e1b2ee8088cd520eab17aa0cfe83c35f4ad1c`. This review did not modify product code.

## Verdict

**FAIL.** The cold first read, isolated sample flow, visual identity, metadata, responsive layout, and registered tests are substantially verified. The product still does not perform the brief's real job: it is only an expiring fictional demo and explicitly instructs agencies not to enter real data. This reopens the earlier critical finding. The README also still makes unregistered test-coverage/completeness claims, reopening F-1-16. A pass requires zero findings.

## 30-second cold read

Fresh Chromium contexts, before scrolling:

| Viewport | What it does | For whom | First click | Result |
| --- | --- | --- | --- | --- |
| 390 × 844 | Links a client commitment, subcontractor costs, and invoice milestones so the user can see job margin. | Boutique agencies that hire subcontractors. | **Try it with sample data**. | Pass |
| 1440 × 900 | Same as mobile. | Same as mobile. | **Try it with sample data**. | Pass |

The exact first-screen text that made this clear was: **“Protect margin before work starts.”**, **“For boutique agencies that hire subcontractors, it links each client commitment to costs and client invoice milestones.”**, and **“Try it with sample data.”** Both widths had no initial console/page error, no horizontal overflow, and only same-origin requests.

## Findings

### F-2-1 — BLOCKING — repeat of F-1-1: no real agency product exists

- **Exact live evidence:** the persistent demo banner says **“Demo — sample data, nothing is saved.”** The landing page says **“Do not enter client data.”** The live planning dialog says **“Accounts, permanent agency records, team roles, and checkout are not available in this demo release.”**
- **Code confirmation:** `src/app/App.tsx` mounts only public and `/demo` job-chain routes. `src/api/client.ts` calls only `/api/v1/demo/*`, and `server/src/routes/mod.rs` registers only `/api/v1/demo/*` product APIs. The real tenant/onboarding/team routes in `src/app/route-manifest.ts` are only a plan and are not mounted.
- **Why this fails:** the brief's smallest useful product requires an agency to record real job chains and protect client identities and subcontractor rates with role-based access. A visitor cannot create an organisation, save a real job, invite a colleague, limit rate visibility, or return to durable real records. An honestly labelled demo is not an end-to-end solution for that job.
- **Concrete fix:** implement agency onboarding, durable tenant-scoped job chains, and owner/finance/producer/viewer authorization enforced by the API and UI. Retain `/demo` as a separately isolated sample. Add claim tests for real-record persistence, tenant separation, and rate/client-field role projections.

### F-2-2 — MEDIUM — repeat of F-1-16: README test-coverage and claim-completeness statements are unlisted claims

- **Exact README location:** **“It checks keyboard use, route focus, deep links, 200% text zoom, dialog console errors, and internal links.”**, **“It also checks serious and critical axe findings.”**, and **“Every public claim and exact command is listed in `.factory/claims.json`.”**
- **Evidence:** `.factory/claims.json` contains no claim for keyboard use, route focus, deep links, 200% zoom, dialog-console behavior, internal links, axe results, or registry completeness. `tests/claims.test.ts` only checks a fixed expected ID list and non-empty fields; it does not audit rendered landing/README copy against the registry. Therefore the last sentence is false under the product's own claims rule, and the first two are unlisted verification claims.
- **Why this matters:** a maintainer or visitor is told that these guarantees are tested and that the registry is complete, but the required claim registry cannot discover or run tests for those guarantees. This is the same governance gap identified by F-1-16, not a new wording-only issue.
- **Concrete fix:** either remove these promises and retain only the command to run, or add narrowly stated `@claim:` tests and registry entries for each promised result, plus an automated copy-to-registry audit. Do not retain the completeness sentence until that audit parses both the landing page and README.

## Copy audit

Word counts treat currency values and hyphenated terms as one word. UI labels, names, amounts, and headings are included where they are visitor-facing; fragments are marked as such. No sentence exceeds 22 words. No marketing adjective, metaphor heading, or non-result-naming primary action was found. The secondary link **“See how the chain works”** uses a verb and identifies its destination in the immediate hero context.

### Landing page

| Location | Text | Words | Result |
| --- | --- | ---: | --- |
| Hero label | Job margin tracking for agencies | 5 | Pass |
| H1 | Protect margin before work starts. | 5 | Pass |
| Lead | For boutique agencies that hire subcontractors, it links each client commitment to costs and client invoice milestones. | 17 | Pass |
| Primary action | Try it with sample data | 5 | Pass |
| Secondary action | See how the chain works | 5 | Pass |
| Action note | See a filled job chain. | 5 | Pass |
| Action note | Add a cost, approve scope, or mark an invoice sent. | 10 | Pass |
| Action note | Reset when finished. | 3 | Pass |
| Fact | No account for the demo. | 5 | Pass |
| Fact | Demo changes are discarded. | 4 | Pass |
| Fact | Planned Studio price: $79 each month. | 6 | Pass |
| Preview label | Job margin preview | 3 | Pass |
| Preview heading | See commitment, cost, and invoice status together. | 7 | Pass |
| Preview status | Pending scope may change margin | 5 | Pass |
| Preview note | A pending social cut-down remains visible before you approve more work. | 11 | Pass |
| Preview action | Open this sample job | 4 | Pass |
| How heading | Track each job's margin in three steps. | 7 | Pass |
| Step | Record the client commitment. | 4 | Pass |
| Step copy | Add the approved scope, client commitment, and margin floor. | 9 | Pass |
| Step | Commit the cost. | 3 | Pass |
| Step copy | Link each subcontractor amount before the work starts. | 8 | Pass |
| Step | Check the expected margin. | 4 | Pass |
| Step copy | See the change that puts margin at risk, then fix it before invoicing. | 13 | Pass |
| Limits label | Demo and product limits | 4 | Pass |
| Limits heading | What this tool does not do. | 6 | Pass |
| Limit | Your demo workspace is isolated and expires within 24 hours. | 10 | Pass |
| Limit | The sample uses fictional names and values. | 7 | Pass |
| Limit | Do not enter client data. | 5 | Pass |
| Limit | We do not calculate payroll tax or decide worker status. | 10 | Pass |
| Pricing label | Planned pricing | 2 | Pass |
| Pricing heading | Planned pricing by active job chains. | 6 | Pass |
| Pricing note | Accounts and checkout are not available in this demo release. | 10 | Pass |
| Studio allowance | Keep up to 25 job chains active. | 7 | Pass |
| Portfolio allowance | Keep up to 100 job chains active. | 7 | Pass |
| Footer | Keep each client commitment, subcontractor cost, and margin in one job chain. | 12 | Pass |

Names, amounts, ledger labels, plan names, and footer navigation are short fragments rather than sentences. The terminology remains consistent with the product's audit: job chain, client commitment, committed cost, subcontractor commitment, expected margin, margin floor, and client invoice milestone.

### README

| Location | Sentence | Words | Result |
| --- | --- | ---: | --- |
| Opening | Subcontractor Margin Chain shows boutique agencies each client commitment, subcontractor cost, approval, invoice milestone, and expected margin in one job chain. | 21 | Pass |
| Intro | Open the live demo without an account. | 7 | Pass |
| Intro | Its isolated workspace expires within 24 hours. | 7 | Pass |
| Current demo | Shows the client commitment, committed cost, expected margin, and exact floor calculation. | 10 | Pass |
| Current demo | Names the cost that puts expected margin below the floor. | 8 | Pass |
| Current demo | Keeps scope approval and client invoice milestones beside the same job. | 9 | Pass |
| Current demo | Creates a job chain, adds a cost, approves scope, updates an invoice state, and resets the sample. | 16 | Pass |
| Current demo | Maps CSV columns and previews every row before importing valid job chains. | 11 | Pass |
| Current demo | Exports all current demo job chains as local CSV or JSON downloads. | 11 | Pass |
| Fixture note | The demo starts with three original fictional Northline Studio jobs. | 10 | Pass |
| Fixture note | Their provenance is recorded in `.factory/demo-fixtures.json`. | 6 | Pass |
| Pricing | Planned Studio pricing is $79 per agency each month for 25 active job chains. | 14 | Pass |
| Pricing | Portfolio is planned at $159 for 100 active job chains. | 10 | Pass |
| Availability | Accounts, permanent agency records, team roles, and hosted checkout are planned for the next milestone. | 15 | Pass |
| Availability | Sign-in and purchase controls stay hidden until they work. | 8 | Pass |
| Runtime | The server starts with only `PORT`, which defaults to 8080. | 10 | Pass |
| Runtime | Readiness and Prometheus metrics are available at `/ready` and `/internal/metrics`. | 9 | Pass |
| Requirements | Requirements: Node.js 22+, npm 10+, and a current stable Rust toolchain. | 10 | Pass |
| Local run | Open `http://127.0.0.1:8080/?demo=1` for the supported sample path. | 5 | Pass |
| Browser tests | Playwright 1.58.2 runs browser claims on desktop Chromium and a 390px Chromium profile. | 12 | Pass |
| Test coverage | It checks keyboard use, route focus, deep links, 200% text zoom, dialog console errors, and internal links. | 17 | F-2-2 unlisted claim |
| Test coverage | It also checks serious and critical axe findings. | 9 | F-2-2 unlisted claim |
| Claims | Every public claim and exact command is listed in `.factory/claims.json`. | 11 | F-2-2 false/unlisted claim |
| Claims | The Vitest registry test rejects missing or duplicate claim IDs. | 10 | Pass (source-confirmed) |
| Demo API | Demo routes live under `/api/v1/demo/`. | 7 | Pass |
| Demo API | Create operations require an `Idempotency-Key`. | 6 | Pass |
| Demo API | A retry returns its saved result without adding another record. | 11 | Pass |
| Demo API | Per-client limits are shared across replicas. | 6 | Pass |
| Demo API | Every rejected limit response includes `Retry-After`. | 6 | Pass |
| Demo API | Rejected requests use `application/problem+json` with a stable code, message, request ID, and field when relevant. | 15 | Pass |
| Demo API | Every demo API response uses `Cache-Control: no-store`. | 8 | Pass |
| Money | The server stores money as signed integer cents. | 9 | Pass |
| Money | It rounds each percentage floor upward to the next cent when needed. | 12 | Pass |
| Deploy | `/health` returns the build SHA supplied during the image build. | 10 | Pass |
| Deploy | Deploy this container through the factory; do not change infrastructure from this repository. | 12 | Pass (instruction) |
| Privacy | The public and demo flow makes no cross-origin requests. | 9 | Pass |
| Privacy | It has no analytics, remote fonts, third-party scripts, or advertising. | 10 | Pass |
| Privacy | CSV files stay in the browser until valid rows are sent to the isolated demo API. | 15 | Pass |
| Privacy | CSV and JSON exports are generated in the browser. | 9 | Pass |
| Privacy | Choose “Reset demo” to destroy the current workspace. | 8 | Pass |
| Privacy | See Privacy and Terms. | 4 | Pass |
| License | Licensed under MIT. | 3 | Pass |
| License | Newsreader and Recursive use the SIL Open Font License in `public/fonts/OFL.txt`. | 12 | Pass |

The code snippets and headings are instructions/fragments rather than sentences. Technical terms in the run/API sections are appropriate to their developer-facing context; no plain-language rewrite is required beyond F-2-2.

## Demo and sandbox verification

- **One click:** landing **Try it with sample data** replaces `/?demo=1` with `/demo` and creates an isolated sample workspace without a sign-in or account gate.
- **First useful screen:** at 390 px, the register shows three jobs, `$51,600` client commitments, `$33,700` committed cost, and two jobs needing attention. The initial loading line resolves to this populated register.
- **Sandbox:** the persistent banner reads **“Demo — sample data, nothing is saved”** and exposes **Reset demo**. The reset confirmation says it discards every demo change and reloads the three original fixtures. Browser `localStorage` and `sessionStorage` were empty; the workspace cookie is HttpOnly and therefore intentionally unavailable to page JavaScript.
- **Privacy:** landing → demo → modal interaction made requests only to `https://subcontractor-margin-chain.sociobot.in`; no console or page errors occurred. This product is web-with-backend, not a CLI/library; CLI/playground checks do not apply. It has no offline promise, so offline-reload verification does not apply.

## Claims and clean-clone results

`.factory/claims.json` has 26 unique entries. From a new clone at `/tmp/smc-review2-7SasOi`, `npm ci` succeeded and every exact listed command completed successfully, including all browser claims in both desktop and 390px projects and all named locked Cargo tests:

`m1-chain-math`, `m1-margin-risk`, `m1-linked-status`, `m1-sample-workflow`, `m1-demo-fixtures`, `m1-demo-no-account`, `m1-demo-reset`, `m1-demo-isolation-expiry`, `m1-public-privacy`, `m1-csv-import`, `m1-data-export`, `m1-product-boundaries`, `m1-plan-prices`, `m1-demo-cookie`, `m1-shared-replica-persistence`, `m1-port-only-startup`, `m1-security-headers`, `m1-api-rate-limits`, `m1-idempotent-creates`, `m1-problem-details`, `m1-demo-no-store`, `m1-money-integrity`, `m1-build-identity`, `m1-true-404`, `m1-asset-cache`, and `m1-operations`.

Also verified in that clean clone:

- `npm run check`: pass — 11 Vitest tests, production build, rustfmt, Clippy with warnings denied, and locked Rust tests.
- `npm run test:e2e`: pass — desktop and 390px browser suite.
- Production build: `dist/` produced; main JavaScript was 86.83 KiB gzip and CSS 5.88 KiB gzip.

The registered claims pass; F-2-2 is specifically that the README makes additional coverage/completeness claims which the registry does not list.

## Structure, routes, accessibility, and identity

- The live `/health` build SHA is `201e1b2ee8088cd520eab17aa0cfe83c35f4ad1c`, matching the reviewed checkout.
- `/`, demo routes, `/privacy`, `/terms`, and `/404` have one H1, a main landmark, route-specific title/description/canonical/OG/Twitter metadata, favicon, and the shared header/footer. `/not-a-real-page` returns HTTP 404 with the designed recovery screen.
- Metadata follows the required title patterns, including **“Demo — Subcontractor Margin Chain”** and **“Privacy — Subcontractor Margin Chain.”** Open Graph and Twitter titles change per route.
- The app uses real routes, a skip link, route focus, address-bar deep links, back navigation, and an aria-live route announcer. The full browser suite covers these flows and internal links.
- The carbon-copy ledger treatment is product-specific: warm paper, cyan/red duplicate sheets, rules, offsets, status stamps, and original local SVG artwork. It is not a generic SaaS-card/gradient treatment.
- The brief implies spreadsheet migration and safe extraction; the shipped demo now has CSV mapping/dry-run import plus local CSV/JSON export. No AI step is needed for the stated arithmetic workflow, and no decorative AI feature or embedded provider key was found.

## History recheck

Every earlier document was read: `.factory/review-1.md`, `.factory/polish-1.md`, `.factory/handoff.md`, and `.factory/handoff-m1.md`.

| Earlier finding(s) | Live and code result |
| --- | --- |
| F-1-1 | **Unfixed; reopened as F-2-1.** The product remains demo-only and lacks real records, organisation access, and roles. Calling this an M2 boundary in the polish/handoff does not satisfy the brief or factory DoD. |
| F-1-2 to F-1-15 | Verified fixed: availability and planned price wording are honest; native dialogs have no CSP error; bounded actions/fixtures/limits are present; the former public claims have registry entries and passing commands. |
| F-1-16 | **Unfixed; reopened as F-2-2.** Coverage and completeness claims remain outside the registry and the completeness assertion is false. |
| F-1-17 to F-1-31 | Verified fixed: the reviewed landing/README copy stays within 22 words, uses the documented terms, has informative headings, and names planned pricing accurately. |
| F-1-32 | Verified fixed: Twitter title/description update by route. |
| F-1-33 | Verified fixed: demo CSV mapping/dry run and browser CSV/JSON export work and have passing claims. |

## What would make this perfect

Ship the real, authorized agency workflow: onboarding, durable tenant data, role-limited visibility for identities/rates, and the same margin chain outside `/demo`. Then make the claims registry mechanically complete by testing or removing every README coverage assertion. Re-run this full cold-read, demo, claim, history, route, accessibility, and privacy review until it has no findings.
