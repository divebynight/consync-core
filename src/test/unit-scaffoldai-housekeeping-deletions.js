"use strict";

// MAR-6: housekeeping deletions go through bounded helpers. History is removed
// only through scaffoldaiState; runtime and inbox files only through
// removeRuntimeFile. Neither follows symlinks or deletes outside targets.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");

const { removeRuntimeFile } = require("../lib/scaffoldaiRuntimeFiles.auth.scaffoldai");
const { removeHistoryLog } = require("../lib/scaffoldaiState.state.scaffoldai");
const { resetRuntimeState, cleanIntakeArtifacts } = require("../lib/scaffoldaiHousekeeping.auth.scaffoldai");
const { findIndirectStateWriteViolations } = require("./helpers/state-write-scan");

const repoRoot = path.resolve(__dirname, "..", "..");

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "scaffoldai-hk-deletions-"));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "scaffoldai-hk-outside-"));
  t.after(() => {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  });
  const write = (relative, content = "x\n") => {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  };
  write(".scaffoldai/contracts/active-policy.json", '{"mode":"TEST"}\n');
  write(".scaffoldai/state/next-action.md", "TYPE: REFACTOR\nPACKAGE: p.sdc\n\nbody\n");
  write(".scaffoldai/state/active-runtime.json", '{"in_flight_packet":"p.sdc"}\n');
  write(".scaffoldai/state/snapshot.md", "## Current Package\n\n- type: `REFACTOR`\n- package: `p.sdc`\n");
  write(".scaffoldai/state/history.jsonl", '{"a":1}\n');
  write(".scaffoldai/runtime/mcp/signals.jsonl", '{"s":1}\n');
  write(".scaffoldai/runtime/mcp/shared-memory.jsonl", '{"m":1}\n');
  write(".scaffoldai/inbox/p.sdc.md", "# SDC — P\n");
  const outsideFile = path.join(outside, "precious.txt");
  fs.writeFileSync(outsideFile, "do not delete\n");
  const exists = (relative) => fs.existsSync(path.join(root, relative));
  const isLink = (relative) => {
    try { return fs.lstatSync(path.join(root, relative)).isSymbolicLink(); } catch { return false; }
  };
  return { root, outside, outsideFile, write, exists, isLink };
}

// ---------------------------------------------------------------------------
// removeRuntimeFile
// ---------------------------------------------------------------------------

test("removeRuntimeFile deletes regular files under runtime and inbox", (t) => {
  const f = fixture(t);
  assert.equal(removeRuntimeFile(f.root, ".scaffoldai/runtime/mcp/signals.jsonl"), "removed");
  assert.equal(removeRuntimeFile(f.root, ".scaffoldai/inbox/p.sdc.md"), "removed");
  assert.equal(f.exists(".scaffoldai/runtime/mcp/signals.jsonl"), false);
  assert.equal(f.exists(".scaffoldai/inbox/p.sdc.md"), false);
});

test("removeRuntimeFile reports missing files without error (idempotent)", (t) => {
  const f = fixture(t);
  assert.equal(removeRuntimeFile(f.root, ".scaffoldai/runtime/mcp/absent.jsonl"), "missing");
  assert.equal(removeRuntimeFile(f.root, ".scaffoldai/runtime/no-such-dir/absent.jsonl"), "missing");
});

test("removeRuntimeFile refuses paths outside runtime and inbox", (t) => {
  const f = fixture(t);
  for (const target of [
    ".scaffoldai/state/history.jsonl",
    ".scaffoldai/contracts/active-policy.json",
    ".scaffoldai/runtime",
    ".scaffoldai/inbox",
    ".scaffoldai/runtime/../state/history.jsonl",
    "../outside.txt",
    f.outsideFile,
    "",
  ]) {
    assert.throws(() => removeRuntimeFile(f.root, target), /outside the runtime\/inbox boundary|path is required/, target);
  }
  assert.equal(f.exists(".scaffoldai/state/history.jsonl"), true);
  assert.equal(fs.existsSync(f.outsideFile), true);
});

test("removeRuntimeFile refuses a final-file symlink and deletes neither link nor target", (t) => {
  const f = fixture(t);
  fs.symlinkSync(f.outsideFile, path.join(f.root, ".scaffoldai/runtime/mcp/linked-out.jsonl"));
  fs.symlinkSync(path.join(f.root, ".scaffoldai/runtime/mcp/shared-memory.jsonl"),
    path.join(f.root, ".scaffoldai/runtime/mcp/linked-in.jsonl"));
  assert.equal(removeRuntimeFile(f.root, ".scaffoldai/runtime/mcp/linked-out.jsonl"), "refused_symlink");
  assert.equal(removeRuntimeFile(f.root, ".scaffoldai/runtime/mcp/linked-in.jsonl"), "refused_symlink");
  assert.equal(f.isLink(".scaffoldai/runtime/mcp/linked-out.jsonl"), true);
  assert.equal(fs.existsSync(f.outsideFile), true);
  assert.equal(f.exists(".scaffoldai/runtime/mcp/shared-memory.jsonl"), true);
});

