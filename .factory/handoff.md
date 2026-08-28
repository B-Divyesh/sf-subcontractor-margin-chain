# Current handoff

M1 is built and deployed at <https://subcontractor-margin-chain.sociobot.in>. The no-account verifier entry is <https://subcontractor-margin-chain.sociobot.in/demo>.

Shipped: public site, isolated 24-hour sample workspaces, three realistic jobs, job creation, exact integer margin math, named below-floor warnings, linked scope and client-milestone updates, reset invalidation, rate limits, security headers, responsive/accessibility states, and all six claim tests.

Verification: 8 Vitest tests, 11 Rust tests, and 38 local Playwright desktop/mobile tests pass. All six claims also pass live in both viewports (12/12). Lighthouse scored 98 performance, 100 accessibility, 100 best practices, and 100 SEO. Factory live verification returned HTTPS 200 with no console errors. The ACR cloud build exercised the multi-stage container because no local Docker runtime was installed.

M1 intentionally has no account, SQLite tenant repository, migration, or checkout. The approved plan assigns real Sociobot CIAM, tenant persistence, reversible migrations, roles, trials, and Sociobot/Dodo billing to M2. Do not start M2 until the review → polish pass is complete.

Operational constraint: keep the Container App at one replica for M1's process-local demo store. Production is set to `minReplicas=1,maxReplicas=1`; preserve that after deploy-helper reruns until M2 introduces shared persistence.

See [`.factory/handoff-m1.md`](handoff-m1.md) for evidence, exact commands, claims, known gaps, and M2 operator actions.
