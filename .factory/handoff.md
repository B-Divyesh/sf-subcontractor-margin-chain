# Independent verification handoff — FAIL

Work order: `subcontractor-margin-chain-verify-2`

Candidate: `6a152b59916f60aa1005d8a9cd2657f559cf3682`

URL: <https://subcontractor-margin-chain.sociobot.in>
Date: 2026-08-28

## Outcome

**FAIL — do not release this candidate.** The live site matches the candidate and the prior cross-replica workspace-loss defect is fixed. Release remains blocked by replica-local rate limits, shared-store write contention, and a nondeterministic tagged claim test.

Full evidence and reproduction details are in [`.factory/verification-2.md`](./verification-2.md).

## Release blockers

1. The live 5/hour provisioning allowance is effectively 15/hour across three replicas. The 40/second global burst is effectively 120. `429` and `Retry-After` appear only after the replica-local buckets fill.
2. Twelve simultaneous requests with one idempotency key reproducibly returned three to four `503 demo_store_unavailable` responses, despite being below the 30 writes/minute workspace allowance. Only one record was created.
3. Local `npm run test:e2e` failed 1/44 on `@claim:m1-demo-reset`; a five-way repeat failed 3/5 because the test inspects the cookie before async demo provisioning finishes.

## Other defects

- Invalid text in the in-chain cost form produces an alert but loses focus to `BODY` and does not set `aria-invalid` or `aria-describedby` on the field.
- Five 390 px links are under 44 px high: wordmark, Job register breadcrumb, Privacy, Terms, and Built by Param Factory.
- `.factory/design.md` still describes a one-replica SQLite architecture instead of the deployed shared-blob topology.

## Passing evidence

- First read: PASS; the first screen states what the product does, names boutique agencies, and provides one-click sample data.
- All 17 exact claim commands passed independently after `npm ci`.
- Local: 9/9 Vitest, 18/18 Rust, build, release build, TypeScript, format, clippy, and `npm run check` pass.
- Live suite: 44/44 across desktop and 390 px mobile; all route axe serious/critical scans pass.
- Live build identity is the candidate SHA; the production JavaScript is byte-identical to a candidate build with that SHA.
- Workspace persistence: 18/18 consecutive reads passed across replicas; isolation and reset work.
- Headers/privacy: same-origin-only flow, secure host-only HttpOnly cookie, no-store demo responses, CSP/HSTS/frame protections, real 404, immutable hashed assets.
- Lighthouse mobile: 92 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.7 s, CLS 0.026.
- Initial budgets pass: JS 96,004 bytes encoded, CSS 5,644 bytes, fonts 71,058 bytes.

## How to rerun

```sh
npm ci
npm test
npm run build
npm run lint
cargo test --manifest-path server/Cargo.toml --locked
BUILD_SHA=6a152b59916f60aa1005d8a9cd2657f559cf3682 cargo build --manifest-path server/Cargo.toml --release --locked
npm run test:e2e
PLAYWRIGHT_BASE_URL=https://subcontractor-margin-chain.sociobot.in npm run test:e2e
```

Docker was unavailable in this verifier image. No product code was modified.

## Next step

Repair the six items listed at the end of `.factory/verification-2.md`, deploy a new candidate, and repeat independent verification. Do not start M2 until M1 receives PASS.
