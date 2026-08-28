import { Link } from "react-router-dom";

function LedgerIllustration() {
  return (
    <svg className="ledger-illustration" viewBox="0 0 640 520" role="img" aria-label="A layered job record links a client promise to subcontractor cost and expected margin.">
      <path className="ledger-illustration__risk" d="M126 111h390v310H126z" />
      <path className="ledger-illustration__carbon" d="M105 88h390v310H105z" />
      <path className="ledger-illustration__paper" d="M84 65h390v310H84z" />
      <path className="ledger-illustration__rule" d="M124 132h302M124 190h302M124 248h302M124 306h302" />
      <path className="ledger-illustration__chain" d="M145 160v119m0-80h32m-32 58h32" />
      <circle className="ledger-illustration__node" cx="145" cy="160" r="7" />
      <circle className="ledger-illustration__node" cx="145" cy="199" r="7" />
      <circle className="ledger-illustration__node" cx="145" cy="257" r="7" />
      <path className="ledger-illustration__amount" d="M204 148h180v22H204zm0 55h138v22H204zm0 58h158v22H204z" />
      <g className="ledger-illustration__stamp" transform="rotate(-8 389 328)">
        <rect x="310" y="303" width="158" height="48" rx="3" />
        <path d="M326 326h125" />
      </g>
      <path className="ledger-illustration__registration" d="M63 47v36M45 65h36m414 331v36m-18-18h36" />
    </svg>
  );
}

export function LandingPage() {
  return (
    <main id="main">
      <section className="hero section-shell">
        <div className="hero__copy">
          <p className="eyebrow">Commercial control for subcontracted work</p>
          <h1 tabIndex={-1}>Protect margin before work starts.</h1>
          <p className="lead">For boutique agencies that hire subcontractors, it links every client promise to cost and cash.</p>
          <div className="hero__actions">
            <Link className="primary-action" to="/demo">Try it with sample data</Link>
            <a className="inline-link" href="#how">See how the chain works</a>
          </div>
          <p className="action-note">See a filled job chain. Change anything. Reset when finished.</p>
          <ul className="plain-facts" aria-label="Product facts">
            <li>No account for the demo.</li>
            <li>Demo changes are discarded.</li>
            <li>Studio is $79 a month.</li>
          </ul>
        </div>
        <div className="hero__art" aria-hidden="false"><LedgerIllustration /></div>
      </section>

      <section className="preview-section section-shell" aria-labelledby="preview-title">
        <div className="section-heading">
          <p className="eyebrow">One linked record</p>
          <h2 id="preview-title">See promise, cost, and cash together.</h2>
        </div>
        <article className="ledger-stack ledger-stack--preview">
          <header className="record-heading">
            <div>
              <p className="record-kicker">Cinder &amp; Co. → Aster Bikes</p>
              <h3>Autumn launch films</h3>
            </div>
            <span className="status-stamp status-stamp--warning">Check pending work</span>
          </header>
          <div className="preview-chain">
            <div><span>Client commitment</span><strong>$24,000</strong></div>
            <span aria-hidden="true">−</span>
            <div><span>Committed cost</span><strong>$14,500</strong></div>
            <span aria-hidden="true">=</span>
            <div><span>Expected margin</span><strong>$9,500</strong><small>39.6%</small></div>
          </div>
          <p className="risk-note">A pending social cut-down remains visible before you approve more work.</p>
          <Link className="inline-link" to="/demo/chains/autumn-launch-films">Open this sample job</Link>
        </article>
      </section>

      <section className="how-section section-shell" id="how" aria-labelledby="how-title">
        <div className="section-heading">
          <p className="eyebrow">From promise to invoice</p>
          <h2 id="how-title">Check the chain in three steps.</h2>
        </div>
        <ol className="steps">
          <li><span>01</span><div><h3>Record the promise.</h3><p>Add the client commitment, approved scope, and margin floor.</p></div></li>
          <li><span>02</span><div><h3>Commit the cost.</h3><p>Link each subcontractor amount before the work starts.</p></div></li>
          <li><span>03</span><div><h3>Watch the chain.</h3><p>See the change that puts margin at risk, then fix it before invoicing.</p></div></li>
        </ol>
      </section>

      <section className="limits-section section-shell" aria-labelledby="limits-title">
        <div>
          <p className="eyebrow">Clear limits</p>
          <h2 id="limits-title">A commercial record, not another project manager.</h2>
        </div>
        <ul className="ruled-list">
          <li>Your demo workspace is isolated and expires within 24 hours.</li>
          <li>Subcontractor rates stay behind role-based access after sign-in.</li>
          <li>We do not calculate payroll tax or decide worker status.</li>
        </ul>
      </section>

      <section className="pricing-section section-shell" id="pricing" aria-labelledby="pricing-title">
        <div className="section-heading">
          <p className="eyebrow">Planned agency plans</p>
          <h2 id="pricing-title">Price by active work, not seats.</h2>
          <p>Accounts and checkout arrive in the next milestone.</p>
        </div>
        <div className="price-ledger">
          <article>
            <h3>Studio</h3>
            <p className="price"><strong>$79</strong> per agency each month</p>
            <p>Keep up to 25 job chains active.</p>
            <p>Unlimited internal members and archived jobs are included.</p>
          </article>
          <article>
            <h3>Portfolio</h3>
            <p className="price"><strong>$159</strong> per agency each month</p>
            <p>Keep up to 100 job chains active.</p>
            <p>Includes integration webhooks and priority exports.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
