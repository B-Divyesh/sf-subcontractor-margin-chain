import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { plannedRoutes } from "../src/app/route-manifest";
import { dollarsToMinor, formatMoney, localCalculation, riskLabel } from "../src/features/chains/model";
import { chainFieldLimits, isWithin } from "../src/features/chains/schema";

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
    expect(riskLabel("near_floor")).toBe("Check pending work");
    expect(riskLabel("below_floor")).toBe("Below floor");
    expect(riskLabel("incomplete")).toBe("Incomplete");
  });
});

describe("M1 route and form contracts", () => {
  it("has unique routes and route-specific plain titles", () => {
    const routes = plannedRoutes.filter((route) => route.milestone === "M1");
    expect(new Set(routes.map((route) => route.path)).size).toBe(routes.length);
    expect(routes.map((route) => route.path)).toEqual([
      "/", "/demo", "/demo/chains/new", "/demo/chains/:chainId", "/privacy", "/terms", "/404",
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
