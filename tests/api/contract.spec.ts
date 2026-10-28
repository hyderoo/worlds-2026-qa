import { test, expect } from "@playwright/test";
import { Health, Snapshot } from "../support/schemas";

test.describe("API contract and data integrity", () => {
  test("API-01 health endpoint reports a recent successful sync", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = Health.parse(await res.json());
    const ageMin = (Date.now() - Date.parse(body.sync.lastSuccessAt)) / 60_000;
    expect(ageMin, "last successful sync is older than 60 minutes").toBeLessThan(60);
    expect(body.sync.lastError).toBeNull();
  });

  test("API-02 snapshot matches the documented schema", async ({ request }) => {
    const res = await request.get("/api/public/snapshot");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/json");
    const snap = Snapshot.parse(await res.json());
    expect(snap.matches.length).toBeGreaterThanOrEqual(40);
  });

  test("API-03 snapshot supports CORS and conditional requests (ETag)", async ({ request }) => {
    const first = await request.get("/api/public/snapshot");
    expect(first.headers()["access-control-allow-origin"]).toBe("*");
    const etag = first.headers()["etag"];
    expect(etag).toBeTruthy();
    const second = await request.get("/api/public/snapshot", { headers: { "If-None-Match": etag! } });
    expect([200, 304]).toContain(second.status());
    if (second.status() === 200) expect(second.headers()["etag"]).toBeTruthy();
  });

  test("API-04 match data is internally consistent", async ({ request }) => {
    const snap = Snapshot.parse(await (await request.get("/api/public/snapshot")).json());
    const ids = snap.matches.map((m) => m.id);
    expect(new Set(ids).size, "duplicate match ids").toBe(ids.length);
    for (const m of snap.matches) {
      const [a, b] = m.teams;
      if (m.state === "completed") {
        const max = Math.max(a.wins ?? 0, b.wins ?? 0);
        const need = Math.ceil(m.bestOf / 2);
        expect(max, `match ${m.id} (${a.code} v ${b.code}) winner has fewer wins than a Bo${m.bestOf} needs`).toBe(need);
        expect(a.wins, `match ${m.id}: tie in a completed series`).not.toBe(b.wins);
      }
      if (m.state === "scheduled") expect(a.wins ?? 0).toBe(0);
    }
  });

  test("API-05 series formats follow the tournament rules (Swiss Bo1 or Bo3, Play-Ins Bo5)", async ({ request }) => {
    const snap = Snapshot.parse(await (await request.get("/api/public/snapshot")).json());
    for (const m of snap.matches.filter((x) => x.stage === "Swiss")) expect([1, 3], m.id).toContain(m.bestOf);
    for (const m of snap.matches.filter((x) => x.stage === "Play-Ins")) expect(m.bestOf, m.id).toBe(5);
  });

  test("API-06 calendar feed is a valid iCalendar with one event per match with a known team", async ({ request }) => {
    const [ics, snap] = await Promise.all([request.get("/calendar.ics"), request.get("/api/public/snapshot")]);
    expect(ics.status()).toBe(200);
    const text = await ics.text();
    expect(text.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(text.trim().endsWith("END:VCALENDAR")).toBe(true);
    const events = (text.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(events).toBe((text.match(/END:VEVENT/g) ?? []).length);
    // Documented behaviour: a match is exported once at least one side is known; TBD v TBD slots are left out until they fill in.
    const known = Snapshot.parse(await snap.json()).matches.filter((m) => m.teams.some((t) => t.code !== "TBD")).length;
    expect(events).toBe(known);
    const uids = [...text.matchAll(/^UID:(.+)$/gm)].map((m) => m[1]);
    expect(new Set(uids).size).toBe(uids.length);
  });

  test("API-07 security headers are set on the HTML shell", async ({ request }) => {
    const h = (await request.get("/")).headers();
    expect(h["content-security-policy"]).toContain("default-src 'self'");
    expect(h["content-security-policy"]).toContain("object-src 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["strict-transport-security"]).toContain("max-age=");
    expect(h["referrer-policy"]).toBeTruthy();
    expect(h["permissions-policy"]).toContain("camera=()");
  });

  test("API-08 protected endpoints reject anonymous callers", async ({ request }) => {
    const sync = await request.post("/api/sync");
    expect([401, 403]).toContain(sync.status());
    const admin = await request.get("/admin", { maxRedirects: 0 });
    expect([200, 302, 303, 307, 308]).toContain(admin.status());
    if (admin.status() === 200) expect(await admin.text()).toMatch(/password|sign in|login/i);
  });

  test("API-09 unknown routes return a real 404", async ({ request }) => {
    const res = await request.get("/this-page-does-not-exist");
    expect(res.status()).toBe(404);
  });
});
