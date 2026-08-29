import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  const runOffset = Number.parseInt(process.env.PLAYWRIGHT_IP_OFFSET ?? "0", 10) || 0;
  const projectOctet = (testInfo.project.name === "mobile" ? 117 : 118) + runOffset;
  const testOctet = [...testInfo.testId].reduce((total, character) => total + character.charCodeAt(0), 0) % 200 + 10;
  await page.setExtraHTTPHeaders({ "X-Forwarded-For": `203.0.${projectOctet}.${testOctet}` });
});

for (const path of ["/", "/demo", "/demo/import", "/demo/chains/new", "/demo/chains/autumn-launch-films", "/start", "/privacy", "/terms", "/404"]) {
  test(`route ${path} has semantics, a unique title, and no serious axe findings`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page).toHaveTitle(/.+ — Subcontractor Margin Chain|Subcontractor Margin Chain — .+/);
    expect(await page.locator("html").getAttribute("lang")).toBe("en");
    const results = await new AxeBuilder({ page })
      .options({ rules: { "label-content-name-mismatch": { enabled: true } } })
      .analyze();
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

test("the visible wordmark is contained in its accessible name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "MC Margin Chain" })).toBeVisible();
});

test("the first screen states the job, audience, sample action, and three facts", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Protect margin before work starts." })).toBeVisible();
  await expect(page.getByText("For boutique agencies that hire subcontractors")).toBeVisible();
  await expect(page.getByRole("link", { name: "Try it with sample data" })).toBeVisible();
  const facts = page.getByRole("list", { name: "Product facts" });
  await expect(facts.getByRole("listitem")).toHaveCount(3);
  const box = await facts.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
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

test("public and demo routes and both dialogs run without console or page errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));
  for (const path of ["/", "/demo", "/demo/import", "/demo/chains/new", "/demo/chains/autumn-launch-films", "/privacy", "/terms"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  await page.goto("/demo");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByRole("dialog", { name: "Reset the sample?" })).toBeVisible();
  await page.getByRole("button", { name: "Keep my changes" }).click();
  await page.getByRole("link", { name: "Start for real" }).click();
  await expect(page.getByRole("heading", { name: "Create your agency workspace." })).toBeVisible();
  expect(errors).toEqual([]);
});

test("a fresh saved-workspace deep link opens setup without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/app/chains");
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByRole("heading", { name: "Create your agency workspace." })).toBeFocused();
  expect(errors).toEqual([]);
});

test("every sitemap URL returns a successful page and includes setup", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  const paths = [...xml.matchAll(/<loc>https:\/\/subcontractor-margin-chain\.sociobot\.in([^<]*)<\/loc>/g)].map((match) => match[1] || "/");
  expect(paths).toContain("/start");
  expect(paths).not.toContain("/404");
  for (const path of paths) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});

test("a producer sees a deliberate role-limited workspace without protected values", async ({ page }) => {
  await page.goto("/start");
  await page.getByLabel("Agency name").fill("Role View Agency");
  await page.getByRole("button", { name: "Create agency workspace" }).click();
  await expect(page).toHaveURL(/\/app\/chains$/);
  await expect(page.getByRole("heading", { name: "Job margin register" })).toBeVisible();
  const createdStatus = await page.evaluate(async () => {
    const response = await fetch("/api/v1/app/chains", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "Idempotency-Key": "role-browser-chain" },
      body: JSON.stringify({
        name: "Protected launch",
        contracting_client: "Hidden Client Name",
        end_client: "Hidden End Client",
        approved_scope: "Campaign delivery",
        client_commitment_minor: 1_500_000,
        margin_floor_basis_points: 2500,
        subcontractor: "Hidden Partner Name",
        cost_role: "Production",
        cost_minor: 600_000,
      }),
    });
    return response.status;
  });
  expect(createdStatus).toBe(201);
  await page.goto("/settings/team");
  await page.getByLabel("Team member name").fill("Production lead");
  await page.getByLabel("Role").selectOption("producer");
  await page.getByRole("button", { name: "Create private access link" }).click();
  const accessUrl = await page.locator("code").textContent();
  await page.goto(accessUrl!);
  await expect(page).toHaveURL(/\/app\/chains$/);
  await expect(page.getByText("Client identities hidden for this role")).toBeVisible();
  await expect(page.getByText("Subcontractor costs and margin are hidden for this role.")).toBeVisible();
  await expect(page.getByText("Hidden Client Name")).toHaveCount(0);
  await expect(page.getByText("Hidden End Client")).toHaveCount(0);
  await expect(page.getByText("Hidden Partner Name")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Add a job chain" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Import CSV" })).toHaveCount(0);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});

