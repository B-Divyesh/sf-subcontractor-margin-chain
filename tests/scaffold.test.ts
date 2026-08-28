import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { plannedRoutes } from "../src/app/route-manifest";

describe("planning scaffold", () => {
  it("gives every route a unique path and a page title", () => {
    const paths = plannedRoutes.map(({ path }) => path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(plannedRoutes.every(({ title }) => title.includes("Subcontractor Margin Chain"))).toBe(true);
  });

  it("defines the required visual and accessibility tokens", async () => {
    const css = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
    for (const token of [
      "--color-canvas",
      "--color-paper",
      "--color-ink",
      "--color-carbon",
      "--color-focus",
      "--control-min: 2.75rem",
      "prefers-reduced-motion",
    ]) {
      expect(css).toContain(token);
    }
  });
});

