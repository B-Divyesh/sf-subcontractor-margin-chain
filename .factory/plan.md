# Venture plan — Subcontractor Margin Chain

Plan owner: founding product + engineering lead  
Product: `subcontractor-margin-chain`  
Artifact: web with backend  
Production URL: `https://subcontractor-margin-chain.sociobot.in`  
Plan date: 2026-08-28  
Status: **M1 built and verified; awaiting milestone review**

This plan is the build contract. A milestone builder reads this file, `.factory/design.md`, `.factory/demo.md`, `.factory/claims.json`, all prior handoffs, and the latest review notes before changing code. A milestone is not complete until its claims, tests, and definition of done pass from a clean checkout. Review and polish must pass before the next milestone begins.

## 1. Product requirements

### Customer and situation

The paying customer is the owner of a boutique agency that sells work to a client and delivers some or all of it through freelancers or subcontractors. A producer or finance lead may operate the product day to day. Some jobs also have an intermediary contracting client and a separate end client.

Today, the client promise lives in email, chat, or a proposal. Approved scope lives in a document. Subcontractor rates live in a private spreadsheet. Client and subcontractor invoices live in separate tools. The owner sees true margin after cash moves, when it is too late to change scope, price, or delivery cost.

The product's central object is a **job chain**: contracting client → optional end client → approved scope and client commitment → subcontractor commitments → client and subcontractor invoice states. It is a commercial control record, not a task board.

### Promise

**See the client promise, subcontractor cost, and margin risk in one job chain before the invoice goes out.**

### The three jobs the product must nail

1. **Commit a profitable job before work starts.** Record the contracting client, optional end client, approved scope, client commitment, subcontractor commitments, and a margin floor. Show the formula and warn about incomplete costs.
2. **Control commercial changes during delivery.** Keep scope and cost revisions as history, capture client approval, name the change that crossed the margin floor, and limit who can see client identities and contractor rates.
3. **Close the job without losing the cash trail.** Keep client milestones and subcontractor invoice states beside the same scope and commitments. Show what is due, sent, paid, overdue, or missing without pretending to be an accounting ledger.

### Personas and permissions

| Role | Can do | Must not see/do |
| --- | --- | --- |
| Owner | All organization, job, people, billing, export, and deletion actions | Nothing hidden inside own organization |
| Finance | View revenue and all rates; edit commitments and invoices; export | Change subscription, delete organization, transfer ownership |
| Producer | Create jobs, edit scope, request approval, update delivery status | See subcontractor rates or aggregate cost unless owner enables `cost_visibility`; change billing |
| Viewer | Read allowed job summaries | Edit records or reveal hidden financial fields |
| External client link | Review only the named scope revision and approve/reject it | Other jobs, subcontractor identities or rates, internal notes |
| External subcontractor link | See assigned scope, own commitment, and own invoice form | End-client rate, agency margin, other subcontractors, other jobs |

Membership roles are organization-scoped. External links are not memberships. API response shaping removes forbidden fields; CSS hiding is never a permission control.

### Money and risk rules

- Store money as signed 64-bit integer minor units plus ISO 4217 currency. Never use binary floating point for stored or calculated money.
- One job chain has one currency through M5. A commitment in another currency must be converted outside the product and entered with a recorded note; currency conversion is not silently estimated.
- `client_commitment` is the current approved amount the contracting client agreed to pay.
- `committed_cost` is the sum of current, non-void subcontractor commitments. A submitted or paid subcontractor invoice changes cash status, not the commitment, so it never double counts cost.
- `expected_margin = client_commitment - committed_cost`.
- `margin_floor_amount = ceil(client_commitment × margin_floor_basis_points / 10,000)`. Round upward to the minor unit so the warning is conservative.
- `margin_at_risk = max(0, margin_floor_amount - expected_margin)`.
- **Below floor:** expected margin is less than the floor. **Near floor:** expected margin is at or above the floor but within five percentage points, or a pending unpriced scope revision exists. **Safe:** neither condition applies. **Incomplete:** commitment, currency, or required cost confirmation is missing; never label incomplete work safe.
- Each calculation response includes input amounts, result, rule version, and the revision that last changed the risk state. Client invoice payment does not change expected margin.
- Closed jobs remain in the record and do not count against the active-chain plan limit. Reopening checks the plan allowance.

### Success measures

Primary outcome: pilot agencies record at least 95% of subcontracted jobs before work starts and catch at least one margin-at-risk job per quarter before client invoicing.

Leading measures derived from product records, not third-party tracking:

- activation: an organization creates its first complete job chain within one session after sign-in;
- coverage: owner-entered monthly subcontracted-job count compared with chains created before `work_starts_on`;
- prevention: a risk event was created before the first client milestone was sent and later resolved by price, scope, or cost change;
- retention: an organization has an active job chain in three consecutive months.

Only a privacy-respecting aggregate page count is allowed on public pages. Operational product records may support the owner's own success report and an aggregated operator count, but no behavioral replay, ad pixel, fingerprint, or third-party analytics is allowed.

### Monetization

Billing is a recurring Dodo subscription sold only through the Sociobot billing engine. The application never embeds Dodo, stores card data, or calls a payment provider directly.

| Tier | Exact price | Allowance | Included |
| --- | ---: | ---: | --- |
| Demo | $0 | Isolated sample only | No account, resettable sample, no real persistence |
| Studio | $79 per agency each month | 25 active job chains | Unlimited internal members, archived chains, approvals, invoices, CSV/JSON export |
| Portfolio | $159 per agency each month | 100 active job chains | Everything in Studio plus integration webhooks and priority export processing |

There is no seat charge. Archived jobs and required data export never count against or depend on a paid allowance. A 14-day Studio trial begins after first sign-in without requiring a card. When a trial or subscription lapses, the organization becomes read-only; owners can still export or delete data and can restore the subscription. Existing records are never held hostage.

The Portfolio price is a planning hypothesis, not evidence from the brief. M2 may ship it only after the billing registry supports a verifiable named entitlement; the pricing experiment in Risks decides whether it remains. Studio at $79 is the wedge and must ship.

