"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const { getRepoRoot } = require("../lib/repoRoot.util.shared");
const { intakePacket } = require("../lib/scaffoldaiPacketIntake.auth.scaffoldai");
const { activatePacket } = require("../lib/scaffoldaiPacketActivation.auth.scaffoldai");
const { checkWorkspaceCleanliness } = require("../lib/workspaceCleanlinessCheck.auth.scaffoldai");
const {
  claimPacket,
  releasePacket,
  getClaimStatus,
} = require("../lib/packetClaim.auth.scaffoldai");
const { runVerifyTool } = require("../lib/scaffoldaiVerifyRun.auth.scaffoldai");
const { gatherCloseoutReadiness } = require("../lib/scaffoldaiCloseout.auth.scaffoldai");
const { gatherCompletionStatus } = require("../lib/scaffoldaiCompletionStatus.query.scaffoldai");
const { cleanWorkspace } = require("../lib/scaffoldaiHousekeeping.auth.scaffoldai");
const { getInFlightPacket } = require("../lib/getInFlightPacket.query.scaffoldai");
const scaffoldaiVerifyEvidence = require("../lib/scaffoldaiVerifyEvidence.state.scaffoldai");

const TEST_NAME = "unit-scaffoldai-lifecycle-simulation";
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

function initializeFixtureRoot() {
  ensureDir(tempRoot);
  const fixtureRoot = fs.mkdtempSync(path.join(tempRoot, "lifecycle-sim-"));

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
    [
      "TYPE: REFACTOR",
      "PACKAGE: NONE",
      "",
      "No active in-flight packet.",
      "Mount the next packet intentionally before execution.",
      "",
    ].join("\n")
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

  writeFile(path.join(fixtureRoot, "README.md"), "# Fixture\n");

  const gitInit = spawnSync("git", ["init"], {
    cwd: fixtureRoot,
    encoding: "utf8",
    timeout: 15000,
  });
  assert.strictEqual(gitInit.status, 0, `fixture git init failed: ${gitInit.stderr || gitInit.stdout}`);

  // Configure git user for the fixture repo (needed for operations)
  spawnSync("git", ["config", "user.email", "test@example.com"], { cwd: fixtureRoot });
  spawnSync("git", ["config", "user.name", "Test User"], { cwd: fixtureRoot });

  // Stage all files so workspace is clean for lifecycle testing
  const gitAdd = spawnSync("git", ["add", "-A"], {
    cwd: fixtureRoot,
    encoding: "utf8",
    timeout: 15000,
  });
  assert.strictEqual(gitAdd.status, 0, `fixture git add failed: ${gitAdd.stderr || gitAdd.stdout}`);

  // Commit the initial state so workspace is clean
  const gitCommit = spawnSync("git", ["commit", "-m", "fixture: initial state"], {
    cwd: fixtureRoot,
    encoding: "utf8",
    timeout: 15000,
  });
  assert.strictEqual(gitCommit.status, 0, `fixture git commit failed: ${gitCommit.stderr || gitCommit.stdout}`);

  return fixtureRoot;
}

function appendSignalRecord(fixtureRoot, record) {
  const signalPath = path.join(fixtureRoot, ".scaffoldai", "runtime", "mcp", "signals.jsonl");
  ensureDir(path.dirname(signalPath));
  fs.appendFileSync(signalPath, `${JSON.stringify(record)}\n`, "utf8");
}

function writeInboxPacket(fixtureRoot, fileName, packetTitle) {
  const inboxPath = path.join(fixtureRoot, ".scaffoldai", "inbox", fileName);
  writeFile(
    inboxPath,
    [
      `# SDC — ${packetTitle}`,
      "",
      "MODE: PROCESS_REFACTOR",
      "EXECUTION SURFACE: ScaffoldAI lifecycle simulation",
      "",
      "APPROVAL:",
      "  execute: APPROVED",
      "  commit: PENDING",
      "",
      "GOAL:",
      "Validate lifecycle simulation flow.",
      "",
      "TASKS:",
      "1. Simulate packet lifecycle.",
      "",
      "VERIFY:",
      "Run:",
      "- npm run verify:scaffoldai",
      "",
      "OUTPUT:",
      "Return lifecycle summary.",
      "",
      "CONSTRAINTS:",
      "- no autonomous execution",
      "- preserve append-only logs",
      "",
    ].join("\n")
  );
  return inboxPath;
}

