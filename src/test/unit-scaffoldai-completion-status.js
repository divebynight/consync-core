"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { gatherCompletionStatus } = require("../lib/scaffoldaiCompletionStatus.query.scaffoldai");
const { getRepoRoot } = require("../lib/repoRoot.util.shared");

const TEST_NAME = "unit-scaffoldai-completion-status";
const repoRoot = getRepoRoot(__dirname);
const fixtureRoot = path.join(repoRoot, ".scaffoldai", "tmp", `${TEST_NAME}-fixture`);
const fixtureSignalDir = path.join(fixtureRoot, ".scaffoldai", "runtime", "mcp");
const fixtureSignalPath = path.join(fixtureSignalDir, "signals.jsonl");

function writeFixtureSignals() {
  fs.mkdirSync(fixtureSignalDir, { recursive: true });

  const rows = [
    {
      timestamp: "2026-05-15T00:00:00.000Z",
      client_id: "copilot",
      signal_type: "packet_completed",
      packet: "packet-alpha.sdc.md",
      message: "Alpha complete",
      verify_command: "npm run verify:scaffoldai",
      verify_status: "passed",
      changed_files: ["src/scaffoldai/mcp/signal.js"],
      summary: "Alpha summary",
      commit_suggestion: "scaffoldai: complete alpha",
      needs_human_closeout: true,
    },
    {
      timestamp: "2026-05-15T00:01:00.000Z",
      client_id: "copilot",
      signal_type: "blocker",
      packet: "packet-alpha.sdc.md",
      severity: "blocked",
      message: "Need human confirmation",
    },
    {
      timestamp: "2026-05-15T00:02:00.000Z",
      client_id: "copilot",
      signal_type: "packet_completed",
      packet: "packet-beta.sdc.md",
      message: "Beta complete",
      verify_command: "npm run verify:scaffoldai",
      verify_status: "failed",
      changed_files: ["src/scaffoldai/mcp/tools.js"],
    },
    {
      timestamp: "2026-05-15T00:03:00.000Z",
      client_id: "copilot",
      signal_type: "packet_completed",
      packet: "packet-gamma.sdc.md",
      message: "Gamma complete",
      verify_command: "npm run verify:scaffoldai",
      verify_status: "unknown-status",
      changed_files: ["src/scaffoldai/mcp/server.js"],
    },
  ];

  fs.writeFileSync(fixtureSignalPath, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
}

function cleanupFixture() {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  cleanupFixture();
  writeFixtureSignals();

  const statusAll = gatherCompletionStatus(fixtureRoot, { limit: 25 });
  assert.strictEqual(statusAll.tool, "scaffoldai_completion_status", "tool name should match completion status");
  assert.strictEqual(statusAll.execution_class, "READ_ONLY", "execution class should remain READ_ONLY");
  assert.strictEqual(statusAll.status, "OBSERVE", "status should be OBSERVE");
  assert.ok(Array.isArray(statusAll.data.completions), "completions should be an array");
  assert.strictEqual(statusAll.data.returned_count, 3, "all completion records should be visible when unfiltered");

  const gamma = statusAll.data.completions.find((entry) => entry.packet === "packet-gamma.sdc.md");
  assert.ok(gamma, "gamma completion should be present");
  assert.strictEqual(gamma.verify_status, "not_run", "invalid verify_status should normalize to not_run");

  const alpha = statusAll.data.completions.find((entry) => entry.packet === "packet-alpha.sdc.md");
  assert.ok(alpha, "alpha completion should be present");
  assert.strictEqual(alpha.unresolved_pending_questions, true, "alpha should report unresolved pending questions");
  assert.strictEqual(alpha.unresolved_pending_question_count, 1, "alpha pending question count should be surfaced");
  assert.ok(
    /Resolve blockers first/.test(alpha.closeout_recommendation),
    "alpha recommendation should require blocker resolution"
  );

  const betaOnly = gatherCompletionStatus(fixtureRoot, { packet: "packet-beta.sdc.md", latestOnly: true, limit: 25 });
  assert.strictEqual(betaOnly.data.returned_count, 1, "packet+latest filters should return one matching completion");
  assert.strictEqual(betaOnly.data.completions[0].packet, "packet-beta.sdc.md", "packet filter should be applied");
  assert.strictEqual(betaOnly.data.completions[0].verify_status, "failed", "packet result should keep verify_status");
  assert.ok(
    /Resolve blockers first/.test(betaOnly.data.completions[0].closeout_recommendation),
    "failed verify should recommend resolving blockers"
  );

  const noMatch = gatherCompletionStatus(fixtureRoot, { packet: "missing-packet.sdc.md", latestOnly: true, limit: 25 });
  assert.strictEqual(noMatch.data.returned_count, 0, "non-matching packet filter should return no completions");

  cleanupFixture();
  console.log(`[${TEST_NAME}] PASS`);
}

try {
  main();
} catch (error) {
  cleanupFixture();
  console.error(`[${TEST_NAME}] FAIL: ${error.message}`);
  process.exitCode = 1;
}
