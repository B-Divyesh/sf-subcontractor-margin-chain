import { Link } from "react-router-dom";

function LedgerIllustration() {
  return (
    <svg className="ledger-illustration" viewBox="0 0 640 520" role="img" aria-label="A layered job record links a client commitment to subcontractor cost and expected margin.">
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
          <p className="eyebrow">Job margin tracking for agencies</p>
          <h1 tabIndex={-1}>Protect margin before work starts.</h1>
          <p className="lead">For boutique agencies that hire subcontractors, it links each client commitment to costs and client invoice milestones.</p>
          <div className="hero__actions">
            <Link className="primary-action" to="/?demo=1">Try it with sample data</Link>
            <a className="inline-link" href="#how">See how the chain works</a>
          </div>
          <p className="action-note">See a filled job chain. Add a cost, approve scope, or mark an invoice sent. Reset when finished.</p>
          <ul className="plain-facts" aria-label="Product facts">
            <li>No account for the demo.</li>
            <li>Demo changes are discarded.</li>
            <li>Start a saved agency workspace.</li>
          </ul>
        </div>
        <div className="hero__art" aria-hidden="false"><LedgerIllustration /></div>
      </section>

      <section className="preview-section section-shell" aria-labelledby="preview-title">
        <div className="section-heading">
          <p className="eyebrow">Job margin preview</p>
          <h2 id="preview-title">See commitment, cost, and invoice status together.</h2>
        </div>
        <article className="ledger-stack ledger-stack--preview">
          <header className="record-heading">
            <div>
              <p className="record-kicker">Cinder &amp; Co. → Aster Bikes</p>
              <h3>Autumn launch films</h3>
            </div>
            <span className="status-stamp status-stamp--warning">Pending scope may change margin</span>
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
          <h2 id="how-title">Track each job's margin in three steps.</h2>
        </div>
        <ol className="steps">
          <li><span>01</span><div><h3>Record the client commitment.</h3><p>Add the approved scope, client commitment, and margin floor.</p></div></li>
          <li><span>02</span><div><h3>Commit the cost.</h3><p>Link each subcontractor amount before the work starts.</p></div></li>
          <li><span>03</span><div><h3>Check the expected margin.</h3><p>See the change that puts margin at risk, then fix it before invoicing.</p></div></li>
        </ol>
      </section>

      <section className="limits-section section-shell" aria-labelledby="limits-title">
        <div>
          <p className="eyebrow">Demo and product limits</p>
          <h2 id="limits-title">What this tool does not do.</h2>
        </div>
        <ul className="ruled-list">
          <li>Your demo workspace is isolated and expires within 24 hours.</li>
          <li>The sample uses fictional names and values. Enter real data only in your agency workspace.</li>
          <li>We do not calculate payroll tax or decide worker status.</li>
        </ul>
      </section>

      <section className="pricing-section section-shell" id="pricing" aria-labelledby="pricing-title">
        <div className="section-heading">
          <p className="eyebrow">Agency workspace</p>
          <h2 id="pricing-title">Save real job chains for your agency.</h2>
          <p>Create a workspace, then add real job chains separately from the sample.</p>
        </div>
        <div className="price-ledger">
          <article>
            <h3>Start now</h3>
            <p className="price"><strong>Saved</strong> agency records</p>
            <p><Link className="inline-link" to="/start">Create your agency workspace</Link></p>
          </article>
          <article>
            <h3>Keep the sample separate</h3>
            <p>Use the demo to test the workflow.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
