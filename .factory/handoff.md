# Review 2 handoff — repair in progress

## What changed

The demo is no longer the only product path. `/start` creates a permanent empty agency workspace, `/app/chains` runs the real job-chain workflow, and `/settings/team` creates role-limited access links. Agency records use a separate durable store from demo fixtures. Owner/finance sessions receive subcontractor amounts; producer/viewer sessions have costs removed from responses and cannot create cost commitments. The one-click `?demo=1` route, banner, reset, and sample isolation remain intact.

README coverage/completeness assertions that could not be mechanically supported were removed. The claim registry has real-workspace persistence, tenant isolation, role projection, and browser onboarding tests. The catalog description and copy audit were updated.

## Verified locally

- `npm run check` passed after the repair.
- `cargo test --manifest-path server/Cargo.toml --test agency --locked` passed: 3/3 real-workspace claims.
- `npx playwright test tests/e2e/m1.spec.ts --grep @claim:real-workspace-onboarding` passed on desktop and 390px Chromium.
- `npx playwright test tests/e2e/m1.spec.ts --grep @claim:m1-sample-workflow` passed on desktop and 390px Chromium.

## Remaining operational action

The repair is committed and pushed on remote `main`. At 2026-08-29 UTC, the cold live `/health` still returned `201e1b2ee8088cd520eab17aa0cfe83c35f4ad1c` and `/start` returned HTTP 404, so the factory deployment has not consumed the pushed commit yet. The work-order deployment runner must build and deploy the current `main`, then cold-open `/`, `/?demo=1`, `/start`, `/app/chains`, `/privacy`, `/terms`, and `/404`; run `npx @axe-core/cli` or the supplied Playwright axe suite against the live URL; and update this handoff with the deployed SHA. No deploy command or factory credential is present in this repository.

Date: 2026-08-29 UTC
Work order: `subcontractor-margin-chain-review-2`
Reviewed commit/live build: `201e1b2ee8088cd520eab17aa0cfe83c35f4ad1c`

## What was done

- Performed a fresh mobile (390 px) and desktop cold read of the live deployment.
- Entered the one-click isolated demo, confirmed the seeded job register, demo banner, reset dialog, planning dialog, same-origin request behavior, and no browser errors.
- Read the brief, design, claims, demo contract, every prior review/polish/handoff document, source routes/API, and README.
- Ran every exact command in `.factory/claims.json` from a new clone at `/tmp/smc-review2-7SasOi`.
- Ran `npm run check` and `npm run test:e2e` in that clone. Both passed.
- Checked live metadata, real 404 behavior, route H1/main presence, canonical/OG/Twitter titles, favicon, responsive width, and the live build SHA.

## Result

The review is **FAIL**. See `.factory/review-2.md` for the full evidence and copy audit.

Remaining findings:

1. **F-2-1 BLOCKING / repeat F-1-1:** only an expiring fictional demo is usable. There is no real organisation, durable tenant data, or role-based protection for client identities and subcontractor rates.
2. **F-2-2 MEDIUM / repeat F-1-16:** README promises test coverage and claim-registry completeness without matching `claims.json` entries or a copy-to-registry audit.

## How to verify

```sh
npm ci
npm run check
npm run test:e2e
```

For the supported local demo:

```sh
npm run build
PORT=8080 STATIC_DIR=dist cargo run --manifest-path server/Cargo.toml --locked
```

Open `http://127.0.0.1:8080/?demo=1`.

## Next steps

Implement the real agency workflow and authorization model, keep `/demo` isolated, then register or remove the README's coverage/completeness claims. Re-run the entire review, not only these two findings.
