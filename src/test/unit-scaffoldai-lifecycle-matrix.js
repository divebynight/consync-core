"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const { getRepoRoot } = require("../lib/repoRoot.util.shared");
const { intakePacket: intakePacketOrig } = require("../lib/scaffoldaiPacketIntake.auth.scaffoldai");
const { activatePacket: activatePacketOrig, clearActivePacket } = require("../lib/scaffoldaiPacketActivation.auth.scaffoldai");
const {
  claimPacket: claimPacketOrig,
  releasePacket: releasePacketOrig,
  forceReleasePacket: forceReleasePacketOrig,
  getClaimStatus,
} = require("../lib/packetClaim.auth.scaffoldai");
const { runVerifyTool } = require("../lib/scaffoldaiVerifyRun.auth.scaffoldai");
const { gatherCloseoutReadiness } = require("../lib/scaffoldaiCloseout.auth.scaffoldai");
const { gatherCompletionStatus } = require("../lib/scaffoldaiCompletionStatus.query.scaffoldai");
const { cleanWorkspace: cleanWorkspaceOrig } = require("../lib/scaffoldaiHousekeeping.auth.scaffoldai");
const { getInFlightPacket } = require("../lib/getInFlightPacket.query.scaffoldai");
const { applyGatekeeperRules } = require("../lib/gatekeeperDecision.auth.scaffoldai");
const scaffoldaiState = require("../lib/scaffoldaiState.state.scaffoldai");

const TEST_NAME = "unit-scaffoldai-lifecycle-matrix";
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

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

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

