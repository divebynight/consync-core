const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");
const { resolveVerifyCommand } = require("../lib/resolveVerifyCommand");

const TEST_NAME = "unit-scaffoldai-verify";
const repoRoot = path.resolve(__dirname, "..", "..");
const cliPath = path.join(repoRoot, "src", "index.js");

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack || error.message);
  process.exit(1);
}

function runVerify(args = [], timeout = 30000) {
  return spawnSync(process.execPath, [cliPath, "scaffoldai", "verify", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout,
  });
}

// -----------------------------------------------------------------------
// Unit tests for resolveVerifyCommand
// -----------------------------------------------------------------------

function testResolver() {
  // Explicit --target=scaffoldai
  {
    const result = resolveVerifyCommand(null, { target: "scaffoldai" });
    assert.strictEqual(result.error, false, "scaffoldai target should not error");
    assert.strictEqual(result.command, "npm run verify:scaffoldai");
    assert.strictEqual(result.target, "scaffoldai");
  }

  // Explicit --target=consync
  {
    const result = resolveVerifyCommand(null, { target: "consync" });
    assert.strictEqual(result.error, false);
    assert.strictEqual(result.command, "npm run verify:consync");
    assert.strictEqual(result.target, "consync");
  }

  // Explicit --target=full
  {
    const result = resolveVerifyCommand(null, { target: "full" });
    assert.strictEqual(result.error, false);
    assert.strictEqual(result.command, "npm run verify:full");
    assert.strictEqual(result.target, "full");
  }

  // Invalid target
  {
    const result = resolveVerifyCommand(null, { target: "unknown" });
    assert.strictEqual(result.error, true, "unknown target should error");
    assert.ok(result.reason.includes("unknown"), `Expected reason to mention the bad value. Got: ${result.reason}`);
  }

  // Contract with process/contract/planning -> scaffoldai
  {
    const contract = { allowed_packet_types: ["process", "contract"], in_flight_packet: null };
    const result = resolveVerifyCommand(contract, {});
    assert.strictEqual(result.target, "scaffoldai");
    assert.strictEqual(result.command, "npm run verify:scaffoldai");
  }

  // Contract with product -> consync
  {
    const contract = { allowed_packet_types: ["product"], in_flight_packet: null };
    const result = resolveVerifyCommand(contract, {});
    assert.strictEqual(result.target, "consync");
    assert.strictEqual(result.command, "npm run verify:consync");
  }

  // No contract -> general
  {
    const result = resolveVerifyCommand(null, {});
    assert.strictEqual(result.target, "general");
    assert.strictEqual(result.command, "npm run verify");
  }

  // in_flight_packet overrides allowed_packet_types
  {
    const contract = {
      allowed_packet_types: ["product"],
      in_flight_packet: "process",
    };
    const result = resolveVerifyCommand(contract, {});
    assert.strictEqual(result.target, "scaffoldai", "in_flight_packet process should override allowed_packet_types product");
  }

  console.log("  PASS: resolveVerifyCommand unit tests (7 cases)");
}

// -----------------------------------------------------------------------
// CLI integration tests
// -----------------------------------------------------------------------

function main() {
  console.log(`[${TEST_NAME}] Running`);

  try {
    // 1. Resolver unit tests
    testResolver();

    // 2. Default recommend-only mode — must not execute verification
    {
      const result = runVerify();

      assert.ok(
        result.status === 0,
        `Expected exit code 0 in recommend mode. Got: ${result.status}\nstderr: ${result.stderr}`
      );
      assert.ok(
        result.stdout.includes("[scaffoldai verify]"),
        `Expected [scaffoldai verify] header. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("STATUS: RECOMMEND"),
        `Expected STATUS: RECOMMEND in default mode. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("RECOMMENDED VERIFY:"),
        `Expected RECOMMENDED VERIFY: section. Got:\n${result.stdout}`
      );
      assert.ok(
        !result.stdout.includes("STATUS: PASS") && !result.stdout.includes("STATUS: FAIL"),
        `Default mode must not execute verify. Got:\n${result.stdout}`
      );
      console.log("  PASS: default mode is recommend-only with STATUS: RECOMMEND");
    }

    // 3. Output includes TARGET and REASON
    {
      const result = runVerify();
      assert.ok(result.stdout.includes("TARGET:"), `Missing TARGET section. Got:\n${result.stdout}`);
      assert.ok(result.stdout.includes("REASON:"), `Missing REASON section. Got:\n${result.stdout}`);
      console.log("  PASS: output includes TARGET and REASON sections");
    }

    // 4. --target=scaffoldai recommend mode
    {
      const result = runVerify(["--target=scaffoldai"]);

      assert.ok(result.status === 0, `Expected exit 0. Got: ${result.status}`);
      assert.ok(
        result.stdout.includes("verify:scaffoldai"),
        `Expected verify:scaffoldai in output. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("STATUS: RECOMMEND"),
        `Expected STATUS: RECOMMEND. Got:\n${result.stdout}`
      );
      console.log("  PASS: --target=scaffoldai recommend mode");
    }

    // 5. --target=consync recommend mode
    {
      const result = runVerify(["--target=consync"]);

      assert.ok(result.status === 0, `Expected exit 0. Got: ${result.status}`);
      assert.ok(
        result.stdout.includes("verify:consync"),
        `Expected verify:consync in output. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("STATUS: RECOMMEND"),
        `Expected STATUS: RECOMMEND. Got:\n${result.stdout}`
      );
      console.log("  PASS: --target=consync recommend mode");
    }

    // 6. Invalid target exits non-zero
    {
      const result = runVerify(["--target=bogus"]);

      assert.ok(
        result.status !== 0,
        `Expected non-zero exit for invalid target. Got: ${result.status}`
      );
      console.log("  PASS: invalid --target exits non-zero");
    }

    // 7. --run mode with --target=consync produces PASS or FAIL (runs actual verify)
    //    Using consync target avoids circular recursion (this test lives in verify:scaffoldai,
    //    not verify:consync).
    {
      const result = runVerify(["--target=consync", "--run"], 120000);

      assert.ok(
        result.status === 0 || result.status === 1,
        `Expected exit 0 or 1 from --run mode. Got: ${result.status}`
      );
      assert.ok(
        result.stdout.includes("SELECTED VERIFY:"),
        `Expected SELECTED VERIFY: in run mode output. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("STATUS: PASS") || result.stdout.includes("STATUS: FAIL"),
        `Expected STATUS: PASS or FAIL in run mode. Got:\n${result.stdout}`
      );
      console.log("  PASS: --run mode produces SELECTED VERIFY and STATUS: PASS/FAIL");
    }

    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  }
}

main();
