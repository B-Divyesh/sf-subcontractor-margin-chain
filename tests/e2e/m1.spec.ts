import { expect, request, test } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  const projectOctet = testInfo.project.name === "mobile" ? 113 : 114;
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
    extraHTTPHeaders: { Cookie: `smc_demo=${oldCookie!.value}`, "X-Forwarded-For": "203.0.115.99" },
  });
  const response = await oldWorkspace.get("/api/v1/demo/chains");
  expect(response.status()).toBe(401);
  await oldWorkspace.dispose();
});

test("@claim:m1-plan-prices shows exact plans without a pre-M2 purchase action", async ({ page }) => {
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
