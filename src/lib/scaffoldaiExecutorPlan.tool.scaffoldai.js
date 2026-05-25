"use strict";

const { spawnSync } = require("child_process");
const {
  resolveExecutorContext,
  buildPlanCommand,
  buildPlanPrompt,
} = require("./executorAdapter.lib.scaffoldai");

// -----------------------------------------------------------------------
// scaffoldai_executor_plan — Bounded MCP executor planning tool
// -----------------------------------------------------------------------
//
// Exposes the ScaffoldAI bounded planning path through the MCP server so
// a coordinator can request and receive executor planning output without
// shell access.
//
// Lifecycle separation guarantees:
//   ✅ Read files and repository state
//   ✅ Analyze code and plan
//   ✅ Return structured plan output
//   ❌ Cannot activate packets
//   ❌ Cannot close packets
//   ❌ Cannot verify packets
//   ❌ Cannot mutate approval state
//   ❌ Cannot mutate workflow phases
//   ❌ Cannot perform work-mode execution
//   ❌ Cannot accept arbitrary shell commands
//   ❌ Cannot accept arbitrary executable strings
// -----------------------------------------------------------------------

const EXECUTION_CLASS = "LOCAL_EXECUTOR_PLAN";
const DEFAULT_TIMEOUT_MS = 120000;
const MIN_TIMEOUT_MS = 10000;
const MAX_TIMEOUT_MS = 600000;
const MAX_OUTPUT_CHARS = 8000;

function clampTimeoutMs(value) {
  if (!Number.isFinite(value)) return DEFAULT_TIMEOUT_MS;
  const integer = Math.trunc(value);
  if (integer < MIN_TIMEOUT_MS) return MIN_TIMEOUT_MS;
  if (integer > MAX_TIMEOUT_MS) return MAX_TIMEOUT_MS;
  return integer;
}

function tailText(value) {
  const text = typeof value === "string" ? value : "";
  if (text.length <= MAX_OUTPUT_CHARS) return text;
  return text.slice(-MAX_OUTPUT_CHARS);
}

/**
 * Run the bounded executor plan tool.
 *
 * Sequence (lifecycle-separated):
 *   1. resolveExecutorContext — reads active packet and next-action from disk
 *   2. buildPlanPrompt — constructs deterministic planning prompt from context
 *   3. buildPlanCommand — constructs bounded Copilot CLI command descriptor
 *   4. spawnSync (injectable via deps.execute) — invokes Copilot with bounded flags
 *
 * @param {string} repoRoot - Absolute path to repository root
 * @param {object} args - Tool arguments (timeout_ms)
 * @param {object} deps - Injectable dependencies for testing (execute, now)
 * @returns {object} Structured tool response
 */
function runExecutorPlanTool(repoRoot, args = {}, deps = {}) {
  const now = deps.now instanceof Date ? deps.now : new Date();
  const execute = typeof deps.execute === "function" ? deps.execute : spawnSync;
  const timeoutMs = clampTimeoutMs(args.timeout_ms);

  // 1. Resolve executor context — fails closed if no active packet or next-action
  let context;
  try {
    context = resolveExecutorContext(repoRoot);
  } catch (err) {
    return {
      tool: "scaffoldai_executor_plan",
      execution_class: EXECUTION_CLASS,
      status: "refused",
      active_packet: null,
      planning_mode: "PLAN",
      repo_root: repoRoot,
      command_boundary: null,
      stdout: "",
      stderr: "",
      exit_code: null,
      duration_ms: 0,
      timestamp: now.toISOString(),
      refusal_reason: err.message,
      next_safe_action: "Mount an active packet before requesting executor planning output.",
    };
  }

  // 2. Build planning prompt from context
  const prompt = buildPlanPrompt(context);

  // 3. Build bounded command descriptor
  const command = buildPlanCommand({ repoRoot, prompt });

  const commandBoundary = {
    executable: command.executable,
    planning_flags: ["--plan", "--silent", "--disable-builtin-mcps"],
    deny_tools: ["write", "shell(*)"],
  };

  // 4. Execute bounded planning request
  const startedAt = Date.now();
  let result;

  try {
    result = execute(command.executable, command.args, {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: timeoutMs,
      maxBuffer: 2 * 1024 * 1024,
      shell: false,
    });
  } catch (error) {
    return {
      tool: "scaffoldai_executor_plan",
      execution_class: EXECUTION_CLASS,
      status: "error",
      active_packet: context.activePacket,
      planning_mode: "PLAN",
      repo_root: repoRoot,
      command_boundary: commandBoundary,
      stdout: "",
      stderr: "",
      exit_code: null,
      duration_ms: Date.now() - startedAt,
      timestamp: now.toISOString(),
      refusal_reason: null,
      error_code: "RUNNER_EXCEPTION",
      error_message: error && error.message ? error.message : String(error),
      next_safe_action: "Review runner error. Check that Copilot CLI is installed and accessible.",
    };
  }

  const exitCode = typeof result.status === "number" ? result.status : null;
  const status =
    result.error && result.error.code === "ETIMEDOUT"
      ? "timeout"
      : result.error
      ? "error"
      : exitCode === 0
      ? "complete"
      : "failed";

  return {
    tool: "scaffoldai_executor_plan",
    execution_class: EXECUTION_CLASS,
    status,
    active_packet: context.activePacket,
    planning_mode: "PLAN",
    repo_root: repoRoot,
    command_boundary: commandBoundary,
    stdout: tailText(result.stdout),
    stderr: tailText(result.stderr),
    exit_code: exitCode,
    duration_ms: Date.now() - startedAt,
    timestamp: now.toISOString(),
    refusal_reason: null,
    next_safe_action:
      status === "complete"
        ? "Planning complete. Review plan output, then ask operator to approve or continue."
        : status === "timeout"
        ? "Planning timed out. Retry with a higher timeout."
        : "Planning did not complete successfully. Review stderr for details.",
  };
}

module.exports = {
  EXECUTION_CLASS,
  DEFAULT_TIMEOUT_MS,
  MAX_OUTPUT_CHARS,
  clampTimeoutMs,
  tailText,
  runExecutorPlanTool,
};
