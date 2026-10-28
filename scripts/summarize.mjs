// Builds docs/TEST-CASES.md from the last Playwright JSON run.
import fs from "node:fs";
const r = JSON.parse(fs.readFileSync("evidence/results.json", "utf8"));
const rows = new Map();
const walk = (suite, file) => {
  for (const spec of suite.specs ?? []) {
    const id = /^([A-Z]{2,3}-\d+[a-z]?)\s+(.*)$/.exec(spec.title);
    if (!id) continue;
    const key = id[1];
    const row = rows.get(key) ?? { id: key, title: id[2].replace(/\s*@\w[\w-]*/g, "").trim(), file, runs: [] };
    for (const t of spec.tests) row.runs.push({ project: t.projectName, status: t.expectedStatus === "failed" ? "known" : t.status, ms: t.results.at(-1)?.duration ?? 0 });
    rows.set(key, row);
  }
  for (const s of suite.suites ?? []) walk(s, file);
};
for (const s of r.suites) walk(s, s.file);
const label = { known: "expected fail", expected: "pass", unexpected: "FAIL", flaky: "flaky", skipped: "skipped" };
const area = { API: "API contract", MC: "Match center", TZ: "Time zone", LG: "Language", SP: "Spoiler-free", PR: "Predictor", ST: "Standings", NV: "Navigation", AX: "Accessibility", NG: "Negative paths", RT: "Routes", KB: "Keyboard" };
let out = "# Test cases and last run\n\n";
let pass = 0, known = 0, bad = 0;
for (const row of rows.values()) for (const x of row.runs) { if (x.status === "known") known++; else if (x.status === "expected") pass++; else bad++; }
out += `Generated from \`evidence/results.json\`. Run started ${r.stats.startTime}, ${(r.stats.duration / 1000).toFixed(0)} s, **${pass} runs passed, ${known} known-issue runs failed as expected, ${bad} unexpected failures/flaky/skipped.** A known issue is a real defect that still reproduces; it is not a bug-free pass.\n\n`;
out += "Rows marked *known issue* are written as expected failures (`test.fail`) with a bug ID from [BUGS.md](BUGS.md). Playwright reports them as expected failures. When the app is fixed the test starts passing, which Playwright reports as a failure until the annotation is removed.\n\n";
out += "| ID | Area | Test case | Projects | Result |\n|---|---|---|---|---|\n";
for (const row of [...rows.values()].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))) {
  const res = [...new Set(row.runs.map((x) => label[x.status] ?? x.status))].join("/");
  
  out += `| ${row.id} | ${area[row.id.split("-")[0]] ?? ""} | ${row.title.replace(/\s*\(known issue [^)]*\)/, "")} | ${[...new Set(row.runs.map((x) => x.project))].join(", ")} | ${res} |\n`;
}
fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync("docs/TEST-CASES.md", out + `\nTotal cases: ${rows.size}. Total runs: ${[...rows.values()].reduce((n, x) => n + x.runs.length, 0)}.\n`);
console.log("wrote docs/TEST-CASES.md", rows.size, "cases");
