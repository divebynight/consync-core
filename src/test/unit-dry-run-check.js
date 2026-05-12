const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { applyGatekeeperRules } = require("../lib/gatekeeperDecision.auth.scaffoldai");
const { getInFlightPacket } = require("../lib/getInFlightPacket");

const TEST_NAME = "unit-dry-run-check";

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack);
  process.exit(1);
}

const BASE_CONTRACT = {
  mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
  allowed_packet_types: ["process", "contract", "planning"],
  blocked_packet_types: ["product", "agent"],
  in_flight_packet: null,
  require_clean_git: true,
  require_dry_run: true,
};

function test(description, input, expectedDecision) {
  const result = applyGatekeeperRules(input, BASE_CONTRACT);

  assert.strictEqual(
    result.decision,
    expectedDecision,
    `[${description}] expected decision "${expectedDecision}" but got "${result.decision}"`
  );

  console.log(`  PASS: ${description}`);
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  try {
    // 1. Product packet while product is blocked → BLOCK
    test(
      "product packet blocked by mode lock",
      {
        requestType: "SDC",
        packetId: "some-product-feature-v1",
        packetType: "product",
        gitStatus: "clean",
        inFlightPacket: null,
        mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
      },
      "BLOCK"
    );

    // 2. Process packet while process is allowed → ALLOW
    test(
      "process packet allowed by mode lock",
      {
        requestType: "SDC",
        packetId: "dry-run-check-command-v1",
        packetType: "process",
        gitStatus: "clean",
        inFlightPacket: null,
        mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
      },
      "ALLOW"
    );

    // 3. Dirty git + SDC → CLOSEOUT_REQUIRED
    test(
      "dirty git blocks new SDC",
      {
        requestType: "SDC",
        packetId: "planning-notes-v1",
        packetType: "planning",
        gitStatus: "dirty",
        inFlightPacket: null,
        mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
      },
      "CLOSEOUT_REQUIRED"
    );

    // 4. CLOSEOUT while dirty → ALLOW
    test(
      "CLOSEOUT allowed despite dirty git",
      {
        requestType: "CLOSEOUT",
        packetId: "dry-run-check-command-v1",
        packetType: "process",
        gitStatus: "dirty",
        inFlightPacket: "dry-run-check-command-v1",
        mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
      },
      "ALLOW"
    );

    // 5. In-flight packet + new SDC → CLOSEOUT_REQUIRED
    test(
      "in-flight packet blocks new SDC",
      {
        requestType: "SDC",
        packetId: "packet-state-tracking-v1",
        packetType: "contract",
        gitStatus: "clean",
        inFlightPacket: "dry-run-check-command-v1",
        mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
      },
      "CLOSEOUT_REQUIRED"
    );

    // 6. DRY_RUN request → ALLOW
    test(
      "DRY_RUN request always allowed",
      {
        requestType: "DRY_RUN",
        packetId: "some-product-feature-v1",
        packetType: "product",
        gitStatus: "dirty",
        inFlightPacket: "some-other-packet",
        mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
      },
      "ALLOW"
    );

    // 7. Agent packet blocked → BLOCK
    test(
      "agent packet blocked by mode lock",
      {
        requestType: "SDC",
        packetId: "some-agent-scaffold-v1",
        packetType: "agent",
        gitStatus: "clean",
        inFlightPacket: null,
        mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
      },
      "BLOCK"
    );

    // 8. RECOVERY passthrough → ALLOW
    test(
      "RECOVERY request always allowed",
      {
        requestType: "RECOVERY",
        packetId: "fix-broken-state-v1",
        packetType: "process",
        gitStatus: "dirty",
        inFlightPacket: null,
        mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
      },
      "ALLOW"
    );

    // 9. Supersede with in-flight → SUPERSEDE_REQUIRES_APPROVAL
    test(
      "SUPERSEDE with in-flight packet requires approval",
      {
        requestType: "SUPERSEDE",
        packetId: "replacement-packet-v1",
        packetType: "process",
        gitStatus: "clean",
        inFlightPacket: "dry-run-check-command-v1",
        mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
      },
      "SUPERSEDE_REQUIRES_APPROVAL"
    );

    // --- State source tests ---

    // 10. Dry-run CLI without --in-flight-packet reads in-flight from next-action.md (PACKAGE:)
    (function testStateReadPackage() {
      const repoRoot = path.resolve(__dirname, "..", "..");
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-drc-"));

      try {
        const stateDir = path.join(tempDir, ".scaffoldai", "state");
        fs.mkdirSync(stateDir, { recursive: true });

        // Write a minimal active-contract.json
        fs.writeFileSync(
          path.join(stateDir, "active-contract.json"),
          JSON.stringify({
            mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
            allowed_packet_types: ["process", "contract", "planning"],
            blocked_packet_types: ["product", "agent"],
            in_flight_packet: null,
            require_clean_git: true,
            require_dry_run: true,
          }),
          "utf8"
        );

        // Write next-action.md with PACKAGE: pattern
        fs.writeFileSync(
          path.join(stateDir, "next-action.md"),
          "TYPE: FEATURE\nPACKAGE: active-state-packet-v1\n\nGOAL:\n\nSome work.\n",
          "utf8"
        );

        const result = spawnSync(
          process.execPath,
          [path.join(repoRoot, "src", "index.js"), "dry-run-check",
            "--request-type=SDC", "--packet-type=contract",
            "--packet-id=new-packet-v1", "--git-status=clean"],
          { cwd: tempDir, encoding: "utf8" }
        );

        assert.ok(
          result.stdout.includes("active-state-packet-v1"),
          `Expected in-flight packet from state to appear in report. Got stdout:\n${result.stdout}\nGot stderr:\n${result.stderr}`
        );
        assert.ok(
          result.stdout.includes("CLOSEOUT_REQUIRED"),
          `Expected CLOSEOUT_REQUIRED because state shows an in-flight packet. Got:\n${result.stdout}`
        );
        assert.ok(
          result.stdout.includes("(state)"),
          `Expected source annotation "(state)" in report. Got:\n${result.stdout}`
        );
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }

      console.log("  PASS: dry-run reads in-flight from state (PACKAGE: pattern)");
    })();

    // 11. Dry-run CLI without --in-flight-packet reads in-flight from next-action.md (PACKET_ID:)
    (function testStateReadPacketId() {
      const repoRoot = path.resolve(__dirname, "..", "..");
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-drc-"));

      try {
        const stateDir = path.join(tempDir, ".scaffoldai", "state");
        fs.mkdirSync(stateDir, { recursive: true });

        fs.writeFileSync(
          path.join(stateDir, "active-contract.json"),
          JSON.stringify({
            mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
            allowed_packet_types: ["process", "contract", "planning"],
            blocked_packet_types: ["product", "agent"],
            in_flight_packet: null,
            require_clean_git: true,
            require_dry_run: true,
          }),
          "utf8"
        );

        fs.writeFileSync(
          path.join(stateDir, "next-action.md"),
          "TYPE: FEATURE\nPACKET_ID: packet-id-from-state-v1\n\nGOAL:\n\nSome work.\n",
          "utf8"
        );

        const result = spawnSync(
          process.execPath,
          [path.join(repoRoot, "src", "index.js"), "dry-run-check",
            "--request-type=SDC", "--packet-type=contract",
            "--packet-id=new-packet-v1", "--git-status=clean"],
          { cwd: tempDir, encoding: "utf8" }
        );

        assert.ok(
          result.stdout.includes("packet-id-from-state-v1"),
          `Expected in-flight packet from state to appear in report. Got:\n${result.stdout}`
        );
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }

      console.log("  PASS: dry-run reads in-flight from state (PACKET_ID: pattern)");
    })();

    // 12. CLI override wins over state
    (function testCliOverrideWins() {
      const repoRoot = path.resolve(__dirname, "..", "..");
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-drc-"));

      try {
        const stateDir = path.join(tempDir, ".scaffoldai", "state");
        fs.mkdirSync(stateDir, { recursive: true });

        fs.writeFileSync(
          path.join(stateDir, "active-contract.json"),
          JSON.stringify({
            mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
            allowed_packet_types: ["process", "contract", "planning"],
            blocked_packet_types: ["product", "agent"],
            in_flight_packet: null,
            require_clean_git: true,
            require_dry_run: true,
          }),
          "utf8"
        );

        fs.writeFileSync(
          path.join(stateDir, "next-action.md"),
          "TYPE: FEATURE\nPACKAGE: state-packet-id\n",
          "utf8"
        );

        const result = spawnSync(
          process.execPath,
          [path.join(repoRoot, "src", "index.js"), "dry-run-check",
            "--request-type=SDC", "--packet-type=contract",
            "--packet-id=new-packet-v1", "--git-status=clean",
            "--in-flight-packet=cli-override-packet"],
          { cwd: tempDir, encoding: "utf8" }
        );

        assert.ok(
          result.stdout.includes("cli-override-packet"),
          `Expected CLI override packet to appear in report. Got:\n${result.stdout}`
        );
        assert.ok(
          !result.stdout.includes("state-packet-id"),
          `Expected state value to be suppressed by CLI override. Got:\n${result.stdout}`
        );
        assert.ok(
          result.stdout.includes("(cli-override)"),
          `Expected source annotation "(cli-override)" in report. Got:\n${result.stdout}`
        );
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }

      console.log("  PASS: CLI override wins over state");
    })();

    // 13. No next-action file → in-flight is null → ALLOW for clean allowed packet
    (function testNoStateFile() {
      const repoRoot = path.resolve(__dirname, "..", "..");
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-drc-"));

      try {
        const stateDir = path.join(tempDir, ".scaffoldai", "state");
        fs.mkdirSync(stateDir, { recursive: true });

        fs.writeFileSync(
          path.join(stateDir, "active-contract.json"),
          JSON.stringify({
            mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
            allowed_packet_types: ["process", "contract", "planning"],
            blocked_packet_types: ["product", "agent"],
            in_flight_packet: null,
            require_clean_git: true,
            require_dry_run: true,
          }),
          "utf8"
        );

        // No next-action.md written

        const result = spawnSync(
          process.execPath,
          [path.join(repoRoot, "src", "index.js"), "dry-run-check",
            "--request-type=SDC", "--packet-type=contract",
            "--packet-id=new-packet-v1", "--git-status=clean"],
          { cwd: tempDir, encoding: "utf8" }
        );

        assert.ok(
          result.stdout.includes("In-flight packet:        none"),
          `Expected "none" when no next-action.md. Got:\n${result.stdout}`
        );
        assert.ok(
          result.stdout.includes("ALLOW"),
          `Expected ALLOW when no in-flight packet. Got:\n${result.stdout}`
        );
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }

      console.log("  PASS: no next-action file treats in-flight as null");
    })();

    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  }
}

main();
