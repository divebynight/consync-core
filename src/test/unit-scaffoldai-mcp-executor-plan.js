"use strict";

const assert = require("assert");
const path = require("path");

const {
  EXECUTION_CLASS,
  DEFAULT_TIMEOUT_MS,
  MAX_OUTPUT_CHARS,
  clampTimeoutMs,
  tailText,
  runExecutorPlanTool,
} = require("../lib/scaffoldaiExecutorPlan.tool.scaffoldai");

const TEST_NAME = "unit-scaffoldai-mcp-executor-plan";
const repoRoot = path.resolve(__dirname, "..", "..");

console.log(`[${TEST_NAME}] Running`);

// -----------------------------------------------------------------------
// Test 1: Module loads and exports expected symbols
// -----------------------------------------------------------------------

{
  assert.strictEqual(EXECUTION_CLASS, "LOCAL_EXECUTOR_PLAN", "EXECUTION_CLASS should be LOCAL_EXECUTOR_PLAN");
  assert.strictEqual(typeof DEFAULT_TIMEOUT_MS, "number", "DEFAULT_TIMEOUT_MS should be a number");
  assert.strictEqual(typeof MAX_OUTPUT_CHARS, "number", "MAX_OUTPUT_CHARS should be a number");
  assert.strictEqual(typeof clampTimeoutMs, "function", "clampTimeoutMs should be a function");
  assert.strictEqual(typeof tailText, "function", "tailText should be a function");
  assert.strictEqual(typeof runExecutorPlanTool, "function", "runExecutorPlanTool should be a function");
  console.log("  PASS: module exports expected symbols");
}

// -----------------------------------------------------------------------
// Test 2: tools.js exports runExecutorPlanToolMcp
// -----------------------------------------------------------------------

{
  let toolsMod;
  try {
    toolsMod = require("../scaffoldai/mcp/tools");
  } catch (err) {
    console.error(`  FAIL: tools.js threw on require: ${err.message}`);
    process.exitCode = 1;
  }

  if (toolsMod) {
    assert.strictEqual(
      typeof toolsMod.runExecutorPlanToolMcp,
      "function",
      "tools.js should export runExecutorPlanToolMcp"
    );
    console.log("  PASS: tools.js exports runExecutorPlanToolMcp");
  }
}

// -----------------------------------------------------------------------
// Test 3: server.js registers scaffoldai_executor_plan
// -----------------------------------------------------------------------

{
  const fs = require("fs");
  const serverPath = path.join(__dirname, "..", "scaffoldai", "mcp", "server.js");
  const source = fs.readFileSync(serverPath, "utf8");
  assert.ok(source.includes('"scaffoldai_executor_plan"'), "server.js should register scaffoldai_executor_plan");
  console.log("  PASS: server.js registers scaffoldai_executor_plan");
}

// -----------------------------------------------------------------------
// Test 4: Refusal when no active packet (mocked context resolution failure)
// -----------------------------------------------------------------------

{
  const result = runExecutorPlanTool(
    "/does/not/exist/scaffoldai-executor-plan-test",
    {},
    { now: new Date("2026-05-25T00:00:00.000Z") }
  );

  assert.strictEqual(result.tool, "scaffoldai_executor_plan", "refusal: tool name should be scaffoldai_executor_plan");
  assert.strictEqual(result.execution_class, EXECUTION_CLASS, "refusal: execution_class should be LOCAL_EXECUTOR_PLAN");
  assert.strictEqual(result.status, "refused", "refusal: status should be refused for non-existent repoRoot");
  assert.strictEqual(result.active_packet, null, "refusal: active_packet should be null");
  assert.strictEqual(result.planning_mode, "PLAN", "refusal: planning_mode should be PLAN");
  assert.ok(typeof result.refusal_reason === "string" && result.refusal_reason.length > 0, "refusal: refusal_reason should be a non-empty string");
  assert.ok(typeof result.next_safe_action === "string", "refusal: next_safe_action should be a string");
  assert.strictEqual(result.stdout, "", "refusal: stdout should be empty");
  assert.strictEqual(result.stderr, "", "refusal: stderr should be empty");
  assert.strictEqual(result.exit_code, null, "refusal: exit_code should be null");
  assert.strictEqual(result.command_boundary, null, "refusal: command_boundary should be null");
  console.log("  PASS: runExecutorPlanTool refuses with structured response when repoRoot is invalid");
}

// -----------------------------------------------------------------------
// Test 5: Structured response shape with mocked executor (active packet present)
// -----------------------------------------------------------------------

