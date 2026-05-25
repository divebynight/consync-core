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
//     request.json          — job identity, context, command boundary
//     status.json           — current lifecycle state (written last)
//     stdout.md             — final captured stdout (written on finalize)
//     stderr.log            — final captured stderr (written on finalize)
//     stdout.partial.log    — incremental stdout (updated on each data event)
//     stderr.partial.log    — incremental stderr (updated on each data event)
//     result.json           — full result artifact (written before status.json)
//
// Job lifecycle states:
//   running → completed | failed | timed_out
//   (stale running → cancelled, by cleanupJobs)
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
//
// Finalization guarantees:
//   - All terminal events (close, error, timeout) converge through doFinalize
//   - doFinalize is idempotent — subsequent calls after first are no-ops
//   - result.json is always written before status.json (result-before-status invariant)
//   - writeJsonAtomic uses write-to-tmp + rename for crash-safe writes
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

// True atomic write: write to .tmp then rename into place.
// Prevents partial-file reads on crash or concurrent access.
function writeJsonAtomic(filePath, value) {
  const tmp = filePath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, filePath);
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
 *   6. On any terminal event (close/error/timeout): converge through doFinalize,
 *      write stdout.md, stderr.log, result.json, then update status.json
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
    planning_flags: ["--plan", "--disable-builtin-mcps"],
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
      pid: null,
      finalize_reason: "spawn_exception",
      terminal_event_source: "spawn_exception",
      stdout_bytes: 0,
      stderr_bytes: Buffer.byteLength(errorMsg),
      timeout_fired: false,
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
  let finalized = false;
  let timeoutFired = false;

  if (proc.stdout) {
    proc.stdout.on("data", (chunk) => {
      stdoutBuf += chunk;
      try {
        fs.writeFileSync(path.join(dir, "stdout.partial.log"), tailText(stdoutBuf), "utf8");
      } catch { /* non-fatal */ }
    });
  }

  if (proc.stderr) {
    proc.stderr.on("data", (chunk) => {
      stderrBuf += chunk;
      try {
        fs.writeFileSync(path.join(dir, "stderr.partial.log"), tailText(stderrBuf), "utf8");
      } catch { /* non-fatal */ }
    });
  }

  const timer = setTimeout(() => {
    timeoutFired = true;
    try { proc.kill(); } catch { /* already exited */ }
  }, timeoutMs);

  // Single idempotent finalize path — all terminal events converge here.
  function doFinalize(reason, { code, errMsg } = {}) {
    if (finalized) return;
    finalized = true;
    clearTimeout(timer);

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAt;

    const jobStatus =
      reason === "timeout" || timeoutFired
        ? "timed_out"
        : reason === "error"
        ? "failed"
        : typeof code === "number" && code === 0
        ? "completed"
        : "failed";

    const stdout = tailText(stdoutBuf);
    const stderr = reason === "error" && errMsg ? tailText(errMsg) : tailText(stderrBuf);

    fs.mkdirSync(dir, { recursive: true });

    // result.json written before status.json (result-before-status invariant)
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
      pid: proc.pid || null,
      finalize_reason: reason,
      terminal_event_source: reason,
      stdout_bytes: Buffer.byteLength(stdoutBuf),
      stderr_bytes: Buffer.byteLength(stderrBuf),
      timeout_fired: timeoutFired,
      ...(reason === "error" ? { error_code: "RUNNER_EXCEPTION" } : {}),
    });

    fs.writeFileSync(path.join(dir, "stdout.md"), stdout, "utf8");
    fs.writeFileSync(path.join(dir, "stderr.log"), stderr, "utf8");

    writeJsonAtomic(path.join(dir, "status.json"), {
      job_id: jobId,
      active_packet_id: context.activePacket,
      status: jobStatus,
      started_at: now.toISOString(),
      completed_at: completedAt,
    });
  }

  proc.on("close", (code, signal) => {
    doFinalize("close", { code });
  });

  proc.on("error", (err) => {
    const errMsg = err && err.message ? err.message : String(err);
    doFinalize("error", { errMsg });
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
 * Clean up old executor plan job directories.
 *
 * Terminal-state jobs older than maxAgeMs are removed.
 * Running jobs that have been running longer than maxAgeMs are transitioned
 * to "cancelled" status with artifacts preserved (not deleted).
 *
 * @param {string} repoRoot
 * @param {object} opts - { max_age_ms? }
 * @returns {{ removed: number, cancelled: number, jobs: string[], cancelled_jobs: string[] }}
 */
function cleanupJobs(repoRoot, opts = {}) {
  const dir = plansDir(repoRoot);

  if (!fs.existsSync(dir)) {
    return {
      tool: "scaffoldai_executor_plan_cleanup",
      removed: 0,
      cancelled: 0,
      jobs: [],
      cancelled_jobs: [],
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
  const cancelled = [];

  for (const entry of entries) {
    const jobPath = path.join(dir, entry);
    const statusPath = path.join(jobPath, "status.json");

    if (!fs.existsSync(statusPath)) continue;

    const status = readJsonSafe(statusPath);
    if (!status) continue;

    if (status.status === "running") {
      // Transition stale running jobs to cancelled; preserve artifacts
      const startedAt = status.started_at ? new Date(status.started_at).getTime() : 0;
      if (now - startedAt >= maxAgeMs) {
        try {
          const cancelledAt = new Date().toISOString();
          writeJsonAtomic(statusPath, {
            ...status,
            status: "cancelled",
            completed_at: cancelledAt,
            cancel_reason: "stale_running",
          });
          cancelled.push(entry);
        } catch {
          // skip non-writable entries
        }
      }
      continue;
    }

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

  const totalActions = removed.length + cancelled.length;
  return {
    tool: "scaffoldai_executor_plan_cleanup",
    removed: removed.length,
    cancelled: cancelled.length,
    jobs: removed,
    cancelled_jobs: cancelled,
    next_safe_action:
      totalActions === 0
        ? "No eligible jobs to clean up."
        : `Removed ${removed.length} completed job(s). Cancelled ${cancelled.length} stale running job(s).`,
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

