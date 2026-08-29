# Adversarial first-read review 3 — FAIL

Reviewed 2026-08-29 UTC against live build `957c95fa19fed0d84fd58dea9ae8163f026070a5` at <https://subcontractor-margin-chain.sociobot.in> and the matching `main` checkout. Product code was not modified.

## Verdict

**FAIL.** The first screen, isolated sample demo, visual system, most routing, and every registered claim test are usable. The real-workspace implementation still fails the brief's requirement to protect **client identities** with roles, and several first-time-use and product-contract findings remain. A pass requires zero findings.

## 30-second cold read

Fresh Chromium contexts at 390 × 844 and 1440 × 900, before scrolling:

| Question | Answer from the first screen | Result |
| --- | --- | --- |
| What does this do? | It links a client's commitment, subcontractor costs, and invoice milestones so an agency can see margin before work begins. | Pass |
| Who is it for? | Boutique agencies that hire subcontractors. | Pass |
| What should I click first? | **Try it with sample data** to see a filled job chain. | Pass |

The exact text that made this clear was **“Protect margin before work starts.”**, **“For boutique agencies that hire subcontractors, it links each client commitment to costs and client invoice milestones.”**, and **“Try it with sample data.”** The mobile first screen includes all three facts and the result of the sample action. Initial cold visits made only same-origin requests and had no console/page error.

## Findings

### F-3-1 — BLOCKING — repeat / partial fix of F-1-1: real roles do not protect client identities

- **Exact live/UI evidence:** the team control offers **“Producer — no rate visibility”** and **“Viewer — no rate visibility.”** It offers no client-identity visibility setting or warning.
- **Code evidence:** `server/src/routes/mod.rs` calculates only `can_view_rates`; for producer/viewer it clears `chain.costs` and then returns `JobView::from(chain)`. `JobView` flattens the complete `JobChain`, which includes `contracting_client` and `end_client`. The registered role test in `server/tests/agency.rs` creates a chain with `contracting_client: "Client"`, obtains a producer session, and asserts only that `costs` is empty. It never redacts or tests either client field.
- **Why this fails:** the brief's explicit constraint is **“Protect contractor rates and client identities with role-based access.”** The new saved workspace, tenant separation, and rate redaction repair much of F-1-1, but any producer/viewer access link still receives the client identities. This is a half-fixed version of the earlier blocking brief failure.
- **Concrete fix:** add an explicit client-identity permission to the role model, redact contracting/end-client fields from unauthorized API responses and UI, and add a registered clean-state claim proving each restricted role cannot obtain those values through list or detail endpoints. State the role consequences next to the access-link control.

### F-3-2 — HIGH — a direct real-workspace URL fails instead of sending a new visitor to setup

- **Exact live evidence:** a fresh visit to `/app/chains` requests `/api/v1/app/chains`, receives HTTP 401, and logs Chromium's **“Failed to load resource: the server responded with a status of 401”**. The API message is **“This demo workspace is missing or expired. Start a new sample to continue.”** This is shown on the real-workspace URL.
- **Why this fails:** `/app/chains` is a real route and a deep link. A new visitor who opens it is told about an expired demo, sees an error state, and has no setup action. It also violates the no-console-errors-on-load quality gate for that route.
- **Concrete fix:** before loading an app register, resolve an agency session. If absent, replace-route to `/start`, focus its H1, and retain a return path after setup. Make the unauthenticated app API return an agency-specific problem only as a fallback. Add a browser test for a fresh `/app/chains` deep link with zero console/page errors.

### F-3-3 — HIGH — pricing is neither actionable nor honestly verified

- **Exact location:** the landing header has **“Pricing”**, but its destination shows **“Start now”** and **“Saved agency records”** with no price, plan, allowance, or purchase path. README says **“Planned Studio pricing is $79 per agency each month for 25 active job chains. Portfolio is planned at $159 for 100 active job chains.”**
- **Why this fails:** the researched brief makes $79/month the product's monetization. A prospective agency cannot learn the current price or buy a plan from the advertised Pricing navigation. The README's two concrete price/allowance promises have no `.factory/claims.json` entry or test, so they are also unlisted claims.
- **Concrete fix:** either implement the stated plans through the Sociobot billing API, including an observable plan/allowance claim test, or label the workspace as a free beta, remove the Pricing navigation and planned prices, and say when pricing will be available. Replace **“Start now”** with **“Create a saved workspace.”**

