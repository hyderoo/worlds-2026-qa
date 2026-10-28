import type { Page } from "@playwright/test";
import { test, expect, evidence, readPrefs } from "../support/app";

const firstCard = (page: Page) => page.locator('a[href^="/matches/"]').first();
/** Score lines render as a lone digit on their own line in a series card. */
const scoreLines = async (page: Page) => (await firstCard(page).innerText()).split("\n").filter((l) => /^\d$/.test(l.trim()));
const openSettings = (page: Page) => page.getByRole("button", { name: /settings/i }).click();
const spoilerToggle = (page: Page) => page.getByRole("dialog", { name: /settings/i }).getByRole("button", { name: /spoiler/i });

test.describe("Spoiler-free mode", () => {
  test("SP-01 results are visible by default and nothing asks to be revealed", async ({ page, app }, info) => {
    await app.open("/matches");
    expect(await scoreLines(page)).toHaveLength(2);
    await expect(page.getByRole("button", { name: "Show result" })).toHaveCount(0);
    await evidence(page, info, "SP-01");
  });

  test("SP-02 enabling spoiler-free hides scores and offers a per-match reveal", async ({ page, app }, info) => {
    await app.open("/matches");
    await openSettings(page);
    await spoilerToggle(page).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Show result" }).first()).toBeVisible();
    expect(await scoreLines(page)).toHaveLength(0);
    expect((await readPrefs(page)).spoiler).toBe(true);
    await evidence(page, info, "SP-02");
  });

  test("SP-03 the setting persists after reload", async ({ page, app }) => {
    await app.open("/matches", { spoiler: true });
    await page.reload();
    await expect(page.getByRole("button", { name: "Show result" }).first()).toBeVisible();
    expect(await scoreLines(page)).toHaveLength(0);
    await openSettings(page);
    await expect(spoilerToggle(page)).toHaveAttribute("aria-pressed", "true");
  });

  test("SP-04 revealing one match leaves every other match hidden", async ({ page, app }, info) => {
    await app.open("/matches", { spoiler: true });
    const buttons = page.getByRole("button", { name: "Show result" });
    const total = await buttons.count();
    expect(total).toBeGreaterThan(5);
    await buttons.first().click();
    await expect(buttons).toHaveCount(total - 1);
    expect(await scoreLines(page)).toHaveLength(2);
    expect((await readPrefs(page)).revealed).toHaveLength(1);
    await evidence(page, info, "SP-04");
  });

  test("SP-05 a revealed match stays revealed after reload", async ({ page, app }) => {
    await app.open("/matches", { spoiler: true });
    await page.getByRole("button", { name: "Show result" }).first().click();
    await page.reload();
    await expect(page.getByRole("button", { name: "Show result" }).first()).toBeVisible();
    await expect.poll(() => scoreLines(page).then((l) => l.length)).toBe(2);
  });

  test("SP-06 the standings page hides results and can be shown for the session only", async ({ page, app }, info) => {
    await app.open("/standings", { spoiler: true });
    await expect(page.getByText("Results are hidden (spoiler-free mode).")).toBeVisible();
    await evidence(page, info, "SP-06", "hidden");
    await page.getByRole("button", { name: "Show for this session" }).click();
    await expect(page.getByText("Results are hidden (spoiler-free mode).")).toBeHidden();
    await evidence(page, info, "SP-06", "shown");
    await page.reload();
    await expect(page.getByText("Results are hidden (spoiler-free mode).")).toBeVisible();
    expect((await readPrefs(page)).spoiler).toBe(true);
  });

  test("SP-07 turning spoiler-free off restores scores", async ({ page, app }) => {
    await app.open("/matches", { spoiler: true });
    await openSettings(page);
    await spoilerToggle(page).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Show result" })).toHaveCount(0);
    expect(await scoreLines(page)).toHaveLength(2);
    expect((await readPrefs(page)).spoiler).toBe(false);
  });

  test("SP-08 the match detail page does not leak the result when spoiler-free is on", async ({ page, app }, info) => {
    await app.open("/matches", { spoiler: true });
    await firstCard(page).click();
    await expect(page).toHaveURL(/\/matches\/\d+/);
    await page.waitForLoadState("networkidle").catch(() => undefined);
    const main = await page.locator("main").innerText();
    const lone = main.split("\n").filter((l) => /^\d$/.test(l.trim()));
    expect(lone, "a lone score digit is visible on the detail page").toHaveLength(0);
    await evidence(page, info, "SP-08");
  });
});

test.describe("Spoiler-free mode: first paint", () => {
  // BUG-004: on load the scores are rendered for a few frames before the stored spoiler-free preference is applied.
  test("SP-09 scores are never painted while spoiler-free is on (known issue BUG-004)", async ({ page }) => {
    test.fail(true, "BUG-004 flash of scores before spoiler-free applies");
    await page.addInitScript(() => {
      localStorage.setItem("w26:prefs:v1", JSON.stringify({ lang: "en", spoiler: true }));
      (window as any).__leakFrames = 0;
      const tick = () => {
        const leaked = [...document.querySelectorAll('a[href^="/matches/"]')].some((a) => (a as HTMLElement).innerText.split("\n").some((l) => /^\d$/.test(l.trim())));
        if (leaked) (window as any).__leakFrames++;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto("/matches", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => (window as any).__leakFrames)).toBe(0);
  });
});
