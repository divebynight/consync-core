"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { runSubmitSdcCandidateTool } = require("../scaffoldai/mcp/submit-sdc-candidate");

const TEST_NAME = "validate-remote-submit-duplicate-and-pending-guards";
const repoRoot = path.resolve(__dirname, "..", "..");
const tempRoot = path.join(repoRoot, ".scaffoldai", "tmp");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validPacketContent(title = "Test Packet", uniqueSuffix = "") {
  const id = uniqueSuffix ? ` ${uniqueSuffix}` : "";
  return [
    `# SDC — ${title}${id}`,
    "",
    "MODE: PROCESS_REFACTOR",
    "EXECUTION SURFACE: Test packet submission",
    "",
    "APPROVAL:",
    "  execute: PENDING",
    "  commit: PENDING",
    "",
    "GOAL:",
    "Validate guard behavior.",
    "",
    "TASKS:",
    "1. Test submission.",
    "",
    "VERIFY:",
    "- npm run verify:scaffoldai",
    "",
    "OUTPUT:",
    "1. validation result",
    "",
    "CONSTRAINTS:",
    "- no activation",
    "- no claim",
    "",
  ].join("\n");
}

function createFixtureRepo() {
  if (!fs.existsSync(tempRoot)) {
    fs.mkdirSync(tempRoot, { recursive: true });
  }
  const fixture = fs.mkdtempSync(path.join(tempRoot, `${TEST_NAME}-`));
  const scaffoldaiDir = path.join(fixture, ".scaffoldai");
  fs.mkdirSync(path.join(scaffoldaiDir, "inbox"), { recursive: true });
  fs.mkdirSync(path.join(scaffoldaiDir, "state"), { recursive: true });
  fs.mkdirSync(path.join(scaffoldaiDir, "runtime", "mcp"), { recursive: true });

  // Minimal fixture state files
  fs.writeFileSync(
    path.join(scaffoldaiDir, "state", "active-runtime.json"),
    JSON.stringify({ status: "safe_idle" }, null, 2)
  );
  fs.writeFileSync(
    path.join(scaffoldaiDir, "state", "next-action.md"),
    "TYPE: placeholder\n\nNo active packet"
  );

  return fixture;
}

function cleanupFixture(fixturePath) {
  if (fs.existsSync(fixturePath)) {
    fs.rmSync(fixturePath, { recursive: true, force: true });
  }
}

function recordInboxState(fixture, label) {
  const inboxPath = path.join(fixture, ".scaffoldai", "inbox");
  if (!fs.existsSync(inboxPath)) return { label, files: [] };

  const files = fs
    .readdirSync(inboxPath, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => ({
      name: e.name,
      size: fs.statSync(path.join(inboxPath, e.name)).size,
    }));

  return { label, timestamp: new Date().toISOString(), files };
}

function assertRuntimeUnchanged(before, after, label) {
  const beforeRT = fs.readFileSync(before.runtimePath, "utf8");
  const afterRT = fs.readFileSync(after.runtimePath, "utf8");
  assert.strictEqual(
    beforeRT,
    afterRT,
    `${label}: active-runtime.json must not change`
  );

  const beforeNA = fs.readFileSync(before.nextActionPath, "utf8");
  const afterNA = fs.readFileSync(after.nextActionPath, "utf8");
  assert.strictEqual(beforeNA, afterNA, `${label}: next-action.md must not change`);
}

// ---------------------------------------------------------------------------
// Scenario Functions
// ---------------------------------------------------------------------------