### F-3-4 — MEDIUM — spreadsheet migration works only for fictional demo records

- **Exact location:** `/demo` exposes **“Import CSV”**, while the real register at `/app/chains` omits it. `src/routes/DemoPage.tsx` renders the import link only when `!isReal`; `src/app/App.tsx` has no real import route.
- **Why this fails:** the brief identifies spreadsheets as the current workaround. A real agency must retype each existing commitment and subcontractor cost before it can get value. A demo-only importer removes no real adoption work.
- **Concrete fix:** add a real-workspace CSV import route with column mapping, dry-run errors, explicit confirmation, and tenant-scoped writes. Keep the demo importer isolated. Add a claim that imports a bundled realistic CSV into a fresh real agency workspace and asserts the saved chains; preserve the existing local CSV/JSON export.

### F-3-5 — MINOR — the sitemap contains a dead 404 URL and omits the public setup route

- **Exact location:** `public/sitemap.xml` lists `/404`, which live HTTP fetch returns 404, and does not list `/start`, which is a public setup route.
- **Why this fails:** the crawlable sitemap itself contains a dead URL, while a real entry route is absent. This conflicts with the required route/sitemap and no-dead-links checks.
- **Concrete fix:** remove `/404` from the sitemap, add `/start` if it is intended to be indexed, and add a test that fetches every sitemap URL and expects 200.

### F-3-6 — MINOR — public copy uses three terms for the same invoice concept

- **Exact locations:** landing lead says **“client invoice milestones”**; preview heading says **“invoice status”**; the hero action note and README say **“invoice sent”** / **“invoice state.”** The terminology table defines the concept as **“client invoice milestone.”**
- **Why this fails:** a cold reader must decide whether these are separate records or just different names for the same thing. This contradicts the product's own terminology table.
- **Concrete fix:** use **“client invoice milestone”** for the record and **“client invoice milestone status”** for its state. For example, rewrite the preview heading as **“See commitment, cost, and client invoice milestone status together.”**

## Copy audit

Counts treat a hyphenated term, currency value, and product name word as one word. Labels and actions are included because visitors read them as isolated screen-reader text. No landing or README string exceeds 22 words. No banned marketing adjective or non-result-naming primary action was found. F-3-3 and F-3-6 are the copy/claim exceptions noted above.

### Landing page

| Location | Text | Words | Result |
| --- | --- | ---: | --- |
| Hero label | Job margin tracking for agencies | 5 | Pass |
| H1 | Protect margin before work starts. | 5 | Pass |
| Lead | For boutique agencies that hire subcontractors, it links each client commitment to costs and client invoice milestones. | 17 | Pass |
| Primary action | Try it with sample data | 5 | Pass |
| Secondary action | See how the chain works | 5 | Pass |
| Action note | See a filled job chain. | 5 | Pass |
| Action note | Add a cost, approve scope, or mark an invoice sent. | 10 | F-3-6 terminology |
| Action note | Reset when finished. | 3 | Pass |
| Fact | No account for the demo. | 5 | Pass |
| Fact | Demo changes are discarded. | 4 | Pass |
| Fact | Start a saved agency workspace. | 5 | Pass |
| Preview label | Job margin preview | 3 | Pass |
| Preview heading | See commitment, cost, and invoice status together. | 7 | F-3-6 terminology |
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
| Limit | Enter real data only in your agency workspace. | 8 | Pass |
| Limit | We do not calculate payroll tax or decide worker status. | 10 | Pass |
| Workspace label | Agency workspace | 2 | Pass |
| Workspace heading | Save real job chains for your agency. | 7 | Pass |
| Workspace note | Create a workspace, then add real job chains separately from the sample. | 11 | Pass |
| Card heading | Start now | 2 | F-3-3: vague heading |
| Card copy | Saved agency records | 3 | F-3-3: no price/plan |
| Card action | Create your agency workspace | 5 | Pass |
| Card heading | Keep the sample separate | 4 | Pass |
| Card copy | Use the demo to test the workflow. | 7 | Pass |
| Footer | Keep each client commitment, subcontractor cost, and margin in one job chain. | 12 | Pass |

Names, amounts, mathematical symbols, and field labels are record data or fragments rather than sentences.

### README

