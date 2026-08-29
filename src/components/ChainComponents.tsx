import { Link } from "react-router-dom";
import type { JobChain, MilestoneStatus, RiskState, ScopeStatus } from "../api/client";
import { formatMoney, formatPercent, marginMessage, riskLabel } from "../features/chains/model";

const statusWords: Record<MilestoneStatus | ScopeStatus, string> = {
  pending: "Pending approval",
  approved: "Approved",
  planned: "Planned",
  due: "Due",
  sent: "Sent",
  part_paid: "Part paid",
  paid: "Paid",
  overdue: "Overdue",
};

export function StatusStamp({ status }: { status: MilestoneStatus | ScopeStatus }) {
  return <span className={`status-stamp status-stamp--${status}`}>{statusWords[status]}</span>;
}

export function RiskFlag({ chain }: { chain: JobChain }) {
  return (
    <div className={`risk-flag risk-flag--${chain.calculation.risk_state}`} role={chain.calculation.risk_state === "below_floor" ? "alert" : "status"}>
      <strong>{riskLabel(chain.calculation.risk_state)}</strong>
      <p>{marginMessage(chain)}</p>
    </div>
  );
}

export function MarginSlip({ chain }: { chain: JobChain }) {
  const calculation = chain.calculation;
  if (chain.subcontractor_rates_hidden) {
    return (
      <aside className="margin-slip margin-slip--restricted" aria-labelledby="margin-slip-title">
        <p className="eyebrow">Role-limited view</p>
        <h2 id="margin-slip-title">Margin hidden</h2>
        <p>Ask an owner or finance member to review subcontractor costs and expected margin.</p>
      </aside>
    );
  }
  return (
    <aside className={`margin-slip margin-slip--${calculation.risk_state}`} aria-labelledby="margin-slip-title">
      <p className="eyebrow">Rule {calculation.rule_version}</p>
      <h2 id="margin-slip-title">Margin check</h2>
      <dl>
        <div><dt>Client commitment</dt><dd>{formatMoney(calculation.client_commitment_minor)}</dd></div>
        <div><dt>Committed cost</dt><dd>− {formatMoney(calculation.committed_cost_minor)}</dd></div>
        <div className="margin-slip__total"><dt>Expected margin</dt><dd>{formatMoney(calculation.expected_margin_minor)}</dd></div>
        <div><dt>Margin rate</dt><dd>{formatPercent(calculation.margin_percent_tenths)}</dd></div>
        <div><dt>{chain.margin_floor_basis_points / 100}% floor</dt><dd>{formatMoney(calculation.margin_floor_minor)}</dd></div>
      </dl>
      <RiskFlag chain={chain} />
    </aside>
  );
}

export function JobRegister({ chains, chainBase, canAdd }: { chains: JobChain[]; chainBase: string; canAdd: boolean }) {
  if (chains.length === 0) {
    return (
      <FeedbackPanel title="No job chains yet">
        <p>Add the client commitment before you book subcontractors.</p>
        {canAdd ? <Link className="primary-action" to={`${chainBase}/new`}>Add a job chain</Link> : <p>Your role can review jobs after an owner or finance member adds them.</p>}
      </FeedbackPanel>
    );
  }
  return (
    <ul className="job-register" aria-label={chainBase.startsWith("/demo") ? "Sample job chains" : "Saved agency job chains"}>
      {chains.map((chain) => (
        <li key={chain.id} className={`job-row job-row--${chain.calculation.risk_state}`}>
          <div className="job-row__identity">
            <Link to={`${chainBase}/${chain.id}`}>{chain.name}</Link>
            <span>{chain.client_identity_hidden ? "Client identities hidden for this role" : `${chain.contracting_client ?? "Client"}${chain.end_client ? ` → ${chain.end_client}` : ""}`}</span>
          </div>
          {chain.subcontractor_rates_hidden ? (
            <p className="restricted-note">Subcontractor costs and margin are hidden for this role.</p>
          ) : (
            <dl>
              <div><dt>Client commitment</dt><dd>{formatMoney(chain.calculation.client_commitment_minor)}</dd></div>
              <div><dt>Committed cost</dt><dd>{formatMoney(chain.calculation.committed_cost_minor)}</dd></div>
              <div><dt>Expected margin</dt><dd>{formatMoney(chain.calculation.expected_margin_minor)} · {formatPercent(chain.calculation.margin_percent_tenths)}</dd></div>
            </dl>
          )}
          <span className={`risk-label risk-label--${chain.calculation.risk_state}`}>{riskLabel(chain.calculation.risk_state)}</span>
        </li>
      ))}
    </ul>
  );
}

export function FeedbackPanel({
  title,
  children,
  kind = "default",
}: {
  title: string;
  children: React.ReactNode;
  kind?: "default" | "error" | "loading" | "offline";
}) {
  return (
    <section className={`feedback-panel feedback-panel--${kind}`} aria-live={kind === "error" ? "assertive" : "polite"}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function SummaryStrip({ chains }: { chains: JobChain[] }) {
  const ratesHidden = chains.some((chain) => chain.subcontractor_rates_hidden);
  const revenue = chains.reduce((sum, chain) => sum + (chain.calculation.client_commitment_minor ?? 0), 0);
  const cost = chains.reduce((sum, chain) => sum + (chain.calculation.committed_cost_minor ?? 0), 0);
  const attention = chains.filter((chain) => !["safe", "restricted"].includes(chain.calculation.risk_state)).length;
  if (ratesHidden) {
    return (
      <dl className="summary-strip summary-strip--restricted">
        <div><dt>Active jobs</dt><dd>{chains.length}</dd></div>
        <div><dt>Client identities</dt><dd>Hidden</dd></div>
        <div><dt>Subcontractor costs</dt><dd>Hidden</dd></div>
        <div><dt>Margin</dt><dd>Hidden</dd></div>
      </dl>
    );
  }
  return (
    <dl className="summary-strip">
      <div><dt>Active jobs</dt><dd>{chains.length}</dd></div>
      <div><dt>Client commitments</dt><dd>{formatMoney(revenue)}</dd></div>
      <div><dt>Committed cost</dt><dd>{formatMoney(cost)}</dd></div>
      <div><dt>Need a check</dt><dd>{attention}</dd></div>
    </dl>
  );
}

export function riskClass(state: RiskState) {
  return `risk-${state.replace("_", "-")}`;
}