test("removeRuntimeFile refuses directories", (t) => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.root, ".scaffoldai/runtime/mcp/dir.jsonl"));
  assert.equal(removeRuntimeFile(f.root, ".scaffoldai/runtime/mcp/dir.jsonl"), "refused_not_file");
  assert.equal(f.exists(".scaffoldai/runtime/mcp/dir.jsonl"), true);
});

test("removeRuntimeFile refuses a symlinked parent directory that escapes the boundary", (t) => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.outside, "signals.jsonl"), "outside log\n");
  fs.rmSync(path.join(f.root, ".scaffoldai/runtime/mcp"), { recursive: true });
  fs.symlinkSync(f.outside, path.join(f.root, ".scaffoldai/runtime/mcp"));
  assert.throws(() => removeRuntimeFile(f.root, ".scaffoldai/runtime/mcp/signals.jsonl"), /outside the runtime\/inbox boundary/);
  assert.equal(fs.existsSync(path.join(f.outside, "signals.jsonl")), true);
});

test("removeRuntimeFile refuses when the runtime root itself is a symlink out of .scaffoldai", (t) => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.outside, "mcp"));
  fs.writeFileSync(path.join(f.outside, "mcp", "signals.jsonl"), "outside log\n");
  fs.rmSync(path.join(f.root, ".scaffoldai/runtime"), { recursive: true });
  fs.symlinkSync(f.outside, path.join(f.root, ".scaffoldai/runtime"));
  assert.throws(() => removeRuntimeFile(f.root, ".scaffoldai/runtime/mcp/signals.jsonl"), /outside the runtime\/inbox boundary/);
  assert.equal(fs.existsSync(path.join(f.outside, "mcp", "signals.jsonl")), true);
});

test("removeRuntimeFile refuses a runtime root symlinked to state, and state survives", (t) => {
  const f = fixture(t);
  fs.rmSync(path.join(f.root, ".scaffoldai/runtime"), { recursive: true });
  fs.symlinkSync("state", path.join(f.root, ".scaffoldai/runtime"));
  assert.throws(() => removeRuntimeFile(f.root, ".scaffoldai/runtime/next-action.md"), /outside the runtime\/inbox boundary/);
  assert.equal(f.exists(".scaffoldai/state/next-action.md"), true);
});

test("removeRuntimeFile refuses an inbox root symlinked to packets, and the durable packet survives", (t) => {
  const f = fixture(t);
  f.write(".scaffoldai/packets/p.sdc.md", "# SDC — P\n");
  fs.rmSync(path.join(f.root, ".scaffoldai/inbox"), { recursive: true });
  fs.symlinkSync("packets", path.join(f.root, ".scaffoldai/inbox"));
  assert.throws(() => removeRuntimeFile(f.root, ".scaffoldai/inbox/p.sdc.md"), /outside the runtime\/inbox boundary/);
  assert.equal(f.exists(".scaffoldai/packets/p.sdc.md"), true);
});

test("removeRuntimeFile still works when .scaffoldai itself is a symlinked directory", (t) => {
  const f = fixture(t);
  const moved = path.join(f.outside, "scaffoldai-real");
  fs.renameSync(path.join(f.root, ".scaffoldai"), moved);
  fs.symlinkSync(moved, path.join(f.root, ".scaffoldai"));
  assert.equal(removeRuntimeFile(f.root, ".scaffoldai/runtime/mcp/signals.jsonl"), "removed");
  assert.equal(fs.existsSync(path.join(moved, "runtime/mcp/signals.jsonl")), false);
  assert.equal(fs.existsSync(path.join(moved, "state/next-action.md")), true);
});

// ---------------------------------------------------------------------------
// removeHistoryLog
// ---------------------------------------------------------------------------

test("removeHistoryLog removes only state/history.jsonl", (t) => {
  const f = fixture(t);
  assert.equal(removeHistoryLog(f.root), "removed");
  assert.equal(f.exists(".scaffoldai/state/history.jsonl"), false);
  assert.equal(f.exists(".scaffoldai/state/next-action.md"), true);
  assert.equal(removeHistoryLog(f.root), "missing");
});

