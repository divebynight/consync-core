"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const {
  resolveLatestValidInboxCandidate,
  resolveLatestIntakeCompatibleCandidate,
  enforceSingleDomainContext,
  PROCESS_DOMAIN,
  PRODUCT_DOMAIN,
} = require("../lib/scaffoldaiLifecycleResolution.query.scaffoldai");
const { intakePacket } = require("../lib/scaffoldaiPacketIntake.auth.scaffoldai");
const { activatePacket } = require("../lib/scaffoldaiPacketActivation.auth.scaffoldai");
const { runScaffoldaiLifecycleCommand } = require("../scaffoldai/commands/scaffoldai-lifecycle.cmd.scaffoldai");
const { claimPacket, releasePacket } = require("../lib/packetClaim.auth.scaffoldai");
const scaffoldaiState = require("../lib/scaffoldaiState.state.scaffoldai");
const { getRepoRoot } = require("../lib/repoRoot.util.shared");

const TEST_NAME = "unit-scaffoldai-lifecycle-wrappers";
const repoRoot = getRepoRoot(__dirname);
const tempRoot = path.join(repoRoot, ".scaffoldai", "tmp");

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

function createFixture() {
  ensureDir(tempRoot);
  const fixtureRoot = fs.mkdtempSync(path.join(tempRoot, "lifecycle-wrappers-"));

  const scaffoldaiRoot = path.join(fixtureRoot, ".scaffoldai");
  ensureDir(path.join(scaffoldaiRoot, "inbox"));
  ensureDir(path.join(scaffoldaiRoot, "packets"));
  ensureDir(path.join(scaffoldaiRoot, "runtime", "packet-intake"));
  ensureDir(path.join(scaffoldaiRoot, "runtime", "mcp"));
  ensureDir(path.join(scaffoldaiRoot, "state"));
  ensureDir(path.join(scaffoldaiRoot, "contracts"));

  writeJson(path.join(scaffoldaiRoot, "contracts", "active-policy.json"), {
    mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
    allowed_packet_types: ["process", "contract", "planning"],
    blocked_packet_types: ["product", "agent"],
    require_clean_git: true,
    require_dry_run: true,
  });

  writeJson(path.join(scaffoldaiRoot, "state", "active-runtime.json"), {
    in_flight_packet: null,
  });

  writeFile(
    path.join(scaffoldaiRoot, "state", "next-action.md"),
    ["TYPE: REFACTOR", "PACKAGE: NONE", "", "No active in-flight packet.", ""].join("\n")
  );

  writeFile(
    path.join(scaffoldaiRoot, "state", "snapshot.md"),
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

  writeFile(path.join(scaffoldaiRoot, "state", "active-stream.md"), "ACTIVE STREAM\nprocess\n");
  writeFile(path.join(scaffoldaiRoot, "state", "history.jsonl"), "{\"seed\":\"history\"}\n");
  writeFile(path.join(scaffoldaiRoot, "runtime", "mcp", "signals.jsonl"), "");
  writeFile(path.join(scaffoldaiRoot, "runtime", "mcp", "shared-memory.jsonl"), "");

  spawnSync("git", ["init"], { cwd: fixtureRoot, stdio: "pipe" });
  spawnSync("git", ["config", "user.email", "test@local"], { cwd: fixtureRoot, stdio: "pipe" });
  spawnSync("git", ["config", "user.name", "Test User"], { cwd: fixtureRoot, stdio: "pipe" });
  commitFixture(fixtureRoot, "fixture: initialize wrapper test state");

  return fixtureRoot;
}

function commitFixture(fixtureRoot, message) {
  spawnSync("git", ["add", "."], { cwd: fixtureRoot, stdio: "pipe" });
  const status = spawnSync("git", ["status", "--porcelain"], { cwd: fixtureRoot, encoding: "utf8" });
  if (!status.stdout.trim()) {
    return;
  }

  spawnSync("git", ["commit", "-m", message], { cwd: fixtureRoot, stdio: "pipe" });
}

function packetContent(title) {
  return [
    `# SDC — ${title}`,
    "",
    "MODE: PROCESS_REFACTOR",
    "EXECUTION SURFACE: lifecycle wrapper test",
    "",
    "APPROVAL:",
    "  execute: APPROVED",
    "  commit: PENDING",
    "",
    "GOAL:",
    "Validate wrapper sequencing and gates.",
    "",
    "TASKS:",
    "1. Intake",
    "2. Activate",
    "",
    "VERIFY:",
    "- npm run verify:scaffoldai",
    "",
    "OUTPUT:",
    "1. status",
    "",
    "CONSTRAINTS:",
    "- no autonomous execution",
    "",
  ].join("\n");
}

function setMtimeSame(filePath, ts) {
  fs.utimesSync(filePath, ts, ts);
}

function appendCompletionSignal(fixtureRoot, packetId, verifyStatus) {
  const signalPath = path.join(fixtureRoot, ".scaffoldai", "runtime", "mcp", "signals.jsonl");
  const row = {
    timestamp: "2026-05-16T00:00:00.000Z",
    client_id: "test-client",
    signal_type: "packet_completed",
    packet: `${packetId}.md`,
    message: "Packet complete",
    verify_command: "npm run verify:scaffoldai",
    verify_status: verifyStatus,
    changed_files: ["src/scaffoldai/commands/scaffoldai-lifecycle.cmd.scaffoldai.js"],
  };
  fs.appendFileSync(signalPath, `${JSON.stringify(row)}\n`, "utf8");
}

function writeVerifyEvidence(fixtureRoot, packetId, verifyStatus) {
  const evidencePath = path.join(fixtureRoot, ".scaffoldai", "state", "verify-evidence.json");
  const evidence = {
    timestamp: "2026-05-16T00:00:00.000Z",
    timestamp_ms: Date.now(),
    active_packet_id: packetId,
    packet_id: packetId,
    verify_command: "npm run verify:scaffoldai",
    verify_target: "scaffoldai",
    verify_status: verifyStatus,
    exit_code: verifyStatus === "passed" ? 0 : 1,
    surface: "scaffoldai",
  };
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2) + "\n", "utf8");
}