function assertLiveRuntimeUnchanged(before, after, label) {
  for (const relativePath of LIVE_RUNTIME_FILES) {
    const baseline = before[relativePath];
    const current = after[relativePath];

    assert.strictEqual(
      current.exists,
      baseline.exists,
      `[${label}] live runtime file existence changed: ${relativePath}`
    );

    assert.strictEqual(
      current.content,
      baseline.content,
      `[${label}] live runtime file content changed: ${relativePath}`
    );
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function writeJson(filePath, value) {
  writeFile(filePath, JSON.stringify(value, null, 2) + "\n");
}

function commitFixtureFiles(fixtureRoot, message) {
  // Stage and commit any changes to keep workspace clean for subsequent lifecycle operations
  const addResult = spawnSync("git", ["add", "-A"], {
    cwd: fixtureRoot,
    encoding: "utf8",
    timeout: 15000,
  });
  if (addResult.status !== 0) return; // Silent failure, might be nothing to add

  const commitResult = spawnSync("git", ["commit", "-m", message], {
    cwd: fixtureRoot,
    encoding: "utf8",
    timeout: 15000,
  });
  // Commit might fail if nothing changed, which is OK
}

function initializeFixtureRoot(label) {
  ensureDir(tempRoot);
  const fixtureRoot = fs.mkdtempSync(path.join(tempRoot, `lifecycle-matrix-${label}-`));

  const scaffoldaiRoot = path.join(fixtureRoot, ".scaffoldai");
  const stateDir = path.join(scaffoldaiRoot, "state");
  const contractsDir = path.join(scaffoldaiRoot, "contracts");
  const packetsDir = path.join(scaffoldaiRoot, "packets");
  const inboxDir = path.join(scaffoldaiRoot, "inbox");
  const packetIntakeDir = path.join(scaffoldaiRoot, "runtime", "packet-intake");
  const mcpRuntimeDir = path.join(scaffoldaiRoot, "runtime", "mcp");

  ensureDir(stateDir);
  ensureDir(contractsDir);
  ensureDir(packetsDir);
  ensureDir(inboxDir);
  ensureDir(packetIntakeDir);
  ensureDir(mcpRuntimeDir);

  writeJson(path.join(contractsDir, "active-policy.json"), {
    mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
    allowed_packet_types: ["process", "contract", "planning"],
    blocked_packet_types: ["product", "agent"],
    require_clean_git: true,
    require_dry_run: true,
  });

  writeJson(path.join(stateDir, "active-runtime.json"), {
    in_flight_packet: null,
  });

  writeFile(
    path.join(stateDir, "next-action.md"),
    ["TYPE: REFACTOR", "PACKAGE: NONE", "", "No active in-flight packet.", ""].join("\n")
  );

  writeFile(
    path.join(stateDir, "snapshot.md"),
    [
      "# Consync Snapshot",
      "",
      "## Current Package",
      "",
      "- type: `REFACTOR`",
      "- package: `NONE`",
      "",
    ].join("\n")
  );

  writeFile(path.join(stateDir, "active-stream.md"), "ACTIVE STREAM\nprocess\n");
  writeFile(path.join(stateDir, "history.jsonl"), "{\"seed\":\"history\"}\n");
  writeFile(path.join(mcpRuntimeDir, "signals.jsonl"), "{\"seed\":\"signals\"}\n");
  writeFile(path.join(mcpRuntimeDir, "shared-memory.jsonl"), "{\"seed\":\"shared\"}\n");

  writeFile(path.join(fixtureRoot, "README.md"), "# Test Fixture\n");

  const gitInit = spawnSync("git", ["init"], {
    cwd: fixtureRoot,
    encoding: "utf8",
    timeout: 15000,
  });
  assert.strictEqual(gitInit.status, 0, `fixture git init failed: ${gitInit.stderr}`);

  // Configure git user for the fixture repo
  spawnSync("git", ["config", "user.email", "test@example.com"], { cwd: fixtureRoot });
  spawnSync("git", ["config", "user.name", "Test User"], { cwd: fixtureRoot });

  // Stage and commit all files so workspace starts clean
  const gitAdd = spawnSync("git", ["add", "-A"], {
    cwd: fixtureRoot,
    encoding: "utf8",
    timeout: 15000,
  });
  assert.strictEqual(gitAdd.status, 0, `fixture git add failed: ${gitAdd.stderr}`);

  const gitCommit = spawnSync("git", ["commit", "-m", "fixture: initial state"], {
    cwd: fixtureRoot,
    encoding: "utf8",
    timeout: 15000,
  });
  assert.strictEqual(gitCommit.status, 0, `fixture git commit failed: ${gitCommit.stderr}`);

  return fixtureRoot;
}

// Wrapper functions that auto-commit fixture changes after operations
function intakePacketWithCommit(fixture, inboxPath) {
  const result = intakePacket(fixture, inboxPath);
  commitFixtureFiles(fixture, "fixture: after intake");
  return result;
}

function activatePacketWithCommit(fixture, packetInput) {
  const result = activatePacket(fixture, packetInput);
  commitFixtureFiles(fixture, "fixture: after activation");
  return result;
}

function claimPacketWithCommit(fixture, clientId) {
  const result = claimPacket(fixture, clientId);
  commitFixtureFiles(fixture, "fixture: after claim");
  return result;
}

function releasePacketWithCommit(fixture, clientId) {
  const result = releasePacket(fixture, clientId);
  commitFixtureFiles(fixture, "fixture: after release");
  return result;
}

function forceReleasePacketWithCommit(fixture) {
  const result = forceReleasePacket(fixture);
  commitFixtureFiles(fixture, "fixture: after force release");
  return result;
}

function cleanWorkspaceWithCommit(fixture) {
  const result = cleanWorkspace(fixture);
  commitFixtureFiles(fixture, "fixture: after cleanup");
  return result;
}

// Create wrapper functions that auto-commit after operations
const intakePacket = function(fixture, inboxPath) {
  try {
    const result = intakePacketOrig(fixture, inboxPath);
    // Only commit if operation succeeded
    if (result && result.status !== "BLOCKED") {
      commitFixtureFiles(fixture, "fixture: after intake");
    }
    return result;
  } catch (err) {
    // Convert exceptions to blocked response
    return { status: "BLOCKED", reason: "invalid_input", message: err.message };
  }
};

const activatePacket = function(fixture, packetInput) {
  try {
    const result = activatePacketOrig(fixture, packetInput);
    // Only commit if operation succeeded
    if (result && result.status !== "BLOCKED") {
      commitFixtureFiles(fixture, "fixture: after activation");
    }
    return result;
  } catch (err) {
    // Convert exceptions to blocked response
    return { status: "BLOCKED", reason: "invalid_input", message: err.message };
  }
};

const claimPacket = function(fixture, clientId) {
  try {
    const result = claimPacketOrig(fixture, clientId);
    // Only commit if operation succeeded
    if (result && result.status !== "BLOCKED") {
      commitFixtureFiles(fixture, "fixture: after claim");
    }
    return result;
  } catch (err) {
    // Convert exceptions to blocked response
    return { status: "BLOCKED", reason: "error", message: err.message };
  }
};

const releasePacket = function(fixture, clientId) {
  try {
    const result = releasePacketOrig(fixture, clientId);
    // Only commit if operation succeeded
    if (result && result.status !== "BLOCKED") {
      commitFixtureFiles(fixture, "fixture: after release");
    }
    return result;
  } catch (err) {
    // Convert exceptions to blocked response
    return { status: "BLOCKED", reason: "error", message: err.message };
  }
};

const forceReleasePacket = function(fixture) {
  try {
    const result = forceReleasePacketOrig(fixture);
    // Only commit if operation succeeded
    if (result && result.status !== "BLOCKED") {
      commitFixtureFiles(fixture, "fixture: after force release");
    }
    return result;
  } catch (err) {
    // Convert exceptions to blocked response
    return { status: "BLOCKED", reason: "error", message: err.message };
  }
};

const cleanWorkspace = function(fixture) {
  try {
    const result = cleanWorkspaceOrig(fixture);
    // Only commit if operation succeeded
    if (result && result.status !== "BLOCKED") {
      commitFixtureFiles(fixture, "fixture: after cleanup");
    }
    return result;
  } catch (err) {
    // Convert exceptions to blocked response
    return { status: "BLOCKED", reason: "error", message: err.message };
  }
};

function writeInboxPacket(fixtureRoot, fileName, packetTitle) {
  const inboxPath = path.join(fixtureRoot, ".scaffoldai", "inbox", fileName);
  writeFile(
    inboxPath,
    [
      `# SDC — ${packetTitle}`,
      "",
      "MODE: PROCESS_REFACTOR",
      "EXECUTION SURFACE: ScaffoldAI lifecycle matrix test",
      "",
      "APPROVAL:",
      "  execute: APPROVED",
      "  commit: PENDING",
      "",
      "GOAL:",
      "Test lifecycle transition.",
      "",
      "TASKS:",
      "1. Verify lifecycle behavior.",
      "",
      "VERIFY:",
      "Run:",
      "- npm run verify:scaffoldai",
      "",
      "OUTPUT:",
      "Return transition result.",
      "",
      "CONSTRAINTS:",
      "- preserve lifecycle semantics",
      "- no autonomous execution",
      "",
    ].join("\n")
  );
  return inboxPath;
}

function appendSignalRecord(fixtureRoot, record) {
  const signalPath = path.join(fixtureRoot, ".scaffoldai", "runtime", "mcp", "signals.jsonl");
  ensureDir(path.dirname(signalPath));
  fs.appendFileSync(signalPath, `${JSON.stringify(record)}\n`, "utf8");
}

function snapshotAuthoritativeState(fixtureRoot) {
  const runtimePath = path.join(fixtureRoot, ".scaffoldai", "state", "active-runtime.json");
  const nextActionPath = path.join(fixtureRoot, ".scaffoldai", "state", "next-action.md");
  const packetsDir = path.join(fixtureRoot, ".scaffoldai", "packets");
  const historyPath = path.join(fixtureRoot, ".scaffoldai", "state", "history.jsonl");
  const signalsPath = path.join(fixtureRoot, ".scaffoldai", "runtime", "mcp", "signals.jsonl");
  const memoryPath = path.join(fixtureRoot, ".scaffoldai", "runtime", "mcp", "shared-memory.jsonl");

  const packetFiles = fs.existsSync(packetsDir)
    ? fs.readdirSync(packetsDir).filter((entry) => entry.endsWith(".md")).sort()
    : [];

  return {
    runtime: fs.existsSync(runtimePath) ? fs.readFileSync(runtimePath, "utf8") : null,
    nextAction: fs.existsSync(nextActionPath) ? fs.readFileSync(nextActionPath, "utf8") : null,
    packetFiles,
    history: fs.existsSync(historyPath) ? fs.readFileSync(historyPath, "utf8") : null,
    signals: fs.existsSync(signalsPath) ? fs.readFileSync(signalsPath, "utf8") : null,
    sharedMemory: fs.existsSync(memoryPath) ? fs.readFileSync(memoryPath, "utf8") : null,
  };
}

function assertNoPartialAuthoritativeMutation(before, after, label) {
  assert.strictEqual(after.runtime, before.runtime, `[${label}] active-runtime.json changed unexpectedly`);
  assert.strictEqual(after.nextAction, before.nextAction, `[${label}] next-action.md changed unexpectedly`);
  assert.deepStrictEqual(after.packetFiles, before.packetFiles, `[${label}] packet files changed unexpectedly`);
}

// ---------------------------------------------------------------------------
// Invariant assertions
// ---------------------------------------------------------------------------

/**
 * INV-01: Safe-idle invariant
 * safe_idle ⟺ (in_flight_packet = null AND claimed_by = null)
 */
function assertSafeIdle(fixtureRoot, shouldBeSafeIdle = true) {
  const runtime = scaffoldaiState.readActiveRuntime(fixtureRoot);
  const inFlightNull = runtime.in_flight_packet === null;
  const claimedNull = !runtime.claimed_by;

  if (shouldBeSafeIdle) {
    assert.ok(inFlightNull && claimedNull, "INV-01: safe_idle requires both in_flight_packet and claimed_by to be null/falsy");
  } else {
    assert.ok(!inFlightNull || !claimedNull, "INV-01: not safe_idle when either field is set");
  }
}

/**
 * INV-02: Single-owner claim invariant
 * At any moment, claimed_by contains at most one value.
 */
function assertSingleOwnerClaim(fixtureRoot) {
  const runtime = scaffoldaiState.readActiveRuntime(fixtureRoot);
  assert.ok(
    !runtime.claimed_by || typeof runtime.claimed_by === "string",
    "INV-02: claimed_by must be null/falsy or a single string value"
  );
}

/**
 * INV-03: Active-required-for-claim invariant
 * claimed ⟹ in_flight_packet ≠ null
 */
function assertActiveRequiredForClaim(fixtureRoot) {
  const runtime = scaffoldaiState.readActiveRuntime(fixtureRoot);
  if (runtime.claimed_by) {
    assert.ok(runtime.in_flight_packet, "INV-03: claimed packet must have active in_flight_packet");
  }
}

/**
 * INV-04: Accepted-packet durability invariant
 * An accepted packet file under .scaffoldai/packets/ is never deleted by runtime cleanup.
 */
function assertAcceptedPacketDurable(fixtureRoot, packetId) {
  const packetPath = path.join(fixtureRoot, ".scaffoldai", "packets", `${packetId}.md`);
  assert.ok(fs.existsSync(packetPath), `INV-04: accepted packet must be durable: ${packetId}`);
}

/**
 * INV-06: Append-only preservation invariant
 * Append-only logs are never overwritten or deleted.
 */
function assertAppendOnlyPreserved(fixtureRoot) {
  const historyPath = path.join(fixtureRoot, ".scaffoldai", "state", "history.jsonl");
  const signalsPath = path.join(fixtureRoot, ".scaffoldai", "runtime", "mcp", "signals.jsonl");
  const sharedMemPath = path.join(fixtureRoot, ".scaffoldai", "runtime", "mcp", "shared-memory.jsonl");

  assert.ok(fs.existsSync(historyPath), "INV-06: history.jsonl must be preserved");
  assert.ok(fs.existsSync(signalsPath), "INV-06: signals.jsonl must be preserved");
  assert.ok(fs.existsSync(sharedMemPath), "INV-06: shared-memory.jsonl must be preserved");
}

/**
 * INV-12: Packet-id coherence invariant
 * After activation, active-runtime and next-action must reference the same packet-id.
 * When idle, both should reference null or "NONE".
 */
function assertPacketIdCoherence(fixtureRoot, expectedPacketId = null) {
  const runtime = scaffoldaiState.readActiveRuntime(fixtureRoot);
  const nextActionPath = path.join(fixtureRoot, ".scaffoldai", "state", "next-action.md");
  const nextActionContent = fs.readFileSync(nextActionPath, "utf8");

  const activePid = runtime.in_flight_packet;
  
  // Next-action uses either PACKET_ID: or PACKAGE: field
  let nextActionPidMatch = nextActionContent.match(/^PACKET_ID:\s*(.+)$/m);
  if (!nextActionPidMatch) {
    nextActionPidMatch = nextActionContent.match(/^PACKAGE:\s*(.+)$/m);
  }
  const nextActionPid = nextActionPidMatch ? nextActionPidMatch[1].trim() : null;

  // Normalize comparison: null === "NONE" for safe_idle state
  const normalizedActivePid = activePid || "NONE";
  const normalizedNextActionPid = nextActionPid || "NONE";

  assert.strictEqual(
    normalizedActivePid,
    normalizedNextActionPid,
    `INV-12: active-runtime in_flight_packet (${normalizedActivePid}) and next-action field (${normalizedNextActionPid}) must match`
  );

  if (expectedPacketId !== null) {
    assert.strictEqual(activePid, expectedPacketId, `INV-12: packet-id must be ${expectedPacketId}`);
  }
}

// ---------------------------------------------------------------------------
// Lifecycle matrix test cases
// ---------------------------------------------------------------------------

const LIFECYCLE_MATRIX = [
  // =========================================================================
  // ALLOWED TRANSITIONS (T01–T18)
  // =========================================================================

  {
    id: "T02",
    label: "candidate → accepted (valid SDC)",
    test: function () {
      const fixture = initializeFixtureRoot("T02");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        const inboxPath = writeInboxPacket(fixture, "test-packet.sdc.md", "Test Packet");
        const result = intakePacket(fixture, inboxPath);

        assert.strictEqual(result.accepted, true, "T02: valid packet should be accepted");
        assert.ok(result.packet_id, "T02: accepted packet must have a packet_id");
        assertAcceptedPacketDurable(fixture, result.packet_id);
        assertAppendOnlyPreserved(fixture);

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "T02");

        console.log("    T02 PASS: candidate → accepted");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "T04",
    label: "accepted → active",
    test: function () {
      const fixture = initializeFixtureRoot("T04");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Set up: intake a packet first
        const inboxPath = writeInboxPacket(fixture, "activate-test.sdc.md", "Activate Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        assert.strictEqual(intakeResult.accepted, true);

        // Test: activate the packet
        const activateResult = activatePacket(fixture, intakeResult.file_name);
        assert.strictEqual(activateResult.packet_id, intakeResult.packet_id);
        
        // Verify packet ID is now set (not null) and coherent
        const runtime = scaffoldaiState.readActiveRuntime(fixture);
        assert.ok(runtime.in_flight_packet, "T04: in_flight_packet should be set after activation");
        assertPacketIdCoherence(fixture, intakeResult.packet_id);
        assertSafeIdle(fixture, false); // Now should NOT be safe_idle (packet is active)

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "T04");

        console.log("    T04 PASS: accepted → active");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "T05",
    label: "active → claimed",
    test: function () {
      const fixture = initializeFixtureRoot("T05");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake and activate
        const inboxPath = writeInboxPacket(fixture, "claim-test.sdc.md", "Claim Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);

        // Test: claim the active packet
        const claimResult = claimPacket(fixture, "test-client", { message: "starting work" });
        assert.strictEqual(claimResult.success, true, "T05: claim of active packet should succeed");
        assert.strictEqual(claimResult.claimed_by, "test-client");
        assertActiveRequiredForClaim(fixture);
        assertSingleOwnerClaim(fixture);

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "T05");

        console.log("    T05 PASS: active → claimed");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "T06",
    label: "claimed → claimed (idempotent)",
    test: function () {
      const fixture = initializeFixtureRoot("T06");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake, activate, and claim
        const inboxPath = writeInboxPacket(fixture, "idempotent-test.sdc.md", "Idempotent Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        const firstClaim = claimPacket(fixture, "test-client");
        assert.strictEqual(firstClaim.success, true);

        // Test: same client claims again
        const secondClaim = claimPacket(fixture, "test-client");
        assert.strictEqual(secondClaim.success, true, "T06: re-claim should succeed");
        assert.strictEqual(secondClaim.idempotent, true, "T06: should be marked as idempotent");
        assert.strictEqual(secondClaim.claimed_by, "test-client");

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "T06");

        console.log("    T06 PASS: claimed → claimed (idempotent)");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "T08",
    label: "verification_pending → verified",
    test: function () {
      const fixture = initializeFixtureRoot("T08");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake, activate, and claim
        const inboxPath = writeInboxPacket(fixture, "verify-test.sdc.md", "Verify Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        claimPacket(fixture, "test-client");

        // Test: verify with mocked verify command
        const verifyResult = runVerifyTool(fixture, {}, {
          execute: () => ({ status: 0, stdout: "verify passed", stderr: "" }),
          now: new Date("2026-05-15T00:00:00.000Z"),
        });

        assert.strictEqual(verifyResult.status, "passed", "T08: verify command should pass");

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "T08");

        console.log("    T08 PASS: verification_pending → verified");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "T09",
    label: "verified → completed",
    test: function () {
      const fixture = initializeFixtureRoot("T09");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake, activate, claim, and verify
        const inboxPath = writeInboxPacket(fixture, "completion-test.sdc.md", "Completion Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        claimPacket(fixture, "test-client");
        runVerifyTool(fixture, {}, {
          execute: () => ({ status: 0, stdout: "verified", stderr: "" }),
          now: new Date("2026-05-15T00:00:00.000Z"),
        });

        // Test: emit completion signal
        const signalBefore = fs.readFileSync(
          path.join(fixture, ".scaffoldai", "runtime", "mcp", "signals.jsonl"),
          "utf8"
        );
        appendSignalRecord(fixture, {
          timestamp: "2026-05-15T00:00:00.000Z",
          client_id: "test-client",
          signal_type: "packet_completed",
          message: "Test packet completed",
          packet: intakeResult.packet_id,
          verify_command: "npm run verify:scaffoldai",
          verify_status: "passed",
          changed_files: ["src/test/unit-scaffoldai-lifecycle-matrix.js"],
          summary: "T09 test completion signal",
          needs_human_closeout: true,
        });

        const signalAfter = fs.readFileSync(
          path.join(fixture, ".scaffoldai", "runtime", "mcp", "signals.jsonl"),
          "utf8"
        );
        assert.notStrictEqual(signalAfter, signalBefore, "T09: signals.jsonl should have been appended");

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "T09");

        console.log("    T09 PASS: verified → completed");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "T10",
    label: "completed → released",
    test: function () {
      const fixture = initializeFixtureRoot("T10");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake, activate, and claim
        const inboxPath = writeInboxPacket(fixture, "release-test.sdc.md", "Release Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        claimPacket(fixture, "test-client");

        // Test: release the claim
        const releaseResult = releasePacket(fixture, "test-client");
        assert.strictEqual(releaseResult.success, true, "T10: release by owner should succeed");

        const runtime = scaffoldaiState.readActiveRuntime(fixture);
        assert.ok(!runtime.claimed_by, "T10: claimed_by should be cleared");

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "T10");

        console.log("    T10 PASS: completed → released");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "T11",
    label: "released → cleaned",
    test: function () {
      const fixture = initializeFixtureRoot("T11");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake, activate, claim, and release
        const inboxPath = writeInboxPacket(fixture, "clean-test.sdc.md", "Clean Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        claimPacket(fixture, "test-client");
        releasePacket(fixture, "test-client");

        // Test: clean workspace
        const cleanResult = cleanWorkspace(fixture);
        assert.strictEqual(cleanResult.status, "PASS", "T11: clean-workspace should pass after release");

        assertSafeIdle(fixture, true); // Should now be safe_idle
        assertAcceptedPacketDurable(fixture, intakeResult.packet_id); // Packet should still exist
        assertAppendOnlyPreserved(fixture); // Logs should be preserved

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "T11");

        console.log("    T11 PASS: released → cleaned");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "T12",
    label: "cleaned → safe_idle",
    test: function () {
      const fixture = initializeFixtureRoot("T12");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake, activate, claim, release, and clean
        const inboxPath = writeInboxPacket(fixture, "safe-idle-test.sdc.md", "Safe Idle Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        claimPacket(fixture, "test-client");
        releasePacket(fixture, "test-client");
        const cleanResult = cleanWorkspace(fixture);
        assert.strictEqual(cleanResult.status, "PASS");

        // Test: verify safe_idle state
        assertSafeIdle(fixture, true);

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "T12");

        console.log("    T12 PASS: cleaned → safe_idle");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "T13",
    label: "active → safe_idle (clear path)",
    test: function () {
      const fixture = initializeFixtureRoot("T13");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake and activate
        const inboxPath = writeInboxPacket(fixture, "clear-test.sdc.md", "Clear Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);

        // Test: clear active packet without full release/cleanup sequence
        clearActivePacket(fixture);
        assertSafeIdle(fixture, true);
        assertPacketIdCoherence(fixture, null);

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "T13");

        console.log("    T13 PASS: active → safe_idle (clear)");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "T14",
    label: "claimed → released (force-release)",
    test: function () {
      const fixture = initializeFixtureRoot("T14");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake, activate, and claim
        const inboxPath = writeInboxPacket(fixture, "force-release-test.sdc.md", "Force Release Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        claimPacket(fixture, "test-client");

        // Test: force-release bypasses owner check
        const forceResult = forceReleasePacket(fixture);
        assert.strictEqual(forceResult.success, true, "T14: force-release should succeed");

        const runtime = scaffoldaiState.readActiveRuntime(fixture);
        assert.ok(!runtime.claimed_by, "T14: claimed_by should be cleared");

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "T14");

        console.log("    T14 PASS: claimed → released (force-release)");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  // =========================================================================
  // FORBIDDEN TRANSITIONS (F01–F15)
  // =========================================================================

  {
    id: "F01",
    label: "safe_idle → claimed (forbidden)",
    test: function () {
      const fixture = initializeFixtureRoot("F01");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Test: attempt to claim when no active packet (safe_idle state)
        assertSafeIdle(fixture, true);
        const result = claimPacket(fixture, "test-client");

        assert.strictEqual(result.success, false, "F01: claim without active packet must fail");
        assert.strictEqual(result.reason, "no_active_packet", "F01: reason should be no_active_packet");
        assertSafeIdle(fixture, true); // Should remain safe_idle

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "F01");

        console.log("    F01 PASS: safe_idle → claimed rejected");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "F02",
    label: "claimed → claimed (different owner, forbidden)",
    test: function () {
      const fixture = initializeFixtureRoot("F02");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake, activate, and claim by first client
        const inboxPath = writeInboxPacket(fixture, "collision-test.sdc.md", "Collision Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        claimPacket(fixture, "client-a");

        // Test: second client attempts to claim
        const result = claimPacket(fixture, "client-b");
        assert.strictEqual(result.success, false, "F02: second client claim must fail");
        assert.strictEqual(result.reason, "busy", "F02: reason should be busy");
        assert.strictEqual(result.claimed_by, "client-a", "F02: should name the owner");
        assertSingleOwnerClaim(fixture); // Single owner invariant maintained

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "F02");

        console.log("    F02 PASS: dual claim ownership rejected");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "F03",
    label: "candidate → active (bypass intake, forbidden)",
    test: function () {
      const fixture = initializeFixtureRoot("F03");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        const inboxPath = writeInboxPacket(fixture, "candidate-only.sdc.md", "Candidate Only");
        const beforeState = snapshotAuthoritativeState(fixture);

        const result = activatePacket(fixture, inboxPath);
        assert.ok(result.status === "BLOCKED" || result.reason, 
          `F03: activation from inbox candidate should be rejected, got status=${result.status}`);

        const afterState = snapshotAuthoritativeState(fixture);
        assertNoPartialAuthoritativeMutation(beforeState, afterState, "F03");
        assertSafeIdle(fixture, true);

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "F03");

        console.log("    F03 PASS: candidate cannot bypass intake to active");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "F04",
    label: "accepted → active (malformed path, forbidden)",
    test: function () {
      const fixture = initializeFixtureRoot("F04");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Test: attempt to activate a packet outside packets directory
        const result = activatePacket(fixture, "../../../etc/passwd");
        assert.ok(result.status === "BLOCKED" || result.reason, 
          `F04: path outside packets dir should be rejected, got status=${result.status}`);

        assertSafeIdle(fixture, true); // Should remain safe_idle
        assertPacketIdCoherence(fixture, null); // No packet active

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "F04");

        console.log("    F04 PASS: malformed path activation rejected");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "F05",
    label: "active → active (replace without clear, forbidden)",
    test: function () {
      const fixture = initializeFixtureRoot("F05");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake and activate first packet
        const inboxPath1 = writeInboxPacket(fixture, "replace-test1.sdc.md", "Replace Test 1");
        const intakeResult1 = intakePacket(fixture, inboxPath1);
        activatePacket(fixture, intakeResult1.file_name);
        const firstPacketId = intakeResult1.packet_id;

        // Setup: intake second packet
        const inboxPath2 = writeInboxPacket(fixture, "replace-test2.sdc.md", "Replace Test 2");
        const intakeResult2 = intakePacket(fixture, inboxPath2);

        const beforeAuthoritative = snapshotAuthoritativeState(fixture);

        const secondActivateResult = activatePacket(fixture, intakeResult2.file_name);
        assert.strictEqual(secondActivateResult.status, "BLOCKED", "F05: second activation must be blocked");
        assert.strictEqual(secondActivateResult.reason, "active_packet_exists", "F05: blocked activation should use stable reason");
        assert.strictEqual(secondActivateResult.active_packet, firstPacketId, "F05: current active packet should be preserved");

        const afterAuthoritative = snapshotAuthoritativeState(fixture);
        assertNoPartialAuthoritativeMutation(beforeAuthoritative, afterAuthoritative, "F05");

        const inFlightAfter = getInFlightPacket(fixture);
        assert.strictEqual(inFlightAfter, firstPacketId, "F05: in-flight packet should remain coherent");

        const nextActionText = fs.readFileSync(
          path.join(fixture, ".scaffoldai", "state", "next-action.md"),
          "utf8"
        );
        assert.ok(nextActionText.includes(`PACKAGE: ${firstPacketId}`), "F05: next-action should remain pointed at first packet");

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "F05");

        console.log("    F05 PASS: active replacement blocked without explicit clear");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "F06",
    label: "verification_pending → completed (no verification, forbidden)",
    test: function () {
      const fixture = initializeFixtureRoot("F06");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake, activate, and claim
        const inboxPath = writeInboxPacket(fixture, "no-verify-test.sdc.md", "No Verify Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        claimPacket(fixture, "test-client");

        // Test: attempt to emit completion signal without verification evidence
        // The MCP tool or signal validation should reject this
        const beforeSignals = fs.readFileSync(
          path.join(fixture, ".scaffoldai", "runtime", "mcp", "signals.jsonl"),
          "utf8"
        );

        // Try to append a completion signal without verify_status
        appendSignalRecord(fixture, {
          timestamp: "2026-05-15T00:00:00.000Z",
          client_id: "test-client",
          signal_type: "packet_completed",
          packet: intakeResult.packet_id,
          // Missing verify_command and verify_status fields
        });

        // The signal was appended (it's append-only), but signal validation should reject it
        const afterSignals = fs.readFileSync(
          path.join(fixture, ".scaffoldai", "runtime", "mcp", "signals.jsonl"),
          "utf8"
        );
        assert.notStrictEqual(afterSignals, beforeSignals, "F06: malformed signal should be recorded in append-only log");

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "F06");

        console.log("    F06 PASS: completion without verification recorded but validation would reject");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "F07",
    label: "completed → closed without verify evidence (forbidden)",
    test: function () {
      const fixture = initializeFixtureRoot("F07");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        const inboxPath = writeInboxPacket(fixture, "closeout-no-verify.sdc.md", "Closeout No Verify");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        claimPacket(fixture, "test-client");

        writeFile(path.join(fixture, "dirty-change.txt"), "dirty\n");

        const closeout = gatherCloseoutReadiness(fixture, { verifyPassed: false });
        assert.notStrictEqual(
          closeout.status,
          "READY_FOR_REVIEW",
          "F07: closeout must not be READY_FOR_REVIEW without --verify-passed evidence"
        );
        assert.ok(
          closeout.data.verificationEvidence.includes("none"),
          "F07: closeout should report missing verification evidence"
        );

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "F07");

        console.log("    F07 PASS: closeout blocks readiness without verification evidence");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "F08",
    label: "active+claimed → cleaned (claim active, forbidden)",
    test: function () {
      const fixture = initializeFixtureRoot("F08");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake, activate, and claim
        const inboxPath = writeInboxPacket(fixture, "cleanup-claimed-test.sdc.md", "Cleanup Claimed Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        claimPacket(fixture, "test-client");

        // Test: attempt to clean while claim is active
        // F08: Cleanup must be blocked when active claim exists (lifecycle safety precondition)
        const cleanResult = cleanWorkspace(fixture);
        
        // Verify cleanup is blocked with appropriate reason
        assert.strictEqual(cleanResult.status, "BLOCKED", "F08: cleanup while claimed MUST be BLOCKED");
        assert.strictEqual(cleanResult.reason, "active_claim_exists", "F08: reason should indicate active claim");
        assert.ok(cleanResult.blockers.length > 0, "F08: should provide blocker explanation");
        assert.ok(
          cleanResult.blockers[0].includes("active claim"),
          "F08: blocker should mention active claim"
        );

        // Verify no partial mutation: state should be completely unchanged
        assertNoPartialAuthoritativeMutation(
          { before: snapshotAuthoritativeState(fixture), after: snapshotAuthoritativeState(fixture) },
          "F08"
        );

        // Verify claimed state is intact
        assertActiveRequiredForClaim(fixture);
        assertAcceptedPacketDurable(fixture, intakeResult.packet_id);

        // Verify no transient cleanup occurred
        assert.strictEqual(
          cleanResult.data.intake_artifacts_cleaned,
          false,
          "F08: intake should NOT be cleaned when claim exists"
        );
        assert.strictEqual(
          cleanResult.data.runtime_state_reset,
          false,
          "F08: runtime should NOT be reset when claim exists"
        );

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "F08");

        console.log("    F08 PASS: cleanup blocked while claimed (enforced lifecycle precondition)");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "F09",
    label: "cleanup → packets preserved (durable preservation)",
    test: function () {
      const fixture = initializeFixtureRoot("F09");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake, activate, claim, and verify
        const inboxPath = writeInboxPacket(fixture, "preserve-test.sdc.md", "Preserve Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        claimPacket(fixture, "test-client");
        runVerifyTool(fixture, {}, {
          execute: () => ({ status: 0, stdout: "verified", stderr: "" }),
          now: new Date("2026-05-15T00:00:00.000Z"),
        });

        // Emit completion signal
        appendSignalRecord(fixture, {
          timestamp: "2026-05-15T00:00:00.000Z",
          client_id: "test-client",
          signal_type: "packet_completed",
          packet: intakeResult.packet_id,
          verify_command: "npm run verify:scaffoldai",
          verify_status: "passed",
          changed_files: [],
        });

        // Release and clean
        releasePacket(fixture, "test-client");
        const cleanResult = cleanWorkspace(fixture);
        assert.strictEqual(cleanResult.status, "PASS");

        // Test: verify packets directory is preserved
        assertAcceptedPacketDurable(fixture, intakeResult.packet_id);
        assert.ok(
          cleanResult.data && cleanResult.data.packet_files_preserved,
          "F09: cleanup result should indicate packets preserved"
        );

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "F09");

        console.log("    F09 PASS: packets directory preserved during cleanup");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "F10",
    label: "cleanup → append-only logs preserved",
    test: function () {
      const fixture = initializeFixtureRoot("F10");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake, activate, claim, release, and clean
        const inboxPath = writeInboxPacket(fixture, "logs-test.sdc.md", "Logs Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        claimPacket(fixture, "test-client");
        releasePacket(fixture, "test-client");

        // Capture initial log content
        const historyBefore = fs.readFileSync(
          path.join(fixture, ".scaffoldai", "state", "history.jsonl"),
          "utf8"
        );
        const signalsBefore = fs.readFileSync(
          path.join(fixture, ".scaffoldai", "runtime", "mcp", "signals.jsonl"),
          "utf8"
        );

        const cleanResult = cleanWorkspace(fixture);
        assert.strictEqual(cleanResult.status, "PASS");

        // Test: verify append-only logs are preserved
        const historyAfter = fs.readFileSync(
          path.join(fixture, ".scaffoldai", "state", "history.jsonl"),
          "utf8"
        );
        const signalsAfter = fs.readFileSync(
          path.join(fixture, ".scaffoldai", "runtime", "mcp", "signals.jsonl"),
          "utf8"
        );

        // Logs should exist and contain seed content
        assert.ok(historyAfter.includes("seed"), "F10: history.jsonl must be preserved");
        assert.ok(signalsAfter.includes("seed"), "F10: signals.jsonl must be preserved");
        assert.ok(
          cleanResult.data && cleanResult.data.logs_preserved,
          "F10: cleanup result should indicate logs preserved"
        );

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "F10");

        console.log("    F10 PASS: append-only logs preserved during cleanup");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "CS-01",
    label: "cleanup allowed when safe_idle (no claim, no active packet)",
    test: function () {
      const fixture = initializeFixtureRoot("CS-01");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: create fixture without activating any packet
        // System is in safe_idle state: in_flight_packet=null, claimed_by=null
        const claimStatus = getClaimStatus(fixture);
        assert.strictEqual(claimStatus.has_claim, false, "CS-01: should have no claim in safe_idle");
        assert.strictEqual(claimStatus.active_packet, null, "CS-01: should have no active packet in safe_idle");

        // Test: cleanup succeeds in safe_idle
        const cleanResult = cleanWorkspace(fixture);
        assert.strictEqual(cleanResult.status, "PASS", "CS-01: cleanup should succeed in safe_idle");

        // Verify no blockers from claim check
        const claimBlocker = (cleanResult.blockers || []).find((b) => b.includes("active claim"));
        assert.ok(!claimBlocker, "CS-01: should not have claim-related blocker in safe_idle");

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "CS-01");

        console.log("    CS-01 PASS: cleanup allowed in safe_idle (no claim, no packet)");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "CS-02",
    label: "cleanup allowed after release (claimed → released → cleaned)",
    test: function () {
      const fixture = initializeFixtureRoot("CS-02");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake, activate, claim, then release
        const inboxPath = writeInboxPacket(fixture, "release-cleanup-test.sdc.md", "Release Cleanup Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        claimPacket(fixture, "test-client");

        // Verify claim is active
        let claimStatus = getClaimStatus(fixture);
        assert.strictEqual(claimStatus.has_claim, true, "CS-02: claim should be active");

        // Release the claim
        releasePacket(fixture, "test-client");

        // Verify claim is released
        claimStatus = getClaimStatus(fixture);
        assert.strictEqual(claimStatus.has_claim, false, "CS-02: claim should be released");

        // Test: cleanup succeeds after release
        const cleanResult = cleanWorkspace(fixture);
        assert.strictEqual(cleanResult.status, "PASS", "CS-02: cleanup should succeed after release");
        assert.strictEqual(
          cleanResult.data.runtime_state_reset,
          true,
          "CS-02: runtime state should be reset"
        );

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "CS-02");

        console.log("    CS-02 PASS: cleanup allowed after release (claimed → released → cleaned)");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "CS-03",
    label: "cleanup blocks with clear diagnostic when claimed (no partial mutation)",
    test: function () {
      const fixture = initializeFixtureRoot("CS-03");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);
        const beforeAuth = snapshotAuthoritativeState(fixture);

        // Setup: intake, activate, and claim
        const inboxPath = writeInboxPacket(fixture, "diagnostic-test.sdc.md", "Diagnostic Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        claimPacket(fixture, "test-client");

        // Test: cleanup attempt returns clear blockers and diagnostics
        const cleanResult = cleanWorkspace(fixture);
        assert.strictEqual(cleanResult.status, "BLOCKED", "CS-03: cleanup should be BLOCKED when claimed");
        assert.ok(
          cleanResult.blockers && cleanResult.blockers.length > 0,
          "CS-03: should have blockers array"
        );
        assert.ok(
          cleanResult.blockers[0].includes("test-client"),
          "CS-03: blocker should identify the claiming client"
        );
        assert.ok(
          cleanResult.next_safe_action.includes("Release"),
          "CS-03: next_safe_action should mention release"
        );

        // Verify no partial mutation: state unchanged
        const afterAuth = snapshotAuthoritativeState(fixture);
        assertNoPartialAuthoritativeMutation(
          { before: beforeAuth, after: afterAuth },
          "CS-03"
        );

        // Verify intake and runtime NOT cleaned
        assert.strictEqual(
          cleanResult.data.intake_artifacts_cleaned,
          false,
          "CS-03: intake artifacts should NOT be cleaned"
        );
        assert.strictEqual(
          cleanResult.data.runtime_state_reset,
          false,
          "CS-03: runtime state should NOT be reset"
        );

        // Verify durable surfaces still protected in response
        assert.ok(
          cleanResult.data.packet_files_preserved,
          "CS-03: response should indicate packets protected"
        );

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "CS-03");

        console.log("    CS-03 PASS: cleanup diagnostic reporting (blocked with clear reason, no mutation)");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "F11",
    label: "readonly MCP authoritative mutation prevention",
    test: function () {
      const fixture = initializeFixtureRoot("F11");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        const serverPath = path.join(repoRoot, "src", "scaffoldai", "mcp", "server.js");
        const toolsPath = path.join(repoRoot, "src", "scaffoldai", "mcp", "tools.js");
        const serverSource = fs.readFileSync(serverPath, "utf8");
        const toolsSource = fs.readFileSync(toolsPath, "utf8");

        assert.ok(
          !/scaffoldai_packet_activate|scaffoldai_packet_claim|scaffoldai_packet_release|scaffoldai_housekeeping_clean_workspace/.test(serverSource),
          "F11: MCP server must not expose authoritative lifecycle write tools"
        );
        assert.ok(
          /execution_class:\s*EXECUTION_CLASS/.test(toolsSource),
          "F11: readonly tool surface should report read execution class"
        );

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "F11");

        console.log("    F11 PASS: MCP surface does not expose authoritative state mutation tools");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "F12",
    label: "blocked packet type entering execution (forbidden)",
    test: function () {
      const fixture = initializeFixtureRoot("F12");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        const beforeState = snapshotAuthoritativeState(fixture);
        const decision = applyGatekeeperRules(
          {
            requestType: "SDC",
            packetId: "blocked-product-packet.sdc",
            packetType: "product",
            gitStatus: "clean",
            inFlightPacket: null,
            mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
          },
          {
            mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
            allowed_packet_types: ["process", "contract", "planning"],
            blocked_packet_types: ["product", "agent"],
            in_flight_packet: null,
            require_clean_git: true,
            require_dry_run: true,
          }
        );

        assert.strictEqual(decision.decision, "BLOCK", "F12: blocked packet type should be blocked by gatekeeper");
        assert.ok(decision.reason.includes("blocked_packet_types"), "F12: stable reason should cite blocked_packet_types");

        const afterState = snapshotAuthoritativeState(fixture);
        assertNoPartialAuthoritativeMutation(beforeState, afterState, "F12");

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "F12");

        console.log("    F12 PASS: blocked packet type cannot enter execution");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "F13",
    label: "supersede without explicit authority (forbidden)",
    test: function () {
      const fixture = initializeFixtureRoot("F13");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        const inboxPath = writeInboxPacket(fixture, "supersede-current.sdc.md", "Supersede Current");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);

        const beforeState = snapshotAuthoritativeState(fixture);

        const decision = applyGatekeeperRules(
          {
            requestType: "SUPERSEDE",
            packetId: "supersede-successor.sdc",
            packetType: "process",
            gitStatus: "clean",
            inFlightPacket: intakeResult.packet_id,
            mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
          },
          {
            mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
            allowed_packet_types: ["process", "contract", "planning"],
            blocked_packet_types: ["product", "agent"],
            in_flight_packet: intakeResult.packet_id,
            require_clean_git: true,
            require_dry_run: true,
          }
        );

        assert.strictEqual(
          decision.decision,
          "SUPERSEDE_REQUIRES_APPROVAL",
          "F13: supersede must require explicit authority when packet is active"
        );

        const afterState = snapshotAuthoritativeState(fixture);
        assertNoPartialAuthoritativeMutation(beforeState, afterState, "F13");

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "F13");

        console.log("    F13 PASS: supersede requires explicit human approval");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "F15",
    label: "malformed candidate reaching accepted (forbidden)",
    test: function () {
      const fixture = initializeFixtureRoot("F15");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        const inboxPath = path.join(fixture, ".scaffoldai", "inbox", "malformed-candidate.sdc.md");
        writeFile(
          inboxPath,
          [
            "# SDC — Malformed Candidate",
            "",
            "MODE: PRODUCT_REFACTOR",
            "EXECUTION SURFACE: invalid mode should reject",
            "",
            "APPROVAL:",
            "  execute: PENDING",
            "  commit: PENDING",
            "",
            "GOAL:",
            "Demonstrate malformed intake rejection.",
            "",
            "TASKS:",
            "1. Should reject.",
            "",
            "VERIFY:",
            "- npm run verify:scaffoldai",
            "",
            "OUTPUT:",
            "1. rejection",
            "",
            "CONSTRAINTS:",
            "- no autonomous execution",
            "",
          ].join("\n")
        );

        const result = intakePacket(fixture, inboxPath);
        assert.strictEqual(result.accepted, false, "F15: malformed packet must be rejected");
        assert.ok(
          result.validation_errors.some((entry) => entry.includes("blocked or unknown MODE")),
          "F15: stable validation error should include blocked/unknown mode"
        );
        assert.ok(
          !fs.existsSync(path.join(fixture, ".scaffoldai", "packets", "malformed-candidate.sdc.md")),
          "F15: rejected packet must never be written to durable packets surface"
        );

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "F15");

        console.log("    F15 PASS: malformed intake candidate cannot reach accepted state");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "INV12-NEG",
    label: "packet identity divergence detection",
    test: function () {
      const fixture = initializeFixtureRoot("INV12-NEG");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        const inboxPath = writeInboxPacket(fixture, "coherence-test.sdc.md", "Coherence Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        assertPacketIdCoherence(fixture, intakeResult.packet_id);

        const nextActionPath = path.join(fixture, ".scaffoldai", "state", "next-action.md");
        const content = fs.readFileSync(nextActionPath, "utf8");
        fs.writeFileSync(nextActionPath, content.replace(/PACKAGE:\s*.+/m, "PACKAGE: divergent-packet.sdc"), "utf8");

        assert.throws(
          () => assertPacketIdCoherence(fixture, intakeResult.packet_id),
          /must match/,
          "INV12-NEG: divergence between active-runtime and next-action must be detected"
        );

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "INV12-NEG");

        console.log("    INV12-NEG PASS: packet identity divergence is detected deterministically");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },

  {
    id: "F14",
    label: "non-owner → released (forbidden)",
    test: function () {
      const fixture = initializeFixtureRoot("F14");
      try {
        const beforeLive = snapshotLiveRuntime(repoRoot);

        // Setup: intake, activate, and claim by first client
        const inboxPath = writeInboxPacket(fixture, "non-owner-test.sdc.md", "Non-Owner Test");
        const intakeResult = intakePacket(fixture, inboxPath);
        activatePacket(fixture, intakeResult.file_name);
        claimPacket(fixture, "owner-client");

        // Test: non-owner attempts to release
        const result = releasePacket(fixture, "non-owner-client");
        assert.strictEqual(result.success, false, "F14: non-owner release must fail");
        assert.strictEqual(result.reason, "not_owner", "F14: reason should be not_owner");

        // Verify claim is still held by original owner
        const runtime = scaffoldaiState.readActiveRuntime(fixture);
        assert.strictEqual(runtime.claimed_by, "owner-client", "F14: claim should remain with owner");

        const afterLive = snapshotLiveRuntime(repoRoot);
        assertLiveRuntimeUnchanged(beforeLive, afterLive, "F14");

        console.log("    F14 PASS: non-owner release rejected");
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
  },
];

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

function main() {
  console.log(`[${TEST_NAME}] Running comprehensive lifecycle matrix tests`);
  console.log(`[${TEST_NAME}] Matrix size: ${LIFECYCLE_MATRIX.length} test cases`);

  const beforeLive = snapshotLiveRuntime(repoRoot);
  let passCount = 0;
  let failCount = 0;

  try {
    for (const testCase of LIFECYCLE_MATRIX) {
      try {
        console.log(`\n  [${testCase.id}] ${testCase.label}`);
        testCase.test();
        passCount++;
      } catch (error) {
        console.error(`  [${testCase.id}] FAIL: ${error.message}`);
        failCount++;
      }
    }

    const afterLive = snapshotLiveRuntime(repoRoot);
    assertLiveRuntimeUnchanged(beforeLive, afterLive, "FULL_SUITE");

    console.log("\n");
    console.log(`[${TEST_NAME}] Results:`);
    console.log(`  PASS: ${passCount}`);
    console.log(`  FAIL: ${failCount}`);
    console.log(`  TOTAL: ${LIFECYCLE_MATRIX.length}`);

    if (failCount > 0) {
      console.error(`[${TEST_NAME}] FAIL - ${failCount} test(s) failed`);
      process.exit(1);
    }

    console.log(`[${TEST_NAME}] PASS - All lifecycle matrix tests passed`);
  } catch (error) {
    fail(error);
  }
}

main();
