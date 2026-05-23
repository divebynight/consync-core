const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");

const TEST_NAME = "unit-intake-run";

const repoRoot = path.resolve(__dirname, "..", "..");
const cliPath = path.join(repoRoot, "src", "scaffoldai.js");

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack);
  process.exit(1);
}

function run(args) {
  return spawnSync(process.execPath, [cliPath, "intake-run", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  try {
    // 1. No prompt → BLOCKED, exits non-zero
    {
      const result = run([]);

      assert.ok(
        result.stdout.includes("Agent: Intake"),
        `Expected agent header. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("STATUS: BLOCKED"),
        `Expected BLOCKED. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("REQUIRED NEXT STEP:"),
        `Expected REQUIRED NEXT STEP. Got:\n${result.stdout}`
      );
      assert.strictEqual(result.status, 1, "Expected exit code 1 for no prompt");
      console.log("  PASS: no prompt → BLOCKED, exits 1");
    }

    // 2. Product prompt → PASS, CLASSIFICATION: product
    {
      const result = run(["--prompt=build a new electron window feature"]);

      assert.ok(
        result.stdout.includes("STATUS: PASS"),
        `Expected PASS. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("CLASSIFICATION: product"),
        `Expected product classification. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("RISK: medium"),
        `Expected medium risk. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("REQUIRED NEXT STEP:"),
        `Expected REQUIRED NEXT STEP. Got:\n${result.stdout}`
      );
      assert.strictEqual(result.status, 0, "Expected exit 0");
      console.log("  PASS: product prompt → PASS, CLASSIFICATION: product");
    }

    // 3. Process prompt → PASS, CLASSIFICATION: process
    {
      const result = run(["--prompt=update the handoff workflow and agent definitions"]);

      assert.ok(
        result.stdout.includes("STATUS: PASS"),
        `Expected PASS. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("CLASSIFICATION: process"),
        `Expected process classification. Got:\n${result.stdout}`
      );
      assert.strictEqual(result.status, 0, "Expected exit 0");
      console.log("  PASS: process prompt → PASS, CLASSIFICATION: process");
    }

    // 4. Docs prompt → PASS, CLASSIFICATION: docs, lightweight verification
    {
      const result = run(["--prompt=write documentation and guide for new users"]);

      assert.ok(
        result.stdout.includes("CLASSIFICATION: docs"),
        `Expected docs classification. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("VERIFICATION LEVEL: lightweight"),
        `Expected lightweight verification. Got:\n${result.stdout}`
      );
      assert.strictEqual(result.status, 0, "Expected exit 0");
      console.log("  PASS: docs prompt → PASS, CLASSIFICATION: docs");
    }

    // 5. Unknown prompt → NEEDS_CLARIFICATION
    {
      const result = run(["--prompt=do the thing with the stuff"]);

      assert.ok(
        result.stdout.includes("STATUS: NEEDS_CLARIFICATION"),
        `Expected NEEDS_CLARIFICATION. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("CLASSIFICATION: unknown"),
        `Expected unknown classification. Got:\n${result.stdout}`
      );
      assert.strictEqual(result.status, 0, "Expected exit 0 even for NEEDS_CLARIFICATION");
      console.log("  PASS: unknown prompt → NEEDS_CLARIFICATION");
    }

    // 6. Mixed prompt → PASS, CLASSIFICATION: mixed, AMBIGUITY flags types
    {
      const result = run(["--prompt=build a test for the electron feature and document it"]);

      assert.ok(
        result.stdout.includes("CLASSIFICATION: mixed"),
        `Expected mixed classification. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("AMBIGUITY: multiple types detected:"),
        `Expected ambiguity flag. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("RISK: medium"),
        `Expected medium risk for mixed. Got:\n${result.stdout}`
      );
      assert.strictEqual(result.status, 0, "Expected exit 0");
      console.log("  PASS: mixed prompt → CLASSIFICATION: mixed, ambiguity flagged");
    }

    // 7. Input is printed
    {
      const result = run(["--prompt=build a new feature"]);

      assert.ok(
        result.stdout.includes("Input: build a new feature"),
        `Expected input echo. Got:\n${result.stdout}`
      );
      console.log("  PASS: input is echoed in output");
    }

    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  }
}

main();
