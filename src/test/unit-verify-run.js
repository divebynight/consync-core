const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");

const TEST_NAME = "unit-verify-run";

const repoRoot = path.resolve(__dirname, "..", "..");
const cliPath = path.join(repoRoot, "src", "index.js");

function run(args) {
  return spawnSync(process.execPath, [cliPath, "verify-run", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  // 1. Missing prompt or result → BLOCKED, exit 1
  {
    const result = run([]);
    assert.ok(result.stdout.includes("STATUS: BLOCKED"), "BLOCKED status");
    assert.strictEqual(result.status, 1, "Exit 1 for missing args");
    console.log("  PASS: missing prompt/result → BLOCKED");
  }
  {
    const result = run(["--prompt=build a new feature"]);
    assert.ok(result.stdout.includes("STATUS: BLOCKED"), "BLOCKED status");
    assert.strictEqual(result.status, 1, "Exit 1 for missing result");
    console.log("  PASS: missing result → BLOCKED");
  }
  {
    const result = run(["--result=feature built"]);
    assert.ok(result.stdout.includes("STATUS: BLOCKED"), "BLOCKED status");
    assert.strictEqual(result.status, 1, "Exit 1 for missing prompt");
    console.log("  PASS: missing prompt → BLOCKED");
  }

  // 2. PASS: prompt/result aligned
  {
    const result = run(["--prompt=build a new electron window feature", "--result=added electron window feature"]);
    assert.ok(result.stdout.includes("STATUS: PASS"), "PASS status");
    assert.ok(result.stdout.includes("ALIGNMENT: strong"), "strong alignment");
    assert.ok(result.stdout.includes("SCOPE: correct"), "correct scope");
    assert.ok(result.stdout.includes("COMPLETENESS: complete"), "complete");
    assert.strictEqual(result.status, 0, "Exit 0");
    console.log("  PASS: aligned prompt/result → PASS");
  }

  // 3. WARN: mixed/partial
  {
    const result = run(["--prompt=build a test for the electron feature and document it", "--result=added tests and docs"]);
    assert.ok(result.stdout.includes("STATUS: WARN"), "WARN status");
    assert.ok(result.stdout.includes("ALIGNMENT: partial"), "partial alignment");
    assert.ok(result.stdout.includes("SCOPE: unknown"), "unknown scope");
    assert.ok(result.stdout.includes("COMPLETENESS: partial"), "partial");
    assert.strictEqual(result.status, 0, "Exit 0");
    console.log("  PASS: mixed/partial → WARN");
  }

  // 4. FAIL: unrelated
  {
    const result = run(["--prompt=build a new electron window feature", "--result=updated documentation for API"]);
    assert.ok(result.stdout.includes("STATUS: FAIL"), "FAIL status");
    assert.ok(result.stdout.includes("ALIGNMENT: weak"), "weak alignment");
    assert.ok(result.stdout.includes("SCOPE: drifted"), "drifted scope");
    assert.ok(result.stdout.includes("COMPLETENESS: unclear"), "unclear");
    assert.strictEqual(result.status, 1, "Exit 1");
    console.log("  PASS: unrelated prompt/result → FAIL");
  }

  // 5. FAIL: unknown prompt
  {
    const result = run(["--prompt=asdfghjkl", "--result=did the thing"]);
    assert.ok(result.stdout.includes("STATUS: FAIL"), "FAIL status");
    assert.ok(result.stdout.includes("ALIGNMENT: blocked"), "blocked alignment");
    assert.ok(result.stdout.includes("SCOPE: unknown"), "unknown scope");
    assert.ok(result.stdout.includes("COMPLETENESS: unclear"), "unclear");
    assert.strictEqual(result.status, 1, "Exit 1");
    console.log("  PASS: unknown prompt → FAIL");
  }

  // 6. Input/output echo
  {
    const result = run(["--prompt=build a new feature", "--result=added feature"]);
    assert.ok(result.stdout.includes("Prompt: build a new feature"), "Prompt echo");
    assert.ok(result.stdout.includes("Result: added feature"), "Result echo");
    console.log("  PASS: input/output echo");
  }

  console.log(`[${TEST_NAME}] PASS`);
}

main();
