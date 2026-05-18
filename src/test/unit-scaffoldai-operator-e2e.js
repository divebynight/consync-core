"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const { getRepoRoot } = require("../lib/repoRoot.util.shared");
const { runScaffoldaiLifecycleCommand } = require("../scaffoldai/commands/scaffoldai-lifecycle.cmd.scaffoldai");
const { getInFlightPacket } = require("../lib/getInFlightPacket.query.scaffoldai");
const { claimPacket, releasePacket } = require("../lib/packetClaim.auth.scaffoldai");
const scaffoldaiVerifyEvidence = require("../lib/scaffoldaiVerifyEvidence.state.scaffoldai");
const { checkWorkspaceCleanliness } = require("../lib/workspaceCleanlinessCheck.auth.scaffoldai");

const TEST_NAME = "unit-scaffoldai-operator-e2e";
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

function commitFixtureFiles(fixtureRoot, message) {
  spawnSync("git", ["add", "-A"], { cwd: fixtureRoot, encoding: "utf8", timeout: 15000 });
  const status = spawnSync("git", ["status", "--short"], { cwd: fixtureRoot, encoding: "utf8", timeout: 15000 });
  if (!status.stdout.trim()) return;
  spawnSync("git", ["commit", "-m", message], { cwd: fixtureRoot, encoding: "utf8", timeout: 15000 });
}

function initializeFixture() {
  ensureDir(tempRoot);
  const fixtureRoot = fs.mkdtempSync(path.join(tempRoot, "operator-e2e-"));

  const scaffoldaiRoot = path.join(fixtureRoot, ".scaffoldai");
  ensureDir(path.join(scaffoldaiRoot, "state"));
  ensureDir(path.join(scaffoldaiRoot, "contracts"));
  ensureDir(path.join(scaffoldaiRoot, "packets"));
  ensureDir(path.join(scaffoldaiRoot, "inbox"));
  ensureDir(path.join(scaffoldaiRoot, "runtime", "packet-intake"));
  ensureDir(path.join(scaffoldaiRoot, "runtime", "mcp"));

  writeJson(path.join(scaffoldaiRoot, "contracts", "active-policy.json"), {
    mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
    allowed_packet_types: ["process", "contract", "planning"],
    blocked_packet_types: ["product", "agent"],
    require_clean_git: true,
  });

  writeJson(path.join(scaffoldaiRoot, "state", "active-runtime.json"), { in_flight_packet: null });
  writeFile(path.join(scaffoldaiRoot, "state", "next-action.md"), "TYPE: REFACTOR\nPACKAGE: NONE\n\nNo active packet.\n");
  writeFile(
    path.join(scaffoldaiRoot, "state", "snapshot.md"),
    ["# Consync Snapshot", "", "## Current Package", "", "- type: `REFACTOR`", "- package: `NONE`", ""].join("\n")
  );
  writeFile(path.join(scaffoldaiRoot, "state", "active-stream.md"), "ACTIVE STREAM\nprocess\n");
  writeFile(path.join(scaffoldaiRoot, "state", "history.jsonl"), "{\"seed\":\"history\"}\n");
  writeFile(path.join(scaffoldaiRoot, "runtime", "mcp", "signals.jsonl"), "");
  writeFile(path.join(scaffoldaiRoot, "runtime", "mcp", "shared-memory.jsonl"), "");
  writeFile(path.join(fixtureRoot, "README.md"), "# E2E Operator Test Fixture\n");

  spawnSync("git", ["init"], { cwd: fixtureRoot, encoding: "utf8", timeout: 15000 });
  spawnSync("git", ["config", "user.email", "test@example.com"], { cwd: fixtureRoot });
  spawnSync("git", ["config", "user.name", "Test User"], { cwd: fixtureRoot });

  commitFixtureFiles(fixtureRoot, "fixture: initial state");
  return fixtureRoot;
}

function writeInboxPacket(fixtureRoot, fileName, title) {
  const inboxPath = path.join(fixtureRoot, ".scaffoldai", "inbox", fileName);
  writeFile(
    inboxPath,
    [
      `# SDC — ${title}`,
      "",
      "MODE: PROCESS_REFACTOR",
      "EXECUTION SURFACE: deterministic operator workflow test",
      "",
      "APPROVAL:",
      "  execute: APPROVED",
      "  commit: PENDING",
      "",
      "GOAL:",
      "Validate phase-1 lifecycle choreography and ownership semantics.",
      "",
      "TASKS:",
      "1. Intake",
      "2. Activate",
      "3. Verify and close",
      "",
      "VERIFY:",
      "- npm run verify:scaffoldai",
      "",
      "OUTPUT:",
      "- deterministic state transitions",
      "",
      "CONSTRAINTS:",
      "- no autonomous execution",
      "- no autonomous commits",
      "",
    ].join("\n")
  );

  return inboxPath;
}

function appendCompletionSignal(fixtureRoot, packetId) {
  const signalPath = path.join(fixtureRoot, ".scaffoldai", "runtime", "mcp", "signals.jsonl");
  fs.appendFileSync(
    signalPath,
    `${JSON.stringify({
      timestamp: "2026-05-17T00:00:00.000Z",
      client_id: "operator-e2e-client",
      signal_type: "packet_completed",
      packet: `${packetId}.md`,
      message: "Operator e2e completion",
      verify_command: "npm run verify:scaffoldai",
      verify_status: "passed",
      changed_files: ["src/test/unit-scaffoldai-operator-e2e.js"],
    })}\n`,
    "utf8"
  );
}

