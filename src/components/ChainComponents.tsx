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

export function JobRegister({ chains }: { chains: JobChain[] }) {
  if (chains.length === 0) {
    return (
      <FeedbackPanel title="No job chains yet">
        <p>Add the client promise before you book subcontractors.</p>
        <Link className="primary-action" to="/demo/chains/new">Add a job chain</Link>
      </FeedbackPanel>
    );
  }
  return (
    <ul className="job-register" aria-label="Sample job chains">
      {chains.map((chain) => (
        <li key={chain.id} className={`job-row job-row--${chain.calculation.risk_state}`}>
          <div className="job-row__identity">
            <Link to={`/demo/chains/${chain.id}`}>{chain.name}</Link>
            <span>{chain.contracting_client}{chain.end_client ? ` → ${chain.end_client}` : ""}</span>
          </div>
          <dl>
            <div><dt>Client promise</dt><dd>{formatMoney(chain.calculation.client_commitment_minor)}</dd></div>
            <div><dt>Committed cost</dt><dd>{formatMoney(chain.calculation.committed_cost_minor)}</dd></div>
            <div><dt>Expected margin</dt><dd>{formatMoney(chain.calculation.expected_margin_minor)} · {formatPercent(chain.calculation.margin_percent_tenths)}</dd></div>
          </dl>
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
  const revenue = chains.reduce((sum, chain) => sum + (chain.calculation.client_commitment_minor ?? 0), 0);
  const cost = chains.reduce((sum, chain) => sum + chain.calculation.committed_cost_minor, 0);
  const attention = chains.filter((chain) => chain.calculation.risk_state !== "safe").length;
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
