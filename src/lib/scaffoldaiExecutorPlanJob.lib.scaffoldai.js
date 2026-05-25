"use strict";

const fs = require("fs");
const path = require("path");
const { spawn: defaultSpawn } = require("child_process");
const { randomUUID } = require("crypto");
const {
  resolveExecutorContext,
  buildPlanCommand,
  buildPlanPrompt,
} = require("./executorAdapter.lib.scaffoldai");

// -----------------------------------------------------------------------
// Executor Plan Job — Async artifact-backed job system
// -----------------------------------------------------------------------
//
// Artifact layout per job:
//   .scaffoldai/runtime/executor-plans/<job-id>/
//     request.json   — job identity, context, command boundary
//     status.json    — current lifecycle state
//     stdout.md      — captured planning output (written on completion)
//     stderr.log     — captured stderr output (written on completion)
//     result.json    — full result artifact (written on completion)
//
// Job lifecycle states:
//   running → completed | failed | timed_out
//
// Lifecycle separation guarantees (same as blocking tool):
//   ✅ Read files and repository state
//   ✅ Analyze code and plan
//   ✅ Persist durable planning artifacts
//   ❌ Cannot activate packets
//   ❌ Cannot close packets
//   ❌ Cannot mutate approval state
//   ❌ Cannot mutate workflow phases
//   ❌ Cannot accept arbitrary prompt text
//   ❌ Cannot accept arbitrary shell commands
//   ❌ Cannot mutate Consync artifact directories
// -----------------------------------------------------------------------

const PLANS_SUBPATH = path.join(".scaffoldai", "runtime", "executor-plans");
const DEFAULT_TIMEOUT_MS = 120000;
const MIN_TIMEOUT_MS = 10000;
const MAX_TIMEOUT_MS = 600000;
const MAX_OUTPUT_CHARS = 8000;
const DEFAULT_CLEANUP_AGE_MS = 24 * 60 * 60 * 1000;

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

function plansDir(repoRoot) {
  return path.join(repoRoot, PLANS_SUBPATH);
}

