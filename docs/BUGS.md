# Defects found

All five were found by this suite against https://worlds-2026-live.vercel.app on 28 Oct 2026. Each is covered by a test written as an expected failure, so the suite stays green today and will flag the day a fix lands.

| ID | Severity | Where | What happens | Test |
|---|---|---|---|---|
| BUG-001 | Medium | Home page `/` | The browser logs a React hydration mismatch (minified error #418) on first load. It happens when the visitor's browser time zone is not UTC (reproduced with Asia/Jakarta and America/New_York, not with UTC), so the server HTML and the first client render disagree on a zone dependent value. A UTC browser, such as the default GitHub Actions runner, does not hit it. | NV-07 |
| BUG-002 | Low | `/matches/<unknown id>` | The "Match not found" view is served with HTTP 200. Crawlers and monitoring see a valid page instead of a 404. | MC-08b |
| BUG-003 | Low | `/predictor` | The red notice text (`#cf4b57` on `#0d0c11`) has a contrast ratio of 4.45:1. WCAG AA needs 4.5:1 for normal text. axe-core rule `color-contrast`, impact serious. | AX-04 |
| BUG-004 | Medium | `/matches`, `/` | With spoiler-free mode on, scores are drawn for 2 to 7 animation frames (roughly 30 to 120 ms) on page load before the stored preference is applied, then hidden. For a feature whose whole point is not showing a result, this defeats the purpose on a slow device. Measured with a `requestAnimationFrame` sampler, 6 of 6 loads leaked. | SP-09 |
| BUG-005 | Medium | every page | If the saved time zone in browser storage is a value the app does not know (tampered, or a zone removed in a later release), every page shows the error screen. "Reload" cannot fix it because the bad value is stored. Reproduce: set `localStorage["w26:prefs:v1"]` to `{"tz":"Mars/Olympus","tzSet":true}` and open `/matches`. | NG-10 |

## How to confirm one by hand

- BUG-002: `curl -I https://worlds-2026-live.vercel.app/matches/000` returns `HTTP/2 200`.
- BUG-004: turn on spoiler-free, hard-reload `/matches`, and watch the first cards.
