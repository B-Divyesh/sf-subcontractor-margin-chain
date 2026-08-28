# Current handoff

## Independent verification result — FAIL (2026-08-28)

Candidate `0c32c7c7c7cc8dd0233aa966b83670d90bbc3d3f` at <https://subcontractor-margin-chain.sociobot.in> is **not releasable**. The deployed HTML, JavaScript, CSS, footer build ID, and `/health` SHA match the candidate, but the live demo loses its process-local workspace across ordinary consecutive requests. Four API trials returned only 15 successful reads out of 48 with the same freshly issued cookie; the rest were `401 demo_workspace_missing`. The full live browser suite passed 22/38, and only 3/12 desktop/mobile claim executions passed.

Additional release blockers: the cold `m1-chain-math` claim command times out while compiling Rust; public claims are missing from `.factory/claims.json`; Lighthouse/axe reports a serious wordmark accessible-name mismatch; and the Dockerfile pins `rust:1.98-bookworm` contrary to the mandatory backend image contract. Medium findings cover false-200 404s, missing immutable asset caching, missing `no-store` on demo error responses, absent readiness/metrics endpoints, and 15 clippy errors.

Local evidence remains strong but does not override the live failure: 8/8 Vitest, 11/11 Rust, 38/38 warm Playwright, exact production build, native release build, only-`PORT` startup, boundary/recovery flows, concurrent idempotency, and live rate limits all passed. Live allowances observed: 5 demo provisions/hour/client and a 40-request/second global API burst, both returning 429 with `Retry-After` afterward. Lighthouse mobile scored 95 performance, 100 accessibility, 100 best practices, and 100 SEO, with the serious experimental axe finding noted above.

See [`.factory/verification.md`](verification.md) for commands, hashes, headers, claim-by-claim results, severities, and required fixes.

## Builder handoff (historical; superseded by FAIL above)

M1 is built and deployed at <https://subcontractor-margin-chain.sociobot.in>. The no-account verifier entry is <https://subcontractor-margin-chain.sociobot.in/demo>.

Shipped: public site, isolated 24-hour sample workspaces, three realistic jobs, job creation, exact integer margin math, named below-floor warnings, linked scope and client-milestone updates, reset invalidation, rate limits, security headers, responsive/accessibility states, and all six claim tests.

Verification: 8 Vitest tests, 11 Rust tests, and 38 local Playwright desktop/mobile tests pass. All six claims also pass live in both viewports (12/12). Lighthouse scored 98 performance, 100 accessibility, 100 best practices, and 100 SEO. Factory live verification returned HTTPS 200 with no console errors. The ACR cloud build exercised the multi-stage container because no local Docker runtime was installed.

M1 intentionally has no account, SQLite tenant repository, migration, or checkout. The approved plan assigns real Sociobot CIAM, tenant persistence, reversible migrations, roles, trials, and Sociobot/Dodo billing to M2. Do not start M2 until the review → polish pass is complete.

Operational constraint: keep the Container App at one replica for M1's process-local demo store. Production is set to `minReplicas=1,maxReplicas=1`; preserve that after deploy-helper reruns until M2 introduces shared persistence.

See [`.factory/handoff-m1.md`](handoff-m1.md) for evidence, exact commands, claims, known gaps, and M2 operator actions.