function safeActivatePacket(fixtureRoot, packetInput, summary) {
  const activePacket = getInFlightPacket(fixtureRoot);
  if (activePacket) {
    summary.blockedTransitions.push({
      transition: "activate_while_active",
      reason: `active packet already mounted: ${activePacket}`,
    });
    return {
      status: "blocked",
      reason: "active_packet_exists",
      active_packet: activePacket,
    };
  }

  const activated = activatePacket(fixtureRoot, packetInput);
  
  // Check if the underlying activation was blocked (e.g., dirty workspace)
  if (activated.status === "BLOCKED") {
    summary.blockedTransitions.push({
      transition: "activate_blocked",
      reason: activated.reason,
    });
    return {
      status: "blocked",
      reason: activated.reason,
      data: activated,
    };
  }
  
  summary.lifecyclePhases.push("packet_activate");
  return { status: "ok", data: activated };
}

function safeVerify(fixtureRoot, summary, verificationState, packetId, deps) {
  const claim = getClaimStatus(fixtureRoot);
  if (!claim.has_claim) {
    summary.blockedTransitions.push({
      transition: "verify_without_active_claim",
      reason: "verify requires an active packet claim",
    });
    return {
      status: "blocked",
      reason: "no_active_claim",
    };
  }

  const result = runVerifyTool(fixtureRoot, {}, deps);
  summary.lifecyclePhases.push("verify_execution");

  if (result.status === "passed") {
    verificationState.passed = true;
    const evidence = scaffoldaiVerifyEvidence.buildVerifyEvidence({
      active_packet_id: packetId,
      packet_id: packetId,
      verify_command: "npm run verify:scaffoldai",
      verify_target: "scaffoldai",
      verify_status: "passed",
      exit_code: 0,
      surface: "scaffoldai",
    });
    scaffoldaiVerifyEvidence.writeVerifyEvidence(fixtureRoot, evidence);
  }

  return {
    status: "ok",
    data: result,
  };
}

function safeEmitCompletion(fixtureRoot, summary, verificationState, packetId, changedFiles) {
  if (!verificationState.passed) {
    summary.blockedTransitions.push({
      transition: "completion_without_verification",
      reason: "packet_completed requires verification evidence",
    });
    return {
      status: "blocked",
      reason: "verification_missing",
    };
  }

  appendSignalRecord(fixtureRoot, {
    timestamp: "2026-05-15T00:00:00.000Z",
    client_id: "simulation-client",
    signal_type: "packet_completed",
    message: "Lifecycle simulation packet complete",
    packet: packetId,
    verify_command: "npm run verify:scaffoldai",
    verify_status: "passed",
    changed_files: changedFiles,
    summary: "Deterministic lifecycle simulation happy path completed.",
    needs_human_closeout: true,
  });

  summary.lifecyclePhases.push("completion_signal");
  return {
    status: "ok",
  };
}

function safeCleanWorkspace(fixtureRoot, summary) {
  const claim = getClaimStatus(fixtureRoot);
  if (claim.has_claim) {
    summary.blockedTransitions.push({
      transition: "cleanup_while_claimed",
      reason: `cleanup blocked while claimed by ${claim.claimed_by}`,
    });
    return {
      status: "blocked",
      reason: "claim_active",
    };
  }

  const result = cleanWorkspace(fixtureRoot);
  summary.lifecyclePhases.push("clean_workspace");
  return {
    status: result.status === "PASS" ? "ok" : "blocked",
    data: result,
  };
}

