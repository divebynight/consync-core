"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { getRepoRoot } = require("../lib/repoRoot.util.shared");
const {
  runLifecycleProbe,
  validateProbeReport,
  PROBE_PACKET_TITLE,
  PROBE_CLIENT_ID,
} = require("../lib/scaffoldaiLifecycleProbe.lib.scaffoldai");

const TEST_NAME = "unit-scaffoldai-lifecycle-probe";
const repoRoot = getRepoRoot(__dirname);
const tempRoot = path.join(repoRoot, ".scaffoldai", "tmp");

const LIVE_RUNTIME_FILES = [
  ".scaffoldai/state/active-runtime.json",
  ".scaffoldai/state/next-action.md",
  ".scaffoldai/state/snapshot.md",
  ".scaffoldai/state/history.jsonl",
  ".scaffoldai/runtime/mcp/signals.jsonl",
  ".scaffoldai/runtime/mcp/shared-memory.jsonl",
  ".scaffoldai/runtime/packet-intake/latest-intake.json",
];

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack || error.message);
  process.exit(1);
}

function snapshotLiveRuntime(rootPath) {
  const snapshot = {};
  for (const relativePath of LIVE_RUNTIME_FILES) {
    const absolutePath = path.join(rootPath, relativePath);
    if (!fs.existsSync(absolutePath)) {
      snapshot[relativePath] = { exists: false, content: null };
      continue;
    }
    snapshot[relativePath] = {
      exists: true,
      content: fs.readFileSync(absolutePath, "utf8"),
    };
  }
  return snapshot;
}

