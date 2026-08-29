# Review 3 handoff

## What was done

- Performed an independent fresh-context first read of the live site at 390 px and desktop.
- Tested the one-click demo, banner, reset dialog, sample readiness, cookie/storage isolation, and outgoing request origins.
- Read the brief, design contract, claim registry, demo contract, README, source, every earlier review/polish/handoff/verification document, and the live routes/metadata.
- Cloned current `main` to `/tmp/smc-review3-REwBXY` and ran all 29 exact claim commands, `npm run check`, and `npm run test:e2e`.
- Wrote `.factory/review-3.md`. Product code was not changed.

## Verification

- Live `/health` reports `957c95fa19fed0d84fd58dea9ae8163f026070a5`, matching the reviewed checkout.
- All 29 registered claim commands passed from the fresh clone.
- `npm run check` passed.
- `npm run test:e2e` passed 62/62.

## Result and remaining work

**FAIL.** See `.factory/review-3.md`.

Blocking: producer/viewer roles redact subcontractor costs but still expose contracting and end-client identities, contrary to the brief's role-protection constraint.

Also remaining: unauthenticated `/app/chains` deep links produce a 401/demo error and console error; the Pricing route has no actionable/verified current price; CSV import is demo-only; the sitemap lists `/404` and omits `/start`; and invoice terminology varies.

## How to verify

```sh
npm ci
npm run check
npm run test:e2e
```

For local demo verification:

```sh
npm run build
PORT=8080 STATIC_DIR=dist cargo run --manifest-path server/Cargo.toml --locked
```

Open `http://127.0.0.1:8080/demo`.
