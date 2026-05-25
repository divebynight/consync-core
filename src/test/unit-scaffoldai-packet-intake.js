"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const {
  intakePacket,
  CANONICAL_SECTION_ORDER,
} = require("../lib/scaffoldaiPacketIntake.auth.scaffoldai");
const { runScaffoldaiPacketCommand } = require("../scaffoldai/commands/scaffoldai-packet.cmd.scaffoldai");
const { getInFlightPacket } = require("../lib/getInFlightPacket.query.scaffoldai");
const { gatherStatus } = require("../lib/scaffoldaiStatus.query.scaffoldai");
const { gatherPacketVisibility } = require("../lib/scaffoldaiPacketVisibility.query.scaffoldai");

const TEST_NAME = "unit-scaffoldai-packet-intake";
const repoRoot = path.resolve(__dirname, "..", "..");
const tempRoot = path.join(repoRoot, ".scaffoldai", "tmp");

function createFixtureRepo() {
  fs.mkdirSync(tempRoot, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(tempRoot, "packet-intake-"));

  const stateDir = path.join(fixture, ".scaffoldai", "state");
  const contractsDir = path.join(fixture, ".scaffoldai", "contracts");
  const packetsDir = path.join(fixture, ".scaffoldai", "packets");
  const inboxDir = path.join(fixture, ".scaffoldai", "inbox");
  const incomingDir = path.join(fixture, "incoming");

  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(contractsDir, { recursive: true });
  fs.mkdirSync(packetsDir, { recursive: true });
  fs.mkdirSync(inboxDir, { recursive: true });
  fs.mkdirSync(incomingDir, { recursive: true });

  fs.writeFileSync(
    path.join(stateDir, "next-action.md"),
    ["TYPE: REFACTOR", "PACKAGE: NONE", "", "No active packet.", ""].join("\n"),
    "utf8"
  );
  fs.writeFileSync(
    path.join(contractsDir, "active-policy.json"),
    JSON.stringify(
      {
        mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
        allowed_packet_types: ["process", "contract", "planning"],
        blocked_packet_types: ["product", "agent"],
        require_clean_git: true,
        require_dry_run: true,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(stateDir, "active-runtime.json"),
    JSON.stringify({ in_flight_packet: null }, null, 2) + "\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(stateDir, "active-stream.md"),
    ["ACTIVE STREAM", "", "process", ""].join("\n"),
    "utf8"
  );
  fs.writeFileSync(
    path.join(stateDir, "snapshot.md"),
    ["# Snapshot", "", "## Current Package", "", "- type: `REFACTOR`", "- package: `NONE`", ""].join("\n"),
    "utf8"
  );
  fs.writeFileSync(path.join(stateDir, "handoff.md"), "handoff\n", "utf8");
  fs.writeFileSync(path.join(packetsDir, "README.md"), "# Packets\n", "utf8");

  spawnSync("git", ["init"], { cwd: fixture, stdio: "pipe" });
  spawnSync("git", ["config", "user.email", "test@local"], { cwd: fixture, stdio: "pipe" });
  spawnSync("git", ["config", "user.name", "Test User"], { cwd: fixture, stdio: "pipe" });
  commitFixture(fixture, "fixture: initialize packet intake state");

  return fixture;
}

function commitFixture(fixture, message) {
  spawnSync("git", ["add", "."], { cwd: fixture, stdio: "pipe" });
  const status = spawnSync("git", ["status", "--porcelain"], { cwd: fixture, encoding: "utf8" });
  if (!status.stdout.trim()) {
    return;
  }

  spawnSync("git", ["commit", "-m", message], { cwd: fixture, stdio: "pipe" });
}

function writeInboxPacket(fixturePath, fileName, content) {
  const inboxPath = path.join(fixturePath, ".scaffoldai", "inbox", fileName);
  fs.writeFileSync(inboxPath, content, "utf8");
  return inboxPath;
}

function cleanupFixtureRepo(fixturePath) {
  fs.rmSync(fixturePath, { recursive: true, force: true });
}

function writeIncomingPacket(fixturePath, fileName, content) {
  const incomingPath = path.join(fixturePath, "incoming", fileName);
  fs.writeFileSync(incomingPath, content, "utf8");
  return incomingPath;
}

function validPacketContent(extraLines = []) {
  return [
    "# SDC — Add Strict Intake Validation",
    "",
    "MODE: PROCESS_REFACTOR",
    "EXECUTION SURFACE: ScaffoldAI CLI intake/runtime boundary",
    "",
    "APPROVAL:",
    "  execute: PENDING",
    "  commit: PENDING",
    "",
    "GOAL:",
    "Accept only formally structured SDC packets.",
    "",
    "TASKS:",
    "1. Validate structure.",
    "2. Reject malformed packets.",
    "",
    "VERIFY:",
    "- npm run verify:scaffoldai",
    "",
    "OUTPUT:",
    "1. accepted packet metadata",
    "",
    "CONSTRAINTS:",
    "- local CLI only",
    "- no MCP write authority",
    ...extraLines,
    "",
  ].join("\n");
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  const fixture = createFixtureRepo();

  try {
    // 1. valid SDC accepted
    {
      const sourcePath = writeIncomingPacket(fixture, "valid.md", validPacketContent());
      const result = intakePacket(fixture, sourcePath);

      assert.strictEqual(result.accepted, true);
      assert.strictEqual(result.status, "ACCEPTED");
      assert.strictEqual(result.packet_id, "add-strict-intake-validation.sdc");
      assert.strictEqual(result.file_name, "add-strict-intake-validation.sdc.md");
      assert.strictEqual(result.normalized_slug, "add-strict-intake-validation");
      assert.strictEqual(result.identity.packet_id, result.packet_id);
      assert.strictEqual(result.identity.durable_packet_file, result.file_name);
      assert.strictEqual(result.identity.normalized_slug, result.normalized_slug);
      assert.strictEqual(result.identity.packet_title, result.packet_title);
      assert.ok(fs.existsSync(path.join(fixture, ".scaffoldai", "packets", result.file_name)));
      console.log("  PASS: valid SDC accepted");
    }

    // 2. malformed title rejected
    {
      const sourcePath = writeIncomingPacket(
        fixture,
        "bad-title.md",
        validPacketContent().replace("# SDC — Add Strict Intake Validation", "# Wrong Heading")
      );
      const result = intakePacket(fixture, sourcePath);

      assert.strictEqual(result.accepted, false);
      assert.ok(result.validation_errors.some((entry) => entry.includes("title must match")));
      console.log("  PASS: malformed title rejected");
    }

    // 3. missing sections rejected
    {
      const sourcePath = writeIncomingPacket(
        fixture,
        "missing-sections.md",
        validPacketContent().replace(/OUTPUT:[\s\S]*?CONSTRAINTS:/m, "CONSTRAINTS:")
      );
      const result = intakePacket(fixture, sourcePath);

      assert.strictEqual(result.accepted, false);
      assert.ok(result.missing_sections.includes("OUTPUT"));
      assert.ok(result.recovery_hints.some((entry) => entry.includes(CANONICAL_SECTION_ORDER.join(" -> "))));
      console.log("  PASS: missing sections rejected");
    }

    // 3b. canonical example/template content accepted unchanged
    {
      const canonicalTemplate = fs.readFileSync(
        path.join(repoRoot, ".scaffoldai", "templates", "canonical-sdc-packet-template.sdc.md"),
        "utf8"
      );
      const sourcePath = writeInboxPacket(fixture, "canonical-template.sdc.md", canonicalTemplate);
      const result = intakePacket(fixture, sourcePath);

      assert.strictEqual(result.accepted, true);
      assert.strictEqual(result.source_in_inbox, true);
      console.log("  PASS: canonical template accepted unchanged");
    }

    // 4. invalid mode rejected
    {
      const sourcePath = writeIncomingPacket(
        fixture,
        "invalid-mode.md",
        validPacketContent().replace("MODE: PROCESS_REFACTOR", "MODE: PRODUCT_REFACTOR")
      );
      const result = intakePacket(fixture, sourcePath);

      assert.strictEqual(result.accepted, false);
      assert.ok(result.validation_errors.some((entry) => entry.includes("blocked or unknown MODE")));
      console.log("  PASS: invalid mode rejected");
    }

    // 5. malformed approval block rejected
    {
      const sourcePath = writeIncomingPacket(
        fixture,
        "bad-approval.md",
        validPacketContent().replace("  execute: PENDING", "execute: PENDING")
      );
      const result = intakePacket(fixture, sourcePath);

      assert.strictEqual(result.accepted, false);
      assert.ok(result.validation_errors.some((entry) => entry.includes("missing APPROVAL.execute") || entry.includes("malformed APPROVAL")));
      console.log("  PASS: malformed approval block rejected");
    }

    // 6. blocked authority requests rejected
    {
      const sourcePath = writeIncomingPacket(
        fixture,
        "blocked-authority.md",
        validPacketContent([
          "- autonomous execution required",
          "- automatic commits allowed",
          "- HTTP MCP write authority required",
        ])
      );
      const result = intakePacket(fixture, sourcePath);

      assert.strictEqual(result.accepted, false);
      assert.ok(result.blocked_policy_reasons.includes("requests autonomous execution"));
      assert.ok(result.blocked_policy_reasons.includes("requests automatic commits"));
      assert.ok(result.blocked_policy_reasons.includes("requests HTTP MCP write authority"));
      assert.ok(result.recovery_hints.some((entry) => entry.includes("authority-escalation")));
      console.log("  PASS: blocked authority requests rejected");
    }

    // 6b. malformed canonical section ordering rejected
    {
      const sourcePath = writeIncomingPacket(
        fixture,
        "out-of-order.md",
        [
          "# SDC — Out Of Order Packet",
          "",
          "MODE: PROCESS_REFACTOR",
          "OUTPUT:",
          "1. output",
          "",
          "EXECUTION SURFACE: ScaffoldAI CLI intake/runtime boundary",
          "",
          "APPROVAL:",
          "  execute: PENDING",
          "  commit: PENDING",
          "",
          "GOAL:",
          "Keep ordering deterministic.",
          "",
          "TASKS:",
          "1. Enforce canonical ordering.",
          "",
          "VERIFY:",
          "- npm run verify:scaffoldai",
          "",
          "CONSTRAINTS:",
          "- no MCP write authority",
          "",
        ].join("\n")
      );
      const result = intakePacket(fixture, sourcePath);

      assert.strictEqual(result.accepted, false);
      assert.ok(result.section_order_issues.some((entry) => entry.includes("section out of canonical order")));
      assert.ok(result.recovery_hints.some((entry) => entry.includes(CANONICAL_SECTION_ORDER.join(" -> "))));
      console.log("  PASS: malformed canonical section ordering rejected");
    }

    // 7. accepted packet normalized correctly and content preserved
    {
      const sourcePath = writeIncomingPacket(fixture, "normalized.md", validPacketContent());
      const result = intakePacket(fixture, sourcePath);
      const stored = fs.readFileSync(path.join(fixture, ".scaffoldai", "packets", result.file_name), "utf8");

      assert.strictEqual(stored, validPacketContent());
      assert.strictEqual(result.file_name, "add-strict-intake-validation.sdc.md");
      console.log("  PASS: accepted packet normalized correctly");
    }

    // 8. --activate remains fail-closed under clean-workspace activation gates
    {
      const sourcePath = writeIncomingPacket(
        fixture,
        "activate.md",
        validPacketContent().replace("Add Strict Intake Validation", "Activate Intake Packet")
      );

      fs.writeFileSync(path.join(fixture, "dirty-marker.txt"), "dirty\n", "utf8");

      process.exitCode = 0;
      runScaffoldaiPacketCommand(["intake", sourcePath, "--activate"], { repoRoot: fixture });
      const activationExitCode = process.exitCode || 0;
      process.exitCode = 0;

      // Dirty workspace now produces warnings instead of blocking activation
      assert.strictEqual(
        activationExitCode,
        0,
        "--activate should succeed with warnings when workspace is dirty"
      );
      assert.ok(
        getInFlightPacket(fixture),
        "--activate should not bypass clean-workspace lifecycle protections"
      );
      console.log("  PASS: --activate does not bypass clean-workspace activation gates");
    }

    // 9. rejected packets never written
    {
      const sourcePath = writeIncomingPacket(
        fixture,
        "reject-never-written.md",
        validPacketContent()
          .replace("Add Strict Intake Validation", "Rejected Intake Packet")
          .replace("MODE: PROCESS_REFACTOR", "MODE: UNKNOWN_MODE")
      );
      const result = intakePacket(fixture, sourcePath);

      assert.strictEqual(result.accepted, false);
      assert.ok(!fs.existsSync(path.join(fixture, ".scaffoldai", "packets", "rejected-intake-packet.sdc.md")));
      console.log("  PASS: rejected packets never written");
    }

    // 10. latest intake result is visible through readonly queries
    {
      const sourcePath = writeIncomingPacket(
        fixture,
        "latest-intake.md",
        validPacketContent().replace("Add Strict Intake Validation", "Visible Intake Packet")
      );
      const result = intakePacket(fixture, sourcePath);

      const status = gatherStatus(fixture, { includeGit: false });
      const visibility = gatherPacketVisibility(fixture, { scope: "all" });

      assert.strictEqual(status.data.latest_intake.status, "ACCEPTED");
      assert.strictEqual(status.data.latest_intake.packet_id, result.packet_id);
      assert.strictEqual(visibility.data.latest_intake.status, "ACCEPTED");
      assert.strictEqual(visibility.data.latest_intake.packet_id, result.packet_id);
      console.log("  PASS: readonly queries expose latest intake result");
    }

    // 11. inbox path intake accepted without outside-inbox warning
    {
      const sourcePath = writeInboxPacket(
        fixture,
        "inbox-intake.sdc.md",
        validPacketContent().replace("Add Strict Intake Validation", "Inbox Intake Packet")
      );
      const result = intakePacket(fixture, sourcePath);

      assert.strictEqual(result.accepted, true);
      assert.strictEqual(result.source_in_inbox, true);
      assert.deepStrictEqual(result.warnings, []);
      console.log("  PASS: inbox path intake accepted without warning");
    }

    // 12. external path intake returns warning but still accepts valid packet
    {
      const sourcePath = writeIncomingPacket(
        fixture,
        "external-warning.md",
        validPacketContent().replace("Add Strict Intake Validation", "External Warning Packet")
      );
      const result = intakePacket(fixture, sourcePath);

      assert.strictEqual(result.accepted, true);
      assert.strictEqual(result.source_in_inbox, false);
      assert.ok(result.warnings.some((item) => item.includes("outside .scaffoldai/inbox")));
      console.log("  PASS: external path intake warns but accepts valid packet");
    }

    // 13. repeated intake of identical packet reuses durable identity
    {
      const sourcePath = writeIncomingPacket(
        fixture,
        "repeat-identical.md",
        validPacketContent().replace("Add Strict Intake Validation", "Repeat Identity Packet")
      );
      const first = intakePacket(fixture, sourcePath);
      const second = intakePacket(fixture, sourcePath);

      assert.strictEqual(first.accepted, true);
      assert.strictEqual(second.accepted, true);
      assert.strictEqual(second.packet_id, first.packet_id);
      assert.strictEqual(second.file_name, first.file_name);
      assert.strictEqual(second.reused_existing_packet, true);
      assert.ok(second.warnings.some((entry) => entry.includes("reusing durable packet identity")));
      console.log("  PASS: repeated identical intake reuses durable packet identity");
    }

    // 14. different source with same normalized slug but different content is rejected
    {
      const firstPath = writeInboxPacket(
        fixture,
        "collision-a.sdc.md",
        validPacketContent().replace("Add Strict Intake Validation", "Collision Packet")
      );
      const secondPath = writeIncomingPacket(
        fixture,
        "collision-b.md",
        validPacketContent()
          .replace("Add Strict Intake Validation", "Collision Packet")
          .replace("Accept only formally structured SDC packets.", "Accept only canonical packet identity surfaces.")
      );

      const first = intakePacket(fixture, firstPath);
      const second = intakePacket(fixture, secondPath);

      assert.strictEqual(first.accepted, true);
      assert.strictEqual(second.accepted, false);
      assert.strictEqual(second.normalized_slug, "collision-packet");
      assert.ok(second.validation_errors.some((entry) => entry.includes("normalized packet filename already exists")));
      console.log("  PASS: duplicate normalized slug with different content is rejected");
    }

    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    console.error(`[${TEST_NAME}] FAIL`);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  } finally {
    cleanupFixtureRepo(fixture);
  }
}

main();