function jobDir(repoRoot, jobId) {
  return path.join(plansDir(repoRoot), jobId);
}

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeJsonAtomic(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

// -----------------------------------------------------------------------
// createAndStartJob
// -----------------------------------------------------------------------

/**
 * Create and start an async executor planning job.
 *
 * Sequence:
 *   1. resolveExecutorContext — reads active packet and next-action from disk
 *   2. Generate job ID, create artifact directory
 *   3. Write request.json and initial status.json
 *   4. Spawn Copilot asynchronously (shell: false)
 *   5. Return immediately with { status: "running", job_id, active_packet_id, ... }
 *   6. On Copilot close: write stdout.md, stderr.log, result.json, update status.json
 *
 * @param {string} repoRoot
 * @param {object} args - { timeout_ms? }
 * @param {object} deps - Injectable: { spawn, randomUUID, now }
 */
function createAndStartJob(repoRoot, args = {}, deps = {}) {
  const now = deps.now instanceof Date ? deps.now : new Date();
  const spawnFn = typeof deps.spawn === "function" ? deps.spawn : defaultSpawn;
  const uuidFn = typeof deps.randomUUID === "function" ? deps.randomUUID : randomUUID;
  const timeoutMs = clampTimeoutMs(args.timeout_ms);

  // 1. Resolve executor context — fails closed if no active packet
  let context;
  try {
    context = resolveExecutorContext(repoRoot);
  } catch (err) {
    return {
      tool: "scaffoldai_executor_plan_start",
      status: "refused",
      job_id: null,
      active_packet_id: null,
      refusal_reason: err.message,
      next_safe_action: "Mount an active packet before requesting executor planning output.",
    };
  }

  // 2. Create job artifact directory
  const jobId = uuidFn();
  const dir = jobDir(repoRoot, jobId);
  fs.mkdirSync(dir, { recursive: true });

  // 3. Build bounded command (no arbitrary prompt accepted from caller)
  const prompt = buildPlanPrompt(context);
  const command = buildPlanCommand({ repoRoot, prompt });

  const commandBoundary = {
    executable: command.executable,
    planning_flags: ["--plan", "--silent", "--disable-builtin-mcps"],
    deny_tools: ["write", "shell(*)"],
  };

  // 4. Write request.json
  writeJsonAtomic(path.join(dir, "request.json"), {
    job_id: jobId,
    active_packet_id: context.activePacket,
    started_at: now.toISOString(),
    timeout_ms: timeoutMs,
    command_boundary: commandBoundary,
  });

  // 5. Write initial status.json
  writeJsonAtomic(path.join(dir, "status.json"), {
    job_id: jobId,
    active_packet_id: context.activePacket,
    status: "running",
    started_at: now.toISOString(),
    completed_at: null,
  });

  // 6. Spawn Copilot asynchronously (shell: false — no shell proxy)
  const startedAt = Date.now();
  let proc;
  try {
    proc = spawnFn(command.executable, command.args, {
      cwd: repoRoot,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (spawnErr) {
    const completedAt = new Date().toISOString();
    const errorMsg = spawnErr && spawnErr.message ? spawnErr.message : String(spawnErr);
    writeJsonAtomic(path.join(dir, "result.json"), {
      job_id: jobId,
      active_packet_id: context.activePacket,
      status: "failed",
      exit_code: null,
      duration_ms: 0,
      started_at: now.toISOString(),
      completed_at: completedAt,
      stdout: "",
      stderr: errorMsg,
      command_boundary: commandBoundary,
      error_code: "SPAWN_EXCEPTION",
    });
    fs.writeFileSync(path.join(dir, "stdout.md"), "", "utf8");
    fs.writeFileSync(path.join(dir, "stderr.log"), errorMsg, "utf8");
    writeJsonAtomic(path.join(dir, "status.json"), {
      job_id: jobId,
      active_packet_id: context.activePacket,
      status: "failed",
      started_at: now.toISOString(),
      completed_at: completedAt,
    });
    return {
      tool: "scaffoldai_executor_plan_start",
      status: "failed",
      job_id: jobId,
      active_packet_id: context.activePacket,
      started_at: now.toISOString(),
      error_code: "SPAWN_EXCEPTION",
      error_message: errorMsg,
      next_safe_action: "Review spawn error. Ensure Copilot CLI is installed and accessible.",
    };
  }

  let stdoutBuf = "";
  let stderrBuf = "";

  if (proc.stdout) proc.stdout.on("data", (chunk) => { stdoutBuf += chunk; });
  if (proc.stderr) proc.stderr.on("data", (chunk) => { stderrBuf += chunk; });

  const timer = setTimeout(() => {
    try { proc.kill(); } catch { /* already exited */ }
  }, timeoutMs);

  function finalizeJob(code, signal) {
    clearTimeout(timer);

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAt;
    const timedOut = signal === "SIGTERM" && typeof code !== "number";

    fs.mkdirSync(dir, { recursive: true });

    const jobStatus = timedOut
      ? "timed_out"
      : typeof code === "number" && code === 0
      ? "completed"
      : "failed";

    const stdout = tailText(stdoutBuf);
    const stderr = tailText(stderrBuf);

    fs.writeFileSync(path.join(dir, "stdout.md"), stdout, "utf8");
    fs.writeFileSync(path.join(dir, "stderr.log"), stderr, "utf8");

    writeJsonAtomic(path.join(dir, "result.json"), {
      job_id: jobId,
      active_packet_id: context.activePacket,
      status: jobStatus,
      exit_code: typeof code === "number" ? code : null,
      duration_ms: durationMs,
      started_at: now.toISOString(),
      completed_at: completedAt,
      stdout,
      stderr,
      command_boundary: commandBoundary,
    });

    writeJsonAtomic(path.join(dir, "status.json"), {
      job_id: jobId,
      active_packet_id: context.activePacket,
      status: jobStatus,
      started_at: now.toISOString(),
      completed_at: completedAt,
    });
  }

  proc.on("close", finalizeJob);

  proc.on("error", (err) => {
    clearTimeout(timer);

    const completedAt = new Date().toISOString();
    const errMsg = err && err.message ? err.message : String(err);

    fs.writeFileSync(path.join(dir, "stdout.md"), "", "utf8");
    fs.writeFileSync(path.join(dir, "stderr.log"), errMsg, "utf8");

    writeJsonAtomic(path.join(dir, "result.json"), {
      job_id: jobId,
      active_packet_id: context.activePacket,
      status: "failed",
      exit_code: null,
      duration_ms: Date.now() - startedAt,
      started_at: now.toISOString(),
      completed_at: completedAt,
      stdout: "",
      stderr: errMsg,
      command_boundary: commandBoundary,
      error_code: "RUNNER_EXCEPTION",
    });

    writeJsonAtomic(path.join(dir, "status.json"), {
      job_id: jobId,
      active_packet_id: context.activePacket,
      status: "failed",
      started_at: now.toISOString(),
      completed_at: completedAt,
    });
  });

  return {
    tool: "scaffoldai_executor_plan_start",
    status: "running",
    job_id: jobId,
    active_packet_id: context.activePacket,
    started_at: now.toISOString(),
    timeout_ms: timeoutMs,
    artifact_path: path.join(PLANS_SUBPATH, jobId),
    next_safe_action: `Job started. Poll with scaffoldai_executor_plan_status using job_id: ${jobId}`,
  };
}

// -----------------------------------------------------------------------
// getJobStatus
// -----------------------------------------------------------------------

/**
 * Read job status from artifact disk.
 *
 * @param {string} repoRoot
 * @param {string} jobId
 * @returns {object}
 */
function getJobStatus(repoRoot, jobId) {
  if (!jobId || typeof jobId !== "string") {
    return {
      tool: "scaffoldai_executor_plan_status",
      status: "invalid_request",
      job_id: jobId || null,
      active_packet_id: null,
      error: "job_id is required",
    };
  }

  const dir = jobDir(repoRoot, jobId);
  const statusPath = path.join(dir, "status.json");

  if (!fs.existsSync(statusPath)) {
    return {
      tool: "scaffoldai_executor_plan_status",
      status: "not_found",
      job_id: jobId,
      active_packet_id: null,
      error: `No job artifact found for job_id: ${jobId}`,
    };
  }

  const data = readJsonSafe(statusPath);
  if (!data) {
    return {
      tool: "scaffoldai_executor_plan_status",
      status: "error",
      job_id: jobId,
      active_packet_id: null,
      error: "Failed to parse status.json",
    };
  }

  return {
    tool: "scaffoldai_executor_plan_status",
    ...data,
  };
}

// -----------------------------------------------------------------------
// getJobResult
// -----------------------------------------------------------------------

/**
 * Read job result from artifact disk.
 * Returns partial status if result.json is not yet available.
 *
 * @param {string} repoRoot
 * @param {string} jobId
 * @returns {object}
 */
function getJobResult(repoRoot, jobId) {
  if (!jobId || typeof jobId !== "string") {
    return {
      tool: "scaffoldai_executor_plan_result",
      status: "invalid_request",
      job_id: jobId || null,
      active_packet_id: null,
      result_available: false,
      error: "job_id is required",
    };
  }

  const dir = jobDir(repoRoot, jobId);
  const resultPath = path.join(dir, "result.json");

  if (!fs.existsSync(resultPath)) {
    const statusData = getJobStatus(repoRoot, jobId);
    return {
      tool: "scaffoldai_executor_plan_result",
      job_id: jobId,
      active_packet_id: statusData.active_packet_id || null,
      status: statusData.status,
      result_available: false,
      next_safe_action:
        statusData.status === "running"
          ? "Job is still running. Poll scaffoldai_executor_plan_status again shortly."
          : statusData.status === "not_found"
          ? `No job found for job_id: ${jobId}`
          : "Result not yet available.",
    };
  }

  const data = readJsonSafe(resultPath);
  if (!data) {
    return {
      tool: "scaffoldai_executor_plan_result",
      status: "error",
      job_id: jobId,
      active_packet_id: null,
      result_available: false,
      error: "Failed to parse result.json",
    };
  }

  return {
    tool: "scaffoldai_executor_plan_result",
    ...data,
    result_available: true,
    next_safe_action:
      data.status === "completed"
        ? "Planning complete. Review plan output, then ask operator to approve or continue."
        : data.status === "timed_out"
        ? "Planning timed out. Retry with a higher timeout_ms."
        : "Planning did not complete successfully. Review stderr for details.",
  };
}

// -----------------------------------------------------------------------
// cleanupJobs
// -----------------------------------------------------------------------

/**
 * Clean up old completed executor plan job directories.
 * Never removes running jobs. Never removes append-only logs.
 *
 * @param {string} repoRoot
 * @param {object} opts - { max_age_ms? }
 * @returns {{ removed: number, jobs: string[] }}
 */
function cleanupJobs(repoRoot, opts = {}) {
  const dir = plansDir(repoRoot);

  if (!fs.existsSync(dir)) {
    return {
      tool: "scaffoldai_executor_plan_cleanup",
      removed: 0,
      jobs: [],
      next_safe_action: "No executor-plan runtime artifacts found.",
    };
  }

  const maxAgeMs =
    typeof opts.max_age_ms === "number" && opts.max_age_ms > 0
      ? opts.max_age_ms
      : DEFAULT_CLEANUP_AGE_MS;

  const now = Date.now();
  const entries = fs.readdirSync(dir);
  const removed = [];

  for (const entry of entries) {
    const jobPath = path.join(dir, entry);
    const statusPath = path.join(jobPath, "status.json");

    if (!fs.existsSync(statusPath)) continue;

    const status = readJsonSafe(statusPath);
    if (!status) continue;

    // Never remove running jobs
    if (status.status === "running") continue;

    const completedAt = status.completed_at ? new Date(status.completed_at).getTime() : 0;
    if (now - completedAt >= maxAgeMs) {
      try {
        fs.rmSync(jobPath, { recursive: true, force: true });
        removed.push(entry);
      } catch {
        // skip non-removable entries
      }
    }
  }

  return {
    tool: "scaffoldai_executor_plan_cleanup",
    removed: removed.length,
    jobs: removed,
    next_safe_action:
      removed.length === 0
        ? "No eligible completed jobs to clean up."
        : `Removed ${removed.length} completed job artifact(s).`,
  };
}

module.exports = {
  DEFAULT_TIMEOUT_MS,
  MIN_TIMEOUT_MS,
  MAX_TIMEOUT_MS,
  MAX_OUTPUT_CHARS,
  DEFAULT_CLEANUP_AGE_MS,
  PLANS_SUBPATH,
  clampTimeoutMs,
  tailText,
  createAndStartJob,
  getJobStatus,
  getJobResult,
  cleanupJobs,
};
