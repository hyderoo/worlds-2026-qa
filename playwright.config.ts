import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "https://worlds-2026-live.vercel.app";
// Locally a system Chrome can be used; CI installs the bundled Chromium.
const executablePath = process.env.CHROME_PATH || undefined;
const launchOptions = { executablePath, args: executablePath ? ["--no-sandbox"] : [] };

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 3,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "evidence/results.json" }],
    ["junit", { outputFile: "evidence/junit.xml" }],
  ],
  use: {
    baseURL,
    locale: "en-US",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    launchOptions,
  },
  projects: [
    { name: "api", testDir: "./tests/api" },
    { name: "desktop-chrome", testDir: "./tests/e2e", grepInvert: /@mobile-only/, use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 }, launchOptions } },
    { name: "mobile-chrome", testDir: "./tests/e2e", grep: /@mobile/, use: { ...devices["Pixel 7"], launchOptions } },
  ],
});
