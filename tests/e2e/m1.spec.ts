import { readFileSync } from "node:fs";
import { expect, request, test } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  const runOffset = Number.parseInt(process.env.PLAYWRIGHT_IP_OFFSET ?? "0", 10) || 0;
  const projectOctet = (testInfo.project.name === "mobile" ? 113 : 114) + runOffset;
  const claimOctet = [...testInfo.testId].reduce((total, character) => total + character.charCodeAt(0), 0) % 200 + 10;
  await page.setExtraHTTPHeaders({ "X-Forwarded-For": `203.0.${projectOctet}.${claimOctet}` });
});

test("@claim:m1-chain-math shows the exact job-chain calculation", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("link", { name: "Autumn launch films" }).click();
  const slip = page.getByLabel("Margin check");
  await expect(slip).toContainText("$24,000");
  await expect(slip).toContainText("− $14,500");
  await expect(slip).toContainText("$9,500");
  await expect(slip).toContainText("39.6%");
});

test("@claim:m1-margin-risk names the cost that crosses the floor", async ({ page }) => {
  await page.goto("/demo/chains/autumn-launch-films");
  await page.getByRole("textbox", { name: "Subcontractor", exact: true }).fill("Mara Bell");
  await page.getByLabel("Work covered").fill("Location sound mix");
  await page.getByLabel("Amount in USD").fill("6000");
  await page.getByRole("button", { name: "Add commitment" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Expected margin is $1,300 below this job’s floor after Location sound mix was added.",
  );
  await expect(page.getByLabel("Margin check")).toContainText("$3,500");
});

test("@claim:m1-linked-status keeps approval and invoice state after reload", async ({ page }) => {
  await page.goto("/demo/chains/autumn-launch-films");
  await page.getByRole("button", { name: "Approve revision" }).click();
  await expect(page.getByText("Approved Social cut-down revision.")).toBeVisible();
  await page.getByRole("button", { name: "Mark invoice sent" }).click();
  await expect(page.getByText("Marked Final delivery as sent.")).toBeVisible();
  await page.reload();
  const scopeRow = page.getByRole("listitem").filter({ hasText: "Social cut-down revision" });
  const invoiceRow = page.getByRole("listitem").filter({ hasText: "Final delivery" });
  await expect(scopeRow).toContainText("Approved");
  await expect(invoiceRow).toContainText("Sent");
});

test("@claim:m1-demo-no-account opens a usable sample without CIAM", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (req) => requests.push(req.url()));
  await page.goto("/?demo=1");
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole("heading", { name: "Job margin register" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Annual report microsite" })).toBeVisible();
  expect(requests.some((url) => /ciamlogin|login\.microsoftonline|billing|checkout/.test(url))).toBe(false);
  expect(requests.filter((url) => url.includes("/api/")).every((url) => url.includes("/api/v1/demo/"))).toBe(true);
});

test("@claim:m1-demo-reset discards changes and invalidates the old workspace", async ({ page, context, baseURL }) => {
  await page.goto("/demo/chains/autumn-launch-films");
  await expect(page.getByRole("heading", { name: "Autumn launch films" })).toBeVisible();
  const oldCookie = (await context.cookies()).find((cookie) => cookie.name === "smc_demo");
  expect(oldCookie).toBeTruthy();
  await page.getByRole("textbox", { name: "Subcontractor", exact: true }).fill("Mara Bell");
  await page.getByLabel("Work covered").fill("Location sound mix");
  await page.getByLabel("Amount in USD").fill("6000");
  await page.getByRole("button", { name: "Add commitment" }).click();
  await page.getByRole("button", { name: "Reset demo" }).click();
  const dialog = page.getByRole("dialog", { name: "Reset the sample?" });
  await dialog.getByRole("button", { name: "Reset demo" }).click();
  await expect(page).toHaveURL(/\/demo$/);
  const autumn = page.getByRole("listitem").filter({ hasText: "Autumn launch films" });
  await expect(autumn).toContainText("$14,500");

  const oldWorkspace = await request.newContext({
    baseURL,
    extraHTTPHeaders: { Cookie: `smc_demo=${oldCookie!.value}`, "X-Forwarded-For": `203.0.${115 + (Number.parseInt(process.env.PLAYWRIGHT_IP_OFFSET ?? "0", 10) || 0)}.99` },
  });
  const response = await oldWorkspace.get("/api/v1/demo/chains");
  expect(response.status()).toBe(401);
  await oldWorkspace.dispose();
});

test("@claim:m1-demo-fixtures loads the three documented original sample jobs", async ({ page }) => {
  const provenance = JSON.parse(readFileSync(".factory/demo-fixtures.json", "utf8")) as {
    agency: string;
    provenance: string;
    jobs: Array<{ id: string; name: string }>;
  };
  expect(provenance.agency).toBe("Northline Studio");
  expect(provenance.provenance).toContain("original fictional fixtures");
  expect(provenance.jobs).toEqual([
    { id: "autumn-launch-films", name: "Autumn launch films" },
    { id: "annual-report-microsite", name: "Annual report microsite" },
    { id: "field-interview-edit", name: "Field interview edit" },
  ]);
  await page.goto("/demo");
  const register = page.getByRole("list", { name: "Sample job chains" });
  await expect(register.getByRole("listitem")).toHaveCount(3);
  for (const job of provenance.jobs) await expect(register.getByRole("link", { name: job.name })).toBeVisible();
});

test("@claim:m1-sample-workflow completes every documented sample action", async ({ page }) => {
  await page.goto("/demo/chains/new");
  await page.getByLabel("Job name").fill("Editorial photography");
  await page.getByLabel("Contracting client").fill("Grove House");
  await page.getByLabel("Approved work").fill("Three-day product photography shoot");
  await page.getByLabel("Client commitment in USD").fill("10000");
  await page.getByLabel("Margin floor").fill("25");
  await page.getByRole("textbox", { name: "Subcontractor", exact: true }).fill("Inez Cole");
  await page.getByLabel("Work covered").fill("Photography");
  await page.getByLabel("Committed cost in USD").fill("5000");
  await page.getByRole("button", { name: "Create job chain" }).click();
  await expect(page.getByRole("heading", { name: "Editorial photography" })).toBeVisible();
  await page.goto("/demo/chains/autumn-launch-films");
  await page.getByRole("textbox", { name: "Subcontractor", exact: true }).fill("Mara Bell");
  await page.getByLabel("Work covered").fill("Location sound mix");
  await page.getByLabel("Amount in USD").fill("1");
  await page.getByRole("button", { name: "Add commitment" }).click();
  await page.getByRole("button", { name: "Approve revision" }).click();
  await page.getByRole("button", { name: "Mark invoice sent" }).click();
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.getByRole("dialog", { name: "Reset the sample?" }).getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByRole("list", { name: "Sample job chains" }).getByRole("listitem")).toHaveCount(3);
});

