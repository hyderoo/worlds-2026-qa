import type { Page } from "@playwright/test";
import { test, expect, evidence, seedPrefs } from "../support/app";

const cards = (page: Page) => page.locator('a[href^="/matches/"]');
const countLine = async (page: Page) => Number(/^(\d+) match/.exec(await page.getByText(/^\d+ matches?/).innerText())![1]);

test.describe("Match filters: positive paths", () => {
  test("MC-10 each status filter shows only that status and its count matches the list", async ({ page, app }, info) => {
    await app.open("/matches");
    await page.getByRole("button", { name: "Completed", exact: true }).click();
    await expect(page).toHaveURL(/status=completed/);
    await expect(async () => expect(await countLine(page)).toBe(await cards(page).count())).toPass();
    expect(await cards(page).count()).toBeGreaterThan(0);
    for (const t of await cards(page).allInnerTexts()) expect(t).toMatch(/FINAL/);
    await evidence(page, info, "MC-10", "completed");
    await page.getByRole("button", { name: "Upcoming", exact: true }).click();
    await expect(page).toHaveURL(/status=scheduled/);
    await expect(async () => expect(await countLine(page)).toBe(await cards(page).count())).toPass();
    for (const t of await cards(page).allInnerTexts()) expect(t).not.toMatch(/FINAL/);
  });

  test("MC-11 date filter keeps only that day", async ({ page, app }, info) => {
    await app.open("/matches?date=2026-10-24", { tz: "Asia/Jakarta", tzSet: true });
    await expect(cards(page).first()).toBeVisible();
    const days = await page.locator("section[aria-label]").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
    expect(days.length).toBeGreaterThan(0);
    for (const d of days) expect(d).toMatch(/24 October/i);
    await evidence(page, info, "MC-11");
  });

  test("MC-12 region filter returns only series with a team from that region", async ({ page, app, request }, info) => {
    const snap = await (await request.get("/api/public/snapshot")).json();
    const korean = new Set<string>(snap.teams.filter((t: any) => t.league === "LCK").map((t: any) => t.name));
    expect(korean.size).toBeGreaterThan(0);
    await app.open("/matches");
    await page.getByRole("combobox", { name: "Region" }).selectOption({ label: "Korea" });
    await expect(page).toHaveURL(/region=/);
    await expect(cards(page).first()).toBeVisible();
    for (const t of await cards(page).allInnerTexts()) {
      expect([...korean].some((n) => t.includes(n)), `no Korean team in: ${t.replace(/\n/g, " ")}`).toBe(true);
    }
    await evidence(page, info, "MC-12");
  });

  test("MC-13 calendar view switch is reflected in the URL and keeps the list", async ({ page, app }, info) => {
    await app.open("/matches");
    await page.getByRole("button", { name: "Calendar", exact: true }).click();
    await expect(page).toHaveURL(/view=calendar/);
    await expect(page.locator("main")).toContainText(/\d{2}:\d{2}/);
    await evidence(page, info, "MC-13");
    await page.getByRole("button", { name: "List", exact: true }).click();
    await expect(cards(page).first()).toBeVisible();
  });

  test("MC-14 combined stage and team filters narrow together", async ({ page, app }) => {
    await app.open("/matches?stage=Swiss");
    const swiss = await cards(page).count();
    await page.getByLabel("Search team").fill("Gen.G");
    await expect(async () => {
      const n = await cards(page).count();
      expect(n).toBeGreaterThan(0);
      expect(n).toBeLessThan(swiss);
    }).toPass();
    for (const t of await cards(page).allInnerTexts()) expect(t).toMatch(/Swiss/);
  });
});

