import { test, expect, evidence, readPrefs } from "../support/app";

test.describe("Match center", () => {
  test("MC-01 lists every series and shows a count @smoke @mobile", async ({ page, app }, info) => {
    await app.open("/matches");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/^\d+ matches?/)).toBeVisible();
    const cards = page.locator('a[href^="/matches/"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(40);
    await evidence(page, info, "MC-01");
  });

  test("MC-02 stage filter narrows the list and is reflected in the URL", async ({ page, app }, info) => {
    await app.open("/matches");
    const all = await page.locator('a[href^="/matches/"]').count();
    await page.getByRole("combobox", { name: "Stage" }).selectOption({ label: "Swiss" });
    await expect(page).toHaveURL(/stage=/);
    const swiss = await page.locator('a[href^="/matches/"]').count();
    expect(swiss).toBeGreaterThan(0);
    expect(swiss).toBeLessThan(all);
    await expect(page.getByText(/Play-Ins · Bo5/)).toHaveCount(0);
    await evidence(page, info, "MC-02");
  });

  test("MC-03 filtered views can be shared by URL", async ({ page, app }) => {
    await app.open("/matches");
    await page.getByRole("combobox", { name: "Stage" }).selectOption({ label: "Play-Ins" });
    await expect(page).toHaveURL(/stage=Play-Ins/);
    const url = page.url();
    await page.goto(url);
    await expect(page.getByRole("combobox", { name: "Stage" })).toHaveValue(/play/i);
    await expect(page.getByText(/Swiss · Bo1/)).toHaveCount(0);
  });

  test("MC-04 team search finds only that team's series", async ({ page, app }, info) => {
    await app.open("/matches");
    await page.getByLabel("Search team").fill("T1");
    const cards = page.locator('a[href^="/matches/"]');
    await expect(async () => {
      const n = await cards.count();
      expect(n).toBeGreaterThan(0);
      expect(n).toBeLessThan(20);
    }).toPass();
    for (const t of await cards.allInnerTexts()) expect(t).toMatch(/\bT1\b/);
    await evidence(page, info, "MC-04");
  });

  test("MC-05 a search with no result shows an empty count instead of a crash", async ({ page, app }) => {
    await app.open("/matches");
    await page.getByLabel("Search team").fill("zzzzqqq");
    await expect(page.getByText(/^0 matches/)).toBeVisible();
    await expect(page.locator('a[href^="/matches/"]')).toHaveCount(0);
  });

  test("MC-06 reset restores the full list", async ({ page, app }) => {
    await app.open("/matches");
    const all = await page.locator('a[href^="/matches/"]').count();
    await page.getByLabel("Search team").fill("T1");
    await page.getByRole("button", { name: /reset/i }).or(page.getByRole("link", { name: /reset/i })).first().click();
    await expect(page.locator('a[href^="/matches/"]')).toHaveCount(all);
  });

  test("MC-07 a series opens its detail page with both teams", async ({ page, app }, info) => {
    await app.open("/matches");
    const card = page.locator('a[href^="/matches/"]').first();
    const text = await card.innerText();
    await card.click();
    await expect(page).toHaveURL(/\/matches\/\d+/);
    const teams = text.split("\n").filter((l) => /^[A-Za-z]/.test(l) && l.length > 3 && !/Bo\d|SELESAI|Completed|Play-Ins|Swiss/i.test(l));
    await expect(page.locator("main")).toContainText(teams[0] ?? "");
    await evidence(page, info, "MC-07");
  });

  test("MC-08 invalid match id shows a not-found message with a way back", async ({ page, app }) => {
    await page.goto("/matches/000");
    await expect(page.getByText("Match not found")).toBeVisible();
    await expect(page.getByRole("link", { name: /back to matches/i })).toBeVisible();
  });

  // BUG-002: the not-found view is served with HTTP 200 (soft 404). Expected to fail until the route returns 404.
  test("MC-08b invalid match id responds with HTTP 404 (known issue BUG-002)", async ({ page }) => {
    test.fail(true, "BUG-002 soft 404 on /matches/<unknown id>");
    const res = await page.goto("/matches/000");
    expect(res?.status()).toBe(404);
  });

  test("MC-09 match list has no horizontal overflow on a phone @mobile @mobile-only", async ({ page, app }, info) => {
    await app.open("/matches");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await evidence(page, info, "MC-09");
  });
});

test.describe("Preferences", () => {
  test("TZ-01 changing the time zone shifts every kickoff time consistently", async ({ page, app }, info) => {
    await app.open("/matches", { tz: "Asia/Jakarta", tzSet: true });
    const first = page.locator('a[href^="/matches/"]').first();
    const before = await first.innerText();
    expect(before).toMatch(/WIB/);
    await page.getByRole("button", { name: /settings/i }).click();
    await page.getByLabel(/time zone/i).selectOption({ label: "JST (Tokyo)" });
    await page.keyboard.press("Escape");
    await expect(first).toContainText("JST");
    const after = await first.innerText();
    const h = (s: string) => Number(/(\d{2}):\d{2} (WIB|JST)/.exec(s)![1]);
    // Jakarta is UTC+7, Tokyo is UTC+9
    expect((h(after) - h(before) + 24) % 24).toBe(2);
    expect((await readPrefs(page)).tz).toBe("Asia/Tokyo");
    await evidence(page, info, "TZ-01");
  });

  test("TZ-02 the chosen time zone survives a reload", async ({ page, app }) => {
    await app.open("/matches", { tz: "Asia/Jakarta", tzSet: true });
    await page.getByRole("button", { name: /settings/i }).click();
    await page.getByLabel(/time zone/i).selectOption({ label: "CET/CEST (Paris)" });
    await page.reload();
    await expect(page.locator('a[href^="/matches/"]').first()).toContainText(/CET|CEST/);
  });

  test("LG-01 switching language translates the interface and persists", async ({ page, app }, info) => {
    await app.open("/matches");
    await page.getByRole("button", { name: /settings/i }).click();
    await page.getByLabel(/^language$/i).selectOption({ label: "日本語" });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: /設定/ })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: /設定/ })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", /ja/);
    await evidence(page, info, "LG-01");
  });

  test("LG-02 team names are not translated", async ({ page, app }) => {
    await app.open("/matches", { lang: "ja" });
    await expect(page.locator("main")).toContainText(/T1|Gen\.G|Hanwha/);
  });
});
