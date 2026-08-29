import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { plannedRoutes } from "../src/app/route-manifest";
import { dollarsToMinor, formatMoney, localCalculation, riskLabel } from "../src/features/chains/model";
import { chainFieldLimits, isWithin } from "../src/features/chains/schema";
import { chainsToCsv, parseCsv, previewImport, suggestMapping } from "../src/features/chains/csv";
import type { JobChain } from "../src/api/client";

describe("M1 chain view model", () => {
  it("mirrors the server fixture calculation", () => {
    expect(localCalculation(2_400_000, 1_450_000, 2_000)).toEqual({
      expected_margin_minor: 950_000,
      margin_floor_minor: 480_000,
      margin_at_risk_minor: 0,
    });
    expect(localCalculation(2_400_000, 2_050_000, 2_000).margin_at_risk_minor).toBe(130_000);
    expect(formatMoney(950_000)).toBe("$9,500");
  });

  it("parses dollar input without binary floating-point math", () => {
    expect(dollarsToMinor("$6,000")).toBe(600_000);
    expect(dollarsToMinor("19.9")).toBe(1_990);
    expect(dollarsToMinor("10.999")).toBeNull();
    expect(dollarsToMinor("-1")).toBeNull();
  });

  it("uses written status language", () => {
    expect(riskLabel("safe")).toBe("Above floor");
    expect(riskLabel("near_floor")).toBe("Near margin floor");
    expect(riskLabel("below_floor")).toBe("Below floor");
    expect(riskLabel("incomplete")).toBe("Incomplete");
  });
});

describe("M1 route and form contracts", () => {
  it("has unique routes and route-specific plain titles", () => {
    const routes = plannedRoutes.filter((route) => route.milestone === "M1");
    expect(new Set(routes.map((route) => route.path)).size).toBe(routes.length);
    expect(routes.map((route) => route.path)).toEqual([
      "/", "/demo", "/demo/import", "/demo/chains/new", "/demo/chains/:chainId", "/privacy", "/terms", "/404",
    ]);
    expect(routes.every((route) => route.title.includes("Subcontractor Margin Chain") && route.title.length <= 60)).toBe(true);
  });

  it("sets the same form boundaries as the API", () => {
    expect(isWithin(chainFieldLimits.marginFloorBasisPoints, 2_000)).toBe(true);
    expect(isWithin(chainFieldLimits.marginFloorBasisPoints, 10_001)).toBe(false);
    expect(isWithin(chainFieldLimits.clientCommitmentMinor, 0)).toBe(false);
    expect(chainFieldLimits.approvedScope.maximum).toBe(2_000);
  });

  it("has a reduced-motion path and minimum control target", async () => {
    const [tokens, app] = await Promise.all([
      readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8"),
      readFile(new URL("../src/styles/app.css", import.meta.url), "utf8"),
    ]);
    expect(tokens).toContain("--control-min: 2.75rem");
    expect(tokens).toContain("prefers-reduced-motion: reduce");
    expect(app).toContain("prefers-reduced-motion: reduce");
  });
});

describe("spreadsheet boundaries", () => {
  it("parses quoted CSV cells and reports invalid rows without importing them", () => {
    const document = parseCsv('job_name,contracting_client,approved_scope,client_commitment_usd,margin_floor_percent,subcontractor,work_covered,committed_cost_usd\n"Launch, phase two",Client,Short scope,12000,25,Partner,Editing,6000\nBad row,C,,,120,Partner,x,-1');
    const preview = previewImport(document, suggestMapping(document.headers));
    expect(preview[0]?.name).toBe("Launch, phase two");
    expect(preview[0]?.input?.client_commitment_minor).toBe(1_200_000);
    expect(preview[1]?.input).toBeNull();
    expect(preview[1]?.errors.length).toBeGreaterThan(1);
  });

  it("quotes CSV values and neutralizes spreadsheet formula prefixes", () => {
    const chain = {
      id: "safe-export",
      name: "=SUM(A1:A2)",
      contracting_client: "Client, Inc.",
      end_client: null,
      currency: "USD",
      client_commitment_minor: 10_000,
      margin_floor_basis_points: 2_000,
      scopes: [],
      costs: [],
      milestones: [],
      last_risk_cause: null,
      version: 1,
      calculation: {
        client_commitment_minor: 10_000,
        committed_cost_minor: 0,
        expected_margin_minor: 10_000,
        margin_floor_minor: 2_000,
        margin_at_risk_minor: 0,
        margin_percent_tenths: 1_000,
        risk_state: "safe",
        rule_version: "m1-v1",
        cause: null,
        input_version: 1,
      },
    } satisfies JobChain;
    const csv = chainsToCsv([chain]);
    expect(csv).toContain("'=SUM(A1:A2)");
    expect(csv).toContain('"Client, Inc."');
  });
});
