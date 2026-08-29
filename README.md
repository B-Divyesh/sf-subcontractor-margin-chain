# Subcontractor Margin Chain

Subcontractor Margin Chain shows boutique agencies each client commitment, subcontractor cost, approval, invoice milestone, and expected margin in one job chain.

Open the [live demo](https://subcontractor-margin-chain.sociobot.in/?demo=1) without an account. Its isolated workspace expires within 24 hours.

## Current demo

- Shows the client commitment, committed cost, expected margin, and exact floor calculation.
- Names the cost that puts expected margin below the floor.
- Keeps scope approval and client invoice milestones beside the same job.
- Creates a job chain, adds a cost, approves scope, updates an invoice state, and resets the sample.
- Maps CSV columns and previews every row before importing valid job chains.
- Exports all current demo job chains as local CSV or JSON downloads.

The demo starts with three original fictional Northline Studio jobs. Their provenance is recorded in [`.factory/demo-fixtures.json`](.factory/demo-fixtures.json).

Planned Studio pricing is $79 per agency each month for 25 active job chains. Portfolio is planned at $159 for 100 active job chains.

## Not available yet

Accounts, permanent agency records, team roles, and hosted checkout are planned for the next milestone. Sign-in and purchase controls stay hidden until they work.

## Stack

- React 19, React Router, strict TypeScript, and Vite
- Rust 2021, axum, and tokio
- Shared demo records and request limits across application replicas
- Locked filesystem storage for local containers

The server starts with only `PORT`, which defaults to 8080. Readiness and Prometheus metrics are available at `/ready` and `/internal/metrics`.

## Run locally

Requirements: Node.js 22+, npm 10+, and a current stable Rust toolchain.

```sh
npm ci
npm run build
PORT=8080 STATIC_DIR=dist cargo run --manifest-path server/Cargo.toml --locked
```

Open `http://127.0.0.1:8080/?demo=1` for the supported sample path.

## Test and verify

```sh
npm test
npm run build
npm run lint
cargo test --manifest-path server/Cargo.toml --locked
cargo build --manifest-path server/Cargo.toml --release --locked
npm run test:e2e
npm run check
```

Playwright 1.58.2 runs browser claims on desktop Chromium and a 390px Chromium profile.

It checks keyboard use, route focus, deep links, 200% text zoom, dialog console errors, and internal links. It also checks serious and critical axe findings.

Every public claim and exact command is listed in [`.factory/claims.json`](.factory/claims.json). The Vitest registry test rejects missing or duplicate claim IDs.

## Demo API

Demo routes live under `/api/v1/demo/`. Create operations require an `Idempotency-Key`. A retry returns its saved result without adding another record.

Per-client limits are shared across replicas. Every rejected limit response includes `Retry-After`.

Rejected requests use `application/problem+json` with a stable code, message, request ID, and field when relevant. Every demo API response uses `Cache-Control: no-store`.

The server stores money as signed integer cents. It rounds each percentage floor upward to the next cent when needed.

## Build and deploy

```sh
docker build --build-arg BUILD_SHA=local -t subcontractor-margin-chain .
docker run --rm -p 8080:8080 subcontractor-margin-chain
curl http://127.0.0.1:8080/health
```

`/health` returns the build SHA supplied during the image build. Deploy this container through the factory; do not change infrastructure from this repository.

## Privacy and license

The public and demo flow makes no cross-origin requests. It has no analytics, remote fonts, third-party scripts, or advertising.

CSV files stay in the browser until valid rows are sent to the isolated demo API. CSV and JSON exports are generated in the browser.

Choose “Reset demo” to destroy the current workspace. See [Privacy](https://subcontractor-margin-chain.sociobot.in/privacy) and [Terms](https://subcontractor-margin-chain.sociobot.in/terms).

Licensed under MIT. Newsreader and Recursive use the SIL Open Font License in `public/fonts/OFL.txt`.