### Deliberately out of scope

- payroll, tax withholding, worker classification, time tracking, expenses, or payslips;
- a freelancer marketplace, recruiting, contracts, e-signatures, task boards, files, chat, or resource scheduling;
- bookkeeping, general ledger, tax invoices, payment collection, bank feeds, or accounting reconciliation;
- automatic currency conversion or margin forecasts based on guessed exchange rates;
- sending money to subcontractors or accepting client payment;
- model-generated commercial decisions. Margin arithmetic and alerts are deterministic and auditable.

### AI decision

No runtime AI is planned through M5. Users need exact money, explicit approvals, and attributable rules; a probabilistic summary would add cost and weaken trust. CSV mapping and risk detection are deterministic. If discovery later proves that manual scope extraction is a repeated bottleneck, test an explicit “Draft scope from this text” action through the Sociobot gateway only, showing the sent text, requiring review, supporting undo, returning a canned demo response, and retaining a manual path. No Azure key or direct model endpoint may enter this repository.

## 2. Evidence and wedge

### Demand signals

1. [Hacker News item 46197005](https://hn.algolia.com/api/v1/items/46197005), dated 2025-12-08: the author reports interviews with more than 60 freelancers, creators, and small agencies who lose 20–30% of time and revenue across Gmail/WhatsApp, Notion, payment links, and spreadsheets.
2. [Invoice Ninja issue 12146](https://github.com/invoiceninja/invoiceninja/issues/12146), dated 2026-08-05: a request asks for end-client/sub-client relationships across clients, projects, tasks, and invoices for subcontracted work.

These are recurrent signals of the same missing relationship among buyer, delivery partner, work, and cash. They are directional, not proof of willingness to pay. Neither source proves the $79 price or active-chain packaging.

### Current workaround and competitor gap

Agencies create separate client and project records, keep private subcontractor costs in spreadsheets, and reconcile profit after invoices are paid. Harvest focuses on time and reporting. Bonsai and HoneyBook focus on client workflow. Invoice Ninja focuses on invoices. Each covers part of the record, but none makes the nested end-client-to-subcontractor commercial chain the primary object.

### Switching wedge

The switch begins with one pre-flight question: **“Can we book this subcontractor and keep the promised margin?”** A user can answer it by entering a client commitment, committed cost, and floor without migrating tasks or accounting. The value appears before an invoice and can exceed a month of subscription when one change is caught. Import and exports reduce spreadsheet lock-in later; the product does not require a wholesale operations migration.

## 3. Architecture

### System shape

```text
Browser (React/Vite)
  ├─ public landing, legal, demo UI
  ├─ MSAL PKCE for signed-in routes
  └─ same-origin JSON /api/v1/*
             │
Axum application (single Container App, PORT 8080)
  ├─ global security headers and per-route rate limits
  ├─ DemoStore (M1 isolated, TTL, never tenant repositories)
  ├─ TenantStore (M2 SQLite, every query carries organization_id)
  ├─ Auth discovery/JWKS cache
  ├─ Billing adapter → Sociobot API → Dodo
  └─ outbox/background worker
             │
      /data/app.sqlite3 + rotating backups
```

The Vite build targets ES2022. Axum serves hashed assets and uses an SPA fallback for known frontend routes; `/api/*` never falls through to HTML. Production uses one API replica and a durable `/data` volume while SQLite is authoritative.

### Repository layout

```text
src/app/                 app shell, routing, error boundaries
src/api/                 typed HTTP client and response mapping
src/components/          product primitives
src/features/chains/     chain editor, calculation view models
src/features/billing/    plan and entitlement UI
src/routes/              route screens, titles, loaders
src/styles/              tokens, reset, component styles
tests/                   Vitest and Playwright claim tests
server/src/main.rs       config, listener, shutdown
server/src/routes/       public/demo/authenticated/internal routers
server/src/auth/         discovery, JWKS cache, claims, middleware
server/src/db/           pool, tenant repositories, money types
server/src/domain/       deterministic chain and risk rules
server/src/billing/      Sociobot adapter and entitlement cache
server/src/jobs/         purge, outbox, backup schedules
server/migrations/       reversible sqlx migrations
server/tests/            API integration tests with temp databases
public/                  fonts, metadata art, manifest, robots, sitemap
```

### Data model

All IDs are opaque UUIDv7 values. Timestamps are UTC RFC 3339 at the API edge and integer UTC milliseconds in SQLite. Mutable records have `version`, `created_at`, and `updated_at`; writes use optimistic concurrency and return `409` with the current version when stale. User-authored text has explicit size limits and is stored as text, never rendered as HTML.

| Entity | Essential fields and invariants |
| --- | --- |
| `organizations` | `id`, name, default currency, default margin floor bps, trial end, status, deleted_at |
| `users` | stable Entra `oid`, display name, email for display only, last signed in; never key by email |
| `memberships` | organization, user, role, optional producer cost visibility, status; one owner minimum |
| `invitations` | organization, email, role, token hash, expiry, accepted_at; single use |
| `clients` | organization, kind (`contracting` or `end`), legal/display name, status; unique only within tenant |
| `subcontractors` | organization, display/legal name, contact, status; no tax classification field |
| `job_chains` | organization, name, contracting client, optional end client, currency, work start, floor bps, status, owner, version |
| `client_commitment_revisions` | job, amount minor, scope revision, effective date, reason, created by; append only, one current |
| `scope_revisions` | job, version number, plain description, amount if priced, status, client decision, decided_at; append only |
| `cost_commitments` | job, subcontractor, scope revision, amount minor, state, current revision pointer |
| `cost_commitment_revisions` | commitment, amount, reason, effective date, created by; append only |
| `client_milestones` | job, scope revision, label, amount, due date, status (`planned/due/sent/part_paid/paid/overdue`), external reference |
| `subcontractor_invoices` | job, cost commitment, subcontractor, reference, amount, received/due/paid dates, status; amount mismatch is flagged, not auto-applied |
| `risk_events` | job, rule version, prior/new state, cause type/id, commitment, cost, floor, at-risk amount, resolved_at |
| `approval_links` | job/scope revision, token hash, expiry, max uses, decision; never store raw token |
| `submission_links` | job/subcontractor/commitment, token hash, expiry, max uses; least-privilege projection |
| `subscriptions` | organization, Sociobot product/tier reference, encrypted license token, status, expiry, last verified, active-chain allowance |
| `audit_events` | organization, actor kind/id, action, subject type/id, redacted before/after summary, request id; append only |
| `outbox` | organization, kind, JSON payload, available_at, attempts, lease, completed_at; no secret tokens in payload |

Every tenant table carries `organization_id`, including child tables where denormalization prevents ambiguous joins. Repository methods require a `TenantContext`; no unscoped list/get/update method exists. Compound indexes begin with `organization_id`. Integration tests seed two organizations and attempt cross-tenant reads and mutations for every repository family.

M1 demo objects use the same domain types but a separate `DemoStore` interface and route tree. A demo identifier can never be accepted as an organization ID.

### API conventions

- Prefix JSON APIs with `/api/v1`. Use resource nouns, standard HTTP methods, and problem details (`application/problem+json`) with a stable code, plain message, request ID, and field errors.
- Require `Idempotency-Key` on create operations and external decisions. Retain keys and result hashes for 24 hours.
- Use ETags derived from `version`; require `If-Match` for edits after M2.
- Pagination is cursor-based with a maximum page size of 100. Sort order is stable and documented.
- Validate currency, integer bounds, date order, role, state transitions, and text length at the edge. Parameterize all SQL.
- Mutations write the domain record, risk event, audit event, and outbox item in one transaction.
- Return forbidden financial fields as absent, not null with a revealing label.

### Authentication: Sociobot Entra CIAM

Accounts are necessary for paid, shared, multi-device agency data and arrive in M2. Public, demo, approval-link, privacy, and terms routes do not require sign-in.

Frontend uses `@azure/msal-browser` with authorization code + PKCE, `loginRedirect`, silent token acquisition, scopes `openid profile email`, and `sessionStorage`. Defaults are:

- tenant ID `35c6fe40-0ec0-46b6-98c6-213ad4de6650`;
- authority `https://sociobotcustomers.ciamlogin.com/35c6fe40-0ec0-46b6-98c6-213ad4de6650/`;
- client ID `25c704f4-465a-47af-80ab-2c489466b697`;
- callback `https://subcontractor-margin-chain.sociobot.in/auth/callback`.

Backend fetches OIDC discovery at startup, reads the issuer and JWKS URL instead of hardcoding them, caches keys for one hour, and refreshes once on an unknown key ID. It accepts RS256 only and verifies `aud`, tenant `tid`, discovery `iss`, `exp`, and `nbf`. The stable user key is `oid`. Invalid tokens return `401` and `WWW-Authenticate: Bearer`; wrong-tenant or insufficient-role requests return `403` without resource detail.

Optional environment overrides are exactly `ENTRA_TENANT_ID`, `ENTRA_TENANT_SUBDOMAIN`, and `ENTRA_CLIENT_ID`. Failure to reach discovery does not stop public/demo startup; protected routes return a clear `503` until discovery succeeds. M2 handoff must list callback registration as operator action unless confirmed.

### Billing: Sociobot/Dodo only

M2 adds the live adapter. The owner chooses a named plan on `/settings/billing` and follows a hosted Sociobot checkout under `https://api.sociobot.in/api/v1/products/subcontractor-margin-chain/checkout`; staging uses `https://pilot-api.sociobot.in`. The factory must register the recurring Dodo prices and return URL before live verification. Product code never calls Dodo.

On return, the frontend stores the returned token at `sb_license:subcontractor-margin-chain`, removes it from the URL with `history.replaceState`, and sends it once over authenticated same-origin HTTPS to `/api/v1/billing/activate`. The backend verifies it against the Sociobot product endpoint, binds the verified named entitlement to the owner's organization, and encrypts the token with a CSPRNG key persisted under `/data`. It re-verifies no more than daily, uses cached valid entitlement on first paint, and moves to read-only if the verdict becomes invalid, expired, revoked, or wrong-product. The billing screen also offers “Have a license? Paste it.” Accessibility, export, deletion, demo safety, and risk warnings are never paywalled.

The exact named-tier field returned by the subscription registry must be captured in an adapter fixture before enforcing Portfolio. If the currently deployed verify response exposes only `valid`, `reason`, and `expires_at`, M2 ships Studio only and hides Portfolio rather than trusting a client-selected tier. This is an operator registration dependency, not permission to call Dodo directly.

Checkout, activation, and verification have strict rate limits and idempotency. No webhook is trusted without a Sociobot-defined signature contract. Until that contract is documented, daily verification is authoritative.

### Background work, files, and email

- M1 runs an hourly demo purge; in-memory workspaces disappearing on restart is acceptable and honest.
- M2 adds an in-process, lease-based worker for trial expiry, billing re-verification, and idempotency cleanup. Jobs are safe to repeat.
- M3 adds approval/submission expiry and state-derived overdue marking.
- M4 adds notification outbox retries, daily digest creation, audit retention, and SQLite online backups.
- The product stores no uploaded files through M5. CSV/JSON exports stream from generated records; scope is plain text. This avoids an unnecessary object-store and malware surface.
- Email is transactional and opt-in: invitations, approval requests, invoice reminders, and margin digests. Use a factory-configured SMTP relay when present; otherwise keep the notification in-app and show that email is not configured. Missing email configuration never prevents startup or record use. Unsubscribe applies to reminders/digests, not security or billing receipts sent by the merchant of record.

### Rate limiting and abuse controls

Every server endpoint is limited except `/health`. The limiter uses the first `X-Forwarded-For` hop behind factory ingress and socket IP locally. Every `429` includes `Retry-After` and a problem response.

- public reads and authenticated reads: 20 requests/second, burst 40 per client IP; plus 300/minute per user for signed-in routes;
- tenant writes: 10/minute per user and 60/minute per organization, with small endpoint-specific bursts;
- demo provisioning: 5/hour per IP; demo writes: 30/minute per workspace and 60/minute per IP;
- auth callback and invitation acceptance: 10/15 minutes per IP;
- billing checkout/activation/restore: 5/hour per user and organization;
- external approval/submission links: 30/hour per token digest and IP; five failed token attempts trigger a one-hour IP penalty;
- export: 3/hour per organization; import: 10/day per organization; outgoing webhook test: 10/hour.

Request body limits are 64 KiB by default, 1 MiB for M5 CSV import. Timeouts and bounded concurrency apply before handlers. Rate-limit keys never contain raw auth or share tokens.

### Privacy and security

- Same-origin API; restrictive CORS. CSP allows self-hosted assets, required Microsoft CIAM origins for the auth flow, and Sociobot billing only where the browser must navigate. No inline scripts/styles, remote fonts, trackers, or raw secrets.
- Security headers: HSTS in production, `X-Content-Type-Options: nosniff`, strict `Referrer-Policy`, `Permissions-Policy`, frame denial, and a route-compatible CSP.
- Secrets are absent from the client. Server-generated encryption and internal-operation keys use a CSPRNG and persist under `/data`; optional env overrides never become required. Startup logs say generated versus supplied without values.
- Contractor rates and client identities are confidential. Logs contain IDs or one-way digests, route templates, status, duration, and request IDs—not names, email bodies, share tokens, or money values.
- External tokens have at least 128 bits of entropy, are stored as hashes, expire, are revocable, and reveal a least-privilege projection. State changes require a second explicit step and idempotency.
- Organization export includes data and audit history in CSV plus machine-readable JSON. Deletion has a named confirmation, seven-day recovery window, then purges tenant rows and encrypted credentials. Billing cancellation/revocation follows the Sociobot contract.
- No employment status, tax, protected-characteristic, or payroll inference is collected.

### Observability and operations

- `/health` returns status and build SHA without database dependence. `/ready` verifies migrations and a database round trip. Build SHA comes from Docker `ARG BUILD_SHA=dev`; Docker never reads `.git`.
- JSON logs include timestamp, level, request ID, route template, status, latency, actor kind, and hashed tenant ID. Trace propagation uses `traceparent` when supplied.
- `/internal/metrics` exposes Prometheus-format request count/latency, rate limits, DB pool, outbox depth, demo count, risk transitions, and backup age. It is protected by an operator credential generated at first boot or an optional supplied override.
- Initial service objectives after M2: 99.5% monthly availability excluding hosted CIAM/billing outages; p95 API reads under 300ms and writes under 500ms at 50 concurrent users; error rate under 1%. Alert on five-minute error rate above 5%, backup older than 26 hours, and outbox oldest item above 15 minutes.
- Public and demo views target Lighthouse ≥90 performance and ≥95 accessibility on mobile, LCP <2.5s, INP <200ms, CLS <0.1, initial JS ≤200 KiB gzip, CSS ≤50 KiB, fonts ≤120 KiB, and hero art ≤300 KiB.

### Backups, recovery, export, and migration

SQLite uses WAL, foreign keys, busy timeout, and an application-level migration lock. Migrations are forward and reversible where SQLite permits; every destructive transform first creates a copy table and has a tested rollback procedure.

M4 performs a nightly SQLite online backup to `/data/backups`, retains seven daily and four weekly copies, records checksum and build/migration version, and prunes only after a verified new copy. Factory volume snapshots provide off-instance recovery; the handoff must name that operator configuration. Quarterly restore drills target RPO 24 hours and RTO 4 hours. Tenant export is not a backup substitute.

Move to PostgreSQL when any two-week window shows write-lock p95 over 100ms, sustained writes over 20/second, database size over 20 GiB, or a need for multiple API writer replicas. Repositories isolate SQL so the domain and API contract remain stable.

## 4. Design system

The source of truth is [`.factory/design.md`](./design.md), and the implementation token seed is `src/styles/tokens.css`.

### Direction and rationale

The product uses a **layered carbon-copy ledger**: warm paper, a cyan subcontractor duplicate, a red risk duplicate, crisp rules, and written stamps. The layers expose downstream consequences. No generic SaaS gradient, stock photo, glass card, or dashboard tile grid is allowed.

The interface is intentionally single-mode light because it represents a daylight commercial record and must print predictably. Contrast and forced-colors support remain mandatory. Newsreader provides the editorial display voice; Recursive carries plain copy and tabular money. Both will be self-hosted as two subset WOFF2 files under OFL licenses.

### Tokens

- Palette: canvas `#EEE7D8`, paper `#FFFDF7`, carbon duplicate `#D8EDF0`, risk duplicate `#F0DCD5`, ink `#1D2925`, muted ink `#58625B`, action carbon `#0B5F69`, success `#32613E`, warning `#765000`, danger `#9D3528`, focus `#007F8D`.
- Type: 12, 14, 16, 18–22, and 36–72px steps; body line height 1.55; display line height 1.15; 68ch reading measure; tabular figures.
- Space: 4, 8, 12, 16, 24, 32, 48, 64, 96px.
- Shape: 4px controls, 6px sheets, one-pixel rules, two-pixel totals, minimum 44px control height.
- Depth: cyan sheet offset 6×7px; red sheet offset 12×14px; no blurred decorative shadows.
- Motion: lift/reveal/settle in 180–240ms using transform and opacity. Reduced motion sets durations to zero and preserves the visible changed state.

### Components and states

The 19-component implementation inventory is [`.factory/component-inventory.md`](./component-inventory.md). It covers `AppFrame`, `SiteHeader`, `DemoBanner`, `LedgerStack`, `JobRegister`, `JobChainRow`, `ChainSpine`, `MoneyFigure`, `MarginSlip`, `RiskFlag`, `StatusStamp`, `ScopeRegister`, `CostCommitmentRow`, `InvoiceMilestoneRow`, `MoneyField`, `SheetDialog`, `ActionReceipt`, `FeedbackPanel`, and `PrimaryAction`.

Every data component specifies empty, loading, error, offline, permission, and narrow-screen behavior where applicable. State is conveyed with written labels. Errors preserve entered values and name one recovery step. Destructive actions use specific confirmation or time-limited undo.

### Key screens

1. **Landing:** left-aligned job headline and one-click sample action beside an original ledger stack; real preview before explanation and price.
2. **Job register:** vertical ruled rows ordered by risk; decisive money and next action first; labeled definition-list form on phones.
3. **New job:** four sheet sections and a live “Chain check” receipt; one route, preserved fields, exact validation.
4. **Job workspace:** client-to-cash chain spine, versioned registers, and a sticky margin formula slip that moves near the top on phones.
5. **Settings:** ruled lists for team visibility, named plan allowance, export, and deletion; consequences written beside actions.

### Site structure and accessibility

Every route has its own plain title, one `<h1>`, valid landmarks/headings, a skip link, visible 3px focus, and a polite route announcer. Route navigation uses real URLs and History API behavior; focus and scroll are restored on back/forward. Header contains wordmark, Demo, How it works, Pricing, and sign-in/app as appropriate. Footer contains the one-line description, Privacy, Terms, Built by Param Factory, and build ID.

The landing order is header → first screen → live product preview → three steps → limits/privacy → exact paid plans → footer. Metadata includes canonical, description, Open Graph/Twitter image derived from original art, SVG favicon, 180px touch icon, `robots.txt`, `sitemap.xml`, and a designed 404. At 390px, nothing essential hides or scrolls horizontally. Text zoom at 200%, keyboard-only use, forced colors, reduced motion, and serious/critical axe checks block release.

## 5. Milestones

### M1 — Prove the margin chain in a one-click demo

Status: **built and locally verified; awaiting review → polish**
User outcome: a stranger opens realistic sample jobs, creates or changes a chain, sees deterministic margin risk, links approval and invoice state, and resets the sandbox without an account.

#### Routes and screens added

- `/` landing with approved first-screen copy, live sample preview, how it works, limits/privacy, exact planned prices, and honest “accounts and checkout arrive next” note;
- `/demo` and `/?demo=1` seeded job register with persistent demo banner;
- `/demo/chains/new` complete chain form;
- `/demo/chains/:chainId` job workspace;
- `/privacy`, `/terms`, `/404`, plus metadata assets, `robots.txt`, and `sitemap.xml`.

M1 API: `POST /api/v1/demo/workspaces`, `DELETE /api/v1/demo/workspaces/current`, `GET/POST /api/v1/demo/chains`, `GET/PATCH /api/v1/demo/chains/:id`, scoped commitment/scope/cost/milestone mutations, and `/health`. Demo storage and rate-limit details follow `.factory/demo.md`.

M1 includes no account, checkout, real tenant persistence, email, AI, or fabricated customer testimonial. “Start for real” explains what comes in M2. It must not present a dead purchase or sign-in control.

#### Claims

The executable M1 registry is `.factory/claims.json`.

| ID | User-visible claim | Observable proof |
| --- | --- | --- |
| `m1-chain-math` | Shows client commitment, committed subcontractor cost, and expected margin in one job chain | Seeded $24,000 − $14,500 equals $9,500 and 39.6% |
| `m1-margin-risk` | Warns when committed cost puts expected margin below the job's floor | Add $6,000; warning names the change and $1,300 shortfall |
| `m1-linked-status` | Keeps scope approval and client invoice status beside the same job | Approve revision, mark linked milestone sent, reload both states |
| `m1-demo-no-account` | The sample demo needs no account | Enter and edit without CIAM redirect/request |
| `m1-demo-reset` | Demo changes are discarded when the sample is reset | Reset restores fixtures and invalidates old workspace |
| `m1-plan-prices` | Studio is $79/month and Portfolio is $159/month | Pricing and limits render; no pre-M2 purchase action |

#### Tests

- Rust unit tests: integer money parsing/formatting, conservative floor rounding, risk boundary table, state-transition rejection, property tests over safe integer ranges.
- API integration tests with fresh process store: seed exact fixtures, all demo mutations, invalid/expired workspace, reset invalidation, body limits, problem responses, idempotency, and 429 plus `Retry-After` past each allowance.
- Vitest: view-model math mirrors server fixtures, route manifest/titles, form schema, status language, and reduced-motion token.
- Playwright Chromium desktop + 390px: one-click entry; each `@claim:*` exactly once; keyboard create/edit/reset; focus after route/reset/error; back/forward/deep reload; offline/error state copy; no console/page errors; request log proves demo-only API and no CIAM/billing request.
- Axe on every M1 route with no serious/critical findings. Crawl every link. Check one `<h1>`, title, `lang`, main, alt text, heading order, labels, 44px targets, 200% zoom, and contrast.
- Production build budgets: `npm run build` creates `dist/`; initial JS ≤200 KiB gzip, CSS ≤50 KiB, fonts ≤120 KiB, hero ≤300 KiB; Lighthouse mobile ≥90 performance and ≥95 accessibility, LCP <2.5s, INP <200ms, CLS <0.1.

#### Definition of done

- All six claims pass from a fresh browser using only `/demo`; claim language matches rendered copy and README.
- The three seeded jobs and reset contract match `.factory/demo.md`; no demo path can call or read a tenant repository.
- Margin math is server-authoritative, exact, explained, and handles zero/incomplete/negative results without NaN or false safety.
- Landing, core flow, empty/loading/error/offline states, 390px layout, keyboard, screen reader smoke, focus management, legal pages, metadata, security headers, CSP, and rate limits pass.
- Original SVG/social/favicon assets and self-hosted font licenses have provenance in `.factory/design.md`.
- `npm test`, `npm run build`, `cargo test --locked`, release build, and container smoke on `PORT=8080` pass. `/health` returns the injected build SHA.
- README, copy audit, demo doc, plan status, and `.factory/handoff-m1.md` are current. Review → polish returns PASS before M2.

### M2 — Turn the demo into a paid, private agency workspace

Status: **planned; starts only after M1 PASS**  
User outcome: an owner signs in, creates an organization, persists real job chains, invites role-limited teammates, starts a trial, and subscribes through Sociobot/Dodo.

#### Routes and screens added or upgraded

- `/auth/callback`, `/onboarding`;
- `/app/chains`, `/app/chains/new`, `/app/chains/:chainId` using real tenant storage;
- `/settings/team`, `/settings/billing`;
- `/demo` remains unchanged and isolated.

M2 API adds authenticated organization, member/invitation, client, subcontractor, chain, commitment, and billing routes; `/ready`; initial sqlx migrations; online migration check. Studio allowance is enforced on activation/reopen, never by deleting or hiding records. Portfolio appears only with a server-verifiable registry entitlement.

#### Planned claims

| ID | Claim | Test contract |
| --- | --- | --- |
| `m2-persist-chain` | Signed-in job chains remain available after sign-out and return | CIAM fixture user creates a chain, new context signs in, exact record returns |
| `m2-tenant-isolation` | One agency cannot read or change another agency's job chains | Two token fixtures; enumerate/read/update/export attempts return non-revealing 404/403 and leave records unchanged |
| `m2-rate-privacy` | Producers cannot see subcontractor rates unless an owner allows it | Owner/producer fixtures assert fields absent from JSON, DOM, logs, and export |
| `m2-studio-subscription` | Studio costs $79 per agency each month for up to 25 active job chains | Pilot Sociobot fixture/test checkout activates entitlement; 26th active chain is blocked with archive/upgrade choices |
| `m2-read-only-lapse` | A lapsed plan keeps records readable and exportable | Expired verify fixture blocks mutation but permits list, detail, export, and deletion |
| `m2-demo-isolation` | Demo edits never enter the signed-in agency | Edit demo, sign in, assert tenant clean; create tenant record, return to demo, assert absent |

#### Tests

- Auth unit/API tests for discovery, cached JWKS, rotation, RS256-only, `aud/tid/iss/exp/nbf`, missing token, wrong role, and `WWW-Authenticate`.
- Reversible migration tests on empty and populated temp SQLite; repository cross-tenant matrix for every entity; optimistic concurrency and transaction rollback.
- Billing adapter contract tests use recorded pilot fixtures for valid, invalid, expired, revoked, wrong product, cached daily check, return token stripping, restore purchase, and gateway outage. One authorized staging smoke may use the Dodo test card; CI never spends or calls live billing.
- Playwright claim tests for onboarding under five minutes, sign-out/in persistence, member permission projections, plan limit, billing failure/cancel/return, narrow screen, keyboard, and unchanged demo.
- Load smoke at 100 requests/second for 60 seconds across representative reads plus controlled writes; p95 and 429 behavior recorded.

#### Definition of done

- A stranger can sign in with Sociobot Entra, finish organization setup, create a complete real chain, and enter hosted Studio checkout in under five minutes.
- The callback is registered or named as an operator action. No product password, raw Dodo integration, required startup environment variable, or secret reaches the client/log.
- Tenant isolation and role-filtered response tests pass. Encryption key is generated and persisted at first boot. SQLite uses WAL, constraints, tenant-first indexes, and reversible migrations.
- Billing test mode verifies through Sociobot. Lapsed and over-limit states are calm, read-only, export-safe, and accessible. Demo still passes every M1 claim.
- All quality, security, rate-limit, build, container, mobile, and accessibility gates pass; `.factory/claims.json`, plan status, README/legal copy, and `.factory/handoff-m2.md` are current; review → polish PASS.

### M3 — Control scope approval and both invoice sides

Status: **planned; starts only after M2 PASS**  
User outcome: the agency preserves scope/cost revisions, gets a client decision through a least-privilege link, accepts a subcontractor invoice status, and sees the cash chain without leaking margin.

#### Routes and screens added or upgraded

- richer `/app/chains/:chainId` registers and revision history;
- `/approve/:token` client scope review and decision;
- `/submit/:token` subcontractor invoice submission;
- `/app/chains/:chainId/history` commercial revision timeline;
- `/settings/access-links` active/revoked external links.

M3 API adds append-only revisions, approval/submission token issue/revoke/decision, subcontractor invoice state, client milestone state, and mismatch warnings. It does not send or receive money, produce a tax invoice, or treat an external approval as an e-signature.

#### Planned claims

| ID | Claim | Test contract |
| --- | --- | --- |
| `m3-scope-history` | Keeps every approved scope and cost revision with its author and date | Create two revisions; current view and immutable history show exact values; update/delete attempts fail |
| `m3-client-approval` | A client can approve one scope without seeing subcontractor rates or other jobs | Fresh expiring link decides named revision; network/body/DOM contain no forbidden data; reuse behavior is explicit |
| `m3-risk-cause` | Names the revision that moved expected margin below the floor | Approved change crosses boundary; risk event links exact revision and before/after amounts |
| `m3-invoice-chain` | Shows planned, sent, paid, and overdue client milestones beside subcontractor invoice status | Advance fixture states and clock; workspace text and totals match without changing committed cost |
| `m3-subcontractor-privacy` | A subcontractor link shows only assigned scope, own commitment, and own invoice | Two-subcontractor fixture attempts IDs and endpoints; all other rates/client money absent |

#### Tests

- Domain transition tables for approval, scope, milestone, and subcontractor invoice states; immutable revision and mismatch logic.
- API tests for token entropy/hash/expiry/revocation/max-use, replay and concurrency, least-privilege projections, idempotent decisions, rate limits, audit transactions, and tenant boundaries.
- Playwright claims through owner, client-link, and subcontractor-link contexts; expired/revoked/error states; keyboard and screen reader dialog/link flows; 390px chain history.
- Clock-controlled overdue tests; no flaky wall-clock waits. Security test scans JSON and HTML for forbidden fixture markers.

#### Definition of done

- All five claims pass and prior claims remain green. Link users can complete their one job without an account and cannot navigate into the app.
- Every commercial overwrite is a revision. State transitions and risk cause are deterministic, auditable, and transactionally consistent.
- External pages explain identity limits, expiry, and non-signature status; tokens never enter logs/referrers and are revoked after their intended lifecycle.
- Empty/loading/error/offline/link-expired states, responsive layout, focus, contrast, rate limits, build, and docs pass. `.factory/handoff-m3.md` and review → polish PASS.

### M4 — Make the service operable and the data portable

Status: **planned; starts only after M3 PASS**  
User outcome: owners receive restrained notifications, inspect activity, export or delete their data, while operators can measure health, restore backups, and handle abuse without database access.

#### Routes and screens added

- `/app/notifications`, `/app/activity`;
- `/settings/notifications`, `/settings/data`;
- `/ops` factory-operator view protected by operator credential and network policy;
- `/ready`, `/internal/metrics` and internal backup/job status APIs.

M4 adds transactional in-app notification/outbox behavior, optional email relay, organization export, deletion/recovery workflow, append-only audit views, nightly backups, restore tooling, structured metrics, SLO dashboards-as-config, and runbooks. The operator view shows IDs/digests and counts by default, not client names or rates.

#### Planned claims

| ID | Claim | Test contract |
| --- | --- | --- |
| `m4-data-export` | Owners can export every agency record as CSV and JSON | Seed all entity types; archive contains documented files, row counts, money values, revision/audit links; producer forbidden |
| `m4-delete-control` | Organization deletion has a seven-day recovery window and then removes tenant data | Controlled clock requests, restores, expires; queries and backup manifest follow documented retention |
| `m4-margin-notice` | Owners can receive one digest for unresolved margin risks without duplicate notices | Seed events and retry worker; one in-app item/email fixture per digest key, preferences honored |
| `m4-audit-trail` | Owners can see who changed a commercial record and when | Mutations by roles/external link render actor, action, subject, timestamp without secret payload |
| `m4-backup-restore` | Nightly backups are checksummed and can restore the service | Temp volume backup, corrupt-copy rejection, restore into clean process, row/count/checksum and migration assertions |
| `m4-operations` | Health, readiness, metrics, logs, and rate limits expose service state without customer content | Probe endpoints/log capture; assert fields, auth, redaction, `Retry-After`, and injected build SHA |

#### Tests

- Export schema snapshot and formula reconciliation; spreadsheet-injection neutralization for cells beginning `=`, `+`, `-`, or `@`.
- Controlled-clock deletion/recovery, billing credential purge, notification deduplication/retry/dead-letter, and audit redaction tests.
- Backup under concurrent writes, checksum failure, migration-version mismatch, full restore drill, retention pruning, disk-full error path.
- Metrics/log snapshot tests reject fixture names, emails, amounts, and tokens. Operator auth and cross-tenant support access default-deny.
- Playwright claims for notification preferences, activity filters, export download, destructive focus/confirmation, recovery, mobile, axe, and prior flows.

#### Definition of done

- Export and deletion remain available in trial/lapsed/over-limit states. Backup restore meets the documented RPO/RTO in a timed local drill.
- No background job duplicates a commercial action or notification. Missing SMTP degrades to visible in-app behavior and never blocks startup.
- Runbooks cover CIAM outage, billing outage, DB busy/disk full, restore, leaked share link, suspected tenant leak, and subscription dispute.
- SLOs, rate limits, metrics, privacy text, retention, and operator access are implemented and verified; all prior claims pass; `.factory/handoff-m4.md` and review → polish PASS.

### M5 — Reduce switching cost and support safe sharing

Status: **planned; starts only after M4 PASS**  
User outcome: an agency imports its existing spreadsheet safely, shares a revocable read-only commercial status, emits signed events to its own systems, and installs the app shell without weakening privacy.

#### Routes and screens added

- `/settings/import` upload → map → dry run → commit;
- `/settings/integrations` signed outbound webhooks and accounting-shaped exports;
- `/share/:token` revocable read-only job summary;
- install prompt/help under `/settings/app` and a web app manifest.

M5 supports a documented UTF-8 CSV template plus mappings for common generic columns, dry-run error export, idempotent import, signed outbound webhooks for chain risk/approval/invoice changes, and QuickBooks/Invoice Ninja-shaped CSV exports without claiming a live accounting sync. The PWA caches the public shell and demo fixtures; signed tenant data is not placed in Cache Storage. No background sync of commercial mutations ships without a separate conflict design and claim.

#### Planned claims

| ID | Claim | Test contract |
| --- | --- | --- |
| `m5-csv-import` | Imports valid job chains from CSV after a dry run | Fixture maps rows, reports exact errors, commits valid batch once, rerun idempotent, calculations match |
| `m5-safe-csv` | Spreadsheet formulas are never executed during import or export | Malicious cells remain text; exports neutralize formula prefixes; round trip verified |
| `m5-status-share` | Owners can share and revoke a read-only job status without exposing private rates | Shared projection allowlist and revocation test across browser/network/logs |
| `m5-signed-webhook` | Portfolio can send signed risk, approval, and invoice events with retries | Local receiver verifies signature, event ID, ordering contract, exponential retry, replay safety, secret rotation |
| `m5-installable` | The app can be installed and the demo shell opens after the network is removed | Manifest/service-worker audit; first visit then offline `/demo` loads bundled sample without tenant requests |
| `m5-import-export-shapes` | Exports job and invoice rows in documented Invoice Ninja and QuickBooks CSV shapes | Golden fixtures validate headings, encoding, integer-to-decimal formatting, and row relationships |

#### Tests

- Fuzz/property tests for CSV quoting, encoding, size/row limits, money/date parsing, duplicate keys, formula injection, cancellation, and transactional rollback.
- Webhook receiver fixture for HMAC signature, timestamp window, retries, duplicate event ID, endpoint SSRF controls, DNS/private-range rejection, and secret rotation.
- Share-link projection and token lifecycle matrix. PWA tests use a clean browser, installability audit, offline mode, service-worker version upgrade, and confirmation that authenticated API responses are never cached.
- Playwright completes import from a realistic 40-row fixture, fixes errors, commits, shares/revokes, exports, and repeats all prior demo claims.

#### Definition of done

- A spreadsheet user can dry-run and import without corrupting existing data; error rows are actionable and import is reversible before confirmation.
- Integrations are honest exports/webhooks, not claimed as two-way accounting sync. Webhooks are allowlisted against SSRF, signed, observable, and Portfolio-gated only when its entitlement is verifiable.
- The installed app preserves current routing, accessibility, and demo; it never caches tenant JSON or promises offline tenant edits.
- All M1–M5 claims, tests, budgets, security scans, docs, operator runbooks, and live smoke pass; `.factory/handoff-m5.md` and final review → polish PASS.

## 6. Risks, unknowns, and retirement experiments

| Risk or unknown | Why it matters | Experiment and decision rule | Owner / milestone |
| --- | --- | --- | --- |
| Signal is broad workflow pain, not proof of this wedge | Agencies may prefer a better spreadsheet | Put the M1 demo in front of 8 agency owners. Give a current job and no tutorial. Continue if 6/8 complete the chain and 4/8 ask to use it on a live job; otherwise revise the object and language before M2. | Product / after M1 |
| $79 and active-chain packaging are unproven | Wrong price can hide value or block pilots | Show Studio $79/25 active and a price-neutral prototype to 10 qualified owners. Proceed if at least 4 accept a paid pilot and median stated active jobs fit the cap. | Founder / before M2 live billing |
| Portfolio $159 entitlement may not be representable by current verify API | Client-selected tiers are unsafe | Register pilot named plans and capture a signed/verified response. Ship Portfolio only if the server receives an authoritative tier and expiry; otherwise hide it and ship Studio only. | Billing operator / M2 |
| Owners may not know committed costs before work | The record could arrive too late to protect margin | In interviews, reconstruct the last 10 jobs and note when cost became knowable. If fewer than 70% are knowable before start, add explicit cost ranges/contingency only after a tested calculation design; do not show false precision. | Product / M1 pilot |
| Margin-floor alert may be noisy | Alert fatigue destroys trust | Replay 30 closed jobs with owners. Tune the near-floor band only if fewer than 70% of warnings prompt a stated action; below-floor rule remains exact. | Product / M1–M3 |
| “Agency client” and “end client” language varies | Wrong nouns make onboarding fail | Five-second label test with 8 agencies. Keep “contracting client”/“end client” if 7/8 map both correctly; otherwise allow organization-level labels without changing API semantics. | Design / M1 polish |
| Role shaping could leak rates or identities | A leak destroys the product's core trust | Maintain forbidden marker fixtures and a permission matrix across JSON, DOM, export, logs, share links, and errors. Any marker leak blocks release and triggers incident review. | Security / every milestone |
| External approval links can be forwarded | Unauthorized decisions create commercial disputes | Test expiry, named recipient context, single decision, revocation, and optional email challenge with five pilot clients. Add a challenge only if forwarding occurs or clients request it; never imply legal signature. | Product/security / M3 |
| CIAM callback or claims may differ in production | Accounts could fail despite local fixtures | Register exact callback and run a production-tenant smoke before M2 PASS. If email is absent, UI still works because `oid` is identity and email is optional display data. | Operator / M2 |
| Sociobot subscription webhook/plan contract is not in the attached one-time API skill | Billing may be stale or ambiguous | Use daily `/verify` as authority and a captured adapter fixture. Do not implement direct Dodo or trust unsigned callbacks. Escalate registry capability in handoff if named plan is absent. | Engineering/operator / M2 |
| SQLite single-writer deployment may outgrow one replica | Locking or failover could hurt availability | Record busy time, write p95, size, and replica need. Trigger PostgreSQL migration at the thresholds in Architecture; repository contract and integration suite must pass unchanged. | Engineering / M4 operations |
| Demo creation can be abused | Anonymous state consumes memory/CPU | Load 5,000 TTL workspaces, enforce caps and purge, then attack provision/write limits. Require bounded memory and 429 with `Retry-After`; shorten TTL under pressure rather than touch tenant data. | Engineering / M1 |
| Multi-currency agencies may reject single-currency jobs | Silent FX would make margins misleading | Ask all pilot agencies what fraction of jobs mix currencies. If over 20%, design explicit manual FX snapshots with source/date as a later milestone; never fetch or guess a live rate silently. | Product / after M3 |
| Email delivery is not guaranteed without configured relay | Users may miss approvals or notices | Product always exposes in-app state and copyable links. Email is marked configured/unconfigured; no email-dependent claim ships until a relay fixture and deliverability smoke pass. | Operations / M3–M4 |
| Imports can create bad money or spreadsheet injection | Migration could damage trust or users' desktops | Dry run every row, cap size, reject ambiguous currency/dates, neutralize formula prefixes, and test malicious corpus. A single silent coercion blocks M5. | Engineering / M5 |
| AI may appear to be missing leverage | Competitors may offer document extraction | Measure time spent entering scope in pilots. Consider gateway-assisted drafting only if median entry exceeds 10 minutes and 5/8 owners request it; exact money and final approval remain manual. | Product / after M5 |

## 7. Planning handoff checklist

- `.factory/brief.json` is admitted and remains the researched source.
- `.factory/design.md` records the product-specific visual thesis, tokens, motion, responsive and accessibility rules, stack decision, and asset provenance.
- `.factory/claims.json` contains only the M1 claims. Each later builder adds that milestone's accepted claims before implementation and preserves prior entries.
- `.factory/demo.md` fixes the sample, entry, storage boundary, reset behavior, and verifier path.
- `.factory/copy-audit.md` contains approved M1 landing copy; M1 re-runs the rendered audit.
- The repository skeleton compiles but intentionally contains no product workflow. M1 replaces the scaffold screen rather than presenting it as shipped product.
- No infrastructure, DNS, billing product, or CIAM registration is changed by this planning work order.
