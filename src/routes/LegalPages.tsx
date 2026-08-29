import { Link } from "react-router-dom";

export function PrivacyPage() {
  return (
    <main id="main" className="legal-page section-shell">
      <p className="eyebrow">Last updated 28 August 2026</p>
      <h1 tabIndex={-1}>Privacy in plain words</h1>
      <p className="lead">The public site does not track you. The demo and agency workspace use separate records.</p>
      <section>
        <h2>What the demo stores</h2>
        <p>The server creates a random demo workspace when you open the sample. It stores sample edits in shared storage for up to 24 hours.</p>
        <p>An HttpOnly cookie identifies that workspace. The cookie cannot identify you outside this product.</p>
      </section>
      <section>
        <h2>What an agency workspace stores</h2>
        <p>Your saved job chains stay in the agency workspace. The owner session can add finance, producer, or viewer access.</p>
        <p>Producer and viewer sessions do not receive client identities, subcontractor details, costs, or derived margin totals.</p>
        <p>Do not enter real client or subcontractor details in the demo.</p>
      </section>
      <section>
        <h2>What we do not collect</h2>
        <p>This release has no analytics, advertising pixels, or payment form.</p>
        <p>CSV files are read in your browser. Valid rows go only to the workspace where you choose to import them.</p>
      </section>
      <section>
        <h2>How to remove demo data</h2>
        <p>Choose “Reset demo” to destroy the current workspace. The 24-hour expiry also removes it.</p>
      </section>
      <section>
        <h2>Questions</h2>
        <p>Email <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a> with a privacy question.</p>
      </section>
      <Link className="primary-action" to="/demo">Try the sample demo</Link>
    </main>
  );
}

export function TermsPage() {
  return (
    <main id="main" className="legal-page section-shell">
      <p className="eyebrow">Last updated 28 August 2026</p>
      <h1 tabIndex={-1}>Terms for Margin Chain</h1>
      <p className="lead">Use the demo for fictional records and the agency workspace for real job chains.</p>
      <section>
        <h2>The demo is not an accounting service</h2>
        <p>The demo records commitments and client invoice milestones. It does not send invoices, collect money, calculate tax, or decide worker status.</p>
      </section>
      <section>
        <h2>Your sample edits are temporary</h2>
        <p>Demo workspaces expire within 24 hours. Reset removes them sooner. Do not rely on the demo as permanent storage.</p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <p>Do not attack the service, evade limits, or enter confidential data in the demo. Access may be limited to protect other visitors.</p>
      </section>
      <p>Questions about these terms can go to <a href="mailto:support@sociobot.in">support@sociobot.in</a>.</p>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <main id="main" className="not-found section-shell">
      <div className="torn-sheet" aria-hidden="true"><span>404</span></div>
      <div>
        <p className="eyebrow">This sheet is missing</p>
        <h1 tabIndex={-1}>Page not found</h1>
        <p>The address does not match a job chain or public page.</p>
        <div className="button-row">
          <Link className="primary-action" to="/">Return home</Link>
          <Link className="secondary-action" to="/demo">Open the sample demo</Link>
        </div>
      </div>
    </main>
  );
}
