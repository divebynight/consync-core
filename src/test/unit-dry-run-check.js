const assert = require("assert");
const { applyGatekeeperRules } = require("../lib/gatekeeperDecision");

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

    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  }
}

main();