test("@claim:m1-product-boundaries exposes no tax, worker classification, payment collection, or invoice-sending action", async ({ page }) => {
  await page.goto("/demo/chains/autumn-launch-films");
  const controls = await page.getByRole("button").allTextContents();
  expect(controls.join(" ")).not.toMatch(/calculate tax|classify worker|collect (money|payment)|send invoice/i);
  const response = await page.request.get("/api/v1/demo/chains/autumn-launch-films");
  const body = await response.json();
  const keys = JSON.stringify(body);
  expect(keys).not.toMatch(/payroll_tax|worker_(status|classification)|payment_collection|send_invoice/i);
  await expect(page.getByRole("button", { name: "Mark invoice sent" })).toBeVisible();
});

test("@claim:m1-csv-import maps and dry-runs the bundled CSV before importing two jobs", async ({ page }) => {
  await page.goto("/demo/import");
  await page.getByRole("button", { name: "Load bundled sample CSV" }).click();
  await expect(page.getByText("Loaded sample-job-chains.csv.")).toBeVisible();
  await page.getByRole("button", { name: "Check import" }).click();
  await expect(page.getByText("2 valid jobs. 0 problems.")).toBeVisible();
  await expect(page.getByText("Row 2: Museum audio guide")).toBeVisible();
  await page.getByRole("button", { name: "Import 2 jobs" }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole("link", { name: "Museum audio guide" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Spring catalogue" })).toBeVisible();
  await expect(page.locator(".summary-strip").getByText("5", { exact: true })).toBeVisible();
});

test("@claim:m1-data-export downloads complete CSV and JSON job-chain exports", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/demo");
  await expect(page.getByRole("button", { name: "Export CSV" })).toBeVisible();
  const beforeExports = requests.length;
  const csvDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const csv = await (await csvDownload).createReadStream();
  const csvText = await streamText(csv);
  expect(csvText.split("\r\n").filter(Boolean)).toHaveLength(4);
  expect(csvText).toContain("job_id,job_name,contracting_client");
  expect(csvText).toContain("autumn-launch-films,Autumn launch films,Cinder & Co.");

  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const json = await (await jsonDownload).createReadStream();
  const parsed = JSON.parse(await streamText(json)) as { schema_version: number; chains: Array<{ id: string }> };
  expect(parsed.schema_version).toBe(1);
  expect(parsed.chains).toHaveLength(3);
  expect(parsed.chains.map((chain) => chain.id)).toContain("autumn-launch-films");
  expect(requests).toHaveLength(beforeExports);
});

async function streamText(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

test("@claim:m1-demo-isolation-expiry isolates workspaces for no more than 24 hours", async ({ baseURL }) => {
  const runOffset = Number.parseInt(process.env.PLAYWRIGHT_IP_OFFSET ?? "0", 10) || 0;
  const first = await request.newContext({ baseURL, extraHTTPHeaders: { "X-Forwarded-For": `203.0.${116 + runOffset}.41` } });
  const second = await request.newContext({ baseURL, extraHTTPHeaders: { "X-Forwarded-For": `203.0.${116 + runOffset}.42` } });
  const before = Math.floor(Date.now() / 1000);
  const firstCreated = await first.post("/api/v1/demo/workspaces");
  const secondCreated = await second.post("/api/v1/demo/workspaces");
  expect(firstCreated.status()).toBe(201);
  expect(secondCreated.status()).toBe(201);
  const expiry = (await firstCreated.json()).expires_at as number;
  const after = Math.floor(Date.now() / 1000);
  expect(expiry).toBeGreaterThan(before);
  expect(expiry).toBeLessThanOrEqual(after + 24 * 60 * 60);

  const changed = await first.post("/api/v1/demo/chains/autumn-launch-films/costs", {
    headers: { "Idempotency-Key": "isolation-cost-change" },
    data: { subcontractor: "Mara Bell", role: "Location sound mix", amount_minor: 600000 },
  });
  expect(changed.status()).toBe(201);
  const untouched = await second.get("/api/v1/demo/chains/autumn-launch-films");
  expect(untouched.status()).toBe(200);
  expect((await untouched.json()).calculation.expected_margin_minor).toBe(950000);
  await first.dispose();
  await second.dispose();
});

test("@claim:m1-public-privacy keeps the public and demo flow on this origin", async ({ page }) => {
  const origins = new Set<string>();
  page.on("request", (request) => origins.add(new URL(request.url()).origin));
  await page.goto("/");
  await page.getByRole("link", { name: "Try it with sample data" }).click();
  await page.getByRole("link", { name: "Autumn launch films" }).click();
  await page.getByRole("textbox", { name: "Subcontractor", exact: true }).fill("Mara Bell");
  await page.getByLabel("Work covered").fill("Location sound mix");
  await page.getByLabel("Amount in USD").fill("1");
  await page.getByRole("button", { name: "Add commitment" }).click();
  expect([...origins]).toEqual([new URL(page.url()).origin]);
  const scripts = await page.locator("script[src]").evaluateAll((elements) => elements.map((element) => (element as HTMLScriptElement).src));
  expect(scripts.every((source) => new URL(source).origin === new URL(page.url()).origin)).toBe(true);
  expect(await page.locator('[data-analytics], script[src*="analytics"], script[src*="segment"], script[src*="plausible"]').count()).toBe(0);
});

test("@claim:m1-plan-prices shows exact planned prices without a purchase action", async ({ page }) => {
  await page.goto("/");
  const pricing = page.locator("#pricing");
  await expect(pricing).toContainText("Studio");
  await expect(pricing).toContainText("$79 per agency each month");
  await expect(pricing).toContainText("25 job chains active");
  await expect(pricing).toContainText("Portfolio");
  await expect(pricing).toContainText("$159 per agency each month");
  await expect(pricing).toContainText("100 job chains active");
  await expect(pricing.getByRole("link", { name: /buy|subscribe|checkout/i })).toHaveCount(0);
  await expect(pricing.getByRole("button", { name: /buy|subscribe|checkout/i })).toHaveCount(0);
});
