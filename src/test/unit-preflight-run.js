const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");

const TEST_NAME = "unit-preflight-run";

const repoRoot = path.resolve(__dirname, "..", "..");
const cliPath = path.join(repoRoot, "src", "index.js");

function run(args) {
  return spawnSync(process.execPath, [cliPath, "preflight-run", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  // 1. No prompt → BLOCKED, exit 1
  {
    const result = run([]);
    assert.ok(result.stdout.includes("Agent: Preflight"), "Agent header");
    assert.ok(result.stdout.includes("STATUS: BLOCKED"), "BLOCKED status");
    assert.ok(result.stdout.includes("REQUIRED NEXT STEP:"), "Required next step");
    assert.strictEqual(result.status, 1, "Exit code 1 for missing prompt");
    console.log("  PASS: no prompt → BLOCKED, exit 1");
  }

  // 2. Product prompt → PASS, ready
  {
    const result = run(["--prompt=build a new electron window feature"]);
    assert.ok(result.stdout.includes("STATUS: PASS"), "PASS status");
    assert.ok(result.stdout.includes("CLASSIFICATION: product"), "product classification");
    assert.ok(result.stdout.includes("READINESS: ready"), "ready");
    assert.strictEqual(result.status, 0, "Exit 0");
    console.log("  PASS: product prompt → PASS, ready");
  }

  // 3. Unknown prompt → BLOCKED
  {
    const result = run(["--prompt=do the thing with the stuff"]);
    assert.ok(result.stdout.includes("STATUS: BLOCKED"), "BLOCKED status");
    assert.ok(result.stdout.includes("READINESS: needs_clarification"), "needs_clarification");
    assert.strictEqual(result.status, 1, "Exit 1");
    console.log("  PASS: unknown prompt → BLOCKED");
  }

  // 4. Mixed prompt → WARN, ambiguous
  {
    const result = run(["--prompt=build a test for the electron feature and document it"]);
    assert.ok(result.stdout.includes("STATUS: WARN"), "WARN status");
    assert.ok(result.stdout.includes("CLASSIFICATION: mixed"), "mixed classification");
    assert.ok(result.stdout.includes("READINESS: ambiguous"), "ambiguous");
    assert.strictEqual(result.status, 0, "Exit 0");
    console.log("  PASS: mixed prompt → WARN, ambiguous");
  }

  // 5. Needs clarification prompt → BLOCKED
  {
    const result = run(["--prompt=asdfghjkl"]);
    assert.ok(result.stdout.includes("STATUS: BLOCKED"), "BLOCKED status");
    assert.ok(result.stdout.includes("READINESS: needs_clarification"), "needs_clarification");
    assert.strictEqual(result.status, 1, "Exit 1");
    console.log("  PASS: nonsense prompt → BLOCKED");
  }

  // 6. Input is echoed
  {
    const result = run(["--prompt=build a new feature"]);
    assert.ok(result.stdout.includes("Input: build a new feature"), "Input echo");
    console.log("  PASS: input is echoed");
  }

  console.log(`[${TEST_NAME}] PASS`);
}

main();