function scenarioExactDuplicate() {
  console.log("\n[SCENARIO 1] Exact Duplicate Submit");
  const fixture = createFixtureRepo();

  try {
    const baselineInbox = recordInboxState(fixture, "baseline");
    console.log(`  Baseline inbox: ${baselineInbox.files.length} files`);

    // First submit
    const first = runSubmitSdcCandidateTool(
      {
        content: validPacketContent("Exact Duplicate Test", "v1"),
        submittedBy: "test-client",
      },
      { repoRoot: fixture }
    );

    assert.strictEqual(first.status, "accepted", "first submit should be accepted");
    assert.strictEqual(first.candidate_submitted, true);
    console.log(`  ✓ First submit accepted: ${first.candidate_path}`);

    const afterFirst = recordInboxState(fixture, "after-first");
    assert.strictEqual(
      afterFirst.files.length,
      baselineInbox.files.length + 1,
      "inbox should have 1 new file"
    );

    // Second submit with identical content and filename
    const second = runSubmitSdcCandidateTool(
      {
        content: validPacketContent("Exact Duplicate Test", "v1"),
        submittedBy: "test-client",
      },
      { repoRoot: fixture }
    );

    assert.strictEqual(second.status, "rejected", "second identical submit should be rejected");
    assert.strictEqual(
      second.error_category,
      "duplicate_or_pending_candidate_guard",
      "error should be duplicate_or_pending_candidate_guard"
    );
    assert.ok(
      second.reason.includes("already exists"),
      "reason should mention file already exists"
    );
    assert.strictEqual(second.candidate_submitted, false);
    console.log(`  ✓ Second submit rejected: ${second.reason}`);

    const afterSecond = recordInboxState(fixture, "after-second");
    assert.strictEqual(
      afterSecond.files.length,
      afterFirst.files.length,
      "inbox should not change after rejection"
    );

    // Verify next-action and runtime not mutated
    const beforeRuntime = fs.readFileSync(
      path.join(fixture, ".scaffoldai", "state", "active-runtime.json"),
      "utf8"
    );
    const beforeNA = fs.readFileSync(
      path.join(fixture, ".scaffoldai", "state", "next-action.md"),
      "utf8"
    );

    const thirdAttempt = runSubmitSdcCandidateTool(
      {
        content: validPacketContent("Exact Duplicate Test", "v1"),
      },
      { repoRoot: fixture }
    );

    const afterRuntime = fs.readFileSync(
      path.join(fixture, ".scaffoldai", "state", "active-runtime.json"),
      "utf8"
    );
    const afterNA = fs.readFileSync(
      path.join(fixture, ".scaffoldai", "state", "next-action.md"),
      "utf8"
    );

    assert.strictEqual(
      beforeRuntime,
      afterRuntime,
      "active-runtime.json must not mutate from rejected submit"
    );
    assert.strictEqual(
      beforeNA,
      afterNA,
      "next-action.md must not mutate from rejected submit"
    );
    console.log(`  ✓ No lifecycle mutation from rejected submit`);

    console.log("✓ SCENARIO 1 PASS: Exact duplicate submit is rejected deterministically");
    return { pass: true };
  } finally {
    cleanupFixture(fixture);
  }
}

function scenarioSameTitleSameSlugCollision() {
  console.log("\n[SCENARIO 2] Same Title / Same Slug Collision");
  const fixture = createFixtureRepo();

  try {
    // First candidate with title "Add Feature X"
    const first = runSubmitSdcCandidateTool(
      {
        content: validPacketContent("Add Feature X"),
        suggestedFileName: "feature-x-proposal",
        submittedBy: "agent-a",
      },
      { repoRoot: fixture }
    );

    assert.strictEqual(first.status, "accepted");
    assert.ok(first.identity.packet_id, "should have packet_id");
    const firstPacketId = first.identity.packet_id;
    console.log(`  ✓ First candidate accepted with packet_id: ${firstPacketId}`);

    // Second candidate with identical title but different filename suggestion
    // Should collide by packet_id (same title normalizes to same packet_id)
    const second = runSubmitSdcCandidateTool(
      {
        content: validPacketContent("Add Feature X"),
        suggestedFileName: "add-feature-x-alternate",
        submittedBy: "agent-b",
      },
      { repoRoot: fixture }
    );

    assert.strictEqual(
      second.status,
      "rejected",
      "second candidate with same title should be rejected"
    );
    assert.strictEqual(
      second.error_category,
      "duplicate_or_pending_candidate_guard",
      "should use duplicate guard error category"
    );
    assert.ok(
      second.reason.includes("pending candidate already exists"),
      "reason should mention pending candidate"
    );
    assert.ok(
      second.reason.includes(firstPacketId),
      "reason should reference the existing packet_id"
    );
    console.log(`  ✓ Same-title collision detected: ${second.reason}`);

    console.log("✓ SCENARIO 2 PASS: Same title / same slug collision is rejected");
    return { pass: true };
  } finally {
    cleanupFixture(fixture);
  }
}

