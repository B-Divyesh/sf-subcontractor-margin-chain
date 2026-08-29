import type { JobChain, NewChainInput } from "../../api/client";
import { dollarsToMinor } from "./model";

export const importFields = [
  ["name", "Job name"],
  ["contracting_client", "Contracting client"],
  ["end_client", "End client (optional)"],
  ["approved_scope", "Approved scope"],
  ["client_commitment", "Client commitment (USD)"],
  ["margin_floor", "Margin floor (%)"],
  ["subcontractor", "Subcontractor"],
  ["cost_role", "Work covered"],
  ["cost", "Committed cost (USD)"],
] as const;

export type ImportField = (typeof importFields)[number][0];
export type ColumnMapping = Record<ImportField, string>;

export type ParsedCsv = {
  headers: string[];
  rows: string[][];
};

export type ImportPreviewRow = {
  line: number;
  input: NewChainInput | null;
  name: string;
  errors: string[];
};

export const sampleImportCsv = `job_name,contracting_client,end_client,approved_scope,client_commitment_usd,margin_floor_percent,subcontractor,work_covered,committed_cost_usd
Museum audio guide,Juniper Works,City Museum,Record and edit twelve gallery stories,15000,25,Leila Morgan,Sound editing,7800
Spring catalogue,Northstar Press,,Photograph and retouch forty products,12000,30,Tomas Vale,Product photography,6500`;

const suggestedHeaders: Record<ImportField, string[]> = {
  name: ["job_name", "job", "name"],
  contracting_client: ["contracting_client", "client"],
  end_client: ["end_client"],
  approved_scope: ["approved_scope", "scope"],
  client_commitment: ["client_commitment_usd", "client_commitment", "revenue"],
  margin_floor: ["margin_floor_percent", "margin_floor"],
  subcontractor: ["subcontractor", "contractor"],
  cost_role: ["work_covered", "role"],
  cost: ["committed_cost_usd", "committed_cost", "cost"],
};

export function parseCsv(source: string): ParsedCsv {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      record.push(cell.trim());
      cell = "";
    } else if (character === "\n") {
      record.push(cell.trim());
      if (record.some(Boolean)) records.push(record);
      record = [];
      cell = "";
    } else if (character !== "\r") {
      cell += character;
    }
  }
  if (quoted) throw new Error("The CSV has an unclosed quoted value.");
  record.push(cell.trim());
  if (record.some(Boolean)) records.push(record);
  if (records.length < 2) throw new Error("Add a header row and at least one job row.");
  const headers = records[0]!;
  const rows = records.slice(1);
  if (rows.length > 10) throw new Error("Import no more than 10 jobs at once in the demo.");
  if (headers.some((header) => !header)) throw new Error("Every spreadsheet column needs a heading.");
  if (new Set(headers).size !== headers.length) throw new Error("Each spreadsheet heading must be unique.");
  return { headers, rows };
}

export function suggestMapping(headers: string[]): ColumnMapping {
  return Object.fromEntries(
    importFields.map(([field]) => [field, suggestedHeaders[field].find((candidate) => headers.includes(candidate)) ?? ""]),
  ) as ColumnMapping;
}

export function previewImport(document: ParsedCsv, mapping: ColumnMapping): ImportPreviewRow[] {
  const required = importFields.map(([field]) => field).filter((field) => field !== "end_client");
  const missing = required.filter((field) => !mapping[field]);
  if (missing.length) return [{ line: 1, input: null, name: "Column mapping", errors: ["Map every required column before checking the import."] }];
  const used = Object.values(mapping).filter(Boolean);
  if (new Set(used).size !== used.length) return [{ line: 1, input: null, name: "Column mapping", errors: ["Use each spreadsheet column only once."] }];

  return document.rows.map((row, rowIndex) => {
    const value = (field: ImportField) => {
      const column = document.headers.indexOf(mapping[field]);
      return column < 0 ? "" : (row[column] ?? "").trim();
    };
    const errors: string[] = [];
    const name = value("name");
    const contractingClient = value("contracting_client");
    const endClient = value("end_client");
    const scope = value("approved_scope");
    const subcontractor = value("subcontractor");
    const role = value("cost_role");
    const commitment = dollarsToMinor(value("client_commitment"));
    const cost = dollarsToMinor(value("cost"));
    const floor = Number(value("margin_floor"));

    if (name.length < 2 || name.length > 120) errors.push("Job name must be 2–120 characters.");
    if (contractingClient.length < 2 || contractingClient.length > 120) errors.push("Contracting client must be 2–120 characters.");
    if (endClient.length > 120) errors.push("End client must be no more than 120 characters.");
    if (scope.length < 4 || scope.length > 2_000) errors.push("Approved scope must be 4–2,000 characters.");
    if (subcontractor.length < 2 || subcontractor.length > 120) errors.push("Subcontractor must be 2–120 characters.");
    if (role.length < 2 || role.length > 120) errors.push("Work covered must be 2–120 characters.");
    if (commitment === null || commitment <= 0) errors.push("Client commitment must be a positive USD amount.");
    if (cost === null) errors.push("Committed cost must be zero or a positive USD amount.");
    if (!Number.isFinite(floor) || floor < 0 || floor > 100) errors.push("Margin floor must be from 0% to 100%.");

    const input: NewChainInput | null = errors.length ? null : {
      name,
      contracting_client: contractingClient,
      end_client: endClient || undefined,
      approved_scope: scope,
      client_commitment_minor: commitment!,
      margin_floor_basis_points: Math.round(floor * 100),
      subcontractor,
      cost_role: role,
      cost_minor: cost!,
    };
    return { line: rowIndex + 2, input, name: name || `Row ${rowIndex + 2}`, errors };
  });
}

function spreadsheetSafe(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number): string {
  const safe = spreadsheetSafe(String(value));
  return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

function decimal(minor: number | null): string {
  return minor === null ? "" : (minor / 100).toFixed(2);
}

export function chainsToCsv(chains: JobChain[]): string {
  const headings = [
    "job_id", "job_name", "contracting_client", "end_client", "currency", "client_commitment",
    "committed_cost", "expected_margin", "margin_percent", "margin_floor_percent", "risk_state",
    "subcontractor_commitments", "scope_statuses", "client_invoice_statuses",
  ];
  const rows = chains.map((chain) => [
    chain.id,
    chain.name,
    chain.contracting_client,
    chain.end_client ?? "",
    chain.currency,
    decimal(chain.calculation.client_commitment_minor),
    decimal(chain.calculation.committed_cost_minor),
    decimal(chain.calculation.expected_margin_minor),
    chain.calculation.margin_percent_tenths === null ? "" : (chain.calculation.margin_percent_tenths / 10).toFixed(1),
    (chain.margin_floor_basis_points / 100).toFixed(2),
    chain.calculation.risk_state,
    chain.costs.map((cost) => `${cost.subcontractor}: ${cost.role} (${decimal(cost.amount_minor)} ${chain.currency})`).join("; "),
    chain.scopes.map((scope) => `${scope.description}: ${scope.status}`).join("; "),
    chain.milestones.map((milestone) => `${milestone.label}: ${milestone.status}`).join("; "),
  ]);
  return [headings, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function chainsToJson(chains: JobChain[]): string {
  return JSON.stringify({ schema_version: 1, chains }, null, 2) + "\n";
}

export function downloadText(filename: string, contents: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
