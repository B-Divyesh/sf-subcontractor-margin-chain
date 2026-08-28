# Subcontractor Margin Chain

Subcontractor Margin Chain is planned for boutique agencies that sell client work and deliver it through freelancers or subcontractors. Its job chain will connect the client commitment, approved scope, committed cost, invoice state, and expected margin.

This repository is currently a **planning and tooling scaffold**. It does not yet implement the product or the `/demo` claim flows. M1 is the next work order.

## Product contract

- [Venture plan](.factory/plan.md): PRD, evidence, architecture, milestones, tests, definitions of done, and risks
- [Design system](.factory/design.md): layered carbon-copy ledger thesis and implementation rules
- [M1 claims](.factory/claims.json): claims the first builder must make executable
- [Demo contract](.factory/demo.md): sample data, isolation, reset, and verifier entry
- [Component inventory](.factory/component-inventory.md): 19 planned components and required states

The researched opportunity is in [`.factory/brief.json`](.factory/brief.json).

## Stack

- React 19, Vite, and strict TypeScript for the web interface
- Rust, axum, and tokio for the API shell
- SQLite with sqlx beginning in M2
- Sociobot Entra CIAM for M2 accounts
- Sociobot billing only for recurring Dodo subscriptions

No runtime fonts, scripts, analytics, auth, billing, or model endpoints load from a third-party CDN. AI is not planned because exact commercial rules are more useful here.

## Develop

Requirements: Node.js 22+, npm 10+, and a current stable Rust toolchain.

```sh
npm ci
npm run dev
```

The current frontend scaffold runs at the Vite URL. It displays the planned M1 route inventory and no customer workflow.

## Test and build

```sh
npm test
npm run build             # writes dist/
cargo test --manifest-path server/Cargo.toml --locked
npm run check             # frontend tests/build plus backend tests
```

Playwright is pinned to 1.58.2 for M1 claim tests. `npm run test:e2e` becomes a required gate when M1 adds the browser specifications.

## Run the container shell

```sh
docker build --build-arg BUILD_SHA=local -t subcontractor-margin-chain .
docker run --rm -p 8080:8080 subcontractor-margin-chain
curl http://127.0.0.1:8080/health
```

The backend starts with no environment variables and uses `PORT=8080` by default. The factory will deploy the single container to `https://subcontractor-margin-chain.sociobot.in`; this planning work order does not change infrastructure, DNS, auth registration, or billing.

## License

MIT. See [LICENSE](LICENSE).
