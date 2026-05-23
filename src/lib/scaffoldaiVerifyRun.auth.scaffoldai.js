"use strict";

const { spawnSync } = require("child_process");
const { readActiveContract, resolveVerifyCommand } = require("./resolveVerifyCommand.query.scaffoldai");

const EXECUTION_CLASS = "LOCAL_VERIFY_RUNNER";
const DEFAULT_TIMEOUT_MS = 180000;
const MIN_TIMEOUT_MS = 1000;
const MAX_TIMEOUT_MS = 600000;
const MAX_TAIL_CHARS = 4000;

const ALLOWED_VERIFY_COMMANDS = {
  "npm run verify:scaffoldai": {
    command: "npm",
    args: ["run", "verify:scaffoldai"],
  },
};

function clampTimeoutMs(value) {
  if (!Number.isFinite(value)) return DEFAULT_TIMEOUT_MS;
  const integer = Math.trunc(value);
  if (integer < MIN_TIMEOUT_MS) return MIN_TIMEOUT_MS;
  if (integer > MAX_TIMEOUT_MS) return MAX_TIMEOUT_MS;
  return integer;
}

function tailText(value) {
  const text = typeof value === "string" ? value : "";
  if (text.length <= MAX_TAIL_CHARS) return text;
  return text.slice(-MAX_TAIL_CHARS);
}

function mapRunnerStatus(result) {
  if (result && result.error && result.error.code === "ETIMEDOUT") {
    return "timeout";
  }

  if (result && result.error) {
    return "error";
  }

  if (result && result.status === 0) {
    return "passed";
  }

  if (result && typeof result.status === "number") {
    return "failed";
  }

  return "error";
}

function resolveAllowlistedCommand(repoRoot, requestedCommand) {
  if (requestedCommand) {
    const key = String(requestedCommand).trim();
    return {
      commandKey: key,
      resolved: ALLOWED_VERIFY_COMMANDS[key] || null,
      reason: "requested",
    };
  }

  const contract = readActiveContract(repoRoot);
  const recommendation = resolveVerifyCommand(contract, {});

  if (recommendation && !recommendation.error && ALLOWED_VERIFY_COMMANDS[recommendation.command]) {
    return {
      commandKey: recommendation.command,
      resolved: ALLOWED_VERIFY_COMMANDS[recommendation.command],
      reason: "recommended",
    };
  }

  return {
    commandKey: "npm run verify:scaffoldai",
    resolved: ALLOWED_VERIFY_COMMANDS["npm run verify:scaffoldai"],
    reason: "default",
  };
}

function runVerifyTool(repoRoot, args = {}, deps = {}) {
  const now = deps.now instanceof Date ? deps.now : new Date();
  const execute = typeof deps.execute === "function" ? deps.execute : spawnSync;
  const timeoutMs = clampTimeoutMs(args.timeout_ms);

  const selected = resolveAllowlistedCommand(repoRoot, args.command);

  if (!selected.resolved) {
    return {
      tool: "scaffoldai_verify_run",
      execution_class: EXECUTION_CLASS,
      status: "error",
      command: selected.commandKey,
      exit_code: null,
      duration_ms: 0,
      stdout_tail: "",
      stderr_tail: "",
      timestamp: now.toISOString(),
      error_code: "COMMAND_NOT_ALLOWED",
      error_message: `Unknown or blocked verify command: ${selected.commandKey}`,
      next_safe_action: "Use an allowlisted verify command only.",
    };
  }

  const startedAt = Date.now();
  let result;

  try {
    result = execute(selected.resolved.command, selected.resolved.args, {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024,
      shell: false,
    });
  } catch (error) {
    return {
      tool: "scaffoldai_verify_run",
      execution_class: EXECUTION_CLASS,
      status: "error",
      command: selected.commandKey,
      exit_code: null,
      duration_ms: Date.now() - startedAt,
      stdout_tail: "",
      stderr_tail: "",
      timestamp: now.toISOString(),
      error_code: "RUNNER_EXCEPTION",
      error_message: error && error.message ? error.message : String(error),
      next_safe_action: "Review runner error and retry with an allowlisted command.",
    };
  }

  const status = mapRunnerStatus(result);
  const durationMs = Date.now() - startedAt;
  const exitCode = typeof result.status === "number" ? result.status : null;

  return {
    tool: "scaffoldai_verify_run",
    execution_class: EXECUTION_CLASS,
    status,
    command: selected.commandKey,
    command_source: selected.reason,
    exit_code: exitCode,
    duration_ms: durationMs,
    stdout_tail: tailText(result.stdout),
    stderr_tail: tailText(result.stderr),
    timeout_ms: timeoutMs,
    timestamp: now.toISOString(),
    next_safe_action:
      status === "passed"
        ? "Verification passed. Continue process flow and emit completion handshake if work is done."
        : status === "timeout"
        ? "Verification timed out. Re-run with a higher allowed timeout or inspect logs."
        : "Verification did not pass. Review output tails and address failures before proceeding.",
  };
}

module.exports = {
  EXECUTION_CLASS,
  ALLOWED_VERIFY_COMMANDS,
  DEFAULT_TIMEOUT_MS,
  MAX_TAIL_CHARS,
  clampTimeoutMs,
  tailText,
  mapRunnerStatus,
  runVerifyTool,
};
