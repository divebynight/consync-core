const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");

const TEST_NAME = "unit-scaffoldai-preflight";
const repoRoot = path.resolve(__dirname, "..", "..");
const cliPath = path.join(repoRoot, "src", "scaffoldai.js");

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack || error.message);
  process.exit(1);
}

function runPreflight(args = []) {
  return spawnSync(process.execPath, [cliPath, "scaffoldai", "preflight", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 15000,
  });
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  try {
    // 1. Command runs and exits; exit code 0 (PASS/WARNING) or 1 (BLOCKED)
    {
      const result = runPreflight();

      assert.ok(
        result.status === 0 || result.status === 1,
        `Expected exit code 0 or 1. Got: ${result.status}\nstderr: ${result.stderr}`
      );
      assert.ok(
        result.stdout.includes("[scaffoldai preflight]"),
        `Expected [scaffoldai preflight] header. Got:\n${result.stdout}`
      );
      console.log("  PASS: command runs and produces [scaffoldai preflight] header");
    }

    // 2. Output includes a STATUS line with a valid value
    {
      const result = runPreflight();
      const out = result.stdout;

      const hasValidStatus =
        out.includes("STATUS: PASS") ||
        out.includes("STATUS: WARNING") ||
        out.includes("STATUS: BLOCKED");

      assert.ok(
        hasValidStatus,
        `Expected STATUS: PASS, WARNING, or BLOCKED. Got:\n${out}`
      );
      console.log("  PASS: output includes a valid STATUS line");
    }

    // 3. Output includes all expected sections
    {
      const result = runPreflight();
      const out = result.stdout;

      assert.ok(out.includes("STATE FILES:"), `Missing STATE FILES section. Got:\n${out}`);
      assert.ok(out.includes("ACTIVE PACKET:"), `Missing ACTIVE PACKET section. Got:\n${out}`);
      assert.ok(out.includes("GIT STATUS:"), `Missing GIT STATUS section. Got:\n${out}`);
      assert.ok(out.includes("VERIFY SCRIPTS:"), `Missing VERIFY SCRIPTS section. Got:\n${out}`);
      assert.ok(out.includes("BLOCKERS:"), `Missing BLOCKERS section. Got:\n${out}`);
      assert.ok(out.includes("WARNINGS:"), `Missing WARNINGS section. Got:\n${out}`);
      console.log("  PASS: output includes all expected sections");
    }

    // 4. Required state files are reported
    {
      const result = runPreflight();
      const out = result.stdout;

      assert.ok(
        out.includes("active-stream.md"),
        `Expected active-stream.md in STATE FILES. Got:\n${out}`
      );
      assert.ok(
        out.includes("active-runtime.json"),
        `Expected active-runtime.json in STATE FILES. Got:\n${out}`
      );
      assert.ok(
        out.includes("next-action.md"),
        `Expected next-action.md in STATE FILES. Got:\n${out}`
      );
      console.log("  PASS: all required state files reported in output");
    }

    // 5. Verify scripts are reported
    {
      const result = runPreflight();
      const out = result.stdout;

      assert.ok(out.includes("verify:scaffoldai"), `Expected verify:scaffoldai in VERIFY SCRIPTS. Got:\n${out}`);
      assert.ok(out.includes("verify:consync"), `Expected verify:consync in VERIFY SCRIPTS. Got:\n${out}`);
      console.log("  PASS: verify scripts reported in output");
    }

    // 6. State-dependent: current repo should not produce BLOCKED
    //    (all state files are present and contract is coherent in this repo)
    {
      const result = runPreflight();

      assert.ok(
        result.status === 0,
        `Expected exit code 0 (PASS or WARNING) in healthy repo state. Got: ${result.status}\nOutput:\n${result.stdout}`
      );
      assert.ok(
        !result.stdout.includes("STATUS: BLOCKED"),
        `Expected no BLOCKED status in healthy repo state. Got:\n${result.stdout}`
      );
      console.log("  PASS: command exits 0 and is not BLOCKED in healthy repo state");
    }

    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  }
}

main();
