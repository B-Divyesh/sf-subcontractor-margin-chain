import { type FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  addCost,
  ApiProblem,
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
  const isReal = useLocation().pathname.startsWith("/app");
  const base = isReal ? "/app/chains" : "/demo";
  const revision = useDemoRevision();
  const [chain, setChain] = useState<JobChain | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [costErrors, setCostErrors] = useState<Partial<Record<"subcontractor" | "role" | "amount", string>>>({});
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
    const subcontractor = String(data.get("subcontractor")).trim();
    const role = String(data.get("role")).trim();
    const amount = dollarsToMinor(String(data.get("amount")));
    const errors: typeof costErrors = {};
    if (subcontractor.length < 2 || subcontractor.length > 120) {
      errors.subcontractor = "Enter the subcontractor name.";
    }
    if (role.length < 2 || role.length > 120) {
      errors.role = "Name the work this commitment covers.";
    }
    if (amount === null) {
      errors.amount = "Enter dollars using no more than two decimal places.";
    }
    setCostErrors(errors);
    const firstInvalid = (["subcontractor", "role", "amount"] as const).find((field) => errors[field]);
    if (firstInvalid) {
      const field = form.elements.namedItem(firstInvalid);
      if (field instanceof HTMLElement) field.focus();
      return;
    }
    setSaving("cost");
    try {
      const next = await addCost(chainId, {
        subcontractor,
        role,
        amount_minor: amount!,
      });
      finishAction(next, `Saved ${role} as a new commitment.`);
      form.reset();
    } catch (problem) {
      const apiProblem = problem instanceof ApiProblem ? problem : null;
      const field = apiProblem
        ? ({ subcontractor: "subcontractor", role: "role", amount_minor: "amount" } as const)[apiProblem.field as "subcontractor" | "role" | "amount_minor"]
        : undefined;
      if (field) {
        setCostErrors({ [field]: apiProblem!.message });
        window.setTimeout(() => {
          const input = form.elements.namedItem(field);
          if (input instanceof HTMLElement) input.focus();
        });
      } else {
        setActionError(problem instanceof Error ? problem.message : "We could not save this cost. Check your connection and try again.");
      }
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
          {notFound ? <Link className="primary-action" to={base}>View job chains</Link> : <button className="secondary-action" type="button" onClick={() => setRetry((value) => value + 1)}>Try loading again</button>}
        </FeedbackPanel>
      </main>
    );
  }

  if (!chain) {
    return (
      <main id="main" className="app-main section-shell">
        <h1 tabIndex={-1}>Loading the job chain…</h1>
        <FeedbackPanel title="Loading the linked record" kind="loading"><p>Client commitment, cost, scope, and invoice milestones will appear here.</p></FeedbackPanel>
      </main>
    );
  }

  return (
    <main id="main" className="app-main section-shell">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to={base}>Job register</Link><span aria-hidden="true">/</span><span>{chain.name}</span></nav>
      <header className="page-heading chain-heading">
        <p className="eyebrow">{chain.contracting_client}{chain.end_client ? ` → ${chain.end_client}` : ""}</p>
        <h1 tabIndex={-1}>{chain.name}</h1>
        <p>{isReal ? "Saved agency record" : "Northline Studio · demo owner"}</p>
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
                  <div className="field-control"><label htmlFor="cost-subcontractor">Subcontractor</label><input id="cost-subcontractor" name="subcontractor" autoComplete="off" required minLength={2} maxLength={120} aria-invalid={costErrors.subcontractor ? true : undefined} aria-describedby={costErrors.subcontractor ? "cost-subcontractor-error" : undefined} />{costErrors.subcontractor && <small id="cost-subcontractor-error" className="form-error">{costErrors.subcontractor}</small>}</div>
                  <div className="field-control"><label htmlFor="cost-role">Work covered</label><input id="cost-role" name="role" autoComplete="off" required minLength={2} maxLength={120} aria-invalid={costErrors.role ? true : undefined} aria-describedby={costErrors.role ? "cost-role-error" : undefined} />{costErrors.role && <small id="cost-role-error" className="form-error">{costErrors.role}</small>}</div>
                  <div className="field-control"><label htmlFor="cost-amount">Amount in USD</label><span className="money-input"><span aria-hidden="true">$</span><input id="cost-amount" name="amount" inputMode="decimal" required aria-invalid={costErrors.amount ? true : undefined} aria-describedby={costErrors.amount ? "amount-help cost-amount-error" : "amount-help"} /></span><small id="amount-help">Use dollars and up to two decimal places.</small>{costErrors.amount && <small id="cost-amount-error" className="form-error">{costErrors.amount}</small>}</div>
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