test("removeHistoryLog refuses a symlinked history file and leaves its target", (t) => {
  const f = fixture(t);
  fs.rmSync(path.join(f.root, ".scaffoldai/state/history.jsonl"));
  fs.symlinkSync(f.outsideFile, path.join(f.root, ".scaffoldai/state/history.jsonl"));
  assert.equal(removeHistoryLog(f.root), "refused_symlink");
  assert.equal(f.isLink(".scaffoldai/state/history.jsonl"), true);
  assert.equal(fs.existsSync(f.outsideFile), true);
});

test("removeHistoryLog refuses when the state directory escapes .scaffoldai", (t) => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.outside, "history.jsonl"), "outside history\n");
  fs.rmSync(path.join(f.root, ".scaffoldai/state"), { recursive: true });
  fs.symlinkSync(f.outside, path.join(f.root, ".scaffoldai/state"));
  assert.throws(() => removeHistoryLog(f.root), /outside \.scaffoldai/);
  assert.equal(fs.existsSync(path.join(f.outside, "history.jsonl")), true);
});

test("removeHistoryLog refuses a state root symlinked elsewhere inside .scaffoldai", (t) => {
  const f = fixture(t);
  f.write(".scaffoldai/runtime/history.jsonl", '{"runtime":1}\n');
  fs.renameSync(path.join(f.root, ".scaffoldai/state"), path.join(f.root, ".scaffoldai/state-real"));
  fs.symlinkSync("runtime", path.join(f.root, ".scaffoldai/state"));
  assert.throws(() => removeHistoryLog(f.root), /state directory/);
  assert.equal(f.exists(".scaffoldai/runtime/history.jsonl"), true);
});

// ---------------------------------------------------------------------------
// Housekeeping behavior parity and symlink safety
// ---------------------------------------------------------------------------

const STATE_TOUCHED = [
  ".scaffoldai/state/active-runtime.json",
  ".scaffoldai/state/next-action.md",
  ".scaffoldai/state/snapshot.md",
];
const LOG_PATHS = [
  ".scaffoldai/state/history.jsonl",
  ".scaffoldai/runtime/mcp/signals.jsonl",
  ".scaffoldai/runtime/mcp/shared-memory.jsonl",
];

test("reset without runtime logs keeps logs and reports the same touched/skipped entries", (t) => {
  const f = fixture(t);
  const result = resetRuntimeState(f.root, { includeRuntimeLogs: false });
  assert.equal(result.status, "PASS");
  assert.deepEqual(result.data.touched, STATE_TOUCHED);
  assert.deepEqual(result.data.skipped.map((entry) => entry.path), LOG_PATHS);
  for (const log of LOG_PATHS) assert.equal(f.exists(log), true, log);
});

test("reset with runtime logs deletes exactly the three logs, then reports them not present", (t) => {
  const f = fixture(t);
  const first = resetRuntimeState(f.root, { includeRuntimeLogs: true });
  assert.deepEqual(first.data.touched, [...STATE_TOUCHED, ...LOG_PATHS]);
  assert.deepEqual(first.data.skipped, []);
  for (const log of LOG_PATHS) assert.equal(f.exists(log), false, log);

  const second = resetRuntimeState(f.root, { includeRuntimeLogs: true });
  assert.deepEqual(second.data.touched, STATE_TOUCHED);
  assert.deepEqual(second.data.skipped, LOG_PATHS.map((logPath) => ({ path: logPath, reason: "not present" })));
});

test("reset with runtime logs never follows a symlinked log to an outside target", (t) => {
  const f = fixture(t);
  fs.rmSync(path.join(f.root, ".scaffoldai/runtime/mcp/signals.jsonl"));
  fs.symlinkSync(f.outsideFile, path.join(f.root, ".scaffoldai/runtime/mcp/signals.jsonl"));
  const result = resetRuntimeState(f.root, { includeRuntimeLogs: true });
  assert.equal(result.status, "PASS");
  assert.equal(fs.existsSync(f.outsideFile), true);
  assert.equal(f.isLink(".scaffoldai/runtime/mcp/signals.jsonl"), true);
  assert.ok(result.data.skipped.some((entry) =>
    entry.path === ".scaffoldai/runtime/mcp/signals.jsonl" && /symlink/.test(entry.reason)));
  assert.ok(!result.data.touched.includes(".scaffoldai/runtime/mcp/signals.jsonl"));
});

