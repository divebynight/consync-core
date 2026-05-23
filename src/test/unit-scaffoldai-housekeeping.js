"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const {
  gatherHousekeepingStatus,
  resetRuntimeState,
  parseGitStatusPath,
  cleanIntakeArtifacts,
  cleanWorkspace,
} = require("../lib/scaffoldaiHousekeeping.auth.scaffoldai");
const scaffoldaiState = require("../lib/scaffoldaiState.state.scaffoldai");
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
  const intakeRuntimeDir = path.join(fixture, ".scaffoldai", "runtime", "packet-intake");
  const inboxDir = path.join(fixture, ".scaffoldai", "inbox");
  const srcDir = path.join(fixture, "src");

  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(contractsDir, { recursive: true });
  fs.mkdirSync(packetsDir, { recursive: true });
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.mkdirSync(intakeRuntimeDir, { recursive: true });
  fs.mkdirSync(inboxDir, { recursive: true });
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
  fs.writeFileSync(path.join(inboxDir, "runtime-packet.sdc.md"), "# Runtime Packet (Candidate)\n", "utf8");
  fs.writeFileSync(
    path.join(intakeRuntimeDir, "latest-intake.json"),
    JSON.stringify(
      {
        status: "ACCEPTED",
        accepted: true,
        source_path: path.join(inboxDir, "runtime-packet.sdc.md"),
        packet_id: "runtime-packet.sdc",
        file_name: "runtime-packet.sdc.md",
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
  fs.writeFileSync(path.join(srcDir, "index.js"), "console.log('product code');\n", "utf8");

  return fixture;
}

function writeTerminalHandoff(fixture, packageName, status = "PASS") {
  scaffoldaiState.writeHandoff(
    fixture,
    [
      "TYPE: PROCESS",
      `PACKAGE: ${packageName}`,
      "",
      "STATUS",
      "",
      status,
      "",
      "SUMMARY",
      "",
      `Closed ${packageName} for cleanup testing.`,
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
      "- confirm goal is met",
      "",
      "VERIFICATION NOTES",
      "",
      "- cleanup test fixture",
      "",
    ].join("\n")
  );
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
      writeTerminalHandoff(fixture, "runtime-packet.sdc", "PASS");
      fs.writeFileSync(path.join(fixture, ".scaffoldai", "state", "history.jsonl"), "{\"summary\":\"record\"}\n", "utf8");
      const cleanupResult = cleanIntakeArtifacts(fixture);
      assert.strictEqual(cleanupResult.status, "PASS", "clean-intake-artifacts should pass");
      assert.strictEqual(cleanupResult.data.packet_closed, true, "matching terminal handoff should be recognized as closed");
      assert.strictEqual(cleanupResult.data.cleanup_performed, true, "cleanup should remove the matched inbox candidate");
      assert.strictEqual(cleanupResult.data.inbox_candidate_removed, true, "cleanup should report candidate removal");
      assert.ok(Array.isArray(cleanupResult.data.removed_paths) && cleanupResult.data.removed_paths.some((entry) => entry.endsWith("runtime-packet.sdc.md")));
      assert.ok(Array.isArray(cleanupResult.data.skipped_paths));
      assert.deepStrictEqual(cleanupResult.data.validation_errors, []);
      assert.deepStrictEqual(cleanupResult.data.guard_errors, []);
      assert.strictEqual(cleanupResult.data.error_category, null);
      assert.ok(
        !fs.existsSync(path.join(fixture, ".scaffoldai", "runtime", "packet-intake", "latest-intake.json")),
        "latest intake metadata should be removed"
      );
      assert.ok(
        !fs.existsSync(path.join(fixture, ".scaffoldai", "inbox", "runtime-packet.sdc.md")),
        "consumed inbox packet candidate should be removed"
      );
      assert.ok(
        fs.existsSync(path.join(fixture, ".scaffoldai", "packets", "runtime-packet.sdc.md")),
        "accepted packet copy should be preserved"
      );
      assert.ok(
        fs.existsSync(path.join(fixture, ".scaffoldai", "state", "history.jsonl")),
        "append-only logs should be preserved by intake cleanup"
      );
      console.log("  PASS: intake artifact cleanup removes transient artifacts and preserves durable surfaces");

      const rerun = cleanIntakeArtifacts(fixture);
      assert.strictEqual(rerun.status, "PASS", "cleanup rerun should remain safe");
      assert.strictEqual(rerun.data.cleanup_performed, false, "cleanup rerun should be idempotent");
      assert.strictEqual(rerun.data.inbox_candidate_removed, false, "cleanup rerun should not remove anything");
      assert.ok(Array.isArray(rerun.data.removed_paths) && rerun.data.removed_paths.length === 0, "cleanup rerun should not delete anything");
    }

    {
      const mismatchFixture = createFixtureRepo();
      try {
        writeTerminalHandoff(mismatchFixture, "different-packet.sdc", "PASS");
        const mismatch = cleanIntakeArtifacts(mismatchFixture);
        assert.strictEqual(mismatch.status, "PASS", "mismatched cleanup should stay non-dangerous");
        assert.strictEqual(mismatch.data.cleanup_performed, false, "mismatched cleanup must not remove candidate");
        assert.strictEqual(mismatch.data.inbox_candidate_removed, false, "mismatched cleanup must not remove candidate");
        assert.ok(
          mismatch.data.skipped_paths.some((entry) => entry.endsWith("runtime-packet.sdc.md")),
          "mismatched cleanup should report the preserved candidate"
        );
        assert.ok(
          fs.existsSync(path.join(mismatchFixture, ".scaffoldai", "inbox", "runtime-packet.sdc.md")),
          "mismatched cleanup must preserve the unrelated inbox candidate"
        );
      } finally {
        fs.rmSync(mismatchFixture, { recursive: true, force: true });
      }
    }

    {
      writeTerminalHandoff(fixture, "runtime-packet.sdc", "PASS");
      fs.writeFileSync(
        path.join(fixture, ".scaffoldai", "state", "active-runtime.json"),
        JSON.stringify({ in_flight_packet: "runtime-packet.sdc" }, null, 2) + "\n",
        "utf8"
      );
      fs.writeFileSync(
        path.join(fixture, ".scaffoldai", "state", "next-action.md"),
        ["TYPE: REFACTOR", "PACKAGE: runtime-packet.sdc", "", "Active runtime packet.", ""].join("\n"),
        "utf8"
      );
      fs.writeFileSync(
        path.join(fixture, ".scaffoldai", "state", "snapshot.md"),
        ["# Consync Snapshot", "", "## Current Package", "", "- type: `PROCESS`", "- package: `runtime-packet.sdc`", ""].join("\n"),
        "utf8"
      );
      fs.writeFileSync(path.join(fixture, ".scaffoldai", "runtime", "mcp", "signals.jsonl"), "{\"signal\":\"question\"}\n", "utf8");
      fs.writeFileSync(path.join(fixture, ".scaffoldai", "runtime", "mcp", "shared-memory.jsonl"), "{\"message\":\"hello\"}\n", "utf8");
      fs.writeFileSync(path.join(fixture, ".scaffoldai", "state", "history.jsonl"), "{\"summary\":\"record\"}\n", "utf8");
      fs.writeFileSync(path.join(fixture, ".scaffoldai", "inbox", "runtime-packet.sdc.md"), "# Runtime Packet (Candidate)\n", "utf8");
      fs.writeFileSync(
        path.join(fixture, ".scaffoldai", "runtime", "packet-intake", "latest-intake.json"),
        JSON.stringify(
          {
            status: "ACCEPTED",
            accepted: true,
            source_path: path.join(fixture, ".scaffoldai", "inbox", "runtime-packet.sdc.md"),
            packet_id: "runtime-packet.sdc",
            file_name: "runtime-packet.sdc.md",
          },
          null,
          2
        ) + "\n",
        "utf8"
      );

      const result = cleanWorkspace(fixture);
      assert.strictEqual(result.status, "PASS", "clean-workspace should pass");
      assert.strictEqual(result.data.intake_artifacts_cleaned, true, "intake cleanup should execute");
      assert.strictEqual(result.data.runtime_state_reset, true, "runtime reset should execute");
      assert.strictEqual(result.data.packet_closed, true, "composite cleanup should surface closed packet state");
      assert.strictEqual(result.data.cleanup_performed, true, "composite cleanup should surface candidate removal");
      assert.strictEqual(result.data.inbox_candidate_removed, true, "composite cleanup should report inbox candidate removal");
      assert.strictEqual(result.data.packet_files_preserved, true, "packets should remain preserved");
      assert.strictEqual(result.data.logs_preserved, true, "logs should be preserved by default");
      assert.ok(
        !fs.existsSync(path.join(fixture, ".scaffoldai", "runtime", "packet-intake", "latest-intake.json")),
        "latest intake metadata should be removed by unified cleanup"
      );
      assert.ok(
        !fs.existsSync(path.join(fixture, ".scaffoldai", "inbox", "runtime-packet.sdc.md")),
        "consumed inbox candidate should be removed by unified cleanup"
      );
      assert.strictEqual(getInFlightPacket(fixture), null, "next-action should be neutralized by unified cleanup");
      assert.ok(
        fs.existsSync(path.join(fixture, ".scaffoldai", "state", "history.jsonl")),
        "append-only history should be preserved by unified cleanup"
      );
      assert.ok(
        fs.existsSync(path.join(fixture, ".scaffoldai", "runtime", "mcp", "signals.jsonl")),
        "MCP signal log should be preserved by unified cleanup"
      );
      assert.ok(
        fs.existsSync(path.join(fixture, ".scaffoldai", "packets", "runtime-packet.sdc.md")),
        "accepted packet should be preserved by unified cleanup"
      );
      console.log("  PASS: clean-workspace orchestrates intake cleanup + runtime reset with durable preservation");
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