"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const reports = require("../lib/scaffoldaiReports.query.scaffoldai");

function fixture(t) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "scaffoldai-reports-"));
  const dir = path.join(repoRoot, reports.REPORTS_SUBPATH);
  fs.mkdirSync(dir, { recursive: true });
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  return { repoRoot, dir };
}

function report(id, body = "# Findings\n\nAll clear.\n", extra = {}) {
  const fields = { report_id: id, title: "Audit", share: "chatgpt", ...extra };
  const header = Object.entries(fields).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${v}`).join("\n");
  return `---\n${header}\n---\n${body}`;
}

function write(dir, id, content) {
  fs.writeFileSync(path.join(dir, `${id}.md`), content);
}

test("reads a shared report with metadata and content", (t) => {
  const { repoRoot, dir } = fixture(t);
  write(dir, "bridge-audit", report("bridge-audit", "# Audit\n\nBody.\n",
    { packet: "test-async-executor-plan-flow.sdc", created_at: "2026-10-07T12:00:00Z" }));
  const result = reports.readReport(repoRoot, { report_id: "bridge-audit" });
  assert.equal(result.status, "ok");
  assert.equal(result.report_id, "bridge-audit");
  assert.equal(result.title, "Audit");
  assert.equal(result.packet, "test-async-executor-plan-flow.sdc");
  assert.equal(result.created_at, "2026-10-07T12:00:00Z");
  assert.equal(result.content, "# Audit\n\nBody.\n");
  assert.equal(result.bytes, Buffer.byteLength(report("bridge-audit", "# Audit\n\nBody.\n",
    { packet: "test-async-executor-plan-flow.sdc", created_at: "2026-10-07T12:00:00Z" })));
});

test("lists only valid shared reports without content", (t) => {
  const { repoRoot, dir } = fixture(t);
  write(dir, "b-report", report("b-report"));
  write(dir, "a-report", report("a-report"));
  write(dir, "private-report", report("private-report", "x", { share: "none" }));
  write(dir, "broken", "no frontmatter");
  fs.writeFileSync(path.join(dir, "notes.txt"), report("notes"));
  const result = reports.listReports(repoRoot, {});
  assert.equal(result.status, "ok");
  assert.deepEqual(result.reports.map((r) => r.report_id), ["a-report", "b-report"]);
  assert.ok(result.reports.every((r) => !("content" in r)));
  assert.equal(result.skipped, 2);
});

test("list honors limit and tolerates a missing directory", (t) => {
  const { repoRoot, dir } = fixture(t);
  for (const id of ["r1", "r2", "r3"]) write(dir, id, report(id));
  assert.deepEqual(reports.listReports(repoRoot, { limit: 2 }).reports.map((r) => r.report_id), ["r1", "r2"]);
  fs.rmSync(dir, { recursive: true });
  assert.deepEqual(reports.listReports(repoRoot, {}).reports, []);
});

test("rejects report ids that are not plain lowercase slugs", (t) => {
  const { repoRoot } = fixture(t);
  for (const id of ["../x", "a/b", "A-report", "", "-lead", "a".repeat(81), "x.md", "a\u0000b", 7, null, undefined]) {
    const result = reports.readReport(repoRoot, { report_id: id });
    assert.equal(result.status, "error", String(id));
    assert.equal(result.error_code, "INVALID_REPORT_ID", String(id));
  }
});

test("unshared, missing and non-regular reports are indistinguishable", (t) => {
  const { repoRoot, dir } = fixture(t);
  write(dir, "private-report", report("private-report", "secret plans", { share: "none" }));
  write(dir, "unmarked", report("unmarked", "x", { share: undefined }));
  fs.mkdirSync(path.join(dir, "folder.md"));
  for (const id of ["private-report", "unmarked", "missing", "folder"]) {
    const result = reports.readReport(repoRoot, { report_id: id });
    assert.equal(result.error_code, "REPORT_UNAVAILABLE", id);
    assert.ok(!JSON.stringify(result).includes("secret plans"));
  }
});

test("rejects a symlinked report even when the target is a valid shared report", (t) => {
  const { repoRoot, dir } = fixture(t);
  const outside = path.join(repoRoot, "outside.md");
  fs.writeFileSync(outside, report("linked"));
  fs.symlinkSync(outside, path.join(dir, "linked.md"));
  assert.equal(reports.readReport(repoRoot, { report_id: "linked" }).error_code, "REPORT_UNAVAILABLE");
  assert.deepEqual(reports.listReports(repoRoot, {}).reports, []);
});

test("rejects a symlinked reports directory", (t) => {
  const { repoRoot, dir } = fixture(t);
  const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "scaffoldai-reports-elsewhere-"));
  t.after(() => fs.rmSync(elsewhere, { recursive: true, force: true }));
  write(elsewhere, "moved", report("moved"));
  fs.rmSync(dir, { recursive: true });
  fs.symlinkSync(elsewhere, dir);
  assert.equal(reports.readReport(repoRoot, { report_id: "moved" }).error_code, "REPORT_UNAVAILABLE");
  assert.deepEqual(reports.listReports(repoRoot, {}).reports, []);
});

test("rejects reports larger than 64 KiB", (t) => {
  const { repoRoot, dir } = fixture(t);
  const head = report("big", "");
  write(dir, "big", head + "a".repeat(reports.MAX_REPORT_BYTES - Buffer.byteLength(head) + 1));
  write(dir, "edge", report("edge", "") + "a".repeat(reports.MAX_REPORT_BYTES - Buffer.byteLength(report("edge", ""))));
  const result = reports.readReport(repoRoot, { report_id: "big" });
  assert.equal(result.error_code, "REPORT_TOO_LARGE");
  assert.ok(!("content" in result));
  assert.equal(reports.readReport(repoRoot, { report_id: "edge" }).status, "ok");
});

test("rejects malformed frontmatter", (t) => {
  const { repoRoot, dir } = fixture(t);
  const cases = {
    "no-frontmatter": "# Just markdown\n",
    "unterminated": "---\nreport_id: unterminated\ntitle: x\nshare: chatgpt\n# body\n",
    "id-mismatch": report("other-id"),
    "unknown-key": report("unknown-key", "x", { owner: "me" }),
    "duplicate-key": "---\nreport_id: duplicate-key\ntitle: a\ntitle: b\nshare: chatgpt\n---\nx",
    "no-title": report("no-title", "x", { title: undefined }),
    "bad-date": report("bad-date", "x", { created_at: "yesterday" }),
    "bad-packet": report("bad-packet", "x", { packet: "../etc/passwd" }),
    "long-title": report("long-title", "x", { title: "t".repeat(121) }),
  };
  for (const [id, content] of Object.entries(cases)) {
    write(dir, id, content);
    assert.equal(reports.readReport(repoRoot, { report_id: id }).error_code, "REPORT_INVALID", id);
  }
});

test("rejects invalid UTF-8, control characters and bidi overrides", (t) => {
  const { repoRoot, dir } = fixture(t);
  fs.writeFileSync(path.join(dir, "bad-utf8.md"), Buffer.concat([Buffer.from(report("bad-utf8", "")), Buffer.from([0xff, 0xfe])]));
  write(dir, "nul", report("nul", "a\u0000b"));
  write(dir, "escape", report("escape", "\u001b[31mred"));
  write(dir, "bidi", report("bidi", "safe‮evil"));
  for (const id of ["bad-utf8", "nul", "escape", "bidi"]) {
    assert.equal(reports.readReport(repoRoot, { report_id: id }).error_code, "REPORT_INVALID", id);
  }
  write(dir, "ok-whitespace", report("ok-whitespace", "a\tb\r\nc\n"));
  assert.equal(reports.readReport(repoRoot, { report_id: "ok-whitespace" }).status, "ok");
});

test("blocks reports containing credential-shaped content without echoing it", (t) => {
  const { repoRoot, dir } = fixture(t);
  const secrets = {
    "pem": "-----BEGIN OPENSSH PRIVATE KEY-----\nabc",
    "gh-classic": `ghp_${"A".repeat(36)}`,
    "gh-fine": `github_pat_${"B".repeat(40)}`,
    "sk-key": `sk-ant-${"c".repeat(40)}`,
    "aws": "AKIAABCDEFGHIJKLMNOP",
    "slack": "xoxb-1234567890-abcdefghij",
    "jwt": `eyJ${"a".repeat(20)}.eyJ${"b".repeat(20)}.${"c".repeat(20)}`,
    "bearer": `Authorization: Bearer ${"d".repeat(32)}`,
    "cf-cookie": `CF_Authorization=${"e".repeat(32)}`,
    "env-assign": "SCAFFOLDAI_ACCESS_AUD=abcdef0123456789",
  };
  for (const [id, secret] of Object.entries(secrets)) {
    write(dir, id, report(id, `before\n${secret}\nafter\n`));
    const result = reports.readReport(repoRoot, { report_id: id });
    assert.equal(result.error_code, "REPORT_BLOCKED", id);
    assert.ok(!JSON.stringify(result).includes(secret.slice(0, 12)), id);
  }
  write(dir, "prose", report("prose", "The SCAFFOLDAI_ACCESS_SUBJECTS variable and the CF_Authorization cookie are documented.\n"));
  assert.equal(reports.readReport(repoRoot, { report_id: "prose" }).status, "ok");
});

test("replaces the home directory in report content", (t) => {
  const { repoRoot, dir } = fixture(t);
  write(dir, "paths", report("paths", "See /Users/alice/Projects/x and /Users/alice.\n"));
  const result = reports.readReport(repoRoot, { report_id: "paths" }, { homeDir: "/Users/alice" });
  assert.equal(result.content, "See ~/Projects/x and ~.\n");
});

test("errors never include local paths", (t) => {
  const { repoRoot, dir } = fixture(t);
  write(dir, "broken", "nope");
  for (const id of ["broken", "missing", "../x"]) {
    const text = JSON.stringify(reports.readReport(repoRoot, { report_id: id }));
    assert.ok(!text.includes(repoRoot), id);
    assert.ok(!text.includes(reports.REPORTS_SUBPATH), id);
  }
});
