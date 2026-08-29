import { type FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiProblem, createChain } from "../api/client";
import { dollarsToMinor, formatMoney, localCalculation } from "../features/chains/model";

type Draft = {
  name: string;
  contractingClient: string;
  endClient: string;
  scope: string;
  clientCommitment: string;
  marginFloor: string;
  subcontractor: string;
  role: string;
  cost: string;
};

const initialDraft: Draft = {
  name: "",
  contractingClient: "",
  endClient: "",
  scope: "",
  clientCommitment: "",
  marginFloor: "20",
  subcontractor: "",
  role: "",
  cost: "",
};

export function NewChainPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(initialDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const preview = useMemo(() => {
    const commitment = dollarsToMinor(draft.clientCommitment);
    const cost = dollarsToMinor(draft.cost);
    const floor = Number(draft.marginFloor);
    if (commitment === null || cost === null || !Number.isFinite(floor) || floor < 0 || floor > 100) return null;
    return localCalculation(commitment, cost, Math.round(floor * 100));
  }, [draft.clientCommitment, draft.cost, draft.marginFloor]);

  function update(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors: Record<string, string> = {};
    for (const [field, value] of [
      ["name", draft.name],
      ["contractingClient", draft.contractingClient],
      ["scope", draft.scope],
      ["subcontractor", draft.subcontractor],
      ["role", draft.role],
    ] as const) {
      if (value.trim().length < 2) nextErrors[field] = "Enter at least two characters.";
    }
    const commitment = dollarsToMinor(draft.clientCommitment);
    const cost = dollarsToMinor(draft.cost);
    const floor = Number(draft.marginFloor);
    if (commitment === null || commitment <= 0) nextErrors.clientCommitment = "Enter a client commitment above zero.";
    if (cost === null) nextErrors.cost = "Enter a committed cost of zero or more.";
    if (!Number.isFinite(floor) || floor < 0 || floor > 100) nextErrors.marginFloor = "Enter a margin floor from 0% to 100%.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const firstField = Object.keys(nextErrors)[0] ?? "name";
      const first = form.elements.namedItem(firstField);
      if (first instanceof HTMLElement) first.focus();
      return;
    }
    setSaving(true);
    setServerError("");
    try {
      const chain = await createChain({
        name: draft.name,
        contracting_client: draft.contractingClient,
        end_client: draft.endClient,
        approved_scope: draft.scope,
        client_commitment_minor: commitment!,
        margin_floor_basis_points: Math.round(floor * 100),
        subcontractor: draft.subcontractor,
        cost_role: draft.role,
        cost_minor: cost!,
      });
      navigate(`/demo/chains/${chain.id}`);
    } catch (problem) {
      const message = problem instanceof Error ? problem.message : "The job chain could not be saved. Try again.";
      setServerError(message);
      if (problem instanceof ApiProblem && problem.field) {
        const field = form.elements.namedItem(problem.field);
        if (field instanceof HTMLElement) field.focus();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main id="main" className="app-main section-shell">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/demo">Job register</Link><span aria-hidden="true">/</span><span>New job</span></nav>
      <header className="page-heading">
        <p className="eyebrow">Northline Studio · demo workspace</p>
        <h1 tabIndex={-1}>Add a job chain</h1>
        <p>Record the client commitment and first committed cost before work starts.</p>
      </header>
      {serverError && <p className="form-error action-error" role="alert">{serverError}</p>}
      <div className="new-chain-layout">
        <form className="chain-form" onSubmit={submit} noValidate>
          <fieldset>
            <legend><span>1</span> Name the job and clients</legend>
            <label>Job name<input name="name" value={draft.name} onChange={(event) => update("name", event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} maxLength={120} required /></label>
            {errors.name && <p className="field-error" id="name-error">{errors.name}</p>}
            <div className="field-grid field-grid--two">
              <label>Contracting client<input name="contractingClient" value={draft.contractingClient} onChange={(event) => update("contractingClient", event.target.value)} aria-invalid={Boolean(errors.contractingClient)} aria-describedby={errors.contractingClient ? "contracting-error" : undefined} maxLength={120} required /></label>
              <label>End client <span className="optional">Optional</span><input name="endClient" value={draft.endClient} onChange={(event) => update("endClient", event.target.value)} maxLength={120} /></label>
            </div>
            {errors.contractingClient && <p className="field-error" id="contracting-error">{errors.contractingClient}</p>}
          </fieldset>

          <fieldset>
            <legend><span>2</span> Record the approved scope</legend>
            <label>Approved work<textarea name="scope" value={draft.scope} onChange={(event) => update("scope", event.target.value)} aria-invalid={Boolean(errors.scope)} aria-describedby={errors.scope ? "scope-error" : "scope-help"} maxLength={2000} required /></label>
            <small id="scope-help">Describe the work the client has agreed to buy.</small>
            {errors.scope && <p className="field-error" id="scope-error">{errors.scope}</p>}
          </fieldset>

          <fieldset>
            <legend><span>3</span> Set the client commitment</legend>
            <div className="field-grid field-grid--two">
              <label>Client commitment in USD<span className="money-input"><span aria-hidden="true">$</span><input name="clientCommitment" inputMode="decimal" value={draft.clientCommitment} onChange={(event) => update("clientCommitment", event.target.value)} aria-invalid={Boolean(errors.clientCommitment)} aria-describedby={errors.clientCommitment ? "commitment-error" : undefined} required /></span></label>
              <label>Margin floor<span className="suffix-input"><input name="marginFloor" inputMode="decimal" value={draft.marginFloor} onChange={(event) => update("marginFloor", event.target.value)} aria-invalid={Boolean(errors.marginFloor)} aria-describedby={errors.marginFloor ? "floor-error" : undefined} required /><span aria-hidden="true">%</span></span></label>
            </div>
            {errors.clientCommitment && <p className="field-error" id="commitment-error">{errors.clientCommitment}</p>}
            {errors.marginFloor && <p className="field-error" id="floor-error">{errors.marginFloor}</p>}
          </fieldset>

          <fieldset>
            <legend><span>4</span> Add the first subcontractor</legend>
            <div className="field-grid field-grid--two">
              <label>Subcontractor<input name="subcontractor" value={draft.subcontractor} onChange={(event) => update("subcontractor", event.target.value)} aria-invalid={Boolean(errors.subcontractor)} aria-describedby={errors.subcontractor ? "subcontractor-error" : undefined} maxLength={120} required /></label>
              <label>Work covered<input name="role" value={draft.role} onChange={(event) => update("role", event.target.value)} aria-invalid={Boolean(errors.role)} aria-describedby={errors.role ? "role-error" : undefined} maxLength={120} required /></label>
            </div>
            {errors.subcontractor && <p className="field-error" id="subcontractor-error">{errors.subcontractor}</p>}
            {errors.role && <p className="field-error" id="role-error">{errors.role}</p>}
            <label>Committed cost in USD<span className="money-input"><span aria-hidden="true">$</span><input name="cost" inputMode="decimal" value={draft.cost} onChange={(event) => update("cost", event.target.value)} aria-invalid={Boolean(errors.cost)} aria-describedby={errors.cost ? "cost-error" : undefined} required /></span></label>
            {errors.cost && <p className="field-error" id="cost-error">{errors.cost}</p>}
          </fieldset>
          <div className="button-row">
            <button className="primary-action" type="submit" disabled={saving}>{saving ? "Creating job chain…" : "Create job chain"}</button>
            <Link className="secondary-action" to="/demo">Cancel</Link>
          </div>
        </form>

        <aside className="chain-check" aria-labelledby="chain-check-title" aria-live="polite">
          <p className="eyebrow">Live receipt</p>
          <h2 id="chain-check-title">Chain check</h2>
          {preview ? (
            <dl>
              <div><dt>Client commitment</dt><dd>{formatMoney(dollarsToMinor(draft.clientCommitment))}</dd></div>
              <div><dt>Committed cost</dt><dd>− {formatMoney(dollarsToMinor(draft.cost))}</dd></div>
              <div><dt>Expected margin</dt><dd>{formatMoney(preview.expected_margin_minor)}</dd></div>
              <div><dt>Margin floor</dt><dd>{formatMoney(preview.margin_floor_minor)}</dd></div>
            </dl>
          ) : <p>Enter the client commitment, cost, and floor to check the margin.</p>}
        </aside>
      </div>
    </main>
  );
}
