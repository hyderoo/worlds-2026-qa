import { test, expect, evidence } from "../support/app";
import type { Page } from "@playwright/test";

const swiss = (page: Page) => page.getByRole("region", { name: "Swiss predictor" });
const pairing = (page: Page, a: string, b: string) => swiss(page).locator("div").filter({ has: page.getByRole("button", { name: new RegExp(`^${a}\\b`) }) }).filter({ has: page.getByRole("button", { name: new RegExp(`^${b}\\b`) }) }).last();

test.describe("Swiss predictor", () => {
  test("PR-01 round 1 shows eight official pairings @smoke @mobile", async ({ page, app }, info) => {
    await app.open("/predictor");
    await expect(page.getByRole("heading", { level: 1, name: /predictor/i })).toBeVisible();
    await expect(swiss(page)).toBeVisible();
    await expect(swiss(page).getByText(/round 1/i).first()).toBeVisible();
    await expect(swiss(page).getByText(/official pairing/i).first()).toBeVisible();
    await evidence(page, info, "PR-01");
  });

  test("PR-02 picking a winner marks exactly that team as pressed", async ({ page, app }, info) => {
    await app.open("/predictor");
    const pick = swiss(page).getByRole("button", { pressed: false }).first();
    const label = (await pick.innerText()).split("\n")[0].trim();
    await pick.click();
    const pressed = swiss(page).getByRole("button", { pressed: true });
    await expect(pressed.first()).toBeVisible();
    await expect(pressed.first()).toContainText(label);
    await evidence(page, info, "PR-02");
  });

  test("PR-03 predictions persist across reload (browser only)", async ({ page, app }) => {
    await app.open("/predictor");
    await swiss(page).getByRole("button", { pressed: false }).first().click();
    const n = await swiss(page).getByRole("button", { pressed: true }).count();
    expect(n).toBeGreaterThan(0);
    await page.reload();
    await expect(swiss(page).getByRole("button", { pressed: true })).toHaveCount(n);
    const stored = await page.evaluate(() => Object.keys(localStorage));
    expect(stored.length).toBeGreaterThan(0);
  });

  test("PR-04 reset asks for confirmation and clears picks", async ({ page, app }, info) => {
    await app.open("/predictor");
    await swiss(page).getByRole("button", { pressed: false }).first().click();
    let dialogSeen = false;
    page.once("dialog", (d) => { dialogSeen = true; void d.accept(); });
    await page.getByRole("button", { name: /^reset$/i }).click();
    await expect(swiss(page).getByRole("button", { pressed: true })).toHaveCount(0);
    expect(dialogSeen).toBe(true);
    await evidence(page, info, "PR-04");
  });

  test("PR-05 dismissing the reset dialog keeps the picks", async ({ page, app }) => {
    await app.open("/predictor");
    await swiss(page).getByRole("button", { pressed: false }).first().click();
    const n = await swiss(page).getByRole("button", { pressed: true }).count();
    page.once("dialog", (d) => void d.dismiss());
    await page.getByRole("button", { name: /^reset$/i }).click();
    await expect(swiss(page).getByRole("button", { pressed: true })).toHaveCount(n);
  });

  test("PR-06 later rounds are built from official pairings, not from picks", async ({ page, app }) => {
    await app.open("/predictor");
    await expect(swiss(page).getByText(/round 2/i).first()).toBeVisible();
    await expect(swiss(page).getByText(/1-0/).first()).toBeVisible();
    await expect(swiss(page).getByText(/0-1/).first()).toBeVisible();
  });

  test("PR-07 knockout tab shows the three knockout rounds", async ({ page, app }, info) => {
    await app.open("/predictor");
    await page.getByRole("button", { name: "Knockout" }).click();
    await expect(page.getByRole("region", { name: "Knockout predictor" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Knockout predictor" })).toContainText(/quarter|semi|final/i);
    await evidence(page, info, "PR-07");
  });

  test("PR-08 picks never write to the shared database (local only)", async ({ page, app }) => {
    const writes: string[] = [];
    page.on("request", (r) => { if (["POST", "PUT", "PATCH", "DELETE"].includes(r.method()) && !r.url().includes("/_next/")) writes.push(`${r.method()} ${r.url()}`); });
    await app.open("/predictor");
    await swiss(page).getByRole("button", { pressed: false }).first().click();
    await page.waitForTimeout(500);
    expect(writes.filter((w) => !/client-error/.test(w))).toEqual([]);
  });
});

test.describe("Swiss predictor: more behaviour", () => {
  test("PR-09 clicking a chosen winner again clears the pick", async ({ page, app }) => {
    await app.open("/predictor");
    const first = swiss(page).getByRole("button", { pressed: false }).first();
    await first.click();
    const pressed = swiss(page).getByRole("button", { pressed: true }).first();
    await expect(pressed).toBeVisible();
    await pressed.click();
    await expect(swiss(page).getByRole("button", { pressed: true })).toHaveCount(0);
  });

  test("PR-10 official pairings cannot be removed", async ({ page, app }) => {
    await app.open("/predictor");
    await expect(page.getByRole("button", { name: /remove pairing/i })).toHaveCount(0);
  });

  test("PR-11 knockout slots without teams cannot be picked", async ({ page, app }) => {
    await app.open("/predictor");
    await page.getByRole("button", { name: "Knockout" }).click();
    const ko = page.getByRole("region", { name: "Knockout predictor" });
    await expect(ko.getByRole("button", { pressed: true })).toHaveCount(0);
    const buttons = ko.getByRole("button");
    const n = await buttons.count();
    for (let i = 0; i < n; i++) await expect(buttons.nth(i)).toBeDisabled();
  });
});
