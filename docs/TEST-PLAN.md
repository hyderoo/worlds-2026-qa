# Test plan: Worlds 2026 Live

## Scope

System under test: the public Worlds 2026 Live site (Next.js app, Supabase backed, fed by the official LoL Esports feed). This suite is a black-box suite. It does not need the application source and it never writes to the application's data.

In scope: public pages, the public JSON snapshot, the health endpoint, the calendar feed, security headers, accessibility, responsive layout, browser-stored preferences.

Out of scope: admin panel behaviour behind the password, push notifications, the sync job itself, load testing, the embedded YouTube player (blocked or stubbed in tests), third-party data accuracy.

## Risks and how the suite covers them

| Risk | Why it matters | Cases |
|---|---|---|
| Wrong or inconsistent match data | Fans read results and schedules as fact | API-02, API-04, API-05, ST-03 |
| Stale data after sync failure | Feed runs every minute, silence is easy to miss | API-01, NV-06 |
| Spoilers shown to users who opted out | Core promise of the feature | SP-01 to SP-09 |
| Wrong kickoff time in the viewer's zone | Missed matches | TZ-01, TZ-02 |
| Predictor allows impossible Swiss states or loses picks | Main interactive feature | PR-01 to PR-08 |
| Calendar feed breaks subscribers | External consumers cache it | API-06 |
| Filters or shared URLs break | Links are shared in chats | MC-02 to MC-06 |
| Barrier for assistive tech users | Accessibility and legal exposure | AX-01 to AX-04 |
| Phone layout overflow | Most traffic is mobile | MC-09, NV-05 and the mobile smoke cases |
| Missing hardening | Public site with a protected sync endpoint | API-07, API-08, API-09 |

## Approach

- Layers: API contract tests (no browser) run first and are the fastest signal. Browser tests drive the real UI against the live deployment.
- Tools: Playwright Test with TypeScript, `zod` for response schemas, `@axe-core/playwright` for WCAG 2 A/AA checks. Reports: HTML (with traces on failure), JSON and JUnit.
- Projects: `api`, `desktop-chrome` (1280x900), `mobile-chrome` (Pixel 7 profile, smoke subset tagged `@mobile`).
- Determinism: the site shows live data, so tests assert structure and invariants (a Bo5 winner has 3 wins, a Swiss board never has 3-3) instead of hard-coded scores. Preferences are seeded through `localStorage` before the app boots, English is forced so selectors stay readable.
- Non-destructive by design: only GET requests plus one anonymous `POST /api/sync` that must be rejected. PR-08 asserts the predictor sends no write requests.
- Failures keep a trace and screenshot. Passing UI cases save a named screenshot in `evidence/screenshots` as proof.
- Known defects are annotated with `test.fail` and a bug ID so the suite is green and still honest.

## Entry and exit

Entry: the target URL responds on `/api/health`. Exit for a release check: no unexpected failures, no flaky tests, every known issue still tracked in [BUGS.md](BUGS.md).

## Test data

None to create. Tests read the live snapshot. Where a case needs an existing item (first match card, first team) it takes whatever the feed currently lists.

## Limits

The suite tests Chromium only. Time dependent states (a live match) are not forced, so the live badge path is not covered. Machine translations are checked for presence and persistence, not for wording quality.
