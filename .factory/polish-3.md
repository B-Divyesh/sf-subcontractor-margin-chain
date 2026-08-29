# Perfection-loop polish 3

Date: 2026-08-29 UTC

Work order: `subcontractor-margin-chain-polish-3`

Reviewed release candidate: `957c95fa19fed0d84fd58dea9ae8163f026070a5`

Review report commit: `4856f451046771153d77d4cd0b6474fe33ab19b1`

Application repair commit: `daeafcd9b980ae6881ccb45d6860caba61d84a81`

Live URL: <https://subcontractor-margin-chain.sociobot.in>

## Finding map

Every current and historical finding was rechecked against the repaired source and the deployed application.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Saved agencies use separate durable storage and cookies. Owner, finance, producer, and viewer permissions now govern client identities, rates, financial writes, operational writes, and team access. | `claim_real_agency_records_persist_without_demo_fixtures`; `claim_real_agencies_are_tenant_isolated`; `claim_agency_roles_hide_rates_and_block_financial_writes`; `claim_restricted_roles_hide_client_identities_in_list_and_detail`; live `producer-redaction.png` |
| F-1-2 | The landing action opens the working saved-workspace setup. The commercial panel now states that the saved workspace is a free beta with no checkout or paid plan. | `@claim:real-workspace-onboarding`; `@claim:real-beta-no-billing`; live `/start`; live `screenshot-mobile.png` |
| F-1-3 | The native reset dialog remains compatible with the strict CSP and restores focus after reset. | `public and demo routes and both dialogs run without console or page errors`; `keyboard actions create a chain and reset with focus returned to the heading`; live 78-test run |
| F-1-4 | The first-screen action note names the supported sample actions and uses the canonical milestone term. | `the first screen states the job, audience, sample action, and three facts`; `.factory/copy-audit.md`; live `screenshot-mobile.png` |
| F-1-5 | The three original fictional sample jobs and their provenance remain registered and tested. | `@claim:m1-demo-fixtures`; `.factory/demo-fixtures.json`; live `demo-direct-mobile.png` |
| F-1-6 | The sample claim remains bounded to create, cost, scope approval, milestone status, and reset actions. | `@claim:m1-sample-workflow`; live 78-test run |
| F-1-7 | Tax, worker classification, payment collection, and invoice sending remain explicitly outside the product. | `@claim:m1-product-boundaries`; live `/terms` |
| F-1-8 | Public provider claims remain removed. Both demo and agency records now have observable shared-replica persistence tests. | `workspace_survives_replica_handoff_in_shared_persistence`; `claim_real_agency_survives_replica_handoff_in_shared_persistence`; live `/ready` reports both stores as `azure-blob-shared` |
| F-1-9 | Visitor copy makes no deployment-topology promise. The factory ACR build and container deployment succeeded. | ACR run `chu1`; live `/health`; live `verify.json` |
| F-1-10 | README documents only supported build and server commands, without an unsupported Vite comparison. | Clean clone `npm run check`; production bundle output |
| F-1-11 | Create operations retain stable idempotency keys, including CSV batch rows. | `concurrent_idempotent_retries_stay_available_and_create_one_cost`; `@claim:real-csv-import` |
| F-1-12 | Rejected API responses retain bounded problem details, request IDs, stable codes, and fields. | `claim_problem_details_are_structured_and_bounded` |
| F-1-13 | Money remains integer minor units with conservative upward floor rounding. | `claim_money_integrity_uses_integer_minor_units_and_rounds_up`; `@claim:m1-chain-math` |
| F-1-14 | Build identity remains compiled into the server and observable through health. | `claim_health_reports_build_identity`; live `/health` returned `daeafcd9b980ae6881ccb45d6860caba61d84a81` |
| F-1-15 | README retains a direct factory deployment instruction instead of an untestable infrastructure claim. | README review; ACR run `chu1` |
| F-1-16 | The registry now has 34 unique claims, including real identity projection, shared agency persistence, import, export, and beta status. | `tests/claims.test.ts`; 34/34 exact clean-clone claim commands passed |
| F-1-17 | The README opening remains under the 22-word sentence cap. | `.factory/copy-audit.md`; `npm test` |
| F-1-18 | The first-screen label remains the concrete “Job margin tracking for agencies.” | `.factory/copy-audit.md`; live `screenshot-mobile.png` |
| F-1-19 | The preview label remains the concrete “Job margin preview.” | `.factory/copy-audit.md`; live `screenshot-mobile.png` |
| F-1-20 | Brand-lore and metaphor headings remain removed. | `.factory/copy-audit.md`; live landing review |
| F-1-21 | The method heading remains “Track each job's margin in three steps.” | `.factory/copy-audit.md`; live `screenshot-mobile.png` |
| F-1-22 | The third step remains the action-led “Check the expected margin.” | `.factory/copy-audit.md`; live `screenshot-mobile.png` |
| F-1-23 | Pending scope and risk states remain written in specific, non-color-only language. | `@claim:m1-margin-risk`; live `demo-direct-mobile.png` |
| F-1-24 | The limits section remains explicitly named “Demo and product limits.” | `.factory/copy-audit.md`; live `screenshot-mobile.png` |
| F-1-25 | The boundary heading remains “What this tool does not do.” | `.factory/copy-audit.md`; live `/terms` |
| F-1-26 | The former planned-pricing section is now an honest saved-workspace beta section. | `@claim:real-beta-no-billing`; live `screenshot-mobile.png` |
| F-1-27 | Unavailable plan allowances and “active work” wording were removed from visitor copy. | `@claim:real-beta-no-billing`; README and landing copy audit |
| F-1-28 | Public product terms are standardized: client commitment, client invoice milestone, committed cost, subcontractor commitment, and job chain. | `.factory/copy-audit.md`; `@claim:m1-linked-status` |
| F-1-29 | README claim sentences remain concise and individually testable. | `.factory/copy-audit.md`; `tests/claims.test.ts` |
| F-1-30 | Visitor copy contains no milestone codes, dead sign-in language, or unavailable-account action. | `@claim:m1-demo-no-account`; live `/`, `/demo`, and `/terms` |
| F-1-31 | Unverified price and allowance promises were removed; the page states “Free beta” and “no checkout or paid plan.” | `@claim:real-beta-no-billing`; live `screenshot-mobile.png` |
| F-1-32 | Every public route, setup route, demo route, settings route, and 404 state owns its title, description, canonical, Open Graph, and Twitter metadata. | `each route updates title, description, canonical, Open Graph, and Twitter metadata`; live 78-test run |
| F-1-33 | CSV mapping, dry-run validation, retry-safe import, and browser CSV/JSON export work in both demo and saved agency flows. | `@claim:m1-csv-import`; `@claim:m1-data-export`; `@claim:real-csv-import`; `@claim:real-data-export`; live `real-import-dry-run.png` |
| F-2-1 | The saved-workspace path is end-to-end: setup, durable tenant-isolated records, role links, redacted projections, real import, and local export. | Five agency Rust claims; four real-workspace browser claims; live `app-deep-link-setup.png`, `producer-redaction.png`, and `real-import-dry-run.png` |
| F-2-2 | Unsupported coverage/completeness assertions remain removed. Every current user-facing promise is represented by one executable registry entry. | `tests/claims.test.ts`; 34/34 exact clean-clone claim commands passed |
| F-3-1 | Added explicit client-identity and rate permissions. Producer and viewer list/detail responses omit both client fields, costs, margin values, and risk cause. Restricted UI explains the state and team controls explain each role. | `claim_restricted_roles_hide_client_identities_in_list_and_detail`; `claim_agency_roles_hide_rates_and_block_financial_writes`; `a producer sees a deliberate role-limited workspace without protected values`; live `producer-redaction.png` |
| F-3-2 | Added a session gate before all `/app/*` routes. A fresh deep link replace-routes to `/start`, retains its return path, focuses the setup H1, and does not issue a failing app request. API fallback errors are agency-specific. | `a fresh saved-workspace deep link opens setup without console errors`; live `/app/chains`; live `app-deep-link-setup.png` |
| F-3-3 | Chose the honest current state: “Free beta,” no Pricing navigation, no planned prices, no checkout control, and the heading “Create a saved workspace.” | `@claim:real-beta-no-billing`; live `/`; live `screenshot-mobile.png` |
| F-3-4 | Added `/app/import` with the existing column mapper, bundled or uploaded CSV, dry-run row errors, explicit import confirmation, stable keys, tenant-scoped writes, and role enforcement. Real local CSV/JSON exports remain available. | `@claim:real-csv-import`; `@claim:real-data-export`; live `/app/import`; live `real-import-dry-run.png` |
| F-3-5 | Removed `/404` from the sitemap, added `/start`, and test every listed URL for HTTP 200. The unlisted 404 route still returns a true 404. | `every sitemap URL returns a successful page and includes setup`; `claim_unknown_routes_return_true_404`; live missing-route check returned 404 |
| F-3-6 | Standardized all visitor and README wording on “client invoice milestone” and “client invoice milestone status.” | `.factory/copy-audit.md`; `@claim:m1-linked-status`; live `screenshot-mobile.png` and `demo-direct-mobile.png` |