test("each route updates title, description, canonical, Open Graph, and Twitter metadata", async ({ page }) => {
  const cases = [
    ["/demo", "Demo — Subcontractor Margin Chain", "Try the margin chain with isolated sample agency data."],
    ["/start", "Set up your agency — Subcontractor Margin Chain", "Create a saved agency workspace for real job chains."],
    ["/privacy", "Privacy — Subcontractor Margin Chain", "How the public site and isolated demo handle data."],
    ["/terms", "Terms — Subcontractor Margin Chain", "Terms for using the public site and sample demo."],
    ["/404", "Page not found — Subcontractor Margin Chain", "Return to Subcontractor Margin Chain or open the sample demo."],
  ] as const;
  for (const [path, title, description] of cases) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    expect(await page.locator('meta[name="description"]').getAttribute("content")).toBe(description);
    expect(await page.locator('meta[property="og:title"]').getAttribute("content")).toBe(title);
    expect(await page.locator('meta[property="og:description"]').getAttribute("content")).toBe(description);
    expect(await page.locator('meta[name="twitter:title"]').getAttribute("content")).toBe(title);
    expect(await page.locator('meta[name="twitter:description"]').getAttribute("content")).toBe(description);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(`https://subcontractor-margin-chain.sociobot.in${path}`);
  }
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

test("in-chain cost errors identify and focus every invalid field", async ({ page }) => {
  let costRequests = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/costs")) costRequests += 1;
  });
  await page.goto("/demo/chains/autumn-launch-films");
  await expect(page.getByRole("heading", { name: "Autumn launch films" })).toBeVisible();
  await page.getByLabel("Amount in USD").fill("1");
  await page.getByRole("button", { name: "Add commitment" }).click();

  const subcontractor = page.getByRole("textbox", { name: "Subcontractor", exact: true });
  const role = page.getByRole("textbox", { name: "Work covered" });
  await expect(subcontractor).toBeFocused();
  await expect(subcontractor).toHaveAttribute("aria-invalid", "true");
  await expect(subcontractor).toHaveAttribute("aria-describedby", "cost-subcontractor-error");
  await expect(page.locator("#cost-subcontractor-error")).toHaveText("Enter the subcontractor name.");
  await expect(role).toHaveAttribute("aria-invalid", "true");
  await expect(role).toHaveAttribute("aria-describedby", "cost-role-error");
  await expect(page.locator("#cost-role-error")).toHaveText("Name the work this commitment covers.");
  expect(costRequests).toBe(0);

  await subcontractor.fill("Mara Bell");
  await role.fill("Location sound mix");
  await page.getByRole("button", { name: "Add commitment" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved Location sound mix" })).toBeVisible();
  expect(costRequests).toBe(1);
});

test("all measured mobile navigation links have 44px touch targets", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo/chains/autumn-launch-films");
  await expect(page.getByRole("heading", { name: "Autumn launch films" })).toBeVisible();
  const links = [
    page.getByRole("link", { name: "MC Margin Chain" }),
    page.getByRole("link", { name: "Job register" }),
    page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }),
    page.getByRole("contentinfo").getByRole("link", { name: "Terms" }),
    page.getByRole("contentinfo").getByRole("link", { name: /Built by Param Factory/ }),
  ];
  for (const link of links) {
    const box = await link.boundingBox();
    expect(box, await link.textContent()).not.toBeNull();
    expect(box!.height, await link.textContent()).toBeGreaterThanOrEqual(44);
  }
});
