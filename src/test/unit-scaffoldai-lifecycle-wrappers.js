"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

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

  return fixtureRoot;
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

function writeTerminalHandoff(fixtureRoot, packetId, status) {
  scaffoldaiState.writeHandoff(
    fixtureRoot,
    [
      "TYPE: PROCESS",
      `PACKAGE: ${packetId}`,
      "",
      "STATUS",
      "",
      status,
      "",
      "SUMMARY",
      "",
      "Lifecycle closeout done.",
      "",
      "FILES CREATED",
      "",
      "- none",
      "",
      "FILES MODIFIED",
      "",
      "- none",
      "",
      "FILES DELETED",
      "",
      "- none",
      "",
      "COMMANDS TO RUN",
      "",
      "- none",
      "",
      "HUMAN VERIFICATION",
      "",
      "- confirm",
      "",
      "VERIFICATION NOTES",
      "",
      "- test handoff",
      "",
    ].join("\n")
  );
}

function runLifecycle(fixtureRoot, argv) {
  process.exitCode = 0;
  runScaffoldaiLifecycleCommand(argv, { repoRoot: fixtureRoot });
  return process.exitCode || 0;
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  const fixture = createFixture();

  try {
    const inbox = path.join(fixture, ".scaffoldai", "inbox");
    const a = path.join(inbox, "candidate-a.sdc.md");
    const b = path.join(inbox, "candidate-b.sdc.md");

    writeFile(a, packetContent("Alpha Candidate"));
    writeFile(b, packetContent("Beta Candidate"));

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
      const activated = activatePacket(fixture, intake.file_name);
      assert.strictEqual(activated.status, "PASS");

      const blockedStart = runLifecycle(fixture, ["start-latest"]);
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
      const closeWithoutVerify = runLifecycle(fixture, ["close-feature"]);
      assert.strictEqual(closeWithoutVerify, 1, "close-feature should fail without verification evidence");
      console.log("  PASS: close-feature verification gating");
    }

    // 6) close-feature cleanup gating when claim exists
    {
      const claimed = claimPacket(fixture, "test-client");
      assert.strictEqual(claimed.success, true);

      writeVerifyEvidence(fixture, activatedPacketId(fixture), "passed");
      writeTerminalHandoff(fixture, activatedPacketId(fixture), "PASS");

      const closeWhileClaimed = runLifecycle(fixture, ["close-feature", "--verify-passed"]);
      assert.strictEqual(closeWhileClaimed, 1, "close-feature should fail while claim is active");

      const released = releasePacket(fixture, "test-client");
      assert.strictEqual(released.success, true);
      console.log("  PASS: close-feature cleanup gating blocks active claim");
    }

    // 7) stale verification evidence from another packet must fail closed
    {
      writeVerifyEvidence(fixture, "stale-packet.sdc", "passed");

      const staleEvidence = runLifecycle(fixture, ["close-feature", "--verify-passed"]);
      assert.strictEqual(staleEvidence, 1, "close-feature should fail when evidence belongs to another packet");
      console.log("  PASS: stale verification evidence fails closed");
    }

    // 8) failed verification evidence must fail closed
    {
      writeVerifyEvidence(fixture, activatedPacketId(fixture), "failed");

      const failedEvidence = runLifecycle(fixture, ["close-feature", "--verify-passed"]);
      assert.strictEqual(failedEvidence, 1, "close-feature should fail when verification evidence failed");
      console.log("  PASS: failed verification evidence blocks close-feature");
    }

    // 9) close-feature orchestration success path
    {
      const expectedPacketId = activatedPacketId(fixture);
      writeVerifyEvidence(fixture, activatedPacketId(fixture), "passed");
      const success = runLifecycle(fixture, ["close-feature", "--verify-passed"]);
      assert.strictEqual(success, 0, "close-feature should pass when verification and cleanup gates are met");

      const runtime = JSON.parse(
        fs.readFileSync(path.join(fixture, ".scaffoldai", "state", "active-runtime.json"), "utf8")
      );
      assert.strictEqual(runtime.in_flight_packet, null, "cleanup should clear active packet runtime pointer");
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

try {
  main();
} catch (error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack || error.message);
  process.exitCode = 1;
}
