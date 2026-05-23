"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const scaffoldaiState = require("../lib/scaffoldaiState.state.scaffoldai");

const TEST_NAME = "unit-scaffoldai-policy-runtime";
const repoRoot = path.resolve(__dirname, "..", "..");
const tempRoot = path.join(repoRoot, ".scaffoldai", "tmp");

function main() {
  console.log(`[${TEST_NAME}] Running`);

  fs.mkdirSync(tempRoot, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(tempRoot, "policy-runtime-"));

  try {
    const contractsDir = path.join(fixture, ".scaffoldai", "contracts");
    const stateDir = path.join(fixture, ".scaffoldai", "state");

    fs.mkdirSync(contractsDir, { recursive: true });
    fs.mkdirSync(stateDir, { recursive: true });

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
      JSON.stringify({ in_flight_packet: "policy-runtime-slice.sdc" }, null, 2) + "\n",
      "utf8"
    );

    const composed = scaffoldaiState.readActiveContract(fixture);
    assert.strictEqual(composed.mode, "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN");
    assert.strictEqual(composed.in_flight_packet, "policy-runtime-slice.sdc");
    console.log("  PASS: readActiveContract composes durable policy and runtime state");

    scaffoldaiState.writeActiveRuntime(fixture, { in_flight_packet: null });

    const policyAfterRuntimeWrite = JSON.parse(
      fs.readFileSync(path.join(contractsDir, "active-policy.json"), "utf8")
    );
    assert.strictEqual(
      policyAfterRuntimeWrite.mode,
      "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
      "runtime writes must not rewrite durable policy"
    );

    const runtimeAfterWrite = scaffoldaiState.readActiveRuntime(fixture);
    assert.strictEqual(runtimeAfterWrite.in_flight_packet, null);
    console.log("  PASS: runtime updates do not mutate active policy");

    console.log(`[${TEST_NAME}] PASS`);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

main();