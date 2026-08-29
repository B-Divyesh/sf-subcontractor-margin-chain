# Design system: layered carbon-copy ledger

Status: **implemented in M1**
Last updated: 2026-08-28

## Visual thesis

Subcontractor Margin Chain should feel like the one commercial record an agency would put on the desk before work begins. Its visual world is a layered carbon-copy ledger: warm paper, cyan and red duplicate sheets, ruled columns, registration marks, and compact status stamps. A job is not another dashboard card. It is a stack of linked commitments traced from client commitment to subcontractor cost to client invoice milestone.

This direction fits the product because carbon copies make hidden downstream consequences visible. The offset blue layer stands for subcontractor commitments; the red layer appears only when margin needs attention. The metaphor is structural, not nostalgic decoration: layer order, edges, connectors, and stamps explain the chain.

Avoid generic dashboard grids, gradient blobs, glass panels, rounded pill clouds, stock office imagery, and decorative finance charts. Use whitespace before boxes. A ledger sheet is reserved for a coherent commercial record; it is not a general-purpose card.

## Stack decision

- **Frontend:** React 19, Vite, strict TypeScript, React Router, and native HTML controls. The chain workspace has interdependent money fields, revisions, dialogs, CSV mapping, and dense editable rows. Native modal dialogs provide focus trapping without injected styles, keeping the strict CSP intact. Styling remains hand-written CSS driven by tokens; no Tailwind or themed component kit.
- **Backend:** Rust 2021, axum, and tokio. M1 stores anonymous demo workspaces and rate-limit buckets in a private shared Azure Blob container, using ETags, bounded contention backoff, and idempotent no-op reads across replicas. A local container uses locked JSON files under `/data/demo-workspaces`. M2 still plans sqlx/SQLite for authenticated tenant data; that choice must be revisited before horizontal tenant writes ship.
- **Delivery:** one multi-stage container with three supported application replicas. Axum serves `/api/*`, `/health`, and the built Vite assets from `dist/`. Shared M1 persistence and quotas keep routing behavior consistent across those replicas.
- **Fonts and scripts:** self-hosted only. M1 will check in subset WOFF2 files and OFL license texts. No runtime CDN.

## Palette

The interface is intentionally **single-mode daylight paper**. A dark theme would turn the carbon-paper metaphor into a generic dark dashboard and would make print review less predictable. The canvas is always painted; browser color-scheme is `light`. Windows forced-colors and high-contrast preferences remain supported.

| Token | Value | Use |
| --- | --- | --- |
| `--color-canvas` | `#EEE7D8` | Warm desk/canvas |
| `--color-paper` | `#FFFDF7` | Primary sheet and fields |
| `--color-paper-blue` | `#D8EDF0` | Subcontractor duplicate layer |
| `--color-paper-red` | `#F0DCD5` | At-risk duplicate layer |
| `--color-ink` | `#1D2925` | Primary text and strong rules |
| `--color-ink-muted` | `#58625B` | Secondary copy on paper only |
| `--color-carbon` | `#0B5F69` | Links, primary controls, current chain |
| `--color-carbon-hover` | `#084C54` | Pressed and hover state |
| `--color-carbon-contrast` | `#FFFDF7` | Text on carbon controls |
| `--color-rule` | `#837B6E` | Form rules and boundaries |
| `--color-success` | `#32613E` | Paid, approved, margin safe |
| `--color-warning` | `#765000` | Pending or near the floor |
| `--color-danger` | `#9D3528` | Margin below floor and overdue |
| `--color-focus` | `#007F8D` | Three-pixel keyboard focus ring |

Body and state text pairs target WCAG AA (4.5:1). UI outlines and large figures target 3:1. M1 must verify the exact computed pairs in automated axe checks; color is always paired with a word, icon, or pattern.

## Typography

- **Display:** Newsreader, variable subset, OFL. Use for the single page headline, section headings, and the job name. Its editorial forms give the record authority without looking like accounting software.
- **Body and figures:** Recursive, variable subset, OFL. Use its Sans axis for controls and copy and its Mono axis for money, IDs, dates, and tables. Set `font-variant-numeric: tabular-nums lining-nums` on all amounts.
- Newsreader 600 and Recursive 400/700 Latin WOFF2 files are bundled locally with their OFL license and `font-display: swap`; no third-party font request is made.
- Body is at least 16px with 1.55 line height. The display title is `clamp(2.25rem, 1.7rem + 2.5vw, 4.5rem)`. Supporting text stays within 68 characters per line.

