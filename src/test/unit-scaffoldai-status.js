const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");

const TEST_NAME = "unit-scaffoldai-status";
const repoRoot = path.resolve(__dirname, "..", "..");
const cliPath = path.join(repoRoot, "src", "index.js");

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack || error.message);
  process.exit(1);
}

function runStatus(args = []) {
  return spawnSync(process.execPath, [cliPath, "scaffoldai", "status", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 15000,
  });
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  try {
    // 1. Command runs and exits cleanly
    {
      const result = runStatus();

      assert.ok(
        result.status === 0 || result.status === 1,
        `Expected exit code 0 or 1. Got: ${result.status}\nstderr: ${result.stderr}`
      );
      assert.ok(
        result.stdout.includes("[scaffoldai status]"),
        `Expected [scaffoldai status] header. Got:\n${result.stdout}`
      );
      console.log("  PASS: command runs and produces [scaffoldai status] header");
    }

    // 2. Output includes STATUS line
    {
      const result = runStatus();

      assert.ok(
        result.stdout.includes("STATUS:"),
        `Expected STATUS: line in output. Got:\n${result.stdout}`
      );
      console.log("  PASS: output includes STATUS: line");
    }

    // 3. Output includes expected sections
    {
      const result = runStatus();
      const out = result.stdout;

      assert.ok(out.includes("ACTIVE STREAM:"), `Missing ACTIVE STREAM section. Got:\n${out}`);
      assert.ok(out.includes("ACTIVE PACKET:"), `Missing ACTIVE PACKET section. Got:\n${out}`);
      assert.ok(out.includes("NEXT ACTION:"), `Missing NEXT ACTION section. Got:\n${out}`);
      assert.ok(out.includes("GIT STATUS:"), `Missing GIT STATUS section. Got:\n${out}`);
      assert.ok(out.includes("VERIFY SURFACE:"), `Missing VERIFY SURFACE section. Got:\n${out}`);
      console.log("  PASS: output includes all expected sections");
    }

    // 4. No active packet case — output says (none) when next-action has PACKAGE: NONE
    //    We rely on the fact that the current repo has in_flight_packet: null in active-contract.json.
    //    This is a state-dependent check but is deterministic given the current repo state.
    {
      const result = runStatus();

      // Active packet should be reported as (none) since in_flight_packet is null
      assert.ok(
        result.stdout.includes("ACTIVE PACKET:    (none)"),
        `Expected ACTIVE PACKET: (none) when no packet mounted. Got:\n${result.stdout}`
      );
      console.log("  PASS: output correctly reports (none) when no active packet");
    }

    // 5. Git status section is always present (clean or dirty)
    {
      const result = runStatus();
      const out = result.stdout;

      const hasClean = out.includes("Clean — no uncommitted changes");
      const hasDirty = /\d+ modified/.test(out);
      const hasUnavailable = out.includes("(unavailable");

      assert.ok(
        hasClean || hasDirty || hasUnavailable,
        `GIT STATUS must report clean, dirty, or unavailable. Got:\n${out}`
      );
      console.log("  PASS: GIT STATUS section reports a deterministic state");
    }

    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  }
}

main();