function scenarioSuggestedFilenameSameCanonical() {
  console.log("\n[SCENARIO 3] Suggested Filename Collision (maps to same canonical)");
  const fixture = createFixtureRepo();

  try {
    // Content that will normalize to "test-candidate.sdc.md"
    const baseContent = validPacketContent("Test Candidate Alpha");

    // First submit with no suggested filename (uses canonical)
    const first = runSubmitSdcCandidateTool(
      {
        content: baseContent,
        submittedBy: "client-a",
      },
      { repoRoot: fixture }
    );

    assert.strictEqual(first.status, "accepted");
    const firstFileName = first.candidate.file_name;
    console.log(`  ✓ First candidate accepted with filename: ${firstFileName}`);

    // Second submit with different content but suggested filename that normalizes to same as first
    // Extract the stem from canonical filename and suggest it
    const stemFromFirst = firstFileName.replace(/\.sdc\.md$/, "");
    const second = runSubmitSdcCandidateTool(
      {
        content: validPacketContent("Different Content For Test Candidate"),
        suggestedFileName: stemFromFirst,
        submittedBy: "client-b",
      },
      { repoRoot: fixture }
    );

    assert.strictEqual(
      second.status,
      "rejected",
      "second with filename collision should be rejected"
    );
    assert.strictEqual(
      second.error_category,
      "duplicate_or_pending_candidate_guard"
    );
    assert.ok(
      second.reason.includes(firstFileName),
      "error should name the conflicting file"
    );
    console.log(`  ✓ Filename collision detected: ${second.reason}`);

    console.log("✓ SCENARIO 3 PASS: Suggested filename collision is rejected");
    return { pass: true };
  } finally {
    cleanupFixture(fixture);
  }
}

function scenarioContentDistinctIdentityEquivalent() {
  console.log("\n[SCENARIO 4] Content-Distinct but Identity-Equivalent Candidate");
  const fixture = createFixtureRepo();

  try {
    // First submit
    const first = runSubmitSdcCandidateTool(
      {
        content: validPacketContent("Identity Equivalence Test"),
        submittedBy: "client-a",
      },
      { repoRoot: fixture }
    );

    assert.strictEqual(first.status, "accepted");
    const packetId = first.identity.packet_id;
    const fileName = first.candidate.file_name;
    console.log(`  ✓ First candidate accepted: ${fileName} (packet_id: ${packetId})`);

    // Second submit with different BODY but same TITLE (same packet_id)
    const differentBody = [
      `# SDC — Identity Equivalence Test`,
      "",
      "MODE: PROCESS_REFACTOR",
      "EXECUTION SURFACE: DIFFERENT implementation surface",
      "",
      "APPROVAL:",
      "  execute: PENDING",
      "  commit: PENDING",
      "",
      "GOAL:",
      "Different goal statement.",
      "",
      "TASKS:",
      "1. Different task.",
      "",
      "VERIFY:",
      "- npm run verify:scaffoldai",
      "",
      "OUTPUT:",
      "1. different output",
      "",
      "CONSTRAINTS:",
      "- no activation",
    ].join("\n");

    const second = runSubmitSdcCandidateTool(
      {
        content: differentBody,
        suggestedFileName: `${fileName.replace(/\.sdc\.md/, "")}-v2`,
        submittedBy: "client-b",
      },
      { repoRoot: fixture }
    );

    assert.strictEqual(
      second.status,
      "rejected",
      "content-distinct but identity-equivalent candidate should be rejected"
    );
    assert.strictEqual(
      second.error_category,
      "duplicate_or_pending_candidate_guard"
    );
    assert.ok(
      second.reason.includes("pending candidate already exists for packet id"),
      "error should reference packet_id collision"
    );
    console.log(
      `  ✓ Identity-equivalent candidate rejected: ${second.reason}`
    );

    console.log(
      "✓ SCENARIO 4 PASS: Content-distinct but identity-equivalent candidate is rejected"
    );
    return { pass: true };
  } finally {
    cleanupFixture(fixture);
  }
}

