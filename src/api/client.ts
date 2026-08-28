export type RiskState = "incomplete" | "safe" | "near_floor" | "below_floor";
export type ScopeStatus = "pending" | "approved";
export type MilestoneStatus = "planned" | "due" | "sent" | "part_paid" | "paid" | "overdue";

export type ScopeRevision = {
  id: string;
  description: string;
  status: ScopeStatus;
  linked_milestone_id: string | null;
};

export type CostCommitment = {
  id: string;
  subcontractor: string;
  role: string;
  amount_minor: number;
  state: "committed" | "void";
};

export type ClientMilestone = {
  id: string;
  label: string;
  amount_minor: number;
  status: MilestoneStatus;
  linked_scope_id: string | null;
};

export type MarginCalculation = {
  client_commitment_minor: number | null;
  committed_cost_minor: number;
  expected_margin_minor: number | null;
  margin_floor_minor: number | null;
  margin_at_risk_minor: number | null;
  margin_percent_tenths: number | null;
  risk_state: RiskState;
  rule_version: string;
  cause: string | null;
  input_version: number;
};

export type JobChain = {
  id: string;
  name: string;
  contracting_client: string;
  end_client: string | null;
  currency: string;
  client_commitment_minor: number | null;
  margin_floor_basis_points: number;
  scopes: ScopeRevision[];
  costs: CostCommitment[];
  milestones: ClientMilestone[];
  last_risk_cause: string | null;
  version: number;
  calculation: MarginCalculation;
};

export class ApiProblem extends Error {
  status: number;
  code: string;
  field?: string;

  constructor(status: number, body: { detail?: string; code?: string; field?: string }) {
    super(body.detail ?? "The demo could not complete that request. Try again.");
    this.name = "ApiProblem";
    this.status = status;
    this.code = body.code ?? "request_failed";
    this.field = body.field;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      credentials: "same-origin",
      ...init,
      headers: {
        ...(init?.body ? { "content-type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiProblem(0, {
      code: "offline",
      detail: "The demo is offline. Reconnect, then try again. Your open page has not changed.",
    });
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      detail?: string;
      code?: string;
      field?: string;
    };
    throw new ApiProblem(response.status, body);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function createWorkspace(): Promise<void> {
  await request("/api/v1/demo/workspaces", { method: "POST" });
}

export async function ensureWorkspace(): Promise<void> {
  await createWorkspace();
}

export async function listChains(): Promise<JobChain[]> {
  await createWorkspace();
  const result = await request<{ chains: JobChain[] }>("/api/v1/demo/chains");
  return result.chains;
}

export async function getChain(id: string): Promise<JobChain> {
  await createWorkspace();
  return request<JobChain>(`/api/v1/demo/chains/${encodeURIComponent(id)}`);
}

export type NewChainInput = {
  name: string;
  contracting_client: string;
  end_client?: string;
  approved_scope: string;
  client_commitment_minor: number;
  margin_floor_basis_points: number;
  subcontractor: string;
  cost_role: string;
  cost_minor: number;
};

export async function createChain(input: NewChainInput): Promise<JobChain> {
  await ensureWorkspace();
  return request("/api/v1/demo/chains", {
    method: "POST",
    headers: { "idempotency-key": crypto.randomUUID() },
    body: JSON.stringify(input),
  });
}

export function addCost(
  chainId: string,
  input: { subcontractor: string; role: string; amount_minor: number },
): Promise<JobChain> {
  return request(`/api/v1/demo/chains/${encodeURIComponent(chainId)}/costs`, {
    method: "POST",
    headers: { "idempotency-key": crypto.randomUUID() },
    body: JSON.stringify(input),
  });
}

export function approveScope(chainId: string, scopeId: string): Promise<JobChain> {
  return request(
    `/api/v1/demo/chains/${encodeURIComponent(chainId)}/scopes/${encodeURIComponent(scopeId)}`,
    { method: "PATCH", body: JSON.stringify({ status: "approved" }) },
  );
}

export function updateMilestone(
  chainId: string,
  milestoneId: string,
  status: MilestoneStatus,
): Promise<JobChain> {
  return request(
    `/api/v1/demo/chains/${encodeURIComponent(chainId)}/milestones/${encodeURIComponent(milestoneId)}`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}

export async function resetWorkspace(): Promise<void> {
  await request("/api/v1/demo/workspaces/current", { method: "DELETE" });
  await createWorkspace();
}