function stageFixtureFiles(fixtureRoot) {
  // Stage any new/modified files in git fixture so workspace stays clean
  const addResult = spawnSync("git", ["add", "-A"], {
    cwd: fixtureRoot,
    encoding: "utf8",
    timeout: 15000,
  });
  if (addResult.status !== 0) {
    console.error(`[WARN] git add failed: ${addResult.stderr || addResult.stdout}`);
    return;
  }

  // Commit the staged files to keep workspace clean
  const commitResult = spawnSync("git", ["commit", "-m", "fixture: stage lifecycle changes"], {
    cwd: fixtureRoot,
    encoding: "utf8",
    timeout: 15000,
  });
  // Commit might fail if there's nothing to commit (nothing changed), which is OK
  if (commitResult.status !== 0 && !commitResult.stdout.includes("nothing to commit")) {
    console.error(`[WARN] git commit failed: ${commitResult.stderr || commitResult.stdout}`);
  }
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  const beforeLive = snapshotLiveRuntime(repoRoot);
  let fixtureRoot;

  try {
    const summary = {
      lifecyclePhases: [],
      blockedTransitions: [],
      collisions: [],
      recoveries: [],
      cleanup: null,
      preservedDurableArtifacts: null,
      runtimeIsolation: null,
    };

    fixtureRoot = initializeFixtureRoot();
    const verificationState = { passed: false };

    // Invalid transition: claim without active packet.
    const noActiveClaim = claimPacket(fixtureRoot, "client-a");
    assert.strictEqual(noActiveClaim.success, false, "claim without active packet should fail");
    assert.strictEqual(noActiveClaim.reason, "no_active_packet");
    summary.blockedTransitions.push({
      transition: "claim_without_active_packet",
      reason: noActiveClaim.reason,
    });

    // Happy path intake.
    const packetInboxPath = writeInboxPacket(
      fixtureRoot,
      "lifecycle-simulation-packet.sdc.md",
      "Lifecycle Simulation Packet"
    );

    const intake = intakePacket(fixtureRoot, packetInboxPath);
    assert.strictEqual(intake.accepted, true, "intake should accept valid packet");
    summary.lifecyclePhases.push("packet_intake");

    const dirtyAfterIntake = checkWorkspaceCleanliness(fixtureRoot);
    assert.strictEqual(dirtyAfterIntake.clean, false, "intake should dirty workspace before activation");
    assert.ok(
      dirtyAfterIntake.lifecycle_owned_files_count > 0,
      "dirty workspace should explicitly report lifecycle-owned artifacts"
    );

    const activationBlockedByDirtyIntake = activatePacket(fixtureRoot, intake.file_name);
    assert.strictEqual(
      activationBlockedByDirtyIntake.status,
      "BLOCKED",
      "activation should block until lifecycle-owned intake artifacts are committed"
    );
    assert.strictEqual(activationBlockedByDirtyIntake.reason, "workspace_not_clean");
    summary.blockedTransitions.push({
      transition: "activate_with_uncommitted_intake_artifacts",
      reason: activationBlockedByDirtyIntake.reason,
    });

    stageFixtureFiles(fixtureRoot);  // Keep fixture workspace clean

    // Happy path activate.
    const activateResult = safeActivatePacket(fixtureRoot, intake.file_name, summary);
    assert.strictEqual(activateResult.status, "ok", "first activation should pass");

    // Invalid transition: second activate while active.
    const secondInboxPath = writeInboxPacket(
      fixtureRoot,
      "lifecycle-simulation-secondary.sdc.md",
      "Lifecycle Simulation Secondary"
    );
    const secondIntake = intakePacket(fixtureRoot, secondInboxPath);
    assert.strictEqual(secondIntake.accepted, true, "secondary intake should accept");
    stageFixtureFiles(fixtureRoot);  // Keep fixture workspace clean

    const blockedActivation = safeActivatePacket(fixtureRoot, secondIntake.file_name, summary);
    assert.strictEqual(blockedActivation.status, "blocked", "activate while active should be blocked by lifecycle harness");

    // Happy path claim.
    const firstClaim = claimPacket(fixtureRoot, "client-a", { message: "starting lifecycle simulation" });
    assert.strictEqual(firstClaim.success, true, "initial claim should succeed");
    summary.lifecyclePhases.push("packet_claim");

    // Invalid transition: second-client claim collision.
    const secondClientClaim = claimPacket(fixtureRoot, "client-b");
    assert.strictEqual(secondClientClaim.success, false, "second client claim should collide");
    assert.strictEqual(secondClientClaim.reason, "busy", "second client claim should return busy");
    summary.collisions.push({
      transition: "second_client_claim",
      owner: secondClientClaim.claimed_by,
      reason: secondClientClaim.reason,
    });

    // Invalid transition: cleanup during active claimed work.
    const blockedCleanup = safeCleanWorkspace(fixtureRoot, summary);
    assert.strictEqual(blockedCleanup.status, "blocked", "cleanup should be blocked while active claim exists");

    // Invalid transition: verify without active claim (done on separate fixture).
    const verifyNoClaimRoot = initializeFixtureRoot();
    try {
      const verifyNoClaimSummary = { blockedTransitions: [] };
      const verifyNoClaim = safeVerify(
        verifyNoClaimRoot,
        verifyNoClaimSummary,
        { passed: false },
        {
          execute: () => ({ status: 0, stdout: "verify ok", stderr: "" }),
          now: new Date("2026-05-15T00:10:00.000Z"),
        }
      );
      assert.strictEqual(verifyNoClaim.status, "blocked", "verify without claim should be blocked by lifecycle harness");
      assert.strictEqual(verifyNoClaim.reason, "no_active_claim");
    } finally {
      fs.rmSync(verifyNoClaimRoot, { recursive: true, force: true });
    }

    // Happy path verify with active claim.
    const verifyResult = safeVerify(
      fixtureRoot,
      summary,
      verificationState,
      intake.packet_id,
      {
        execute: () => ({ status: 0, stdout: "verify ok", stderr: "" }),
        now: new Date("2026-05-15T00:20:00.000Z"),
      }
    );
    assert.strictEqual(verifyResult.status, "ok", "verify with claim should proceed");
    assert.strictEqual(verifyResult.data.status, "passed", "verify runner result should be passed");

    // Invalid transition: completion without verification (separate fixture).
    const completionNoVerifySummary = { blockedTransitions: [] };
    const completionNoVerify = safeEmitCompletion(
      fixtureRoot,
      completionNoVerifySummary,
      { passed: false },
      intake.packet_id,
      ["src/test/unit-scaffoldai-lifecycle-simulation.js"]
    );
    assert.strictEqual(completionNoVerify.status, "blocked", "completion should be blocked when verification is missing");
    summary.blockedTransitions.push(...completionNoVerifySummary.blockedTransitions);

    // Happy path completion signal emission.
    const completionResult = safeEmitCompletion(
      fixtureRoot,
      summary,
      verificationState,
      intake.packet_id,
      ["src/test/unit-scaffoldai-lifecycle-simulation.js"]
    );
    assert.strictEqual(completionResult.status, "ok", "completion signal should be emitted after verification");

    // Happy path claim release.
    const release = releasePacket(fixtureRoot, "client-a");
    assert.strictEqual(release.success, true, "claim release should succeed");
    summary.lifecyclePhases.push("claim_release");
    summary.recoveries.push({
      transition: "cleanup_while_claimed",
      recovery_action: "release_claim_then_retry",
      recovered: true,
    });

    // Happy path closeout readiness observation.
    const closeoutReadiness = gatherCloseoutReadiness(fixtureRoot, { verifyPassed: true });
    assert.notStrictEqual(closeoutReadiness.status, "BLOCKED", "closeout readiness should not be blocked for fixture simulation");
    summary.lifecyclePhases.push("closeout_readiness");

    // Happy path clean-workspace.
    const cleanup = safeCleanWorkspace(fixtureRoot, summary);
    assert.strictEqual(cleanup.status, "ok", "clean-workspace should pass after claim release");
    assert.strictEqual(cleanup.data.status, "PASS", "clean-workspace status should be PASS");
    assert.strictEqual(cleanup.data.data.packet_closed, false, "cleanup should report no terminal closeout in this fixture");
    assert.strictEqual(cleanup.data.data.cleanup_performed, false, "cleanup should not consume inbox candidate before closeout");
    assert.strictEqual(cleanup.data.data.inbox_candidate_removed, false, "cleanup should preserve inbox candidate before closeout");
    summary.cleanup = {
      touched: cleanup.data.data.touched,
      skipped: cleanup.data.data.skipped,
      packet_files_preserved: cleanup.data.data.packet_files_preserved,
      logs_preserved: cleanup.data.data.logs_preserved,
    };

    // Validate completion visibility and append-only preservation guarantees.
    const completionStatus = gatherCompletionStatus(fixtureRoot, {
      packet: intake.packet_id,
      latestOnly: true,
      limit: 10,
    });

    assert.strictEqual(completionStatus.data.returned_count, 1, "completion status should include emitted packet_completed record");
    assert.strictEqual(completionStatus.data.completions[0].verify_status, "passed", "completion verify status should be passed");

    const ownershipMismatch = scaffoldaiVerifyEvidence.validateVerifyEvidence(
      fixtureRoot,
      "other-packet.sdc"
    );
    assert.strictEqual(ownershipMismatch.valid, false, "verify evidence should be packet-owned");
    assert.strictEqual(
      ownershipMismatch.reason,
      "verify_evidence_packet_mismatch",
      "verify evidence packet mismatch should fail closed"
    );

    assert.ok(
      fs.existsSync(path.join(fixtureRoot, ".scaffoldai", "packets", `${intake.packet_id}.md`)),
      "accepted packet must be preserved after clean-workspace"
    );
    assert.ok(
      fs.existsSync(path.join(fixtureRoot, ".scaffoldai", "state", "history.jsonl")),
      "append-only history must be preserved after clean-workspace"
    );
    assert.ok(
      fs.existsSync(path.join(fixtureRoot, ".scaffoldai", "runtime", "mcp", "signals.jsonl")),
      "append-only signal log must be preserved after clean-workspace"
    );
    assert.ok(
      fs.existsSync(secondInboxPath),
      "cleanup before closeout must preserve the remaining inbox candidate"
    );

    assert.strictEqual(getInFlightPacket(fixtureRoot), null, "final packet pointer should be neutralized after clean-workspace");

    summary.preservedDurableArtifacts = {
      packets: true,
      history_jsonl: true,
      signals_jsonl: true,
      shared_memory_jsonl: true,
    };

    summary.runtimeIsolation = {
      fixture_root: fixtureRoot,
      live_runtime_mutated: false,
    };

    const afterLive = snapshotLiveRuntime(repoRoot);
    assertLiveRuntimeUnchanged(beforeLive, afterLive);

    console.log("[lifecycle simulation summary]");
    console.log(JSON.stringify(summary, null, 2));
    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  } finally {
    if (fixtureRoot) {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  }
}

main();
