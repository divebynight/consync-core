const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const TEST_NAME = "unit-consync-run";

const repoRoot = path.resolve(__dirname, "..", "..");
const cliPath = path.join(repoRoot, "src", "index.js");

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack);
  process.exit(1);
}

function withTempDir(fn) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-run-"));
  try {
    fn(tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function writeContract(tempDir, overrides = {}) {
  const stateDir = path.join(tempDir, ".consync", "state");
  fs.mkdirSync(stateDir, { recursive: true });

  const contract = Object.assign(
    {
      mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
      allowed_packet_types: ["process", "contract", "planning"],
      blocked_packet_types: ["product", "agent"],
      in_flight_packet: null,
      require_clean_git: true,
      require_dry_run: true,
    },
    overrides
  );

  fs.writeFileSync(
    path.join(stateDir, "active-contract.json"),
    JSON.stringify(contract),
    "utf8"
  );

  return stateDir;
}

function run(tempDir, extraArgs, stdinInput) {
  return spawnSync(
    process.execPath,
    [cliPath, "consync-run",
      "--request-type=SDC", "--packet-type=contract",
      "--packet-id=test-packet-v1", "--git-status=clean",
      ...extraArgs],
    {
      cwd: tempDir,
      encoding: "utf8",
      input: stdinInput !== undefined ? stdinInput : undefined,
    }
  );
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  try {
    // 1. ALLOW decision → prints report and prompts
    withTempDir((tempDir) => {
      writeContract(tempDir);

      const result = run(tempDir, [], "n\n");

      assert.ok(
        result.stdout.includes("CONSYNC-RUN REPORT"),
        `Expected report header. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("Decision:                ALLOW"),
        `Expected ALLOW decision. Got:\n${result.stdout}`
      );
      assert.ok(
        result.stdout.includes("Proceed with this action? (y/N)"),
        `Expected prompt to appear on ALLOW. Got:\n${result.stdout}`
      );
      console.log("  PASS: ALLOW decision prints report and prompts");
    });

    // 2. BLOCK decision → prints report, no prompt, exits non-zero
    withTempDir((tempDir) => {
      writeContract(tempDir);

      const result = spawnSync(
        process.execPath,
        [cliPath, "consync-run",
          "--request-type=SDC", "--packet-type=product",
          "--packet-id=test-packet-v1", "--git-status=clean"],
        { cwd: tempDir, encoding: "utf8" }
      );

      assert.ok(
        result.stdout.includes("Decision:                BLOCK"),
        `Expected BLOCK decision. Got:\n${result.stdout}`
      );
      assert.ok(
        !result.stdout.includes("Proceed with this action?"),
        `Expected no prompt on BLOCK. Got:\n${result.stdout}`
      );
      assert.strictEqual(result.status, 1, "Expected non-zero exit on BLOCK");
      console.log("  PASS: BLOCK decision — no prompt, exits non-zero");
    });

    // 3. ALLOW + user enters "y" → Approved message
    withTempDir((tempDir) => {
      writeContract(tempDir);

      const result = run(tempDir, [], "y\n");

      assert.ok(
        result.stdout.includes("Approved."),
        `Expected Approved message. Got:\n${result.stdout}`
      );
      assert.strictEqual(result.status, 0, "Expected zero exit on approval");
      console.log("  PASS: user enters y → Approved");
    });

    // 4. ALLOW + user enters anything else (default) → Cancelled message
    withTempDir((tempDir) => {
      writeContract(tempDir);

      const result = run(tempDir, [], "\n");

      assert.ok(
        result.stdout.includes("Cancelled."),
        `Expected Cancelled message. Got:\n${result.stdout}`
      );
      assert.strictEqual(result.status, 0, "Expected zero exit on cancel");
      console.log("  PASS: default answer → Cancelled");
    });

    // 5. CLOSEOUT_REQUIRED → no prompt, exits non-zero
    withTempDir((tempDir) => {
      const stateDir = writeContract(tempDir);

      fs.writeFileSync(
        path.join(stateDir, "next-action.md"),
        "TYPE: FEATURE\nPACKET_ID: active-packet-v1\n",
        "utf8"
      );

      const result = run(tempDir, [], undefined);

      assert.ok(
        result.stdout.includes("CLOSEOUT_REQUIRED"),
        `Expected CLOSEOUT_REQUIRED. Got:\n${result.stdout}`
      );
      assert.ok(
        !result.stdout.includes("Proceed with this action?"),
        `Expected no prompt on CLOSEOUT_REQUIRED. Got:\n${result.stdout}`
      );
      assert.strictEqual(result.status, 1, "Expected non-zero exit on CLOSEOUT_REQUIRED");
      console.log("  PASS: CLOSEOUT_REQUIRED — no prompt, exits non-zero");
    });

    // 6. ALLOW + "N" explicitly → Cancelled
    withTempDir((tempDir) => {
      writeContract(tempDir);

      const result = run(tempDir, [], "N\n");

      assert.ok(
        result.stdout.includes("Cancelled."),
        `Expected Cancelled message. Got:\n${result.stdout}`
      );
      console.log("  PASS: user enters N → Cancelled");
    });

    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  }
}

main();