function assertLiveRuntimeUnchanged(before, after) {
  for (const relativePath of LIVE_RUNTIME_FILES) {
    const baseline = before[relativePath];
    const current = after[relativePath];
    assert.strictEqual(
      current.exists,
      baseline.exists,
      `live runtime file existence changed: ${relativePath}`
    );
    assert.strictEqual(
      current.content,
      baseline.content,
      `live runtime file content changed: ${relativePath}`
    );
  }
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  const beforeLive = snapshotLiveRuntime(repoRoot);

  try {
    // -----------------------------------------------------------------------
    // Test 1: probe generation — probe report has correct structure
    // -----------------------------------------------------------------------
    const report = runLifecycleProbe(repoRoot, { probeId: "test-probe-gen" });

    assert.strictEqual(typeof report, "object", "probe report should be an object");
    assert.strictEqual(typeof report.probe_id, "string", "probe report should have probe_id");
    assert.ok(Array.isArray(report.phases_reached), "probe report should have phases_reached array");
    assert.ok(Array.isArray(report.blocked_transitions), "probe report should have blocked_transitions array");
    assert.ok(Array.isArray(report.mcp_tools_exercised), "probe report should have mcp_tools_exercised array");
    assert.ok(Array.isArray(report.errors), "probe report should have errors array");
    assert.ok(Array.isArray(report.terminal_states_observed), "probe report should have terminal_states_observed array");

    console.log(`[${TEST_NAME}] probe generation: PASS`);

    // -----------------------------------------------------------------------
    // Test 2: probe lifecycle flow — all expected phases reached
    // -----------------------------------------------------------------------
    assert.ok(report.ok, `probe should complete ok (errors: ${JSON.stringify(report.errors)})`);
    assert.strictEqual(report.errors.length, 0, "probe should have no errors");

    const validation = validateProbeReport(report);
    assert.ok(
      validation.valid,
      `probe report validation failed — missing: ${validation.missing_phases.join(", ")}, errors: ${validation.errors.join(", ")}`
    );

    // Verify all expected lifecycle phases are reached
    const expectedPhases = [
      "probe_fixture_init",
      "packet_submission",
      "packet_intake",
      "packet_activation",
      "packet_claim",
      "verify_evidence_written",
      "closeout_readiness",
      "claim_release",
      "clean_workspace",
    ];
    for (const phase of expectedPhases) {
      assert.ok(
        report.phases_reached.includes(phase),
        `expected phase "${phase}" not reached (got: ${report.phases_reached.join(", ")})`
      );
    }

    console.log(`[${TEST_NAME}] probe lifecycle flow: PASS`);

    // -----------------------------------------------------------------------
    // Test 3: MCP tools exercised — key tools appear in report
    // -----------------------------------------------------------------------
    const expectedTools = ["intakePacket", "activatePacket", "claimPacket", "releasePacket"];
    for (const tool of expectedTools) {
      assert.ok(
        report.mcp_tools_exercised.includes(tool),
        `expected MCP tool "${tool}" not exercised (got: ${report.mcp_tools_exercised.join(", ")})`
      );
    }

    console.log(`[${TEST_NAME}] MCP tools exercised: PASS`);

    // -----------------------------------------------------------------------
    // Test 4: cleanup behavior — probe fixture is cleaned up; no temp dirs left
    // -----------------------------------------------------------------------
    assert.ok(report.cleanup !== null, "probe report should have cleanup info");
    assert.strictEqual(report.cleanup.status, "PASS", "cleanup should report PASS");

    // Verify no lifecycle-probe-* dirs remain in .scaffoldai/tmp after probe
    if (fs.existsSync(tempRoot)) {
      const remnants = fs.readdirSync(tempRoot).filter((name) => name.startsWith("lifecycle-probe-"));
      assert.strictEqual(
        remnants.length,
        0,
        `probe fixture dirs should be cleaned up (found: ${remnants.join(", ")})`
      );
    }

    console.log(`[${TEST_NAME}] cleanup behavior: PASS`);

    // -----------------------------------------------------------------------
    // Test 5: refusal behavior — probe succeeds even with no active packet in
    //         live runtime (probe is fully isolated from live state)
    // -----------------------------------------------------------------------
    const secondReport = runLifecycleProbe(repoRoot, { probeId: "test-probe-2" });
    assert.ok(
      secondReport.ok,
      "probe should succeed independently of live packet state"
    );
    const secondValidation = validateProbeReport(secondReport);
    assert.ok(secondValidation.valid, "second probe run should also be valid");

    console.log(`[${TEST_NAME}] refusal behavior (isolated from live state): PASS`);

    // -----------------------------------------------------------------------
    // Test 6: idempotency — running probe twice produces consistent results
    // -----------------------------------------------------------------------
    assert.deepStrictEqual(
      report.phases_reached,
      secondReport.phases_reached,
      "two probe runs should reach the same phases"
    );
    assert.deepStrictEqual(
      report.mcp_tools_exercised,
      secondReport.mcp_tools_exercised,
      "two probe runs should exercise the same MCP tools"
    );

    console.log(`[${TEST_NAME}] idempotency: PASS`);

    // -----------------------------------------------------------------------
    // Test 7: terminal state — probe_complete is always the last terminal state
    // -----------------------------------------------------------------------
    assert.ok(
      report.terminal_states_observed.includes("probe_complete"),
      "probe should observe probe_complete terminal state"
    );
    assert.strictEqual(
      report.terminal_states_observed[report.terminal_states_observed.length - 1],
      "probe_complete",
      "probe_complete should be the last terminal state"
    );

    console.log(`[${TEST_NAME}] terminal state: PASS`);

    // -----------------------------------------------------------------------
    // Test 8: live runtime isolation — probe must not mutate live runtime files
    // -----------------------------------------------------------------------
    const afterLive = snapshotLiveRuntime(repoRoot);
    assertLiveRuntimeUnchanged(beforeLive, afterLive);

    console.log(`[${TEST_NAME}] live runtime isolation: PASS`);

    // -----------------------------------------------------------------------
    // Test 9: exported constants are well-formed
    // -----------------------------------------------------------------------
    assert.strictEqual(typeof PROBE_PACKET_TITLE, "string", "PROBE_PACKET_TITLE should be a string");
    assert.ok(PROBE_PACKET_TITLE.length > 0, "PROBE_PACKET_TITLE should not be empty");
    assert.strictEqual(typeof PROBE_CLIENT_ID, "string", "PROBE_CLIENT_ID should be a string");
    assert.ok(PROBE_CLIENT_ID.length > 0, "PROBE_CLIENT_ID should not be empty");

    console.log(`[${TEST_NAME}] exported constants: PASS`);

    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  }
}

main();