test("intake cleanup removes the closed inbox candidate and latest intake result as before", (t) => {
  const f = fixture(t);
  f.write(".scaffoldai/state/handoff.md", "TYPE: PROCESS\nPACKAGE: p.sdc\n\nSTATUS\n\nPASS\n");
  f.write(".scaffoldai/runtime/packet-intake/latest-intake.json", JSON.stringify({
    source_path: path.join(f.root, ".scaffoldai/inbox/p.sdc.md"), packet_id: "p.sdc", file_name: "p.sdc.md",
  }));
  const result = cleanIntakeArtifacts(f.root);
  assert.deepEqual(result.data.removed_paths,
    [".scaffoldai/inbox/p.sdc.md", ".scaffoldai/runtime/packet-intake/latest-intake.json"]);
  assert.equal(result.data.inbox_candidate_removed, true);
  assert.equal(f.exists(".scaffoldai/inbox/p.sdc.md"), false);
  assert.equal(cleanIntakeArtifacts(f.root).data.removed_paths.length, 0);
});

test("intake cleanup never deletes through a symlinked inbox candidate", (t) => {
  const f = fixture(t);
  fs.rmSync(path.join(f.root, ".scaffoldai/inbox/p.sdc.md"));
  fs.symlinkSync(f.outsideFile, path.join(f.root, ".scaffoldai/inbox/p.sdc.md"));
  f.write(".scaffoldai/state/handoff.md", "TYPE: PROCESS\nPACKAGE: p.sdc\n\nSTATUS\n\nPASS\n");
  f.write(".scaffoldai/runtime/packet-intake/latest-intake.json", JSON.stringify({
    source_path: path.join(f.root, ".scaffoldai/inbox/p.sdc.md"), packet_id: "p.sdc", file_name: "p.sdc.md",
  }));
  const result = cleanIntakeArtifacts(f.root);
  assert.equal(fs.existsSync(f.outsideFile), true);
  assert.equal(result.data.inbox_candidate_removed, false);
  assert.ok(result.data.skipped.some((entry) => /symlink/.test(entry.reason)));
});

test("intake cleanup through an inbox root symlinked to packets deletes no durable packet", (t) => {
  const f = fixture(t);
  f.write(".scaffoldai/packets/p.sdc.md", "# SDC — P\n");
  fs.rmSync(path.join(f.root, ".scaffoldai/inbox"), { recursive: true });
  fs.symlinkSync("packets", path.join(f.root, ".scaffoldai/inbox"));
  f.write(".scaffoldai/state/handoff.md", "TYPE: PROCESS\nPACKAGE: p.sdc\n\nSTATUS\n\nPASS\n");
  f.write(".scaffoldai/runtime/packet-intake/latest-intake.json", JSON.stringify({
    source_path: path.join(f.root, ".scaffoldai/inbox/p.sdc.md"), packet_id: "p.sdc", file_name: "p.sdc.md",
  }));
  assert.throws(() => cleanIntakeArtifacts(f.root), /outside the runtime\/inbox boundary/);
  assert.equal(f.exists(".scaffoldai/packets/p.sdc.md"), true);
  assert.equal(f.exists(".scaffoldai/runtime/packet-intake/latest-intake.json"), true);
});

// ---------------------------------------------------------------------------
// Invariant H coverage for housekeeping
// ---------------------------------------------------------------------------

test("invariant H flags a direct state-path deletion in housekeeping", (t) => {
  const scanRoot = fs.mkdtempSync(path.join(os.tmpdir(), "scaffoldai-invariant-h-"));
  t.after(() => fs.rmSync(scanRoot, { recursive: true, force: true }));
  fs.mkdirSync(path.join(scanRoot, "src/lib"), { recursive: true });
  const source = fs.readFileSync(path.join(repoRoot, "src/lib/scaffoldaiHousekeeping.auth.scaffoldai.js"), "utf8");
  const target = path.join(scanRoot, "src/lib/scaffoldaiHousekeeping.auth.scaffoldai.js");

  fs.writeFileSync(target, source);
  assert.deepEqual(findIndirectStateWriteViolations({ repoRoot: scanRoot, srcDirs: ["src/lib"] }), []);

  fs.writeFileSync(target, `${source}\nfunction direct(root) { fs.unlinkSync(path.join(root, STATE_ROOT, "history.jsonl")); }\n`);
  assert.deepEqual(findIndirectStateWriteViolations({ repoRoot: scanRoot, srcDirs: ["src/lib"] }),
    ["src/lib/scaffoldaiHousekeeping.auth.scaffoldai.js"]);
});

test("the live housekeeping module needs no invariant H exemption", () => {
  const violations = findIndirectStateWriteViolations({ repoRoot, srcDirs: ["src/lib"] });
  assert.ok(!violations.includes("src/lib/scaffoldaiHousekeeping.auth.scaffoldai.js"));
});