## Spacing, shape, and depth

- Spacing uses a 4/8px rhythm: 4, 8, 12, 16, 24, 32, 48, 64, and 96px.
- Controls are at least 44px tall. Adjacent touch targets have at least 8px separation.
- Controls use a 4px radius. Sheets use 6px. Stamps may be circular. Do not use pill containers except a compact status with a written label.
- The signature sheet stack uses crisp offset layers: cyan at `(6px, 7px)` and red at `(12px, 14px)`. Use borders and offsets rather than soft drop shadows.
- Ledger rules are one pixel; totals use two pixels. Registration crosses and perforation marks are sparse and decorative with `aria-hidden="true"`.
- The desktop content width is 1200px. The main reading column is 68ch; form width is 672px.

## Interaction grammar and motion

The physical rule is **lift, reveal, settle**. Opening a job lifts its top sheet by 8px and reveals the linked layer beneath. Adding a cost inserts a blue duplicate row from its source position. Crossing the margin floor exposes the red layer once and moves focus to the written warning.

- Pressed controls move by at most 1px; sheet transitions use 180–240ms and the `cubic-bezier(0.2, 0.8, 0.2, 1)` settle curve.
- Animate only opacity and transforms. No looping motion, count-up money, confetti, or parallax in the work surface.
- With `prefers-reduced-motion: reduce`, durations become zero. The changed layer remains visible and the live-region message carries the same meaning.
- Async saves change `Saving…` to `Saved` near the edited field. Never move the primary action while saving.

## Original visual assets and provenance

M1 includes one hand-authored SVG ledger stack for the landing preview and social card. It is drawn from product UI primitives: abstract ruled sheets, amount blocks, connector marks, and a margin stamp. It contains no raster stock, logos, people, copied icon set, or machine-generated text. The same composition produces a 1200×630 Open Graph image and the designed 404 torn-sheet motif.

Provenance record: concept and geometry specified by Param Factory for this product on 2026-08-28; implementation is original repository-authored SVG/CSS. No generated imagery was required. If a later milestone introduces generated imagery, record the model, prompt, date, edits, and license here before shipping. Footer copy should say “Illustration made for Subcontractor Margin Chain” only if imagery beyond interface geometry is added.

M1 implementation record, 2026-08-28: the ledger stack is hand-authored in `src/routes/LandingPage.tsx`; `public/og-card.svg`, `public/favicon.svg`, and `public/apple-touch-icon.svg` derive from the same geometry. No model, stock image, copied icon, logo, or external asset was used. Newsreader 600 and Recursive 400/700 Latin WOFF2 files are bundled by Vite from Fontsource 5.2.6. Both font projects use the SIL Open Font License 1.1; the repository notice is `public/fonts/OFL.txt`.

## Five key screens, sketched in words

### 1. Landing and live preview (`/`)

A left-aligned headline reads “Protect margin before work starts.” The next sentence names boutique agencies and subcontracted jobs. Beside it, not behind it, an angled three-sheet job record shows client commitment, committed cost, and expected margin. “Try it with sample data” is the primary action; “See how the chain works” is the adjacent text link. Three facts read: “No account for the demo”, “Demo changes are discarded”, and “Studio starts at $79 a month.” Below, the actual demo register preview precedes the three-step explanation, limits/privacy, and price.

### 2. Job register (`/demo`, later `/app/chains`)

This is a vertical ledger, not a card grid. A top summary strip shows active jobs, total contracted revenue, committed cost, and the number needing attention. Each job is one ruled row: job and two client names on the left; revenue, cost, margin, floor, next invoice, and written status across the row. The risk sort is first. On phones, each row becomes a stacked definition list with margin and next action first. The primary action is “Add a job chain.”

### 3. New job chain (`/demo/chains/new`)

A four-part sheet asks for the contracting client and optional end client, approved scope, client commitment, then margin floor and first subcontractor commitment. A sticky but non-obscuring “Chain check” receipt recalculates expected margin after each valid entry. Sections remain on one route and preserve typed data. Errors sit under labels, the first invalid field receives focus, and the final action says “Create job chain.”

