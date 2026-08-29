# Review 2 handoff — FAIL

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
