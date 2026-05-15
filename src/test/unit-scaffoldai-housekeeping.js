"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const {
  gatherHousekeepingStatus,
  resetRuntimeState,
  parseGitStatusPath,
} = require("../lib/scaffoldaiHousekeeping.auth.scaffoldai");
const { getInFlightPacket } = require("../lib/getInFlightPacket.query.scaffoldai");

const TEST_NAME = "unit-scaffoldai-housekeeping";
const repoRoot = path.resolve(__dirname, "..", "..");
const cliPath = path.join(repoRoot, "src", "scaffoldai.js");
const tempRoot = path.join(repoRoot, ".scaffoldai", "tmp");

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack || error.message);
  process.exit(1);
}

function createFixtureRepo() {
  fs.mkdirSync(tempRoot, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(tempRoot, "housekeeping-"));

  const stateDir = path.join(fixture, ".scaffoldai", "state");
  const contractsDir = path.join(fixture, ".scaffoldai", "contracts");
  const packetsDir = path.join(fixture, ".scaffoldai", "packets");
  const runtimeDir = path.join(fixture, ".scaffoldai", "runtime", "mcp");
  const srcDir = path.join(fixture, "src");

  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(contractsDir, { recursive: true });
  fs.mkdirSync(packetsDir, { recursive: true });
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.mkdirSync(srcDir, { recursive: true });

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
    JSON.stringify({ in_flight_packet: "runtime-packet.sdc" }, null, 2) + "\n",
    "utf8"
  );

  fs.writeFileSync(
    path.join(stateDir, "next-action.md"),
    [
      "TYPE: REFACTOR",
      "PACKAGE: runtime-packet.sdc",
      "",
      "Active runtime packet.",
      "",
    ].join("\n"),
    "utf8"
  );

  fs.writeFileSync(
    path.join(stateDir, "snapshot.md"),
    [
      "# Consync Snapshot",
      "",
      "## Current Package",
      "",
      "- type: `PROCESS`",
      "- package: `runtime-packet.sdc`",
      "",
    ].join("\n"),
    "utf8"
  );

  fs.writeFileSync(path.join(stateDir, "history.jsonl"), "{\"summary\":\"record\"}\n", "utf8");
  fs.writeFileSync(path.join(runtimeDir, "signals.jsonl"), "{\"signal\":\"question\"}\n", "utf8");
  fs.writeFileSync(path.join(runtimeDir, "shared-memory.jsonl"), "{\"message\":\"hello\"}\n", "utf8");
  fs.writeFileSync(path.join(packetsDir, "runtime-packet.sdc.md"), "# Runtime Packet\n", "utf8");
  fs.writeFileSync(path.join(srcDir, "index.js"), "console.log('product code');\n", "utf8");

  return fixture;
}

function runHousekeepingStatus(args = []) {
  return spawnSync(process.execPath, [cliPath, "scaffoldai", "housekeeping", "status", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 15000,
  });
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  let fixture;

  try {
    {
      assert.strictEqual(parseGitStatusPath(" M .scaffoldai/state/next-action.md"), ".scaffoldai/state/next-action.md");
      assert.strictEqual(parseGitStatusPath("R  a.txt -> b.txt"), "b.txt");
      console.log("  PASS: git status path parser handles modified and renamed lines");
    }

    {
      const status = gatherHousekeepingStatus(repoRoot, {
        gitStatus: {
          clean: false,
          count: 3,
          files: [
            " M .scaffoldai/state/next-action.md",
            " M src/index.js",
            "?? .scaffoldai/runtime/mcp/signals.jsonl",
          ],
        },
      });

      assert.strictEqual(status.status, "MIXED", "Expected MIXED status for runtime + implementation changes");
      assert.strictEqual(status.data.runtime_changes.length, 2, "Expected two runtime changes");
      assert.strictEqual(status.data.implementation_changes.length, 1, "Expected one implementation change");
      assert.strictEqual(status.data.safe_to_reset.length, 1, "Expected one safe runtime reset candidate");
      assert.strictEqual(status.data.safe_to_reset[0].path, ".scaffoldai/state/next-action.md");
      console.log("  PASS: housekeeping status classifies runtime vs implementation changes");
    }

    fixture = createFixtureRepo();

    {
      const resetResult = resetRuntimeState(fixture, { includeRuntimeLogs: false });

      assert.strictEqual(resetResult.status, "PASS", "reset should pass for valid fixture");

      const runtime = JSON.parse(
        fs.readFileSync(path.join(fixture, ".scaffoldai", "state", "active-runtime.json"), "utf8")
      );
      assert.strictEqual(runtime.in_flight_packet, null, "active-runtime in_flight_packet should be null after reset");
      assert.strictEqual(getInFlightPacket(fixture), null, "next-action pointer should be NONE after reset");

      const snapshot = fs.readFileSync(path.join(fixture, ".scaffoldai", "state", "snapshot.md"), "utf8");
      assert.ok(snapshot.includes("- package: `NONE`"), "snapshot should be neutralized to package NONE");

      assert.ok(
        fs.existsSync(path.join(fixture, ".scaffoldai", "state", "history.jsonl")),
        "history log should be preserved by default"
      );
      assert.ok(
        fs.existsSync(path.join(fixture, ".scaffoldai", "runtime", "mcp", "signals.jsonl")),
        "runtime signal log should be preserved by default"
      );
      assert.ok(
        fs.existsSync(path.join(fixture, ".scaffoldai", "packets", "runtime-packet.sdc.md")),
        "packet files must never be deleted by housekeeping reset"
      );

      const productCode = fs.readFileSync(path.join(fixture, "src", "index.js"), "utf8");
      assert.strictEqual(productCode, "console.log('product code');\n", "product/runtime code files must not be touched");
      console.log("  PASS: runtime-state reset neutralizes active packet and preserves logs/packets/product code by default");
    }

    {
      const resetResult = resetRuntimeState(fixture, { includeRuntimeLogs: true });
      assert.strictEqual(resetResult.status, "PASS", "reset with log cleanup should pass");

      assert.ok(
        !fs.existsSync(path.join(fixture, ".scaffoldai", "state", "history.jsonl")),
        "history log should be deleted when includeRuntimeLogs is true"
      );
      assert.ok(
        !fs.existsSync(path.join(fixture, ".scaffoldai", "runtime", "mcp", "signals.jsonl")),
        "signal log should be deleted when includeRuntimeLogs is true"
      );
      assert.ok(
        !fs.existsSync(path.join(fixture, ".scaffoldai", "runtime", "mcp", "shared-memory.jsonl")),
        "shared memory log should be deleted when includeRuntimeLogs is true"
      );
      console.log("  PASS: optional runtime log cleanup is explicit and bounded");
    }

    {
      const result = runHousekeepingStatus();
      assert.strictEqual(result.status, 0, `Expected status command to exit 0. Got: ${result.status}`);
      assert.ok(result.stdout.includes("[scaffoldai housekeeping status]"), "Missing housekeeping status header");
      assert.ok(result.stdout.includes("RUNTIME STATE CATALOG:"), "Missing runtime state catalog section");
      assert.ok(result.stdout.includes("SAFE TO RESET:"), "Missing safe-to-reset section");
      console.log("  PASS: CLI housekeeping status prints expected sections");
    }

    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  } finally {
    if (fixture) {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  }
}

main();