function readGitDirtyFiles(fixtureRoot) {
  const status = spawnSync("git", ["status", "--short"], {
    cwd: fixtureRoot,
    encoding: "utf8",
  });

  if (status.status !== 0) {
    return [];
  }

  return status.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[A-Z?]{1,2}\s+/, ""));
}

async function runLifecycle(fixtureRoot, argv) {
  process.exitCode = 0;
  await runScaffoldaiLifecycleCommand(argv, { repoRoot: fixtureRoot });
  return process.exitCode || 0;
}

async function main() {
  console.log(`[${TEST_NAME}] Running`);

  const fixture = createFixture();

  try {
    const inbox = path.join(fixture, ".scaffoldai", "inbox");
    const a = path.join(inbox, "candidate-a.sdc.md");
    const b = path.join(inbox, "candidate-b.sdc.md");

    writeFile(a, packetContent("Alpha Candidate"));
    writeFile(b, packetContent("Beta Candidate"));
    commitFixture(fixture, "fixture: seed inbox candidates");

    // 1) deterministic latest candidate resolution
    {
      const one = resolveLatestIntakeCompatibleCandidate(fixture);
      assert.strictEqual(one.ok, true, "should resolve latest compatible candidate");
      assert.ok(one.value.packet_id, "resolved candidate should include packet identity");
      const valid = resolveLatestValidInboxCandidate(fixture);
      assert.strictEqual(valid.ok, true, "should resolve latest valid candidate");
      console.log("  PASS: deterministic latest candidate resolution");
    }

    // 2) ambiguity refusal when latest candidates tie on timestamp
    {
      const now = new Date();
      setMtimeSame(a, now);
      setMtimeSame(b, now);
      const ambiguous = resolveLatestIntakeCompatibleCandidate(fixture);
      assert.strictEqual(ambiguous.ok, false, "ambiguous latest candidates should fail closed");
      assert.strictEqual(ambiguous.diagnostic.reason, "ambiguous_latest_candidate");
      console.log("  PASS: ambiguous candidate resolution refuses operation");

      const future = new Date(now.getTime() + 1000);
      setMtimeSame(a, now);
      setMtimeSame(b, future);
    }

    // 3) wrapper ordering enforcement and fail-closed when active packet exists
    {
      const intake = intakePacket(fixture, b);
      assert.strictEqual(intake.accepted, true);
      commitFixture(fixture, "fixture: intake packet for activation");
      const activated = activatePacket(fixture, intake.file_name);
      assert.strictEqual(activated.status, "PASS");
      commitFixture(fixture, "fixture: activate packet");

      const blockedStart = await runLifecycle(fixture, ["start-latest"]);
      assert.strictEqual(blockedStart, 1, "start-latest should block while packet is active");
      console.log("  PASS: wrapper ordering enforcement blocks start-latest with active packet");
    }

    // 4) one-domain-at-a-time scaffolding behavior
    {
      const processDomain = enforceSingleDomainContext(fixture, PROCESS_DOMAIN);
      assert.strictEqual(processDomain.ok, true, "process domain should pass with process packet active");

      const productDomain = enforceSingleDomainContext(fixture, PRODUCT_DOMAIN);
      assert.strictEqual(productDomain.ok, false, "product domain should fail with process packet active");
      assert.strictEqual(productDomain.diagnostic.reason, "domain_context_conflict");
      console.log("  PASS: one-domain-at-a-time scaffolding enforces domain boundary");
    }

    // 5) close-feature verification gating
    {
      const closeWithoutVerify = await runLifecycle(fixture, ["close-feature"]);
      assert.strictEqual(closeWithoutVerify, 1, "close-feature should fail without verification evidence");
      console.log("  PASS: close-feature verification gating");
    }

    // 6) close-feature cleanup gating when claim exists
    {
      const claimed = claimPacket(fixture, "test-client");
      assert.strictEqual(claimed.success, true);
      commitFixture(fixture, "fixture: claim active packet");

      writeVerifyEvidence(fixture, activatedPacketId(fixture), "passed");
      commitFixture(fixture, "fixture: write verification evidence for claimed packet");
      const closeWhileClaimed = await runLifecycle(fixture, ["close-feature"]);
      assert.strictEqual(closeWhileClaimed, 1, "close-feature should fail while claim is active");

      const released = releasePacket(fixture, "test-client");
      assert.strictEqual(released.success, true);
      commitFixture(fixture, "fixture: release packet claim");
      console.log("  PASS: close-feature cleanup gating blocks active claim");
    }

    // 7) stale verification evidence from another packet must fail closed
    {
      writeVerifyEvidence(fixture, "stale-packet.sdc", "passed");
      commitFixture(fixture, "fixture: write stale verification evidence");

      const staleEvidence = await runLifecycle(fixture, ["close-feature"]);
      assert.strictEqual(staleEvidence, 1, "close-feature should fail when evidence belongs to another packet");
      console.log("  PASS: stale verification evidence fails closed");
    }

    // 8) failed verification evidence must fail closed
    {
      writeVerifyEvidence(fixture, activatedPacketId(fixture), "failed");
      commitFixture(fixture, "fixture: write failed verification evidence");

      const failedEvidence = await runLifecycle(fixture, ["close-feature"]);
      assert.strictEqual(failedEvidence, 1, "close-feature should fail when verification evidence failed");
      console.log("  PASS: failed verification evidence blocks close-feature");
    }

    // 9) close-feature orchestration success path (end-to-end wrapper flow)
    {
      const expectedPacketId = activatedPacketId(fixture);
      assert.ok(expectedPacketId, "active packet should exist before close-feature");

      const handoffBefore = scaffoldaiState.readHandoff(fixture);
      const hasPreexistingTerminalHandoff =
        Boolean(handoffBefore) &&
        handoffBefore.includes(`PACKAGE: ${expectedPacketId}`) &&
        /\nPASS\n|\nFAIL\n/.test(handoffBefore);
      assert.strictEqual(
        hasPreexistingTerminalHandoff,
        false,
        "success path must not rely on pre-seeded terminal handoff"
      );

      writeVerifyEvidence(fixture, activatedPacketId(fixture), "passed");
  commitFixture(fixture, "fixture: write passing verification evidence");
      const success = await runLifecycle(fixture, ["close-feature"]);
      assert.strictEqual(success, 0, "close-feature should pass when verification and cleanup gates are met");

      const handoffAfter = scaffoldaiState.readHandoff(fixture);
      assert.ok(handoffAfter, "terminal handoff evidence should be written by close-feature closeout stage");
      assert.ok(handoffAfter.includes(`PACKAGE: ${expectedPacketId}`), "handoff should match active packet");
      assert.ok(/\nPASS\n/.test(handoffAfter), "handoff should include terminal PASS status");

      const runtime = JSON.parse(
        fs.readFileSync(path.join(fixture, ".scaffoldai", "state", "active-runtime.json"), "utf8")
      );
      assert.strictEqual(runtime.in_flight_packet, null, "cleanup should clear active packet runtime pointer");

      const latestIntakePath = path.join(
        fixture,
        ".scaffoldai",
        "runtime",
        "packet-intake",
        "latest-intake.json"
      );
      assert.strictEqual(fs.existsSync(latestIntakePath), false, "cleanup should remove latest intake metadata");
      assert.strictEqual(fs.existsSync(b), false, "cleanup should remove consumed inbox candidate after closeout evidence");

      const nextAction = fs.readFileSync(path.join(fixture, ".scaffoldai", "state", "next-action.md"), "utf8");
      assert.ok(nextAction.includes("PACKAGE: NONE"), "final lifecycle state should be clean idle");
      console.log("  PASS: close-feature orchestration runs cleanup and closes active packet context");

      const evidence = JSON.parse(
        fs.readFileSync(path.join(fixture, ".scaffoldai", "state", "verify-evidence.json"), "utf8")
      );
      assert.strictEqual(
        evidence.active_packet_id,
        expectedPacketId,
        "verification evidence should be bound to the active packet"
      );
    }

    // 10) close-feature is idempotent after packet is already closed
    {
      const secondClose = await runLifecycle(fixture, ["close-feature"]);
      assert.strictEqual(secondClose, 0, "close-feature should return success when packet is already closed");

      const nextAction = fs.readFileSync(path.join(fixture, ".scaffoldai", "state", "next-action.md"), "utf8");
      assert.ok(nextAction.includes("PACKAGE: NONE"), "idempotent close-feature should keep idle next-action state");
      console.log("  PASS: close-feature is idempotent when already closed");
    }

    // 11) intake dirties workspace and activation is blocked until operator commits lifecycle-owned artifacts
    {
      const phaseFixture = createFixture();
      try {
        const inbox = path.join(phaseFixture, ".scaffoldai", "inbox", "phase1-intake.sdc.md");
        writeFile(inbox, packetContent("Phase 1 Intake"));
        commitFixture(phaseFixture, "fixture: phase1 intake candidate");

        const intake = intakePacket(phaseFixture, inbox);
        assert.strictEqual(intake.accepted, true, "phase1 intake should be accepted");

        const dirtyAfterIntake = readGitDirtyFiles(phaseFixture);
        assert.ok(dirtyAfterIntake.length > 0, "intake should dirty workspace before activation");

        const blockedActivation = activatePacket(phaseFixture, intake.file_name);
        assert.strictEqual(blockedActivation.status, "BLOCKED", "activation should block on uncommitted intake artifacts");
        assert.strictEqual(blockedActivation.reason, "workspace_not_clean", "activation should fail with explicit dirty workspace reason");

        commitFixture(phaseFixture, "fixture: commit lifecycle-owned intake artifacts");
        const activated = activatePacket(phaseFixture, intake.file_name);
        assert.strictEqual(activated.status, "PASS", "activation should succeed after committing intake artifacts");
      } finally {
        fs.rmSync(phaseFixture, { recursive: true, force: true });
      }
      console.log("  PASS: intake dirties workspace and activation waits for explicit operator commit");
    }

    // 12) close-feature should allow dirty active work and then leave deterministic dirty lifecycle artifacts for commit choreography
    {
      const phaseFixture = createFixture();
      try {
        const inbox = path.join(phaseFixture, ".scaffoldai", "inbox", "phase1-close.sdc.md");
        writeFile(inbox, packetContent("Phase 1 Close"));
        commitFixture(phaseFixture, "fixture: phase1 close candidate");

        const intake = intakePacket(phaseFixture, inbox);
        assert.strictEqual(intake.accepted, true);
        commitFixture(phaseFixture, "fixture: phase1 close intake committed");

        const activated = activatePacket(phaseFixture, intake.file_name);
        assert.strictEqual(activated.status, "PASS");
        commitFixture(phaseFixture, "fixture: phase1 close activation committed");

        writeFile(path.join(phaseFixture, "OPERATOR-WORK.md"), "operator work\n");

        writeVerifyEvidence(phaseFixture, activated.packet_id, "passed");
        appendCompletionSignal(phaseFixture, activated.packet_id, "passed");

        const closeResult = await runLifecycle(phaseFixture, ["close-feature"]);
        assert.strictEqual(
          closeResult,
          0,
          "close-feature should succeed with dirty active packet workspace and defer commit choreography to operator"
        );

        const dirtyAfterClose = readGitDirtyFiles(phaseFixture);
        assert.ok(dirtyAfterClose.length > 0, "close-feature should leave intentional dirty artifacts for operator commit");
      } finally {
        fs.rmSync(phaseFixture, { recursive: true, force: true });
      }
      console.log("  PASS: close-feature succeeds with dirty active work and leaves deterministic dirty state");
    }

    // 13) repeated verify/close cycles enforce verify-evidence packet ownership
    {
      const phaseFixture = createFixture();
      try {
        const inboxA = path.join(phaseFixture, ".scaffoldai", "inbox", "cycle-a.sdc.md");
        writeFile(inboxA, packetContent("Cycle A"));
        commitFixture(phaseFixture, "fixture: cycle A candidate");

        const intakeA = intakePacket(phaseFixture, inboxA);
        assert.strictEqual(intakeA.accepted, true);
        commitFixture(phaseFixture, "fixture: cycle A intake");

        const activateA = activatePacket(phaseFixture, intakeA.file_name);
        assert.strictEqual(activateA.status, "PASS");
        commitFixture(phaseFixture, "fixture: cycle A activate");

        writeVerifyEvidence(phaseFixture, activateA.packet_id, "passed");
        appendCompletionSignal(phaseFixture, activateA.packet_id, "passed");
        const closeA = await runLifecycle(phaseFixture, ["close-feature"]);
        assert.strictEqual(closeA, 0, "cycle A close-feature should pass");
        commitFixture(phaseFixture, "fixture: cycle A close committed");

        const inboxB = path.join(phaseFixture, ".scaffoldai", "inbox", "cycle-b.sdc.md");
        writeFile(inboxB, packetContent("Cycle B"));
        commitFixture(phaseFixture, "fixture: cycle B candidate");

        const intakeB = intakePacket(phaseFixture, inboxB);
        assert.strictEqual(intakeB.accepted, true);
        commitFixture(phaseFixture, "fixture: cycle B intake");

        const activateB = activatePacket(phaseFixture, intakeB.file_name);
        assert.strictEqual(activateB.status, "PASS");
        commitFixture(phaseFixture, "fixture: cycle B activate");

        const staleClose = await runLifecycle(phaseFixture, ["close-feature"]);
        assert.strictEqual(staleClose, 1, "cycle B close-feature should fail on cycle A verify evidence ownership");

        writeVerifyEvidence(phaseFixture, activateB.packet_id, "passed");
        appendCompletionSignal(phaseFixture, activateB.packet_id, "passed");
        const closeB = await runLifecycle(phaseFixture, ["close-feature"]);
        assert.strictEqual(closeB, 0, "cycle B close-feature should pass with packet-owned verify evidence");
      } finally {
        fs.rmSync(phaseFixture, { recursive: true, force: true });
      }
      console.log("  PASS: repeated verify/close cycles enforce packet-scoped verification evidence ownership");
    }

    console.log(`[${TEST_NAME}] PASS`);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

function activatedPacketId(fixtureRoot) {
  const nextAction = fs.readFileSync(path.join(fixtureRoot, ".scaffoldai", "state", "next-action.md"), "utf8");
  const packet = nextAction.match(/^PACKAGE:\s*(.+)$/m);
  if (!packet) return null;
  const value = packet[1].trim();
  return value === "NONE" ? null : value;
}

main().catch((error) => {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
