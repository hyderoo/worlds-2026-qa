import { test as base, expect, type Page, type TestInfo } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const PREFS_KEY = "w26:prefs:v1";

/** Seed preferences before the app boots. English UI by default so assertions are readable. */
export async function seedPrefs(page: Page, prefs: Record<string, unknown> = {}) {
  await page.addInitScript(([key, value]) => {
    if (!window.sessionStorage.getItem("__seeded")) {
      window.localStorage.setItem(key as string, JSON.stringify(value));
      window.sessionStorage.setItem("__seeded", "1");
    }
  }, [PREFS_KEY, { lang: "en", ...prefs }] as const);
}

export async function readPrefs(page: Page): Promise<Record<string, any>> {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "{}"), PREFS_KEY);
}

/** Save a full-page evidence screenshot named after the test case ID and attach it to the report. */
export async function evidence(page: Page, info: TestInfo, tcId: string, label = "") {
  const dir = path.join(process.cwd(), "evidence", "screenshots");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${tcId}${label ? "-" + label : ""}-${info.project.name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  await info.attach(`${tcId}${label ? " " + label : ""}`, { path: file, contentType: "image/png" });
}

export const test = base.extend<{ app: { open: (p: string, prefs?: Record<string, unknown>) => Promise<void> } }>({
  app: async ({ page }, use) => {
    await use({
      open: async (p, prefs) => {
        await seedPrefs(page, prefs);
        await page.goto(p, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle").catch(() => undefined);
      },
    });
  },
});
export { expect };
