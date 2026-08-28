import type { JobChain, MarginCalculation, RiskState } from "../../api/client";

export function formatMoney(minor: number | null, currency = "USD"): string {
  if (minor === null) return "Not entered";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: minor % 100 === 0 ? 0 : 2,
  }).format(minor / 100);
}

export function formatPercent(tenths: number | null): string {
  if (tenths === null) return "Not available";
  return `${(tenths / 10).toFixed(1)}%`;
}

export function dollarsToMinor(value: string): number | null {
  const normalized = value.trim().replace(/[$,\s]/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, decimal = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function riskLabel(state: RiskState): string {
  return {
    incomplete: "Incomplete",
    safe: "Above floor",
    near_floor: "Check pending work",
    below_floor: "Below floor",
  }[state];
}

export function marginMessage(chain: JobChain | { calculation: MarginCalculation; margin_floor_basis_points: number }): string {
  const { calculation } = chain;
  if (calculation.risk_state === "incomplete") {
    return "Add the client commitment and confirmed costs before judging this margin.";
  }
  if (calculation.risk_state === "below_floor") {
    return `Expected margin is ${formatMoney(calculation.margin_at_risk_minor)} below this job’s floor after ${
      calculation.cause ?? "the latest change"
    }.`;
  }
  if (calculation.risk_state === "near_floor") {
    return calculation.cause
      ? `Check the margin before you approve more work. ${calculation.cause}.`
      : "Expected margin is within five percentage points of the floor.";
  }
  return "Expected margin is above this job’s floor.";
}

export function localCalculation(
  commitmentMinor: number,
  costMinor: number,
  floorBasisPoints: number,
): Pick<MarginCalculation, "expected_margin_minor" | "margin_floor_minor" | "margin_at_risk_minor"> {
  const margin = commitmentMinor - costMinor;
  const floor = Math.ceil((commitmentMinor * floorBasisPoints) / 10_000);
  return {
    expected_margin_minor: margin,
    margin_floor_minor: floor,
    margin_at_risk_minor: Math.max(0, floor - margin),
  };
}