Screenshot names are relative to `.factory/evidence/polish-3-live/`. Equivalent local captures are under `.factory/evidence/polish-3-local/`.

## Verification summary

- Fresh clone `/tmp/smc-polish3-clean-Xm9XpK` at `daeafcd9b980ae6881ccb45d6860caba61d84a81`: all 34 exact `.factory/claims.json` commands passed independently.
- Fresh clone `npm run check`: 11 Vitest tests, production build, rustfmt, Clippy with warnings denied, and 28 Rust unit/integration tests passed.
- Fresh clone `npm run test:e2e`: 78/78 passed across desktop Chromium and the 390px mobile project.
- The browser suite includes real/demo flows, privacy request recording, offline error handling, keyboard/focus, route metadata, sitemap crawling, 200% zoom, 44px targets, and serious/critical axe checks.
- Production build: 89.20 KiB gzip JavaScript and 5.97 KiB gzip CSS.
- Local Lighthouse mobile: 98 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 2.071s, CLS 0.027, TBT 21.5ms, 172,095 transferred bytes.
- Factory deployment: ACR run `chu1` succeeded and deployed application commit `daeafcd9b980ae6881ccb45d6860caba61d84a81`.
- Cold live verifier: 672ms load, no console errors, one title/H1/main, `lang=en`, no missing alt text, and no unnamed buttons.
- Live browser/axe suite: 78/78 passed against the public hostname.
- Live Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.651s, CLS 0.027, TBT 4ms, 167,751 transferred bytes.
- Live runtime: `/health` returned the deployed SHA; `/ready` returned both stores as `azure-blob-shared`; public routes returned 200; an unknown route returned 404.

## Result

All findings from reviews 1–3, including every minor item, are closed. No review finding remains unresolved.
