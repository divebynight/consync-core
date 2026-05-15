"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { gatherPendingQuestions } = require("../lib/scaffoldaiPendingQuestions.query.scaffoldai");
const { getRepoRoot } = require("../lib/repoRoot.util.shared");

const TEST_NAME = "unit-scaffoldai-pending-questions";
const repoRoot = getRepoRoot(__dirname);
const fixtureRoot = path.join(repoRoot, ".scaffoldai", "tmp", `${TEST_NAME}-fixture`);
const fixtureSignalDir = path.join(fixtureRoot, ".scaffoldai", "runtime", "mcp");
const fixtureSignalPath = path.join(fixtureSignalDir, "signals.jsonl");

function writeFixtureSignals() {
  fs.mkdirSync(fixtureSignalDir, { recursive: true });

  const rows = [
    {
      timestamp: "2026-05-14T00:00:00.000Z",
      client_id: "copilot",
      signal_type: "question",
      packet: "packet-alpha.sdc.md",
      severity: "needs_decision",
      message: "Pick canonical packet identifier",
      options: ["filename", "frontmatter"],
    },
    {
      timestamp: "2026-05-14T00:03:00.000Z",
      client_id: "copilot",
      signal_type: "blocker",
      packet: "packet-beta.sdc.md",
      severity: "blocked",
      message: "Need human decision on resolution model",
      options: ["append-only", "authoritative"],
      question_id: "q_beta_1",
      question_hash: "bbbbbbbbbbbbbbbb",
    },
    {
      timestamp: "2026-05-14T00:05:00.000Z",
      client_id: "copilot",
      signal_type: "question_resolved",
      packet: "packet-alpha.sdc.md",
      question_text: "Pick canonical packet identifier",
      resolved_by: "human.owner",
      resolution_note: "Decision recorded in packet metadata.",
      message: "Resolved in working notes",
    },
    {
      timestamp: "2026-05-14T00:08:00.000Z",
      client_id: "copilot",
      signal_type: "unblocked",
      packet: "packet-beta.sdc.md",
      question_id: "q_beta_1",
      question_hash: "bbbbbbbbbbbbbbbb",
      resolved_by: "human.owner",
      resolution_note: "Chose append-only model",
      message: "No longer blocked",
    },
    {
      timestamp: "2026-05-14T00:12:00.000Z",
      client_id: "copilot",
      signal_type: "question",
      packet: "packet-gamma.sdc.md",
      severity: "needs_decision",
      message: "Keep unresolved sample",
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

  const before = fs.readFileSync(fixtureSignalPath, "utf8");

  const unresolved = gatherPendingQuestions(fixtureRoot, { unresolvedOnly: true, limit: 25 });
  assert.strictEqual(unresolved.tool, "scaffoldai_pending_questions", "tool name should match");
  assert.strictEqual(unresolved.execution_class, "READ_ONLY", "execution class should remain READ_ONLY");
  assert.strictEqual(unresolved.status, "OBSERVE", "status should remain OBSERVE");
  assert.strictEqual(unresolved.data.unresolved_only, true, "unresolved_only should default to true");
  assert.ok(Array.isArray(unresolved.data.pending_questions), "pending_questions should be an array");
  assert.strictEqual(unresolved.data.returned_count, 1, "only unresolved question should be returned");
  assert.strictEqual(
    unresolved.data.pending_questions[0].question,
    "Keep unresolved sample",
    "unresolvedOnly=true should hide resolved items"
  );
  assert.strictEqual(
    unresolved.data.pending_questions[0].resolution_status,
    "unresolved",
    "remaining item should be unresolved"
  );
  assert.strictEqual(unresolved.data.pending_questions[0].resolved_at, null, "unresolved item should have null resolved_at");
  assert.strictEqual(unresolved.data.pending_questions[0].resolved_by, null, "unresolved item should have null resolved_by");
  console.log("  PASS: unresolvedOnly=true hides resolved entries");

  const historical = gatherPendingQuestions(fixtureRoot, { unresolvedOnly: false, limit: 25 });
  assert.strictEqual(historical.data.unresolved_only, false, "unresolvedOnly=false should be reflected in output");
  assert.strictEqual(historical.data.total_question_signals, 3, "question and blocker rows should count as question signals");
  assert.strictEqual(historical.data.returned_count, 3, "historical view should retain all question records");

  const resolvedAlpha = historical.data.pending_questions.find((entry) => entry.packet === "packet-alpha.sdc.md");
  assert.ok(resolvedAlpha, "historical view should include packet-alpha question");
  assert.strictEqual(resolvedAlpha.resolution_status, "resolved", "packet-alpha should be resolved");
  assert.strictEqual(resolvedAlpha.resolved_at, "2026-05-14T00:05:00.000Z", "packet-alpha resolved_at should be detected");
  assert.strictEqual(resolvedAlpha.resolved_by, "human.owner", "packet-alpha resolved_by should be detected");

  const resolvedBeta = historical.data.pending_questions.find((entry) => entry.packet === "packet-beta.sdc.md");
  assert.ok(resolvedBeta, "historical view should include packet-beta blocker");
  assert.strictEqual(resolvedBeta.resolution_status, "resolved", "packet-beta should be resolved");
  assert.strictEqual(resolvedBeta.resolved_at, "2026-05-14T00:08:00.000Z", "packet-beta resolved_at should be detected");
  assert.strictEqual(resolvedBeta.resolved_by, "human.owner", "packet-beta resolved_by should be detected");
  assert.strictEqual(resolvedBeta.question_id, "q_beta_1", "question_id should be preserved on output");
  assert.strictEqual(resolvedBeta.question_hash, "bbbbbbbbbbbbbbbb", "question_hash should be preserved on output");

  const after = fs.readFileSync(fixtureSignalPath, "utf8");
  assert.strictEqual(after, before, "gatherPendingQuestions must not mutate runtime signal history");
  console.log("  PASS: historical view retains resolved entries and preserves append-only history");

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