{
  const mockExecute = () => ({ status: 0, stdout: "## Plan\n\nAnalysis complete.", stderr: "", error: null });
  const now = new Date("2026-05-25T12:00:00.000Z");

  const result = runExecutorPlanTool(repoRoot, {}, { execute: mockExecute, now });

  assert.strictEqual(result.tool, "scaffoldai_executor_plan", "shape: tool name should be scaffoldai_executor_plan");
  assert.strictEqual(result.execution_class, EXECUTION_CLASS, "shape: execution_class should be LOCAL_EXECUTOR_PLAN");
  assert.strictEqual(result.status, "complete", "shape: status should be complete for exit code 0");
  assert.ok(typeof result.active_packet === "string" && result.active_packet.length > 0, "shape: active_packet should be a non-empty string");
  assert.strictEqual(result.planning_mode, "PLAN", "shape: planning_mode should be PLAN");
  assert.ok(typeof result.repo_root === "string", "shape: repo_root should be a string");
  assert.ok(result.command_boundary !== null, "shape: command_boundary should not be null");
  assert.strictEqual(result.command_boundary.executable, "copilot", "shape: command_boundary.executable should be copilot");
  assert.ok(Array.isArray(result.command_boundary.planning_flags), "shape: command_boundary.planning_flags should be an array");
  assert.ok(result.command_boundary.planning_flags.includes("--plan"), "shape: planning_flags should include --plan");
  assert.ok(Array.isArray(result.command_boundary.deny_tools), "shape: command_boundary.deny_tools should be an array");
  assert.ok(result.command_boundary.deny_tools.includes("write"), "shape: deny_tools should include write");
  assert.ok(result.command_boundary.deny_tools.includes("shell(*)"), "shape: deny_tools should include shell(*)");
  assert.ok(typeof result.stdout === "string", "shape: stdout should be a string");
  assert.ok(typeof result.stderr === "string", "shape: stderr should be a string");
  assert.strictEqual(result.exit_code, 0, "shape: exit_code should be 0 for success");
  assert.ok(typeof result.duration_ms === "number", "shape: duration_ms should be a number");
  assert.strictEqual(result.timestamp, "2026-05-25T12:00:00.000Z", "shape: timestamp should match injected now");
  assert.strictEqual(result.refusal_reason, null, "shape: refusal_reason should be null on success");
  assert.ok(typeof result.next_safe_action === "string", "shape: next_safe_action should be a string");
  console.log("  PASS: runExecutorPlanTool returns complete structured response shape");
}

// -----------------------------------------------------------------------
// Test 6: Command boundary construction reuses buildPlanCommand flags
// -----------------------------------------------------------------------

{
  const capturedArgs = {};
  const mockExecute = (executable, args, options) => {
    capturedArgs.executable = executable;
    capturedArgs.args = args;
    capturedArgs.options = options;
    return { status: 0, stdout: "plan output", stderr: "", error: null };
  };

  runExecutorPlanTool(repoRoot, {}, { execute: mockExecute });

  assert.strictEqual(capturedArgs.executable, "copilot", "boundary: executable should be copilot");
  assert.ok(capturedArgs.args.includes("--plan"), "boundary: args should include --plan");
  assert.ok(capturedArgs.args.includes("--silent"), "boundary: args should include --silent");
  assert.ok(capturedArgs.args.includes("--disable-builtin-mcps"), "boundary: args should include --disable-builtin-mcps");
  assert.ok(capturedArgs.args.includes("--deny-tool=write"), "boundary: args should deny write tool");
  assert.ok(capturedArgs.args.includes("--deny-tool=shell(*)"), "boundary: args should deny shell(*) tool");
  assert.ok(!capturedArgs.args.includes("--allow-tool=write"), "boundary: args must not allow write tool");
  assert.ok(capturedArgs.args.includes("-C"), "boundary: args should include -C flag");
  assert.strictEqual(capturedArgs.options.shell, false, "boundary: shell should be false — no shell execution");
  console.log("  PASS: command boundary reuses buildPlanCommand flags correctly");
}

// -----------------------------------------------------------------------
// Test 7: No arbitrary shell command input accepted
// -----------------------------------------------------------------------

{
  const capturedArgs = {};
  const mockExecute = (executable, args, options) => {
    capturedArgs.executable = executable;
    capturedArgs.args = [...args];
    return { status: 0, stdout: "plan output", stderr: "", error: null };
  };

  // Pass an attacker-controlled "command" — the tool must not use it
  runExecutorPlanTool(repoRoot, { command: "rm -rf /", timeout_ms: 10000 }, { execute: mockExecute });

  assert.ok(!capturedArgs.args.includes("rm -rf /"), "no-shell: injected command string must not appear in args");
  assert.ok(!capturedArgs.args.some((arg) => arg.includes("rm -rf")), "no-shell: injected shell fragment must not appear in any arg");
  assert.strictEqual(capturedArgs.executable, "copilot", "no-shell: executable must always be copilot");
  console.log("  PASS: arbitrary command input is not accepted or passed through");
}

