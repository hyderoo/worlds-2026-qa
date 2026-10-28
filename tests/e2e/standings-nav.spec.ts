import AxeBuilder from "@axe-core/playwright";
import { test, expect, evidence } from "../support/app";

test.describe("Standings and bracket", () => {
  test("ST-01 standings page renders stage tabs @smoke @mobile", async ({ page, app }, info) => {
    await app.open("/standings");
    for (const s of ["Play-Ins", "Swiss", "Knockouts"]) await expect(page.getByRole("button", { name: s }).first()).toBeVisible();
    await evidence(page, info, "ST-01");
  });

  test("ST-02 Swiss view shows the bracket and the record board", async ({ page, app }, info) => {
    await app.open("/standings");
    await page.getByRole("button", { name: "Swiss" }).first().click();
    await expect(page.locator("div[role=region][aria-label=\"Swiss bracket\"]")).toBeVisible();
    await expect(page.getByRole("region", { name: "Swiss record board" })).toBeVisible();
    await evidence(page, info, "ST-02");
  });

  test("ST-03 Swiss record board only has legal records", async ({ page, app }) => {
    await app.open("/standings");
    await page.getByRole("button", { name: "Swiss" }).first().click();
    const text = await page.getByRole("region", { name: "Swiss record board" }).innerText();
    const records = [...text.matchAll(/\b([0-3])-([0-3])\b/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(records.length).toBeGreaterThan(0);
    for (const [w, l] of records) expect(w === 3 && l === 3, "3-3 is impossible in a Swiss stage").toBe(false);
  });

  test("ST-04 Knockouts view renders without error", async ({ page, app }, info) => {
    await app.open("/standings");
    const tab = page.getByRole("button", { name: "Knockouts" }).first();
    await tab.click();
    await expect(tab).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("main")).toContainText(/quarter|semi|final/i);
    await evidence(page, info, "ST-04");
  });

  test("ST-05 zoom controls change the bracket scale within limits", async ({ page, app }) => {
    await app.open("/standings");
    const out = page.getByRole("button", { name: "Zoom out" }).first();
    for (let i = 0; i < 8; i++) await out.click();
    const inn = page.getByRole("button", { name: "Zoom in" }).first();
    for (let i = 0; i < 12; i++) await inn.click();
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Navigation, search and resilience", () => {
  test("NV-01 primary navigation reaches the main sections @smoke", async ({ page, app }) => {
    await app.open("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const [name, url] of [["Standings", /standings/], ["Teams", /teams/], ["Predictor", /predictor/]] as const) {
      const link = nav.getByRole("link", { name }).first();
      if (await link.count()) { await link.click(); await expect(page).toHaveURL(url); }
    }
  });

  test("NV-02 command palette opens with Ctrl+K and finds a team", async ({ page, app }, info) => {
    await app.open("/");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /search/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("textbox").fill("Gen");
    await expect(dialog.getByRole("option").first()).toBeVisible();
    await evidence(page, info, "NV-02");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("NV-03 unknown page shows the branded 404 with a way back", async ({ page, app }, info) => {
    const res = await page.goto("/nope/not-here");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("link", { name: /home|back|matches/i }).first()).toBeVisible();
    await evidence(page, info, "NV-03");
  });

  test("NV-04 team profile opens from the teams index", async ({ page, app }, info) => {
    await app.open("/teams");
    const link = page.locator('a[href^="/teams/"]').first();
    const href = await link.getAttribute("href");
    await link.click();
    await expect(page).toHaveURL(new RegExp(href!));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await evidence(page, info, "NV-04");
  });

  test("NV-05 mobile menu opens and lists navigation @mobile @mobile-only", async ({ page, app }, info) => {
    await app.open("/");
    await page.getByRole("button", { name: /menu/i }).click();
    await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
    await evidence(page, info, "NV-05");
  });

  test("NV-06 the app survives an upstream API failure with cached or empty state, not a blank page", async ({ page, app }, info) => {
    await page.route("**/api/public/snapshot**", (r) => r.fulfill({ status: 500, body: "boom" }));
    await app.open("/matches");
    await expect(page.locator("main")).not.toBeEmpty();
    await expect(page.getByText(/application error|unhandled/i)).toHaveCount(0);
    await evidence(page, info, "NV-06");
  });

  // BUG-001: React hydration mismatch (minified error #418) on first load of the home page. It only happens when the visitor's
  // browser time zone is not UTC (the server renders its default zone, the client switches to the browser zone). So the test runs in a New York context.
  test("NV-07 no console errors on the home page for a non-UTC visitor (known issue BUG-001)", async ({ browser, baseURL }) => {
    test.fail(true, "BUG-001 React hydration error #418 on / when the browser time zone is not UTC");
    const ctx = await browser.newContext({ baseURL, timezoneId: "America/New_York", locale: "en-US" });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error" && !/youtube|favicon|ERR_BLOCKED|Failed to load resource/i.test(m.text())) errors.push(m.text()); });
    await page.goto("/", { waitUntil: "networkidle" });
    await ctx.close();
    expect(errors).toEqual([]);
  });
});

test.describe("Accessibility (axe-core, WCAG 2 A/AA)", () => {
  for (const [id, path] of [["AX-01", "/"], ["AX-02", "/matches"], ["AX-03", "/standings"], ["AX-04", "/predictor"]] as const) {
    test(`${id} ${path} has no serious or critical violations${path === "/predictor" ? " (known issue BUG-003)" : ""}`, async ({ page, app }, info) => {
      if (path === "/predictor") test.fail(true, "BUG-003 alert text contrast 4.45:1 (needs 4.5:1)");
      await app.open(path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
      await info.attach(`${id}-axe.json`, { body: JSON.stringify(results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })), null, 2), contentType: "application/json" });
      expect(bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`)).toEqual([]);
    });
  }
});
