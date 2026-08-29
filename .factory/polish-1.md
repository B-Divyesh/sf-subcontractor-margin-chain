# Perfection-loop polish 1

Date: 2026-08-29 UTC

Work order: `subcontractor-margin-chain-polish-1`

Reviewed candidate: `ab5ac4df62e5dc31f8fd8c831f27c287398a3392`

Implemented candidate: `4558b3351058e64a1a5da2480d36972102a4c883`

Live URL: <https://subcontractor-margin-chain.sociobot.in>

The controller classifies identity, permanent multi-tenant records, roles, and billing as M2. F-1-1 is therefore closed for M1 by preserving the isolated demo and correcting every availability statement. No placeholder account or payment path was added.

## Finding map

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Kept real organizations, CIAM, roles, billing, and tenant storage in M2. The demo remains isolated and all current limitations are explicit. | `@claim:m1-demo-no-account`, `@claim:m1-demo-isolation-expiry`; live `/demo`; `demo-mobile.png` |
| F-1-2 | Reworded the price as planned and replaced “Start for real” with “See planned real-work features.” | `@claim:m1-plan-prices`; live `/` and `/demo`; `screenshot-mobile.png`, `demo-mobile.png` |
| F-1-3 | Replaced the injected-style dialog package with native modal dialogs under strict `style-src 'self'`. | `public and demo routes and both dialogs run without console or page errors`; live `/demo`; `demo-mobile.png` |
| F-1-4 | Replaced “Change anything” with the three exact supported actions. | `.factory/copy-audit.md`; `@claim:m1-sample-workflow`; live `/`; `screenshot-desktop.png` |
| F-1-5 | Added exact fixture IDs, names, and original-fictional provenance. | `@claim:m1-demo-fixtures`; `.factory/demo-fixtures.json`; live `/demo`; `demo-mobile.png` |
| F-1-6 | Replaced “complete” with the bounded create/add/approve/update/reset workflow. | `@claim:m1-sample-workflow`; live `/demo`; `demo-mobile.png` |
| F-1-7 | Registered and tested the absence of tax, classification, collection, and invoice-sending actions. | `@claim:m1-product-boundaries`; live `/terms` and sample job; `demo-mobile.png` |
| F-1-8 | Removed provider and managed-identity claims from public README copy; retained the observable shared-replica claim. | `workspace_survives_replica_handoff_in_shared_persistence`; live `/ready`; `screenshot-desktop.png` |
| F-1-9 | Removed the unproved deployment-shape claim from public copy; kept runnable build instructions and verified the real ACR image. | ACR run `chrr`; live `/health`; `screenshot-desktop.png` |
| F-1-10 | Removed the unsupported Vite-versus-server comparison and documented only the supported server command. | `npm run check` from clean clone; live `/?demo=1`; `screenshot-mobile.png` |
| F-1-11 | Registered concurrent create idempotency. CSV batch rows also reuse stable keys after partial failure. | `concurrent_idempotent_retries_stay_available_and_create_one_cost`; live `/demo/import`; `import-dry-run-mobile.png` |
| F-1-12 | Registered problem responses with media type, code, request ID, field, and body-bound assertions. | `claim_problem_details_are_structured_and_bounded`; live demo API; `demo-mobile.png` |
| F-1-13 | Registered integer-cent storage and conservative upward rounding. | `claim_money_integrity_uses_integer_minor_units_and_rounds_up`; live sample margin check; `demo-mobile.png` |
| F-1-14 | Registered build identity and made the test compile with an exact supplied SHA. | `claim_health_reports_build_identity`; live `/health` reports `4558b335…`; `screenshot-desktop.png` |
| F-1-15 | Replaced the untestable infrastructure claim with a direct factory deployment instruction. | README review; live `/`; `screenshot-desktop.png` |
| F-1-16 | Expanded the claim registry from 17 to 26 unique commands and opened both dialogs in the console regression. | `public claim registry`; full clean-clone and live 62-test suites; `demo-mobile.png` |
| F-1-17 | Rewrote the README opening to 20 words. | `.factory/copy-audit.md`; live README source; `screenshot-desktop.png` |
| F-1-18 | Replaced “Commercial control” with “Job margin tracking for agencies.” | `.factory/copy-audit.md`; live `/`; `screenshot-mobile.png` |
| F-1-19 | Replaced “One linked record” with “Job margin preview.” | `.factory/copy-audit.md`; live `/`; `screenshot-mobile.png` |
| F-1-20 | Removed “From promise to invoice.” | `.factory/copy-audit.md`; live `/`; `screenshot-desktop.png` |
| F-1-21 | Replaced the vague chain heading with “Track each job's margin in three steps.” | `.factory/copy-audit.md`; live `/`; `screenshot-mobile.png` |
| F-1-22 | Replaced “Watch the chain” with “Check the expected margin.” | `.factory/copy-audit.md`; live `/`; `screenshot-mobile.png` |
| F-1-23 | Replaced the ambiguous pending-work stamp with a scope-specific sentence; near-floor rows now say “Near margin floor.” | `M1 chain view model uses written status language`; live `/`; `screenshot-mobile.png` |
| F-1-24 | Replaced “Clear limits” with “Demo and product limits.” | `.factory/copy-audit.md`; live `/`; `screenshot-mobile.png` |
| F-1-25 | Replaced the person comparison with “What this tool does not do.” | `.factory/copy-audit.md`; live `/`; `screenshot-mobile.png` |
| F-1-26 | Replaced “Planned agency plans” with “Planned pricing.” | `.factory/copy-audit.md`; live `/`; `screenshot-mobile.png` |
| F-1-27 | Replaced “active work” with “active job chains.” | `@claim:m1-plan-prices`; live `/#pricing`; `screenshot-mobile.png` |
| F-1-28 | Standardized public copy on client commitment, client invoice milestone, active job chain, committed cost, and subcontractor commitment. | terminology table in `.factory/copy-audit.md`; live routes; `screenshot-desktop.png` |
| F-1-29 | Split the README coverage sentence into two sentences under 22 words. | `.factory/copy-audit.md` rules and README review; live code source; `screenshot-desktop.png` |
| F-1-30 | Removed user-facing M1/M2 and “dead sign-in” language; copy now says current demo and not available yet. | `@claim:m1-demo-no-account`; live `/`, `/terms`, and demo planning dialog; `demo-mobile.png` |
| F-1-31 | Gave both plan allowances the “active job chains” unit. | `@claim:m1-plan-prices`; live `/#pricing`; `screenshot-mobile.png` |
| F-1-32 | Route changes now update Twitter title and description with title, canonical, description, and Open Graph metadata. | `each route updates title, description, canonical, Open Graph, and Twitter metadata`; live public/demo routes; `screenshot-desktop.png` |
| F-1-33 | Added `/demo/import` with CSV selection, column mapping, dry-run row validation, retry-safe import, and bundled data. Added local CSV/JSON downloads with formula-prefix neutralization. | `@claim:m1-csv-import`, `@claim:m1-data-export`, `spreadsheet boundaries`; live `/demo/import` and `/demo`; `import-dry-run-mobile.png` |

Screenshot paths above are relative to `.factory/evidence/polish-1-live/`. Local comparison captures are under `.factory/evidence/polish-1-local/`.

## Verification summary

- Fresh clone `/tmp/smc-polish-clean`: all 26 exact `.factory/claims.json` commands passed independently.
- Fresh clone: `npm run check` passed 11 Vitest tests, production build, rustfmt, Clippy with warnings denied, and 22 Rust tests.
- Fresh clone: `npm run test:e2e` passed 62/62 across desktop and 390px Chromium.
- Local Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.8s, CLS 0.028, TBT 30ms.
- Live cold verifier: 704ms load, no console errors, one title/H1/main, `lang=en`, no missing alt, and no unnamed button.
- Live browser/axe suite: 62/62 passed. The native reset and planning dialogs produced zero CSP or page errors.
- Live Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.7s, CLS 0.053, TBT 0ms.
- Live runtime: `/health` reported `4558b3351058e64a1a5da2480d36972102a4c883`; `/ready` reported `azure-blob-shared`; an unknown route returned 404.
