import { type FormEvent, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  addCost,
  approveScope,
  getChain,
  updateMilestone,
  type JobChain,
} from "../api/client";
import { FeedbackPanel, MarginSlip, StatusStamp } from "../components/ChainComponents";
import { useDemoRevision } from "../components/AppFrame";
import { dollarsToMinor, formatMoney } from "../features/chains/model";

export function ChainPage() {
  const { chainId = "" } = useParams();
  const revision = useDemoRevision();
  const [chain, setChain] = useState<JobChain | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState("");
  const [receipt, setReceipt] = useState("");
  const [retry, setRetry] = useState(0);
  const receiptRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let active = true;
    setChain(null);
    setError("");
    getChain(chainId)
      .then((result) => active && setChain(result))
      .catch((problem: unknown) => active && setError(problem instanceof Error ? problem.message : "This job did not load. Try again."));
    return () => { active = false; };
  }, [chainId, retry, revision]);

  useEffect(() => {
    if (chain) window.setTimeout(() => document.querySelector<HTMLElement>("main h1")?.focus());
  }, [chain?.id]);

  function finishAction(next: JobChain, message: string) {
    setChain(next);
    setReceipt(message);
    window.setTimeout(() => receiptRef.current?.focus());
  }

  async function submitCost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setActionError("");
    const data = new FormData(event.currentTarget);
    const amount = dollarsToMinor(String(data.get("amount")));
    if (amount === null) {
      setActionError("Enter the commitment in dollars, using no more than two decimal places.");
      const field = form.elements.namedItem("amount");
      if (field instanceof HTMLElement) field.focus();
      return;
    }
    setSaving("cost");
    try {
      const next = await addCost(chainId, {
        subcontractor: String(data.get("subcontractor")),
        role: String(data.get("role")),
        amount_minor: amount,
      });
      finishAction(next, `Saved ${String(data.get("role"))} as a new commitment.`);
      form.reset();
    } catch (problem) {
      setActionError(problem instanceof Error ? problem.message : "We could not save this cost. Check your connection and try again.");
    } finally {
      setSaving("");
    }
  }

  async function approve(scopeId: string, description: string) {
    setSaving(scopeId);
    setActionError("");
    try {
      finishAction(await approveScope(chainId, scopeId), `Approved ${description}.`);
    } catch (problem) {
      setActionError(problem instanceof Error ? problem.message : "The scope could not be approved. Try again.");
    } finally {
      setSaving("");
    }
  }

  async function markSent(milestoneId: string, label: string) {
    setSaving(milestoneId);
    setActionError("");
    try {
      finishAction(await updateMilestone(chainId, milestoneId, "sent"), `Marked ${label} as sent.`);
    } catch (problem) {
      setActionError(problem instanceof Error ? problem.message : "The invoice state could not change. Try again.");
    } finally {
      setSaving("");
    }
  }

  if (error) {
    const notFound = error.includes("not available");
    return (
      <main id="main" className="app-main section-shell">
        <h1 tabIndex={-1}>{notFound ? "Job chain not found" : "This job did not load"}</h1>
        <FeedbackPanel title={notFound ? "Return to the job register" : "Check the connection"} kind="error">
          <p>{error}</p>
          {notFound ? <Link className="primary-action" to="/demo">View sample jobs</Link> : <button className="secondary-action" type="button" onClick={() => setRetry((value) => value + 1)}>Try loading again</button>}
        </FeedbackPanel>
      </main>
    );
  }

  if (!chain) {
    return (
      <main id="main" className="app-main section-shell">
        <h1 tabIndex={-1}>Loading the job chain…</h1>
        <FeedbackPanel title="Loading the linked record" kind="loading"><p>Promise, cost, scope, and invoices will appear here.</p></FeedbackPanel>
      </main>
    );
  }

  return (
    <main id="main" className="app-main section-shell">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/demo">Job register</Link><span aria-hidden="true">/</span><span>{chain.name}</span></nav>
      <header className="page-heading chain-heading">
        <p className="eyebrow">{chain.contracting_client}{chain.end_client ? ` → ${chain.end_client}` : ""}</p>
        <h1 tabIndex={-1}>{chain.name}</h1>
        <p>Northline Studio · demo owner</p>
      </header>
      {receipt && <p ref={receiptRef} className="action-receipt" role="status" tabIndex={-1}>{receipt}</p>}
      {actionError && <p className="form-error action-error" role="alert">{actionError}</p>}
      <div className="workspace-layout">
        <div className="chain-spine">
          <section className="chain-register" aria-labelledby="commitment-heading">
            <span className="chain-register__number" aria-hidden="true">1</span>
            <div>
              <h2 id="commitment-heading">Client commitment</h2>
              <p className="large-money">{formatMoney(chain.client_commitment_minor)}</p>
              <p>The current approved amount from {chain.contracting_client}.</p>
            </div>
          </section>

          <section className="chain-register" aria-labelledby="scope-heading">
            <span className="chain-register__number" aria-hidden="true">2</span>
            <div className="chain-register__content">
              <h2 id="scope-heading">Approved scope</h2>
              <ul className="record-list">
                {chain.scopes.map((scope) => (
                  <li key={scope.id}>
                    <div><strong>{scope.description}</strong><StatusStamp status={scope.status} /></div>
                    {scope.status === "pending" && (
                      <button className="secondary-action" type="button" onClick={() => approve(scope.id, scope.description)} disabled={saving === scope.id}>
                        {saving === scope.id ? "Approving…" : "Approve revision"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="chain-register chain-register--carbon" aria-labelledby="cost-heading">
            <span className="chain-register__number" aria-hidden="true">3</span>
            <div className="chain-register__content">
              <h2 id="cost-heading">Subcontractor commitments</h2>
              <ul className="record-list">
                {chain.costs.map((cost) => (
                  <li key={cost.id}>
                    <div><strong>{cost.subcontractor}</strong><span>{cost.role}</span></div>
                    <span className="money-figure">{formatMoney(cost.amount_minor)}</span>
                  </li>
                ))}
              </ul>
              <form className="inline-sheet-form" onSubmit={submitCost} noValidate>
                <h3>Add a committed cost</h3>
                <div className="field-grid">
                  <label>Subcontractor<input name="subcontractor" autoComplete="off" required minLength={2} maxLength={120} /></label>
                  <label>Work covered<input name="role" autoComplete="off" required minLength={2} maxLength={120} /></label>
                  <label>Amount in USD<span className="money-input"><span aria-hidden="true">$</span><input name="amount" inputMode="decimal" required aria-describedby="amount-help" /></span><small id="amount-help">Use dollars and up to two decimal places.</small></label>
                </div>
                <button className="primary-action" type="submit" disabled={saving === "cost"}>{saving === "cost" ? "Saving…" : "Add commitment"}</button>
              </form>
            </div>
          </section>

          <section className="chain-register" aria-labelledby="invoice-heading">
            <span className="chain-register__number" aria-hidden="true">4</span>
            <div className="chain-register__content">
              <h2 id="invoice-heading">Client milestones</h2>
              {chain.milestones.length === 0 ? <p>No client milestones yet. Add them when billing is agreed.</p> : (
                <ul className="record-list">
                  {chain.milestones.map((milestone) => (
                    <li key={milestone.id}>
                      <div><strong>{milestone.label}</strong><span>{formatMoney(milestone.amount_minor)}</span><StatusStamp status={milestone.status} /></div>
                      {(milestone.status === "planned" || milestone.status === "due") && (
                        <button className="secondary-action" type="button" onClick={() => markSent(milestone.id, milestone.label)} disabled={saving === milestone.id}>
                          {saving === milestone.id ? "Saving…" : "Mark invoice sent"}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
        <MarginSlip chain={chain} />
      </div>
    </main>
  );
}
