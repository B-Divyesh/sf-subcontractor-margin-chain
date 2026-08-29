# M1 component inventory

These 21 components define the first implementation. Primitive controls are product-shaped and accessible; composites preserve the commercial-chain semantics. Each component needs Storybook-free fixture coverage in Vitest or a route-level Playwright test. Do not build variants that no milestone uses.

| Component | Responsibility | Required states |
| --- | --- | --- |
| `AppFrame` | Skip link, site/app header, main landmark, footer, route announcer | public, demo, signed-in, narrow |
| `SiteHeader` | Wordmark, up to four links, current route, sign-in/start action | default, menu open, keyboard focus |
| `DemoBanner` | Persistent sandbox notice with reset and real-start actions | ready, resetting, reset failed |
| `LedgerStack` | Layered sheet container with semantic heading association | default, lifted, at risk, reduced motion |
| `JobRegister` | Sortable list/table of job chains and summary row | sample, empty, loading, error, mobile labels |
| `JobChainRow` | One job's clients, decisive amounts, risk, and next action | safe, near floor, below floor, closed |
| `ChainSpine` | Ordered relationship between commitment, scope, costs, and invoices | complete, pending link, broken link |
| `MoneyFigure` | Locale-aware currency amount with tabular figures | positive, zero, negative, hidden by role |
| `MarginSlip` | Revenue − committed cost = expected margin; compares floor | safe, near floor, below floor, incomplete |
| `RiskFlag` | Written warning plus cause and recovery action | warning, danger, resolved, acknowledged |
| `StatusStamp` | Text status for approval and invoices | draft, pending, approved, sent, paid, overdue |
| `ScopeRegister` | Versioned scope items and client-approved amount | empty, draft, approved, superseded, error |
| `CostCommitmentRow` | Subcontractor, scope, amount, approval and invoice state | draft, committed, changed, invoiced, hidden rate |
| `InvoiceMilestoneRow` | Outbound milestone amount, due date, status, linked scope | planned, due, sent, partly paid, paid, overdue |
| `MoneyField` | Labeled currency entry converted to integer minor units | pristine, editing, invalid, saving, saved, disabled |
| `SheetDialog` | Focus-managed review/confirmation surface | review, destructive, busy, server error |
| `ActionReceipt` | Immediate summary after a chain-changing action | saving, saved, failed, undo available |
| `FeedbackPanel` | Empty, loading, offline, permission, and route errors | named variants with one next action |
| `PrimaryAction` | Button/link family with verb-first labels | default, hover, pressed, focus, busy, disabled |
| `CsvColumnMap` | Maps uploaded spreadsheet headings to job fields | automatic match, missing required, duplicate, mobile stack |
| `ImportDryRun` | Shows each CSV row before any demo write | valid, row errors, importing, API failure |

## Composition boundaries

- `MoneyFigure`, `StatusStamp`, `RiskFlag`, `PrimaryAction`, and `MoneyField` are primitives.
- `JobChainRow`, `CostCommitmentRow`, and `InvoiceMilestoneRow` are record rows, not generic cards.
- `JobRegister`, `ScopeRegister`, `MarginSlip`, and `ChainSpine` own domain display rules and may consume policy-shaped view models only.
- Routes own data loading, mutations, page titles, the single `<h1>`, and error boundaries.
- Server response types are generated or mapped at `src/api/`; components never fetch directly.