test.describe("Match filters: negative and edge paths", () => {
  test("NG-01 a date with no matches shows guidance, not a blank page", async ({ page, app }, info) => {
    await app.open("/matches?date=2099-01-01");
    await expect(page.getByText(/^0 matches/)).toBeVisible();
    await expect(page.getByText("No matches fit these filters")).toBeVisible();
    await evidence(page, info, "NG-01");
  });

  test("NG-02 an unknown stage in the URL does not crash the page", async ({ page, app }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await app.open("/matches?stage=Bogus");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/^\d+ matches?/)).toBeVisible();
    expect(errors.filter((e) => !/#418/.test(e))).toEqual([]);
  });

  test("NG-03 a malformed date in the URL does not crash the page", async ({ page, app }) => {
    await app.open("/matches?date=garbage");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/^\d+ matches?/)).toBeVisible();
  });

  test("NG-04 markup typed into search is shown as text and never executed", async ({ page, app }) => {
    await app.open("/matches");
    await page.getByLabel("Search team").fill("<img src=x onerror=window.__pwned=1><script>window.__pwned=2</script>");
    await expect(page.getByText(/^0 matches/)).toBeVisible();
    expect(await page.evaluate(() => (window as any).__pwned)).toBeUndefined();
    await expect(page.locator("main img[src='x']")).toHaveCount(0);
  });

  test("NG-05 a very long search string is handled", async ({ page, app }) => {
    await app.open("/matches");
    await page.getByLabel("Search team").fill("a".repeat(5000));
    await expect(page.getByText(/^0 matches/)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("NG-06 My teams with nothing followed shows an empty state", async ({ page, app }) => {
    await app.open("/matches");
    await page.getByRole("button", { name: "My teams", exact: true }).click();
    await expect(page.getByText(/^0 matches/)).toBeVisible();
    await expect(page.getByText("No matches fit these filters")).toBeVisible();
  });

  test("NG-07 an unknown team code returns a real 404 page", async ({ page, app }, info) => {
    const res = await page.goto("/teams/ZZZ");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await evidence(page, info, "NG-07");
  });

  test("NG-08 corrupted saved preferences fall back to defaults", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("w26:prefs:v1", "{not json"));
    await page.goto("/matches");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(cards(page).first()).toBeVisible();
  });

  test("NG-09 an unknown saved language falls back without showing raw translation keys", async ({ page, app }) => {
    await app.open("/matches", { lang: "xx" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/\b(hdr|spoiler|path)\.[a-z]+/i);
  });

  // BUG-005: a saved time zone id the app does not know (tampered storage, or a zone removed in a later release) sends every page into the error screen, and Reload cannot recover because the bad value is persisted.
  test("NG-10 an unknown saved time zone still renders kickoff times (known issue BUG-005)", async ({ page, app }) => {
    test.fail(true, "BUG-005 unknown saved time zone crashes the app into the error boundary");
    await app.open("/matches", { tz: "Mars/Olympus", tzSet: true });
    await expect(cards(page).first()).toBeVisible();
    await expect(cards(page).first()).toContainText(/\d{2}:\d{2}/);
  });
});

const routes: [string, string, RegExp][] = [
  ["RT-01", "/", /Worlds 2026/],
  ["RT-02", "/matches", /Every series/],
  ["RT-03", "/standings", /Bracket and standings/],
  ["RT-04", "/predictor", /Predictor/],
  ["RT-05", "/teams", /The field/],
  ["RT-06", "/teams/T1", /T1/],
  ["RT-07", "/today", /Today/],
  ["RT-08", "/about", /Data and sync/],
  ["RT-09", "/compare", /Compare teams/],
  ["RT-10", "/daily", /Daily recap/],
  ["RT-11", "/groups", /Friends league/],
  ["RT-12", "/recaps", /Match recaps/],
  ["RT-13", "/stats", /Statistics/],
  ["RT-14", "/predictions", /My predictions/],
];
test.describe("Every public route renders", () => {
  for (const [id, path, h1] of routes) {
    test(`${id} ${path} responds 200 with its heading`, async ({ page, app }) => {
      await seedPrefs(page);
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 }).first()).toHaveText(h1);
    });
  }
});

