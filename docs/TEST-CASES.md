# Test cases and last run

Generated from `evidence/results.json`. Run started 2026-10-28T09:10:22.821Z, 88 s, **115 runs passed, 5 known-issue runs failed as expected, 0 unexpected failures/flaky/skipped.** A known issue is a real defect that still reproduces; it is not a bug-free pass.

Rows marked *known issue* are written as expected failures (`test.fail`) with a bug ID from [BUGS.md](BUGS.md). Playwright reports them as expected failures. When the app is fixed the test starts passing, which Playwright reports as a failure until the annotation is removed.

| ID | Area | Test case | Projects | Result |
|---|---|---|---|---|
| API-01 | API contract | health endpoint reports a recent successful sync | api | pass |
| API-02 | API contract | snapshot matches the documented schema | api | pass |
| API-03 | API contract | snapshot supports CORS and conditional requests (ETag) | api | pass |
| API-04 | API contract | match data is internally consistent | api | pass |
| API-05 | API contract | series formats follow the tournament rules (Swiss Bo1 or Bo3, Play-Ins Bo5) | api | pass |
| API-06 | API contract | calendar feed is a valid iCalendar with one event per match with a known team | api | pass |
| API-07 | API contract | security headers are set on the HTML shell | api | pass |
| API-08 | API contract | protected endpoints reject anonymous callers | api | pass |
| API-09 | API contract | unknown routes return a real 404 | api | pass |
| API-10 | API contract | team directory has unique codes and a roster for each team | api | pass |
| API-11 | API contract | every match references teams that exist in the directory (or TBD) | api | pass |
| API-12 | API contract | the snapshot is read-only: POST is rejected | api | pass |
| API-13 | API contract | CORS preflight is answered for GET with If-None-Match | api | pass |
| API-14 | API contract | calendar events have a start, a later end and a stable UID | api | pass |
| API-15 | API contract | calendar entries do not leak final scores | api | pass |
| API-16 | API contract | unknown API paths do not expose a stack trace | api | pass |
| API-17 | API contract | sync endpoint rejects a wrong secret | api | pass |
| API-18 | API contract | robots and sitemap are served | api | pass |
| API-19 | API contract | web manifest is valid for installation | api | pass |
| AX-01 | Accessibility | / has no serious or critical violations | desktop-chrome | pass |
| AX-02 | Accessibility | /matches has no serious or critical violations | desktop-chrome | pass |
| AX-03 | Accessibility | /standings has no serious or critical violations | desktop-chrome | pass |
| AX-04 | Accessibility | /predictor has no serious or critical violations | desktop-chrome | expected fail |
| KB-01 | Keyboard | the skip link is the first tab stop and moves focus to the content | desktop-chrome | pass |
| KB-02 | Keyboard | Escape closes the settings dialog | desktop-chrome | pass |
| KB-03 | Keyboard | the search palette finds nothing for gibberish and stays usable | desktop-chrome | pass |
| LG-01 | Language | switching language translates the interface and persists | desktop-chrome | pass |
| LG-02 | Language | team names are not translated | desktop-chrome | pass |
| LG-03 | Language | Bahasa Indonesia sets the document language and shows no raw keys | desktop-chrome | pass |
| LG-04 | Language | Bahasa Melayu sets the document language and shows no raw keys | desktop-chrome | pass |
| LG-05 | Language | 日本語 sets the document language and shows no raw keys | desktop-chrome | pass |
| LG-06 | Language | 한국어 sets the document language and shows no raw keys | desktop-chrome | pass |
| LG-07 | Language | 中文 sets the document language and shows no raw keys | desktop-chrome | pass |
| LG-08 | Language | Français sets the document language and shows no raw keys | desktop-chrome | pass |
| LG-09 | Language | Español sets the document language and shows no raw keys | desktop-chrome | pass |
| LG-10 | Language | Português sets the document language and shows no raw keys | desktop-chrome | pass |
| MC-01 | Match center | lists every series and shows a count | desktop-chrome, mobile-chrome | pass |
| MC-02 | Match center | stage filter narrows the list and is reflected in the URL | desktop-chrome | pass |
| MC-03 | Match center | filtered views can be shared by URL | desktop-chrome | pass |
| MC-04 | Match center | team search finds only that team's series | desktop-chrome | pass |
| MC-05 | Match center | a search with no result shows an empty count instead of a crash | desktop-chrome | pass |
| MC-06 | Match center | reset restores the full list | desktop-chrome | pass |
| MC-07 | Match center | a series opens its detail page with both teams | desktop-chrome | pass |
| MC-08 | Match center | invalid match id shows a not-found message with a way back | desktop-chrome | pass |
| MC-08b | Match center | invalid match id responds with HTTP 404 | desktop-chrome | expected fail |
| MC-09 | Match center | match list has no horizontal overflow on a phone | mobile-chrome | pass |
| MC-10 | Match center | each status filter shows only that status and its count matches the list | desktop-chrome | pass |
| MC-11 | Match center | date filter keeps only that day | desktop-chrome | pass |
| MC-12 | Match center | region filter returns only series with a team from that region | desktop-chrome | pass |
| MC-13 | Match center | calendar view switch is reflected in the URL and keeps the list | desktop-chrome | pass |
| MC-14 | Match center | combined stage and team filters narrow together | desktop-chrome | pass |
| NG-01 | Negative paths | a date with no matches shows guidance, not a blank page | desktop-chrome | pass |
| NG-02 | Negative paths | an unknown stage in the URL does not crash the page | desktop-chrome | pass |
| NG-03 | Negative paths | a malformed date in the URL does not crash the page | desktop-chrome | pass |
| NG-04 | Negative paths | markup typed into search is shown as text and never executed | desktop-chrome | pass |
| NG-05 | Negative paths | a very long search string is handled | desktop-chrome | pass |
| NG-06 | Negative paths | My teams with nothing followed shows an empty state | desktop-chrome | pass |
| NG-07 | Negative paths | an unknown team code returns a real 404 page | desktop-chrome | pass |
| NG-08 | Negative paths | corrupted saved preferences fall back to defaults | desktop-chrome | pass |
| NG-09 | Negative paths | an unknown saved language falls back without showing raw translation keys | desktop-chrome | pass |
| NG-10 | Negative paths | an unknown saved time zone still renders kickoff times | desktop-chrome | expected fail |
| NV-01 | Navigation | primary navigation reaches the main sections | desktop-chrome | pass |
| NV-02 | Navigation | command palette opens with Ctrl+K and finds a team | desktop-chrome | pass |
| NV-03 | Navigation | unknown page shows the branded 404 with a way back | desktop-chrome | pass |
| NV-04 | Navigation | team profile opens from the teams index | desktop-chrome | pass |
| NV-05 | Navigation | mobile menu opens and lists navigation | mobile-chrome | pass |
| NV-06 | Navigation | the app survives an upstream API failure with cached or empty state, not a blank page | desktop-chrome | pass |
| NV-07 | Navigation | no console errors on the home page | desktop-chrome | expected fail |
| PR-01 | Predictor | round 1 shows eight official pairings | desktop-chrome, mobile-chrome | pass |
| PR-02 | Predictor | picking a winner marks exactly that team as pressed | desktop-chrome | pass |
| PR-03 | Predictor | predictions persist across reload (browser only) | desktop-chrome | pass |
| PR-04 | Predictor | reset asks for confirmation and clears picks | desktop-chrome | pass |
| PR-05 | Predictor | dismissing the reset dialog keeps the picks | desktop-chrome | pass |
| PR-06 | Predictor | later rounds are built from official pairings, not from picks | desktop-chrome | pass |
| PR-07 | Predictor | knockout tab shows the three knockout rounds | desktop-chrome | pass |
| PR-08 | Predictor | picks never write to the shared database (local only) | desktop-chrome | pass |
| PR-09 | Predictor | clicking a chosen winner again clears the pick | desktop-chrome | pass |
| PR-10 | Predictor | official pairings cannot be removed | desktop-chrome | pass |
| PR-11 | Predictor | knockout slots without teams cannot be picked | desktop-chrome | pass |
| RT-01 | Routes | / responds 200 with its heading | desktop-chrome | pass |
| RT-02 | Routes | /matches responds 200 with its heading | desktop-chrome | pass |
| RT-03 | Routes | /standings responds 200 with its heading | desktop-chrome | pass |
| RT-04 | Routes | /predictor responds 200 with its heading | desktop-chrome | pass |
| RT-05 | Routes | /teams responds 200 with its heading | desktop-chrome | pass |
| RT-06 | Routes | /teams/T1 responds 200 with its heading | desktop-chrome | pass |
| RT-07 | Routes | /today responds 200 with its heading | desktop-chrome | pass |
| RT-08 | Routes | /about responds 200 with its heading | desktop-chrome | pass |
| RT-09 | Routes | /compare responds 200 with its heading | desktop-chrome | pass |
| RT-10 | Routes | /daily responds 200 with its heading | desktop-chrome | pass |
| RT-11 | Routes | /groups responds 200 with its heading | desktop-chrome | pass |
| RT-12 | Routes | /recaps responds 200 with its heading | desktop-chrome | pass |
| RT-13 | Routes | /stats responds 200 with its heading | desktop-chrome | pass |
| RT-14 | Routes | /predictions responds 200 with its heading | desktop-chrome | pass |
| SP-01 | Spoiler-free | results are visible by default and nothing asks to be revealed | desktop-chrome | pass |
| SP-02 | Spoiler-free | enabling spoiler-free hides scores and offers a per-match reveal | desktop-chrome | pass |
| SP-03 | Spoiler-free | the setting persists after reload | desktop-chrome | pass |
| SP-04 | Spoiler-free | revealing one match leaves every other match hidden | desktop-chrome | pass |
| SP-05 | Spoiler-free | a revealed match stays revealed after reload | desktop-chrome | pass |
| SP-06 | Spoiler-free | the standings page hides results and can be shown for the session only | desktop-chrome | pass |
| SP-07 | Spoiler-free | turning spoiler-free off restores scores | desktop-chrome | pass |
| SP-08 | Spoiler-free | the match detail page does not leak the result when spoiler-free is on | desktop-chrome | pass |
| SP-09 | Spoiler-free | scores are never painted while spoiler-free is on | desktop-chrome | expected fail |
| ST-01 | Standings | standings page renders stage tabs | desktop-chrome, mobile-chrome | pass |
| ST-02 | Standings | Swiss view shows the bracket and the record board | desktop-chrome | pass |
| ST-03 | Standings | Swiss record board only has legal records | desktop-chrome | pass |
| ST-04 | Standings | Knockouts view renders without error | desktop-chrome | pass |
| ST-05 | Standings | zoom controls change the bracket scale within limits | desktop-chrome | pass |
| TZ-01 | Time zone | changing the time zone shifts every kickoff time consistently | desktop-chrome | pass |
| TZ-02 | Time zone | the chosen time zone survives a reload | desktop-chrome | pass |
| TZ-03 | Time zone | WITA (Makassar) labels kickoff times and is stored as Asia/Makassar | desktop-chrome | pass |
| TZ-04 | Time zone | WIT (Jayapura) labels kickoff times and is stored as Asia/Jayapura | desktop-chrome | pass |
| TZ-05 | Time zone | SGT (Singapore) labels kickoff times and is stored as Asia/Singapore | desktop-chrome | pass |
| TZ-06 | Time zone | KST (Seoul) labels kickoff times and is stored as Asia/Seoul | desktop-chrome | pass |
| TZ-07 | Time zone | UTC labels kickoff times and is stored as UTC | desktop-chrome | pass |
| TZ-08 | Time zone | ET (New York) labels kickoff times and is stored as America/New_York | desktop-chrome | pass |
| TZ-09 | Time zone | PT (Los Angeles) labels kickoff times and is stored as America/Los_Angeles | desktop-chrome | pass |
| TZ-10 | Time zone | Los Angeles is 14 hours behind Jakarta for an October kickoff | desktop-chrome | pass |

Total cases: 117. Total runs: 120.