function scenarioStructuredRejectionDiagnostics() {
  console.log("\n[SCENARIO 5] Structured Rejection Diagnostics");
  const fixture = createFixtureRepo();

  try {
    // Setup: submit a base candidate
    const base = runSubmitSdcCandidateTool(
      {
        content: validPacketContent("Diagnostic Test Base"),
        submittedBy: "diagnostics-test",
      },
      { repoRoot: fixture }
    );
    assert.strictEqual(base.status, "accepted");

    // Attempt duplicate
    const duplicate = runSubmitSdcCandidateTool(
      {
        content: validPacketContent("Diagnostic Test Base"),
        submittedBy: "diagnostics-test",
      },
      { repoRoot: fixture }
    );

    assert.strictEqual(duplicate.status, "rejected");

    // Check structured diagnostics
    assert.strictEqual(
      duplicate.execution_class,
      "LOCAL_CANDIDATE_INBOX_WRITE_ONLY",
      "should preserve execution_class"
    );
    assert.ok(
      duplicate.error_category,
      "should have error_category"
    );
    assert.ok(
      duplicate.reason,
      "should have reason string"
    );
    assert.ok(
      Array.isArray(duplicate.guard_errors),
      "should have guard_errors array"
    );
    assert.ok(
      duplicate.guard_errors.length > 0,
      "guard_errors should not be empty"
    );
    assert.strictEqual(
      duplicate.candidate_submitted,
      false,
      "should have candidate_submitted: false"
    );
    assert.ok(
      duplicate.next_safe_action,
      "should have next_safe_action guidance"
    );

    console.log(`  ✓ Error category: ${duplicate.error_category}`);
    console.log(`  ✓ Reason: ${duplicate.reason}`);
    console.log(
      `  ✓ Guard errors: ${duplicate.guard_errors.join("; ")}`
    );
    console.log(`  ✓ Next action: ${duplicate.next_safe_action}`);

    console.log("✓ SCENARIO 5 PASS: Rejection diagnostics are structured and informative");
    return { pass: true };
  } finally {
    cleanupFixture(fixture);
  }
}

function scenarioNoRuntimeMutationFromRejection() {
  console.log("\n[SCENARIO 6] No Runtime Mutation From Rejected Submit");
  const fixture = createFixtureRepo();

  try {
    // Snapshot initial state
    const beforeRT = fs.readFileSync(
      path.join(fixture, ".scaffoldai", "state", "active-runtime.json"),
      "utf8"
    );
    const beforeNA = fs.readFileSync(
      path.join(fixture, ".scaffoldai", "state", "next-action.md"),
      "utf8"
    );

    // Submit and reject
    const attempt1 = runSubmitSdcCandidateTool(
      {
        content: validPacketContent("Runtime Mutation Test"),
      },
      { repoRoot: fixture }
    );
    assert.strictEqual(attempt1.status, "accepted");

    const afterFirstRT = fs.readFileSync(
      path.join(fixture, ".scaffoldai", "state", "active-runtime.json"),
      "utf8"
    );
    const afterFirstNA = fs.readFileSync(
      path.join(fixture, ".scaffoldai", "state", "next-action.md"),
      "utf8"
    );

    // These should not have changed
    assert.strictEqual(beforeRT, afterFirstRT, "runtime should not change from accepted submit");
    assert.strictEqual(beforeNA, afterFirstNA, "next-action should not change from accepted submit");
    console.log(`  ✓ Active runtime unaffected by accepted candidate submit`);

    // Now try rejected submit
    const attempt2 = runSubmitSdcCandidateTool(
      {
        content: validPacketContent("Runtime Mutation Test"),
      },
      { repoRoot: fixture }
    );
    assert.strictEqual(attempt2.status, "rejected");

    const afterRejectionRT = fs.readFileSync(
      path.join(fixture, ".scaffoldai", "state", "active-runtime.json"),
      "utf8"
    );
    const afterRejectionNA = fs.readFileSync(
      path.join(fixture, ".scaffoldai", "state", "next-action.md"),
      "utf8"
    );

    assert.strictEqual(afterFirstRT, afterRejectionRT, "runtime should not change from rejected submit");
    assert.strictEqual(afterFirstNA, afterRejectionNA, "next-action should not change from rejected submit");
    console.log(`  ✓ Active runtime unaffected by rejected candidate submit`);

    console.log(
      "✓ SCENARIO 6 PASS: No runtime/lifecycle mutation occurs from submit attempts"
    );
    return { pass: true };
  } finally {
    cleanupFixture(fixture);
  }
}