| Location | Sentence | Words | Result |
| --- | --- | ---: | --- |
| Opening | Subcontractor Margin Chain shows boutique agencies each client commitment, subcontractor cost, approval, invoice milestone, and expected margin in one job chain. | 21 | Pass |
| Intro | Open the live demo without an account. | 7 | Pass |
| Intro | Its isolated workspace expires within 24 hours. | 7 | Pass |
| Current demo | Shows the client commitment, committed cost, expected margin, and exact floor calculation. | 10 | Pass |
| Current demo | Names the cost that puts expected margin below the floor. | 8 | Pass |
| Current demo | Keeps scope approval and client invoice milestones beside the same job. | 9 | Pass |
| Current demo | Creates a job chain, adds a cost, approves scope, updates an invoice state, and resets the sample. | 16 | F-3-6 terminology |
| Current demo | Maps CSV columns and previews every row before importing valid job chains. | 11 | Pass |
| Current demo | Exports all current demo job chains as local CSV or JSON downloads. | 11 | Pass |
| Fixture note | The demo starts with three original fictional Northline Studio jobs. | 10 | Pass |
| Fixture note | Their provenance is recorded in `.factory/demo-fixtures.json`. | 6 | Pass |
| Pricing | Planned Studio pricing is $79 per agency each month for 25 active job chains. | 14 | F-3-3 unlisted claim |
| Pricing | Portfolio is planned at $159 for 100 active job chains. | 10 | F-3-3 unlisted claim |
| Workspace | Open `/start` to create a saved agency workspace. | 8 | Pass |
| Workspace | Real job chains use a separate session and never load the demo fixtures. | 11 | Pass |
| Runtime | The server starts with only `PORT`, which defaults to 8080. | 10 | Pass |
| Runtime | Readiness and Prometheus metrics are available at `/ready` and `/internal/metrics`. | 9 | Pass |
| Requirements | Requirements: Node.js 22+, npm 10+, and a current stable Rust toolchain. | 10 | Pass |
| Local run | Open `http://127.0.0.1:8080/?demo=1` for the supported sample path. | 5 | Pass |
| Browser tests | Playwright 1.58.2 runs browser claims on desktop Chromium and a 390px Chromium profile. | 12 | Pass |
| API | Demo routes live under `/api/v1/demo/`. | 7 | Pass |
| API | Create operations require an `Idempotency-Key`. | 6 | Pass |
| API | A retry returns its saved result without adding another record. | 11 | Pass |
| API | Per-client limits are shared across replicas. | 6 | Pass |
| API | Every rejected limit response includes `Retry-After`. | 6 | Pass |
| API | Rejected requests use `application/problem+json` with a stable code, message, request ID, and field when relevant. | 15 | Pass |
| API | Every demo API response uses `Cache-Control: no-store`. | 8 | Pass |
| Money | The server stores money as signed integer cents. | 9 | Pass |
| Money | It rounds each percentage floor upward to the next cent when needed. | 12 | Pass |
| Deploy | `/health` returns the build SHA supplied during the image build. | 10 | Pass |
| Deploy | Deploy this container through the factory; do not change infrastructure from this repository. | 12 | Instruction |
| Privacy | The public and demo flow makes no cross-origin requests. | 9 | Pass |
| Privacy | It has no analytics, remote fonts, third-party scripts, or advertising. | 10 | Pass |
| Privacy | CSV files stay in the browser until valid rows are sent to the isolated demo API. | 15 | Pass |
| Privacy | CSV and JSON exports are generated in the browser. | 9 | Pass |
| Privacy | Choose “Reset demo” to destroy the current workspace. | 8 | Pass |
| Privacy | See Privacy and Terms. | 4 | Pass |
| License | Licensed under MIT. | 3 | Pass |
| License | Newsreader and Recursive use the SIL Open Font License in `public/fonts/OFL.txt`. | 12 | Pass |

Technical documentation headings and command snippets are instructions/fragments rather than sentences. The README's price statements are the only landing/README claim-like sentences without a claims entry.

## Demo, privacy, and claims

