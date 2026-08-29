import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Claim = { id: string; claim: string; where: string; test: string; sandbox: string };

describe("public claim registry", () => {
  it("contains every shipped product and response-policy claim exactly once", () => {
    const claims = JSON.parse(readFileSync(".factory/claims.json", "utf8")) as Claim[];
    const ids = claims.map((claim) => claim.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      "m1-chain-math",
      "m1-margin-risk",
      "m1-linked-status",
      "m1-sample-workflow",
      "m1-demo-fixtures",
      "m1-demo-no-account",
      "m1-demo-reset",
      "m1-demo-isolation-expiry",
      "m1-public-privacy",
      "m1-csv-import",
      "m1-data-export",
      "m1-product-boundaries",
      "m1-plan-prices",
      "m1-demo-cookie",
      "m1-shared-replica-persistence",
      "m1-port-only-startup",
      "m1-security-headers",
      "m1-api-rate-limits",
      "m1-idempotent-creates",
      "m1-problem-details",
      "m1-demo-no-store",
      "m1-money-integrity",
      "m1-build-identity",
      "m1-true-404",
      "m1-asset-cache",
      "m1-operations",
    ]);
    expect(new Set(claims.map((claim) => claim.test)).size).toBe(claims.length);
    for (const claim of claims) {
      expect(claim.claim.trim()).not.toBe("");
      expect(claim.where.trim()).not.toBe("");
      expect(claim.test.trim()).not.toBe("");
      expect(claim.sandbox.trim()).not.toBe("");
    }
  });
});