### 4. Job chain workspace (`/demo/chains/:id`, later `/app/chains/:id`)

The header states job name, contracting client → end client, owner, and current risk in words. Beneath it, a vertical chain spine connects four registers: Client commitment, Approved scope, Subcontractor commitments, and Invoice milestones. A right-side margin slip stays visible on wide screens and becomes the first disclosure after the header on phones. It shows the exact formula and which change caused risk. History appears as dated carbon duplicates, never hidden overwrites.

### 5. Team, plan, and controls (`/settings/team`, `/settings/billing`, `/settings/data`)

Settings use plain ruled lists. Each person row states role and financial visibility in words. Billing shows the active-chain count against the named plan before the hosted checkout link. Data controls explain export and deletion consequences. Destructive actions open a focused confirmation sheet naming the organization and recovery window.

## Responsive rules

- **390–599px:** one column; 16px page gutters; no fixed side rail; summary figures become a two-column definition list; register rows become labeled stacks; margin slip appears before editable registers; the demo banner wraps without covering content; bottom padding includes the safe area.
- **600–899px:** forms remain one column; job register keeps names and the three decisive numbers, with secondary fields in a disclosure.
- **900px and above:** job workspace uses a fluid main column plus a 288px margin slip. The ledger register may use columns, but all headers remain associated with cells.
- Nothing essential depends on hover. Do not hide fields solely to fit; change the representation. Avoid horizontal page scrolling at 320px and at 200% text zoom.

## Accessibility rules

- Each route owns a plain-language title, one `<h1>`, and a valid heading outline inside `header`, `nav`, `main`, and `footer` landmarks.
- A visible skip link targets `#main`. Route changes focus the new `<h1>` and announce its title through a polite live region. Back/forward restores route, focus, and scroll.
- Native tables are used only when row/column comparison is the task. Mobile alternatives preserve names through `<dl>` or explicitly labeled cells.
- Inputs have visible labels, currency suffix/prefix semantics, instructions, and inline errors linked with `aria-describedby`. Money is stored as integer minor units and read with currency names.
- Status never relies on hue or stamp shape. Every state includes text such as “Below floor by $1,250.”
- Dialogs use tested focus trapping, return focus to their trigger, close with Escape when safe, and never dismiss destructive confirmation from a stray backdrop click.
- Keyboard focus uses a 3px cyan ring with 3px offset. Touch targets are at least 44×44px.
- Respect reduced motion, forced colors, zoom to 200%, and browser text resizing. Serious or critical axe findings block a milestone.

## State language

- **Empty:** show the record that will appear and a specific action: “No job chains yet. Add the client commitment before you book subcontractors.” Demo never starts empty; it starts with the sample.

## Polish 1 additions

The CSV import screen uses the same ruled paper, carbon accents, tight radii, and written states as the job ledger. Column mapping, dry-run results, and row errors remain one vertical record on phones. CSV and JSON export controls sit beside the register heading instead of introducing dashboard cards. Native dialogs replace the prior injected-style primitive while preserving the sheet form, focus trap, Escape behavior, and reduced-motion policy.
- **Loading:** preserve the ledger geometry with quiet ruled placeholders and the visible text “Loading job chains…”. Do not animate under reduced motion.
- **Error:** keep entered data in place. Say what failed and offer one next action: “We could not save this cost. Check your connection and try again.”
- **Offline:** the demo explains that unsent edits remain in the demo namespace; signed-in work is read-only until the API returns unless an offline mutation queue has been proven.
- **Permission denied:** name the hidden category without leaking values: “Your role cannot view subcontractor rates. Ask an owner or finance member.”
- **At risk:** state the amount and cause, not only “warning”: “Expected margin is $1,250 below this job’s floor after the design revision.”

## Polish 2 additions

`/start`, `/app/chains`, and `/settings/team` reuse the ledger surface rather than introducing account-dashboard chrome. The real workspace begins as a clean unstacked sheet, while the demo retains its cyan/red sample stack and explicit banner. The team screen uses written role consequences beside the access-link action. On small screens these routes keep the same 16px gutters, single-column form treatment, and wrapping access-link text; no real-record control is hidden behind the demo banner.
