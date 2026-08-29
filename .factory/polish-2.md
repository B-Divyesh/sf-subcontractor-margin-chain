# Perfection-loop polish 2

Candidate reviewed: `201e1b2ee8088cd520eab17aa0cfe83c35f4ad1c`.

## Finding map

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-2-1 / F-1-1 | Added `/start`, `/app/chains`, `/app/chains/new`, real persistent agency storage, an empty real register, and role-limited team access. Demo remains a separate store, cookie namespace, and route tree. | `claim_real_agency_records_persist_without_demo_fixtures`, `claim_real_agencies_are_tenant_isolated`, `claim_agency_roles_hide_rates_and_block_financial_writes`, `@claim:real-workspace-onboarding` |
| F-2-2 / F-1-16 | Removed unsupported README coverage/completeness promises. The claim registry now includes every current public real-workspace promise and its exact test. | `tests/claims.test.ts`; `npm test` |
| F-1-2 | Replaced the roadmap dialog and planned-pricing call to action with the working “Create your agency workspace” path. | `@claim:real-workspace-onboarding` |
| F-1-3 to F-1-4 | Preserved the native CSP-safe reset dialog and bounded sample actions. | `npm run test:e2e`; existing dialog and sample-flow claims |
| F-1-5 to F-1-15 | Preserved the registered fixture, privacy, export/import, money, idempotency, headers, rate-limit, and operational claims. | `.factory/claims.json`; `npm run check` |
| F-1-17 to F-1-31 | Re-audited first-screen and real-workspace wording; removed obsolete price/roadmap wording and kept terms consistent. | `.factory/copy-audit.md`; `@claim:real-workspace-onboarding` |
| F-1-32 | Preserved route-specific title, canonical, Open Graph, and Twitter updates; new real routes own titles. | `npm run test:e2e` route checks |
| F-1-33 | Preserved demo CSV mapping/dry-run and local CSV/JSON export. | `@claim:m1-csv-import`, `@claim:m1-data-export` |
| Verification-2 focus and mobile findings | Preserved shared demo limits, deterministic reset waits, input error focus, mobile target styling, and updated architecture documentation for the second store. | existing API/browser regression suite; `.factory/design.md` |

## Local evidence

- `npm run check`: pass (Vitest 11 tests, production build, rustfmt, Clippy with warnings denied, Rust unit/integration tests).
- Real-work claims: all three `server/tests/agency.rs` tests pass.
- Browser smoke: desktop and 390px `@claim:real-workspace-onboarding` passes; desktop and 390px sample workflow passes after route correction.
- Bundle: 87.90 KiB gzip JavaScript and 5.88 KiB gzip CSS from the production build.

## Deployment evidence

The repair is pushed to `main`. Cold live evidence after the push: `/health` still returned `201e1b2ee8088cd520eab17aa0cfe83c35f4ad1c` and `/start` was HTTP 404. The repository has no deployment command or factory credential, so the work-order deployment runner must consume the pushed commit before a live recheck can pass.
