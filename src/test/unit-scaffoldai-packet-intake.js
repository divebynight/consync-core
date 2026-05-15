"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { intakePacket } = require("../lib/scaffoldaiPacketIntake.auth.scaffoldai");
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
  const incomingDir = path.join(fixture, "incoming");

  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(contractsDir, { recursive: true });
  fs.mkdirSync(packetsDir, { recursive: true });
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

  return fixture;
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
      console.log("  PASS: missing sections rejected");
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
      console.log("  PASS: blocked authority requests rejected");
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

    // 8. --activate activates accepted packet
    {
      const sourcePath = writeIncomingPacket(
        fixture,
        "activate.md",
        validPacketContent().replace("Add Strict Intake Validation", "Activate Intake Packet")
      );

      runScaffoldaiPacketCommand(["intake", sourcePath, "--activate"], { repoRoot: fixture });
      assert.strictEqual(getInFlightPacket(fixture), "activate-intake-packet.sdc");
      console.log("  PASS: --activate activates accepted packet");
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