function writeVerifyEvidence(fixtureRoot, packetId) {
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

async function runLifecycle(fixtureRoot, args) {
  process.exitCode = 0;
  await runScaffoldaiLifecycleCommand(args, { repoRoot: fixtureRoot });
  return process.exitCode || 0;
}

async function runCycle(fixtureRoot, cycleLabel) {
  const packetPath = writeInboxPacket(fixtureRoot, `${cycleLabel}.sdc.md`, `Operator ${cycleLabel}`);
  commitFixtureFiles(fixtureRoot, `fixture: add ${cycleLabel} candidate`);

  const intakeResult = await runLifecycle(fixtureRoot, ["intake-latest"]);
  assert.strictEqual(intakeResult, 0, `${cycleLabel}: intake-latest should pass`);

  const dirtyAfterIntake = checkWorkspaceCleanliness(fixtureRoot);
  assert.strictEqual(dirtyAfterIntake.clean, false, `${cycleLabel}: intake should dirty workspace`);
  assert.ok(
    dirtyAfterIntake.lifecycle_owned_files_count > 0,
    `${cycleLabel}: dirty intake should report lifecycle-owned artifacts`
  );

  const blockedActivation = await runLifecycle(fixtureRoot, ["activate-latest"]);
  assert.strictEqual(blockedActivation, 1, `${cycleLabel}: activation should block until intake artifacts are committed`);

  commitFixtureFiles(fixtureRoot, `fixture: commit ${cycleLabel} intake artifacts`);

  const activateResult = await runLifecycle(fixtureRoot, ["activate-latest"]);
  assert.strictEqual(activateResult, 0, `${cycleLabel}: activation should pass after commit`);

  const activePacket = getInFlightPacket(fixtureRoot);
  assert.ok(activePacket, `${cycleLabel}: packet should be active`);

  const claim = claimPacket(fixtureRoot, "operator-e2e-client");
  assert.strictEqual(claim.success, true, `${cycleLabel}: claim should succeed`);

  const closeWhileClaimed = await runLifecycle(fixtureRoot, ["close-feature"]);
  assert.strictEqual(closeWhileClaimed, 1, `${cycleLabel}: close-feature should block while claim active`);

  const release = releasePacket(fixtureRoot, "operator-e2e-client");
  assert.strictEqual(release.success, true, `${cycleLabel}: release should recover interrupted close transition`);

  writeFile(path.join(fixtureRoot, `${cycleLabel}-WORK.md`), `${cycleLabel} operator work\n`);
  writeVerifyEvidence(fixtureRoot, activePacket);
  appendCompletionSignal(fixtureRoot, activePacket);

  const closeResult = await runLifecycle(fixtureRoot, ["close-feature"]);
  assert.strictEqual(closeResult, 0, `${cycleLabel}: close-feature should pass with dirty active work`);

  const dirtyAfterClose = checkWorkspaceCleanliness(fixtureRoot);
  assert.strictEqual(dirtyAfterClose.clean, false, `${cycleLabel}: close-feature should leave explicit dirty state`);

  return {
    packetPath,
    packetId: activePacket,
    dirtyAfterClose,
  };
}

async function main() {
  const fixture = initializeFixture();

  try {
    console.log(`[${TEST_NAME}] Running`);

    const firstCycle = await runCycle(fixture, "cycle-one");

    const blockedStartSecond = await runLifecycle(fixture, ["activate-latest"]);
    assert.strictEqual(
      blockedStartSecond,
      1,
      "activation should remain blocked after close-feature until operator commits lifecycle-owned artifacts"
    );

    commitFixtureFiles(fixture, "fixture: commit cycle-one close artifacts");

    const secondPacketPath = writeInboxPacket(fixture, "cycle-two.sdc.md", "Operator cycle-two");
    commitFixtureFiles(fixture, "fixture: add cycle-two candidate");

    const intakeTwo = await runLifecycle(fixture, ["intake-latest"]);
    assert.strictEqual(intakeTwo, 0, "cycle-two intake should pass");
    commitFixtureFiles(fixture, "fixture: commit cycle-two intake artifacts");

    const activateTwo = await runLifecycle(fixture, ["activate-latest"]);
    assert.strictEqual(activateTwo, 0, "cycle-two activation should pass");

    const packetTwo = getInFlightPacket(fixture);
    assert.ok(packetTwo, "cycle-two packet should be active");

    // Verify-evidence ownership semantics: stale evidence from previous packet must fail close-feature.
    const staleEvidenceClose = await runLifecycle(fixture, ["close-feature"]);
    assert.strictEqual(staleEvidenceClose, 1, "cycle-two close-feature should fail on stale verify evidence ownership");

    writeVerifyEvidence(fixture, packetTwo);
    appendCompletionSignal(fixture, packetTwo);

    const closeTwo = await runLifecycle(fixture, ["close-feature"]);
    assert.strictEqual(closeTwo, 0, "cycle-two close-feature should pass with packet-owned verify evidence");

    assert.strictEqual(
      fs.existsSync(secondPacketPath),
      false,
      "consumed inbox candidate should be removed after successful close-feature cleanup"
    );

    console.log(`[${TEST_NAME}] PASS`);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack || error.message);
  process.exit(1);
});
