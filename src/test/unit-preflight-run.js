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

    // 1c. Execution surface mismatch → BLOCKED
    {
      const result = run([
        "--prompt=build a new electron window feature",
        "--mode=IMPLEMENT",
        "--execution-surface=verify", // mismatch
        "--context=product",
        "--expectation=add electron window",
        "--task=add window",
        "--output-format=STATUS,SUMMARY,FILES"
      ]);
      assert.ok(result.stdout.includes("STATUS: BLOCKED"), "BLOCKED status (surface mismatch)");
      assert.ok(result.stdout.toLowerCase().includes("surface mismatch"), "surface mismatch reason");
      assert.strictEqual(result.status, 1, "Exit 1 for surface mismatch");
      console.log("  PASS: execution surface mismatch → BLOCKED");
    }

  // 1b. Missing required fields → BLOCKED
  {
    const result = run(["--prompt=build a new electron window feature"]);
    assert.ok(result.stdout.includes("STATUS: BLOCKED"), "BLOCKED status");
    assert.ok(result.stdout.includes("BLOCKED FIELDS:"), "Blocked fields");
    assert.strictEqual(result.status, 1, "Exit 1 for missing required fields");
    console.log("  PASS: missing required fields → BLOCKED");
  }

  // 2. Product prompt with all required fields → PASS, ready
  {
    const result = run([
      "--prompt=build a new electron window feature",
      "--mode=IMPLEMENT",
      "--execution-surface=copilot",
      "--context=product",
      "--expectation=add electron window",
      "--task=add window",
      "--output-format=STATUS,SUMMARY,FILES"
    ]);
    assert.ok(result.stdout.includes("STATUS: PASS"), "PASS status");
    assert.ok(result.stdout.includes("CLASSIFICATION: product"), "product classification");
    assert.ok(result.stdout.includes("READINESS: ready"), "ready");
    assert.strictEqual(result.status, 0, "Exit 0");
    console.log("  PASS: product prompt with all fields → PASS, ready");
  }

  // 3. Unknown prompt with all required fields → BLOCKED, needs_clarification
  {
    const result = run([
      "--prompt=do the thing with the stuff",
      "--mode=IMPLEMENT",
      "--execution-surface=copilot",
      "--context=product",
      "--expectation=clarify",
      "--task=clarify",
      "--output-format=STATUS,SUMMARY,FILES"
    ]);
    assert.ok(result.stdout.includes("STATUS: BLOCKED"), "BLOCKED status");
    assert.ok(result.stdout.includes("READINESS: needs_clarification"), "needs_clarification");
    assert.strictEqual(result.status, 1, "Exit 1");
    console.log("  PASS: unknown prompt with all fields → BLOCKED, needs_clarification");
  }


  // 4. Mixed prompt with all required fields → WARN, ambiguous
  {
    const result = run([
      "--prompt=build a test for the electron feature and document it",
      "--mode=IMPLEMENT",
      "--execution-surface=copilot",
      "--context=mixed",
      "--expectation=add tests and docs",
      "--task=add tests and docs",
      "--output-format=STATUS,SUMMARY,FILES"
    ]);
    assert.ok(result.stdout.includes("STATUS: WARN"), "WARN status");
    assert.ok(result.stdout.includes("CLASSIFICATION: mixed"), "mixed classification");
    assert.ok(result.stdout.includes("READINESS: ambiguous"), "ambiguous");
    assert.strictEqual(result.status, 0, "Exit 0");
    console.log("  PASS: mixed prompt with all fields → WARN, ambiguous");
  }

  // 5. Needs clarification prompt with all required fields → BLOCKED
  {
    const result = run([
      "--prompt=asdfghjkl",
      "--mode=IMPLEMENT",
      "--execution-surface=copilot",
      "--context=product",
      "--expectation=clarify",
      "--task=clarify",
      "--output-format=STATUS,SUMMARY,FILES"
    ]);
    assert.ok(result.stdout.includes("STATUS: BLOCKED"), "BLOCKED status");
    assert.ok(result.stdout.includes("READINESS: needs_clarification"), "needs_clarification");
    assert.strictEqual(result.status, 1, "Exit 1");
    console.log("  PASS: nonsense prompt with all fields → BLOCKED");
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
