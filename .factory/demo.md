# Demo sandbox contract

## Entry points

- Canonical URL: `https://subcontractor-margin-chain.sociobot.in/demo`
- Alias: `https://subcontractor-margin-chain.sociobot.in/?demo=1`; replace this URL with `/demo` after activation so refresh and sharing are predictable.
- The landing page action is “Try it with sample data.” It enters the seeded register in one click and never opens sign-in.

Local verification uses `http://127.0.0.1:8080/demo` after building the web app and starting the Rust server with `STATIC_DIR=dist`. The same-origin API is required; Vite-only preview is not the full demo.

## Isolation

M1 creates an opaque, random demo workspace through `POST /api/v1/demo/workspaces`. Repeating that call with a valid cookie returns the current workspace without replacing it. Its identifier lives in an `HttpOnly`, `SameSite=Lax`, `Secure` cookie on HTTPS and expires after at most 24 hours. Production uses a private Azure Blob container through the Container App managed identity, so every replica reads the same durable workspace. Local containers use `/data/demo-workspaces`. No signed-in tenant repository exists in M1. Never copy a demo object into real data automatically.

`sessionStorage` may store presentation preferences under `smc:demo:v1:*`. It is not the record source. Production storage keys and API routes never load while the demo banner is present.

Every demo response, including errors, carries `Cache-Control: no-store`. Demo endpoints have stricter IP and workspace rate limits. Logs do not contain client names or money values.

## Seeded agency and jobs

The fictional demo agency is **Northline Studio**. Names and values are original fixtures, not customer data.

1. **Autumn launch films**
   - Contracting client: Cinder & Co.
   - End client: Aster Bikes
   - Client commitment: USD 24,000
   - Committed subcontractor costs: Samira Chen, edit, USD 6,200; Osei Reed, production, USD 8,300
   - Expected margin: USD 9,500 (39.6%); floor: 20% (USD 4,800)
   - Scope: launch film approved; social cut-down revision pending
   - Client milestones: USD 12,000 sent; USD 12,000 planned
2. **Annual report microsite**
   - Contracting client: Common Thread Partners
   - End client: Harbor Grid
   - Client commitment: USD 18,000
   - Committed cost: USD 13,800
   - Expected margin: USD 4,200 (23.3%); floor: 25% (USD 4,500)
   - Written risk: USD 300 below floor after accessibility review was added
   - Scope approved; first client invoice due
3. **Field interview edit**
   - Contracting client: Merritt Research
   - No separate end client
   - Client commitment: USD 9,600
   - Committed cost: USD 5,400
   - Expected margin: USD 4,200 (43.8%); floor: 30% (USD 2,880)
   - Scope approved; client invoice paid; one subcontractor invoice pending

All money fixtures are stored as integer cents with `USD`. M1 does not convert currencies.

## Reset and exit

The persistent banner reads “Demo — sample data, nothing is saved” and offers “Reset demo” and “Start for real.” Reset requires a compact confirmation because it discards edits, destroys the current workspace, creates a newly seeded workspace, and returns focus to the page heading. “Start for real” leaves demo storage behind and, in M1, explains that accounts arrive in M2. From M2 onward it starts Entra sign-in and organization onboarding; it never imports the sample.

## Verification

Every M1 claim starts in a new Playwright browser context and uses only `/demo` and these fixtures. Tests must prove reset invalidates the old workspace, demo requests stay under `/api/v1/demo/`, no CIAM or billing request occurs, and no signed-in tenant endpoint is requested.

Run all desktop and 390px claim flows with `npm run test:e2e`. Run one claim with the exact command recorded in `.factory/claims.json`.
