"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  activatePacket,
  clearActivePacket,
} = require("../lib/scaffoldaiPacketActivation.auth.scaffoldai");
const { getInFlightPacket } = require("../lib/getInFlightPacket.query.scaffoldai");
const { gatherStatus } = require("../lib/scaffoldaiStatus.query.scaffoldai");
const { gatherPacketVisibility } = require("../lib/scaffoldaiPacketVisibility.query.scaffoldai");

const TEST_NAME = "unit-scaffoldai-packet-activation";
const repoRoot = path.resolve(__dirname, "..", "..");
const tempRoot = path.join(repoRoot, ".scaffoldai", "tmp");

function createFixtureRepo() {
  fs.mkdirSync(tempRoot, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(tempRoot, "packet-activation-"));

  const stateDir = path.join(fixture, ".scaffoldai", "state");
  const contractsDir = path.join(fixture, ".scaffoldai", "contracts");
  const packetsDir = path.join(fixture, ".scaffoldai", "packets");

  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(contractsDir, { recursive: true });
  fs.mkdirSync(packetsDir, { recursive: true });

  fs.writeFileSync(
    path.join(stateDir, "next-action.md"),
    [
      "TYPE: REFACTOR",
      "PACKAGE: NONE",
      "",
      "No active packet.",
      "",
    ].join("\n"),
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
    [
      "ACTIVE STREAM",
      "",
      "process",
      "",
    ].join("\n"),
    "utf8"
  );

  fs.writeFileSync(
    path.join(stateDir, "snapshot.md"),
    [
      "# Snapshot",
      "",
      "## Current Package",
      "",
      "- type: `REFACTOR`",
      "- package: `NONE`",
      "",
    ].join("\n"),
    "utf8"
  );

  fs.writeFileSync(path.join(packetsDir, "README.md"), "# Packet docs\n", "utf8");
  fs.writeFileSync(
    path.join(packetsDir, "alpha-process.sdc.md"),
    [
      "# Alpha Process Packet",
      "",
      "MODE: PROCESS_REFACTOR",
      "",
      "GOAL:",
      "Validate packet activation.",
      "",
    ].join("\n"),
    "utf8"
  );

  return fixture;
}

function cleanupFixtureRepo(fixturePath) {
  fs.rmSync(fixturePath, { recursive: true, force: true });
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  const fixture = createFixtureRepo();

  try {
    // 1) Valid activation writes authoritative pointer and extracts metadata.
    {
      const result = activatePacket(fixture, "alpha-process.sdc.md");

      assert.strictEqual(result.packet_id, "alpha-process.sdc", "packet id should derive from filename stem");
      assert.strictEqual(result.title, "Alpha Process Packet", "title should be extracted from markdown heading");
      assert.strictEqual(result.category, "process", "category should derive from MODE prefix");

      const runtime = JSON.parse(
        fs.readFileSync(path.join(fixture, ".scaffoldai", "state", "active-runtime.json"), "utf8")
      );
      assert.strictEqual(runtime.in_flight_packet, "alpha-process.sdc", "active-runtime should store in-flight packet");

      const policy = JSON.parse(
        fs.readFileSync(path.join(fixture, ".scaffoldai", "contracts", "active-policy.json"), "utf8")
      );
      assert.strictEqual(policy.mode, "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN", "active-policy should remain stable during activation");
      assert.strictEqual(getInFlightPacket(fixture), "alpha-process.sdc", "next-action pointer should match in-flight packet");

      const historyPath = path.join(fixture, ".scaffoldai", "state", "history.jsonl");
      assert.ok(fs.existsSync(historyPath), "history append should run for activation");
      console.log("  PASS: valid activation writes pointer and metadata");
    }

    // 2) Missing packet rejects activation.
    {
      assert.throws(
        () => activatePacket(fixture, "missing-packet"),
        /packet not found:/,
        "missing packet should be rejected"
      );
      console.log("  PASS: invalid or missing packet is rejected");
    }

    // 3) Path traversal / outside path is rejected.
    {
      fs.writeFileSync(path.join(fixture, "outside.md"), "# outside\n", "utf8");

      assert.throws(
        () => activatePacket(fixture, "../outside.md"),
        /must stay under \.scaffoldai\/packets\//,
        "path traversal should be rejected"
      );

      assert.throws(
        () => activatePacket(fixture, path.join(fixture, "outside.md")),
        /must stay under \.scaffoldai\/packets\//,
        "absolute outside path should be rejected"
      );
      console.log("  PASS: outside packet paths are rejected");
    }

    // 4) Clear clears only pointer, keeps packet files.
    {
      const clearResult = clearActivePacket(fixture);

      assert.strictEqual(clearResult.previous_packet, "alpha-process.sdc", "clear should report previous packet");
      assert.strictEqual(getInFlightPacket(fixture), null, "clear should remove next-action pointer");

      const runtime = JSON.parse(
        fs.readFileSync(path.join(fixture, ".scaffoldai", "state", "active-runtime.json"), "utf8")
      );
      assert.strictEqual(runtime.in_flight_packet, null, "clear should null active-runtime pointer");

      const packetPath = path.join(fixture, ".scaffoldai", "packets", "alpha-process.sdc.md");
      assert.ok(fs.existsSync(packetPath), "clear must not delete packet files");
      console.log("  PASS: clear behavior only clears active pointer");
    }

    // 5) MCP-facing status and packet visibility stay consistent.
    {
      activatePacket(fixture, "alpha-process.sdc.md");

      const status = gatherStatus(fixture, { includeGit: false });
      const visibility = gatherPacketVisibility(fixture, { scope: "in_flight" });

      assert.strictEqual(status.data.active_packet, "alpha-process.sdc", "status should report active packet");
      assert.strictEqual(visibility.data.in_flight_packet, "alpha-process.sdc", "packet visibility should report same packet");
      assert.strictEqual(visibility.data.packet_count, 1, "in_flight visibility should return one packet");
      assert.strictEqual(visibility.data.packets[0].in_flight_relation, "active", "packet visibility relation should be active");
      console.log("  PASS: MCP visibility and status are consistent");
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