const langs: [string, string, string][] = [["LG-03", "id", "Bahasa Indonesia"], ["LG-04", "ms", "Bahasa Melayu"], ["LG-05", "ja", "日本語"], ["LG-06", "ko", "한국어"], ["LG-07", "zh", "中文"], ["LG-08", "fr", "Français"], ["LG-09", "es", "Español"], ["LG-10", "pt", "Português"]];
test.describe("Each language loads", () => {
  for (const [id, code, name] of langs) {
    test(`${id} ${name} sets the document language and shows no raw keys`, async ({ page, app }) => {
      await app.open("/matches", { lang: code });
      await expect(page.locator("html")).toHaveAttribute("lang", new RegExp(`^${code}`));
      await expect(page.locator("body")).not.toContainText(/\b(hdr|spoiler|path)\.[a-z]+/i);
      await expect(cards(page).first()).toBeVisible();
    });
  }
});

const zones: [string, string, string, RegExp][] = [["TZ-03", "WITA (Makassar)", "Asia/Makassar", /WITA/], ["TZ-04", "WIT (Jayapura)", "Asia/Jayapura", /\d{2}:\d{2} WIT(?!A)/], ["TZ-05", "SGT (Singapore)", "Asia/Singapore", /SGT/], ["TZ-06", "KST (Seoul)", "Asia/Seoul", /KST/], ["TZ-07", "UTC", "UTC", /UTC/], ["TZ-08", "ET (New York)", "America/New_York", /E[SD]?T/], ["TZ-09", "PT (Los Angeles)", "America/Los_Angeles", /PT|PDT|PST/]];
test.describe("Each time zone option", () => {
  for (const [id, label, iana, abbr] of zones) {
    test(`${id} ${label} labels kickoff times and is stored as ${iana}`, async ({ page, app }) => {
      await app.open("/matches");
      await page.getByRole("button", { name: /settings/i }).click();
      await page.getByLabel(/time zone/i).selectOption({ label });
      await page.keyboard.press("Escape");
      await expect(cards(page).first()).toContainText(abbr);
      expect((await page.evaluate(() => JSON.parse(localStorage.getItem("w26:prefs:v1")!))).tz).toBe(iana);
    });
  }

  test("TZ-10 Los Angeles is 14 hours behind Jakarta for an October kickoff", async ({ page, app }) => {
    await app.open("/matches", { tz: "Asia/Jakarta", tzSet: true });
    const hour = (s: string) => Number(/(\d{2}):\d{2}/.exec(s)![1]);
    const before = hour(await cards(page).first().innerText());
    await page.getByRole("button", { name: /settings/i }).click();
    await page.getByLabel(/time zone/i).selectOption({ label: "PT (Los Angeles)" });
    await page.keyboard.press("Escape");
    await expect(cards(page).first()).toContainText(/PT|PDT|PST/);
    const after = hour(await cards(page).first().innerText());
    expect((before - after + 24) % 24).toBe(14);
  });
});

test.describe("Keyboard and dialogs", () => {
  test("KB-01 the skip link is the first tab stop and moves focus to the content", async ({ page, app }) => {
    await app.open("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /skip to content/i });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#/);
  });

  test("KB-02 Escape closes the settings dialog", async ({ page, app }) => {
    await app.open("/");
    await page.getByRole("button", { name: /settings/i }).click();
    const dialog = page.getByRole("dialog", { name: /settings/i });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("KB-03 the search palette finds nothing for gibberish and stays usable", async ({ page, app }) => {
    await app.open("/");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /search/i });
    await dialog.getByRole("textbox").fill("qqqqzzzz");
    await expect(dialog.getByRole("option")).toHaveCount(0);
    await dialog.getByRole("textbox").fill("T1");
    await expect(dialog.getByRole("option").first()).toBeVisible();
  });
});
