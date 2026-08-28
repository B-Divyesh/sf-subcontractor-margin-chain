# Subcontractor Margin Chain

Subcontractor Margin Chain helps boutique agencies see the client promise, subcontractor cost, approval state, invoice state, and expected margin in one job chain.

M1 ships a public product page and a complete sample workflow. Open the [live demo](https://subcontractor-margin-chain.sociobot.in/demo) without an account. The demo contains three fictional Northline Studio jobs and keeps every edit in an isolated, expiring workspace.

## What M1 does

- Shows client commitment, committed subcontractor cost, expected margin, and the exact floor calculation.
- Warns when a new cost puts the expected margin below the floor and names that cost.
- Keeps a scope approval and linked client milestone beside the same job.
- Creates complete sample job chains and resets the sample to its original state.
- Shows the planned Studio price of $79 per agency each month for 25 active jobs and Portfolio price of $159 for 100.

Accounts, real agency storage, team roles, and hosted checkout are M2 work. M1 does not show dead sign-in or purchase controls.

## Stack

- React 19, React Router, strict TypeScript, and Vite
- Rust 2021, axum, and tokio
- An in-process `DemoStore` with random HttpOnly workspace cookies and a 24-hour maximum lifetime
- One multi-stage container that serves the JSON API and built web assets on `PORT`

The server starts with only `PORT` or with no environment variables. It sends security headers, accepts same-origin API calls, limits every API route except `/health`, and uses the first `X-Forwarded-For` address behind factory ingress.

## Run locally

Requirements: Node.js 22+, npm 10+, and a current stable Rust toolchain.

```sh
npm ci
npm run build
PORT=8080 STATIC_DIR=dist cargo run --manifest-path server/Cargo.toml --locked
```

Then open `http://127.0.0.1:8080/demo`. Vite-only development does not provide the demo API; use the Rust command for the complete product.

## Test and verify

```sh
npm test
npm run build
cargo test --manifest-path server/Cargo.toml --locked
cargo build --manifest-path server/Cargo.toml --release --locked
npm run test:e2e
npm run check
```

Playwright 1.58.2 runs every claim on desktop Chromium and a 390px Chromium profile. It also checks keyboard flows, route focus, deep links, 200% text zoom, console errors, internal links, and serious or critical axe findings.

Each public claim and its exact command is listed in [`.factory/claims.json`](.factory/claims.json). Demo fixtures, reset behavior, and the storage boundary are in [`.factory/demo.md`](.factory/demo.md).

## API

The M1 routes are under `/api/v1/demo/`. Create operations require an `Idempotency-Key`. Errors use `application/problem+json`. Demo responses use `Cache-Control: no-store`.

The server stores money as signed integer cents and calculates the floor with conservative upward rounding. It never uses a binary floating-point value as the authoritative money amount.

## Build and deploy

```sh
docker build --build-arg BUILD_SHA=local -t subcontractor-margin-chain .
docker run --rm -p 8080:8080 subcontractor-margin-chain
curl http://127.0.0.1:8080/health
```

The factory deploys the container and supplies only `PORT`. `/health` returns the build SHA supplied at image build time. Repository code does not change DNS, billing, or other infrastructure directly.

## Privacy and license

The public site has no analytics, remote fonts, third-party scripts, or advertising. The demo is for fictional data and can be destroyed with “Reset demo.” See `/privacy` and `/terms` in the product.

Licensed under MIT. The self-hosted Newsreader and Recursive fonts use the SIL Open Font License; their notice is in `public/fonts/OFL.txt`.
