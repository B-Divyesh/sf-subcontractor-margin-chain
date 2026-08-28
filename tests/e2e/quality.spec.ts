import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  const projectOctet = testInfo.project.name === "mobile" ? 117 : 118;
  await page.setExtraHTTPHeaders({ "X-Forwarded-For": `203.0.${projectOctet}.${testInfo.parallelIndex + 10}` });
});

for (const path of ["/", "/demo", "/demo/chains/new", "/demo/chains/autumn-launch-films", "/privacy", "/terms", "/404"]) {
  test(`route ${path} has semantics, a unique title, and no serious axe findings`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page).toHaveTitle(/.+ — Subcontractor Margin Chain|Subcontractor Margin Chain — .+/);
    expect(await page.locator("html").getAttribute("lang")).toBe("en");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
  });
}

test("keyboard actions create a chain and reset with focus returned to the heading", async ({ page }) => {
  await page.goto("/demo/chains/new");
  await page.getByLabel("Job name").fill("Editorial photography");
  await page.getByLabel("Contracting client").fill("Grove House");
  await page.getByLabel("Approved work").fill("Three-day product photography shoot");
  await page.getByLabel("Client commitment in USD").fill("10000");
  await page.getByLabel("Margin floor").fill("25");
  await page.getByRole("textbox", { name: "Subcontractor", exact: true }).fill("Inez Cole");
  await page.getByLabel("Work covered").fill("Photography");
  await page.getByLabel("Committed cost in USD").fill("5000");
  await page.getByRole("button", { name: "Create job chain" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Editorial photography" })).toBeFocused();

  await page.getByRole("button", { name: "Reset demo" }).focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Reset the sample?" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  await dialog.getByRole("button", { name: "Reset demo" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Job margin register" })).toBeFocused();
});

test("deep links, back navigation, and route focus work", async ({ page }) => {
  await page.goto("/demo/chains/autumn-launch-films");
  await expect(page.getByRole("heading", { name: "Autumn launch films" })).toBeFocused();
  await page.getByRole("link", { name: "Job register" }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/demo\/chains\/autumn-launch-films$/);
  await expect(page.getByRole("heading", { name: "Autumn launch films" })).toBeFocused();
});

test("the demo explains a failed or offline load", async ({ page }) => {
  await page.goto("/");
  await page.route("**/api/v1/demo/**", (route) => route.abort("internetdisconnected"));
  await page.getByRole("link", { name: "Try it with sample data" }).click();
  await expect(page.getByRole("heading", { name: "The demo is offline" })).toBeVisible();
  await expect(page.getByText("Reconnect, then try again")).toBeVisible();
});

test("public and demo routes load without console or page errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));
  for (const path of ["/", "/demo", "/demo/chains/new", "/demo/chains/autumn-launch-films", "/privacy", "/terms", "/404"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(errors).toEqual([]);
});

test("all internal page links resolve", async ({ page, request }) => {
  await page.goto("/");
  const hrefs = await page.locator("a[href]").evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
  const origin = new URL(page.url()).origin;
  const internal = [...new Set(hrefs.filter((href) => href.startsWith(origin) && !href.includes("#")))];
  for (const href of internal) {
    const response = await request.get(href);
    expect(response.status(), href).toBe(200);
  }
});

test("the 390px layout and 200% text zoom do not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo/chains/autumn-launch-films");
  await page.locator("html").evaluate((element) => { element.style.fontSize = "200%"; });
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
  await expect(page.getByLabel("Margin check")).toBeVisible();
});