- **Demo:** one click from the landing reaches `/demo`; by 164 ms in three fresh 390px runs the first useful register showed three realistic jobs, $51,600 client commitments, $33,700 committed cost, and two jobs needing a check. The persistent **“Demo — sample data, nothing is saved”** banner, Reset demo, and Start for real were present. A reset opens its confirmation and produced no dialog CSP/error.
- **Isolation:** the live demo received a host-only `smc_demo` cookie that is HttpOnly, Secure, SameSite=Lax, and expires within 24 hours. Local storage was empty. Request recording through landing, demo, and sample mutation used only the site origin. Demo routes are separate from `/api/v1/app/*`; reset deletes/reseeds the demo workspace and does not open the real-store API.
- **Claims:** from fresh clone `/tmp/smc-review3-REwBXY` at `957c95fa19fed0d84fd58dea9ae8163f026070a5`, `npm ci` passed and all **29/29** exact `.factory/claims.json` commands passed independently. `npm run check` passed (11 Vitest tests, production build, rustfmt, Clippy with warnings denied, and 25 Rust tests). `npm run test:e2e` passed **62/62**.

## Structure, accessibility, and visual identity

- `/`, `/demo`, `/start`, `/app/chains`, `/privacy`, `/terms`, and `/404` each have a title following the product-title pattern, one H1, one main landmark, route metadata, canonical, Open Graph/Twitter data, favicon, shared header/footer, and designed 404 recovery.
- `robots.txt`, local assets, self-hosted fonts, CSP/security headers, reduced motion, focus styling, and the distinct carbon-copy ledger visual identity were confirmed. The warm paper, cyan/red duplicate sheets, ruled ledger geometry, and original SVG are specific to the job-chain task rather than a generic SaaS template.
- F-3-2 and F-3-5 are the remaining routing/sitemap failures. The full local suite covers the other deep-link, back-button, keyboard, 200% zoom, touch-target, and serious/critical axe paths.

## History recheck

All earlier review, polish, handoff, and verification documents were read. Results below are based on both live build `957c95f` and current code, not a status label in a prior document.

| Earlier finding | Current result |
| --- | --- |
| F-1-1 / F-2-1 | **Partially fixed; reopened as F-3-1.** Saved tenant records, rate redaction, and team access now exist, but client identities are not role-protected. |
| F-1-2 | Fixed: the landing now opens an actual saved-workspace setup path. F-3-3 separately finds its missing commercial/pricing completion. |
| F-1-3 | Fixed: the native reset dialog produces no CSP console error. |
| F-1-4 | Fixed: the action note now names bounded sample actions. |
| F-1-5 | Fixed: fixture names/count/provenance have `m1-demo-fixtures`. |
| F-1-6 | Fixed: the bounded sample workflow has `m1-sample-workflow`. |
| F-1-7 | Fixed: product boundaries have `m1-product-boundaries`. |
| F-1-8 | Fixed: provider-specific public storage claims were removed; shared persistence is tested. |
| F-1-9 | Fixed: unsupported container-topology prose was removed from visitor copy. |
| F-1-10 | Fixed: the Vite comparison claim was removed. |
| F-1-11 | Fixed: `m1-idempotent-creates` is registered and passed. |
| F-1-12 | Fixed: `m1-problem-details` is registered and passed. |
| F-1-13 | Fixed: `m1-money-integrity` is registered and passed. |
| F-1-14 | Fixed: `m1-build-identity` is registered and passed. |
| F-1-15 | Fixed: the infrastructure statement is now an operational instruction. |
| F-1-16 / F-2-2 | Fixed: README coverage/completeness assertions were removed. F-3-3 is a new, specific unlisted pricing claim. |
| F-1-17 through F-1-31 | Fixed except the invoice terminology inconsistency reopened as F-3-6; all audited strings remain within the word cap. |
| F-1-32 | Fixed: route-specific Twitter title/description updates are present and tested. |
| F-1-33 | Fixed for the demo: CSV mapping/dry-run and local exports work. F-3-4 identifies the remaining real-workspace gap. |
| Verification-2 / Verification-3 operational, mobile, CSP, rate-limit, and reset-race findings | Confirmed fixed by the current source, 29 registered claim commands, and 62/62 local browser suite. |

## What would make this perfect

Protect client identities as rigorously as rates, make unauthenticated real-work deep links take a visitor to setup without console noise, and either ship the stated Sociobot-billed plans or remove the pricing promise until they exist. Add real CSV migration, repair the sitemap, and use one client-invoice term throughout. Re-run this complete cold-read, demo, claims, privacy, history, and route review until no findings remain.