// -----------------------------------------------------------------------
// Test 8: status is 'failed' when exit code is non-zero
// -----------------------------------------------------------------------

{
  const mockExecute = () => ({ status: 1, stdout: "", stderr: "copilot error", error: null });

  const result = runExecutorPlanTool(repoRoot, {}, { execute: mockExecute });

  assert.strictEqual(result.status, "failed", "failure: status should be failed for non-zero exit code");
  assert.strictEqual(result.exit_code, 1, "failure: exit_code should be 1");
  assert.ok(typeof result.stderr === "string", "failure: stderr should be a string");
  console.log("  PASS: runExecutorPlanTool returns failed status for non-zero exit code");
}

// -----------------------------------------------------------------------
// Test 9: status is 'timeout' when runner returns ETIMEDOUT
// -----------------------------------------------------------------------

{
  const mockExecute = () => ({
    status: null,
    stdout: "",
    stderr: "",
    error: { code: "ETIMEDOUT" },
  });

  const result = runExecutorPlanTool(repoRoot, {}, { execute: mockExecute });

  assert.strictEqual(result.status, "timeout", "timeout: status should be timeout for ETIMEDOUT");
  assert.strictEqual(result.exit_code, null, "timeout: exit_code should be null for ETIMEDOUT");
  console.log("  PASS: runExecutorPlanTool returns timeout status for ETIMEDOUT error");
}

// -----------------------------------------------------------------------
// Test 10: clampTimeoutMs stays within bounds
// -----------------------------------------------------------------------

{
  assert.strictEqual(clampTimeoutMs(undefined), DEFAULT_TIMEOUT_MS, "clamp: undefined should return DEFAULT_TIMEOUT_MS");
  assert.strictEqual(clampTimeoutMs(null), DEFAULT_TIMEOUT_MS, "clamp: null should return DEFAULT_TIMEOUT_MS");
  assert.strictEqual(clampTimeoutMs(5000), 10000, "clamp: values below MIN should be clamped to MIN");
  assert.strictEqual(clampTimeoutMs(700000), 600000, "clamp: values above MAX should be clamped to MAX");
  assert.strictEqual(clampTimeoutMs(60000), 60000, "clamp: values in range should pass through");
  console.log("  PASS: clampTimeoutMs clamps to valid bounds");
}

// -----------------------------------------------------------------------
// Test 11: tailText truncates long output
// -----------------------------------------------------------------------

{
  const short = "short text";
  assert.strictEqual(tailText(short), short, "tail: short text should pass through unchanged");

  const long = "x".repeat(MAX_OUTPUT_CHARS + 100);
  const result = tailText(long);
  assert.strictEqual(result.length, MAX_OUTPUT_CHARS, "tail: long text should be truncated to MAX_OUTPUT_CHARS");
  assert.ok(result === long.slice(-MAX_OUTPUT_CHARS), "tail: truncation should take the tail (last chars)");
  console.log("  PASS: tailText truncates long output to MAX_OUTPUT_CHARS tail");
}

// -----------------------------------------------------------------------
// Test 12: Lifecycle separation — tool does not write to disk
// -----------------------------------------------------------------------

{
  const fs = require("fs");
  const source = fs.readFileSync(path.join(__dirname, "..", "lib", "scaffoldaiExecutorPlan.tool.scaffoldai.js"), "utf8");

  assert.ok(!source.includes("writeFileSync"), "lifecycle: tool must not writeFileSync");
  assert.ok(!source.includes("appendFileSync"), "lifecycle: tool must not appendFileSync");
  assert.ok(!source.includes("mkdirSync"), "lifecycle: tool must not mkdirSync");
  assert.ok(!source.includes(".scaffoldai/state"), "lifecycle: tool must not mutate .scaffoldai/state");
  assert.ok(!source.includes(".consync"), "lifecycle: tool must not touch .consync");
  assert.ok(!source.includes("git commit"), "lifecycle: tool must not run git commit");
  assert.ok(!source.includes("git push"), "lifecycle: tool must not run git push");
  console.log("  PASS: scaffoldaiExecutorPlan.tool.scaffoldai.js does not contain lifecycle-mutating operations");
}

if (process.exitCode !== 1) {
  console.log(`[${TEST_NAME}] PASS`);
}
