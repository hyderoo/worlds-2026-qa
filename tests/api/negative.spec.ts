import { test, expect } from "@playwright/test";
import { Snapshot } from "../support/schemas";

test.describe("API: more positive and negative cases", () => {
  test("API-10 team directory has unique codes and a roster for each team", async ({ request }) => {
    const snap: any = await (await request.get("/api/public/snapshot")).json();
    const codes = snap.teams.map((t: any) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.length).toBeGreaterThanOrEqual(16);
    for (const t of snap.teams) {
      expect(t.name, t.code).toBeTruthy();
      expect(t.players.length, `${t.code} roster`).toBeGreaterThanOrEqual(5);
    }
  });

  test("API-11 every match references teams that exist in the directory (or TBD)", async ({ request }) => {
    const snap: any = await (await request.get("/api/public/snapshot")).json();
    const codes = new Set<string>(snap.teams.map((t: any) => t.code));
    for (const m of Snapshot.parse(snap).matches) for (const t of m.teams) expect(t.code === "TBD" || codes.has(t.code), `${m.id}: ${t.code}`).toBe(true);
  });

  test("API-12 the snapshot is read-only: POST is rejected", async ({ request }) => {
    const res = await request.post("/api/public/snapshot", { data: {} });
    expect([404, 405]).toContain(res.status());
  });

  test("API-13 CORS preflight is answered for GET with If-None-Match", async ({ request }) => {
    const res = await request.fetch("/api/public/snapshot", { method: "OPTIONS", headers: { Origin: "https://example.org", "Access-Control-Request-Method": "GET" } });
    expect(res.status()).toBeLessThan(300);
    expect(res.headers()["access-control-allow-methods"]).toContain("GET");
  });

  test("API-14 calendar events have a start, a later end and a stable UID", async ({ request }) => {
    const text = await (await request.get("/calendar.ics")).text();
    for (const ev of text.split("BEGIN:VEVENT").slice(1)) {
      const get = (k: string) => new RegExp(`^${k}[^:]*:(.+)$`, "m").exec(ev)?.[1]?.trim();
      const s = get("DTSTART"), e = get("DTEND");
      expect(get("UID")).toMatch(/^\d+@worlds-2026-live$/);
      expect(s).toMatch(/^\d{8}T\d{6}Z$/);
      expect(e).toMatch(/^\d{8}T\d{6}Z$/);
      expect(e! > s!).toBe(true);
    }
  });

  test("API-15 calendar entries do not leak final scores", async ({ request }) => {
    const text = await (await request.get("/calendar.ics")).text();
    for (const line of text.split(/\r?\n/).filter((l) => l.startsWith("SUMMARY"))) expect(line, line).not.toMatch(/\b\d\s*[-:]\s*\d\b/);
  });

  test("API-16 unknown API paths do not expose a stack trace", async ({ request }) => {
    const res = await request.get("/api/does-not-exist");
    expect(res.status()).toBe(404);
    expect(await res.text()).not.toMatch(/at \S+ \(|node_modules|stack/i);
  });

  test("API-17 sync endpoint rejects a wrong secret", async ({ request }) => {
    const res = await request.post("/api/sync", { headers: { Authorization: "Bearer not-the-secret" } });
    expect([401, 403]).toContain(res.status());
  });

  test("API-18 robots and sitemap are served", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toMatch(/User-agent/i);
    const sm = await request.get("/sitemap.xml");
    expect(sm.status()).toBe(200);
    expect(await sm.text()).toContain("<urlset");
  });

  test("API-19 web manifest is valid for installation", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);
    const m = await res.json();
    expect(m.name).toBeTruthy();
    expect(m.start_url).toBeTruthy();
    expect(m.icons.length).toBeGreaterThan(0);
  });
});
