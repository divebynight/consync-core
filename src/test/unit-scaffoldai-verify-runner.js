"use strict";

const assert = require("assert");
const path = require("path");
const {
  runVerifyTool,
  MAX_TAIL_CHARS,
} = require("../lib/scaffoldaiVerifyRun.auth.scaffoldai");

const TEST_NAME = "unit-scaffoldai-verify-runner";
const repoRoot = path.resolve(__dirname, "..", "..");

function main() {
  console.log(`[${TEST_NAME}] Running`);

  // 1) allowlisted command executes and returns passed
  {
    let called = false;
    let receivedCommand = null;
    let receivedArgs = null;
    const result = runVerifyTool(repoRoot, {}, {
      now: new Date("2026-05-15T00:00:00.000Z"),
      execute: (command, args) => {
        called = true;
        receivedCommand = command;
        receivedArgs = args;
        return { status: 0, stdout: "all good", stderr: "" };
      },
    });

    assert.strictEqual(called, true, "runner should call execute for allowlisted command");
    assert.strictEqual(receivedCommand, "npm", "runner should use npm command");
    assert.deepStrictEqual(receivedArgs, ["run", "verify:scaffoldai"], "runner should use allowlisted args");
    assert.strictEqual(result.execution_class, "LOCAL_VERIFY_RUNNER");
    assert.strictEqual(result.status, "passed");
    assert.strictEqual(result.command, "npm run verify:scaffoldai");
    console.log("  PASS: verify runner executes allowlisted verify command");
  }

  // 2) unknown command rejected
  {
    const result = runVerifyTool(repoRoot, { command: "npm run verify:unknown" }, {
      execute: () => {
        throw new Error("execute should not be called for unknown command");
      },
    });

    assert.strictEqual(result.status, "error");
    assert.strictEqual(result.error_code, "COMMAND_NOT_ALLOWED");
    console.log("  PASS: unknown command is rejected");
  }

  // 3) output bounded
  {
    const longStdout = `A${"x".repeat(MAX_TAIL_CHARS + 100)}TAIL`;
    const longStderr = `B${"y".repeat(MAX_TAIL_CHARS + 100)}TAIL`;

    const result = runVerifyTool(repoRoot, {}, {
      execute: () => ({ status: 1, stdout: longStdout, stderr: longStderr }),
    });

    assert.strictEqual(result.status, "failed");
    assert.ok(result.stdout_tail.length <= MAX_TAIL_CHARS, "stdout tail should be bounded");
    assert.ok(result.stderr_tail.length <= MAX_TAIL_CHARS, "stderr tail should be bounded");
    assert.ok(result.stdout_tail.endsWith("TAIL"), "stdout tail should keep last bytes");
    assert.ok(result.stderr_tail.endsWith("TAIL"), "stderr tail should keep last bytes");
    console.log("  PASS: output tails are bounded and truncated from the end");
  }

  // 4) timeout behavior
  {
    const result = runVerifyTool(repoRoot, { timeout_ms: 1500 }, {
      execute: () => ({
        error: { code: "ETIMEDOUT", message: "timed out" },
        status: null,
        stdout: "partial",
        stderr: "timeout",
      }),
    });

    assert.strictEqual(result.status, "timeout");
    assert.strictEqual(result.timeout_ms, 1500);
    console.log("  PASS: timeout behavior is covered");
  }

  console.log(`[${TEST_NAME}] PASS`);
}

main();