function scenarioNormalCandidateStillWorks() {
  console.log("\n[SCENARIO 7] Normal Unique Candidate Submission Still Works");
  const fixture = createFixtureRepo();

  try {
    const baselineInbox = recordInboxState(fixture, "baseline");

    // Submit multiple unique candidates
    const results = [];
    for (let i = 1; i <= 3; i++) {
      const result = runSubmitSdcCandidateTool(
        {
          content: validPacketContent(`Unique Candidate ${i}`),
          suggestedFileName: `unique-candidate-${i}`,
          submittedBy: `client-${i}`,
        },
        { repoRoot: fixture }
      );

      assert.strictEqual(result.status, "accepted", `candidate ${i} should be accepted`);
      assert.strictEqual(result.candidate_submitted, true);
      results.push(result);
      console.log(`  ✓ Unique candidate ${i} accepted: ${result.candidate_path}`);
    }

    const afterInbox = recordInboxState(fixture, "after");
    assert.strictEqual(
      afterInbox.files.length,
      baselineInbox.files.length + 3,
      "inbox should have 3 new files"
    );

    // Verify all have distinct packet_ids
    const packetIds = results.map((r) => r.identity.packet_id);
    const uniqueIds = new Set(packetIds);
    assert.strictEqual(
      uniqueIds.size,
      packetIds.length,
      "all candidates should have unique packet_ids"
    );

    console.log(`  ✓ All candidates have unique packet_ids`);

    console.log(
      "✓ SCENARIO 7 PASS: Normal unique candidate submissions continue to work"
    );
    return { pass: true };
  } finally {
    cleanupFixture(fixture);
  }
}

function scenarioLifecycleBoundaryIntact() {
  console.log("\n[SCENARIO 8] Lifecycle Boundary Remains Intact");
  const fixture = createFixtureRepo();

  try {
    // Submit a candidate
    const result = runSubmitSdcCandidateTool(
      {
        content: validPacketContent("Boundary Test"),
      },
      { repoRoot: fixture }
    );

    assert.strictEqual(result.status, "accepted");

    // Verify no lifecycle state is modified
    assert.strictEqual(
      result.activated,
      false,
      "candidate should not be activated"
    );
    assert.strictEqual(
      result.claimed,
      false,
      "candidate should not be claimed"
    );
    assert.strictEqual(
      result.active_runtime_mutated,
      false,
      "active runtime should not be mutated"
    );
    assert.strictEqual(
      result.next_action_mutated,
      false,
      "next_action should not be mutated"
    );

    // Verify next action is unchanged
    const nextAction = fs.readFileSync(
      path.join(fixture, ".scaffoldai", "state", "next-action.md"),
      "utf8"
    );
    assert.ok(
      nextAction.includes("placeholder") || nextAction.includes("No active packet"),
      "next-action should remain in placeholder state"
    );

    console.log(`  ✓ Candidate not activated`);
    console.log(`  ✓ Candidate not claimed`);
    console.log(`  ✓ Runtime state preserved`);

    console.log("✓ SCENARIO 8 PASS: Lifecycle boundary remains intact");
    return { pass: true };
  } finally {
    cleanupFixture(fixture);
  }
}

// ---------------------------------------------------------------------------
// Main Runner
// ---------------------------------------------------------------------------

function main() {
  console.log(`[${TEST_NAME}] Starting validation suite`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const results = [];

  const scenarios = [
    scenarioExactDuplicate,
    scenarioSameTitleSameSlugCollision,
    scenarioSuggestedFilenameSameCanonical,
    scenarioContentDistinctIdentityEquivalent,
    scenarioStructuredRejectionDiagnostics,
    scenarioNoRuntimeMutationFromRejection,
    scenarioNormalCandidateStillWorks,
    scenarioLifecycleBoundaryIntact,
  ];

  for (const scenario of scenarios) {
    try {
      const result = scenario();
      results.push(result);
    } catch (error) {
      console.error(`✗ Scenario failed: ${error.message}`);
      console.error(error.stack);
      results.push({ pass: false, error: error.message });
    }
  }

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;

  console.log(`\n${"=".repeat(70)}`);
  console.log(`Summary: ${passed}/${total} scenarios passed`);

  if (passed === total) {
    console.log(`✓ ALL SCENARIOS PASSED`);
    process.exitCode = 0;
  } else {
    console.log(`✗ ${total - passed} scenario(s) failed`);
    process.exitCode = 1;
  }
}

main();
