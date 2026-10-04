"use strict";

const fs = require("fs");
const path = require("path");
const { spawn: defaultSpawn } = require("child_process");
const { randomUUID } = require("crypto");
const {
  PLANS_SUBPATH, validJobId, artifactRoot, jobPath, readArtifact, writeArtifact,
  acquireArtifactLock, acquirePlanSlot, ARTIFACT_NAMES,
} = require("./scaffoldaiExecutorPlanGuard.lib.scaffoldai");
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
//   Cleanup never infers cancellation from elapsed time.
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
//   - Timeout requests termination; only confirmed exit permits terminal state.
//   - doFinalize is idempotent — subsequent calls after first are no-ops
//   - result.json is always written before status.json (result-before-status invariant)
//   - Guarded artifact writes use private temporary files and atomic rename.
// -----------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 120000;
const MIN_TIMEOUT_MS = 10000;
const MAX_TIMEOUT_MS = 600000;
const MAX_OUTPUT_CHARS = 8000;
const DEFAULT_CLEANUP_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_CAPTURE_BYTES = 1024 * 1024;
const TERMINATION_GRACE_MS = 2000;
const ownedJobs = new Set();

function stopOwnedPlanJobs() {
  for (const stop of ownedJobs) stop("OPERATOR_SHUTDOWN");
}

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

function logError(error) {
  process.stderr.write(`[ScaffoldAI executor] ${error.code || "ERROR"}: ${error.message}\n`);
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

  let slot;
  let jobId;
  let dir;
  try {
    jobId = uuidFn();
    if (!validJobId(jobId)) throw Object.assign(new Error("Invalid generated job ID."), { code: "INVALID_JOB_ID" });
    slot = acquirePlanSlot(repoRoot);
    dir = jobPath(repoRoot, jobId);
    fs.mkdirSync(dir, { mode: 0o700 });
  } catch (error) {
    if (slot) slot.release();
    logError(error);
    return {
      tool: "scaffoldai_executor_plan_start", status: "refused", job_id: null,
      error_code: error.code || "ARTIFACT_ERROR",
      refusal_reason: "Executor admission refused. Inspect local executor diagnostics.",
    };
  }
  const writeJson = (name, value) => writeArtifact(repoRoot, jobId, name, JSON.stringify(value, null, 2) + "\n");

  // 3. Build bounded command (no arbitrary prompt accepted from caller)
  const prompt = buildPlanPrompt(context);
  const command = buildPlanCommand({ repoRoot, prompt });

  const commandBoundary = {
    executable: command.executable,
    planning_flags: ["--plan", "--disable-builtin-mcps"],
    deny_tools: ["write", "shell(*)"],
  };

  // 4. Write request.json
  try {
    writeJson("request.json", {
      job_id: jobId,
      active_packet_id: context.activePacket,
      started_at: now.toISOString(),
      timeout_ms: timeoutMs,
      command_boundary: commandBoundary,
    });

  // 5. Write initial status.json
    writeJson("status.json", {
      job_id: jobId,
      active_packet_id: context.activePacket,
      status: "running",
      started_at: now.toISOString(),
      completed_at: null,
    });
  } catch (error) {
    slot.release();
    logError(error);
    return { tool: "scaffoldai_executor_plan_start", status: "refused", job_id: jobId,
      error_code: "ARTIFACT_WRITE_FAILED", refusal_reason: "Could not persist executor request." };
  }

  // 6. Spawn Copilot asynchronously (shell: false — no shell proxy)
  const startedAt = Date.now();
  let proc;
  try {
    proc = spawnFn(command.executable, command.args, {
      cwd: repoRoot,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
    });
  } catch (spawnErr) {
    const completedAt = new Date().toISOString();
    const errorMsg = spawnErr && spawnErr.message ? spawnErr.message : String(spawnErr);
    logError(spawnErr);
    try {
      writeJson("result.json", {
        job_id: jobId,
        active_packet_id: context.activePacket,
        status: "failed",
        exit_code: null,
        duration_ms: 0,
        started_at: now.toISOString(),
        completed_at: completedAt,
        stdout: "",
        stderr: tailText(errorMsg),
        command_boundary: commandBoundary,
        error_code: "SPAWN_EXCEPTION",
        pid: null,
        finalize_reason: "spawn_exception",
        terminal_event_source: "spawn_exception",
        stdout_bytes: 0,
        stderr_bytes: Buffer.byteLength(errorMsg),
        timeout_fired: false,
      });
      writeArtifact(repoRoot, jobId, "stdout.md", "");
      writeArtifact(repoRoot, jobId, "stderr.log", tailText(errorMsg));
      writeJson("status.json", {
        job_id: jobId,
        active_packet_id: context.activePacket,
        status: "failed",
        started_at: now.toISOString(),
        completed_at: completedAt,
      });
    } catch (error) {
      logError(error);
    } finally {
      slot.release();
    }
    return {
      tool: "scaffoldai_executor_plan_start",
      status: "failed",
      job_id: jobId,
      active_packet_id: context.activePacket,
      started_at: now.toISOString(),
      error_code: "SPAWN_EXCEPTION",
      error_message: "Copilot could not be started. See local diagnostics.",
      next_safe_action: "Review spawn error. Ensure Copilot CLI is installed and accessible.",
    };
  }

  let stdoutBuf = "";
  let stderrBuf = "";
  let finalized = false;
  let timeoutFired = false;
  let stopping = false;
  let stopReason = null;
  let terminationTimer;
  let confirmationTimer;
  let stdoutBytes = 0;
  let stderrBytes = 0;

  function signalExecutor(signal) {
    try {
      if (process.platform !== "win32" && Number.isInteger(proc.pid) && proc.pid > 0) {
        process.kill(-proc.pid, signal);
      } else {
        proc.kill(signal);
      }
      return true;
    } catch (error) {
      if (error.code === "ESRCH") return true;
      logError(error);
      return false;
    }
  }

  function reportUnconfirmed() {
    const error = new Error("Executor termination is unconfirmed; admission remains locked.");
    error.code = "TERMINATION_UNCONFIRMED";
    logError(error);
    try {
      writeJson("status.json", {
        job_id: jobId, active_packet_id: context.activePacket, status: "running",
        started_at: now.toISOString(), completed_at: null, error_code: error.code,
      });
    } catch (writeError) { logError(writeError); }
    if (deps.onComplete) deps.onComplete({ status: "error", job_id: jobId, error_code: error.code });
  }

  function stopExecutor(reason) {
    if (stopping || finalized) return;
    stopping = true;
    stopReason = reason;
    signalExecutor("SIGTERM");
    if (finalized) return;
    terminationTimer = setTimeout(() => {
      if (finalized) return;
      signalExecutor("SIGKILL");
      if (finalized) return;
      confirmationTimer = setTimeout(() => {
        if (finalized) return;
        reportUnconfirmed();
      }, TERMINATION_GRACE_MS);
    }, TERMINATION_GRACE_MS);
  }

  if (proc.stdout) {
    proc.stdout.on("data", (chunk) => {
      stdoutBytes += Buffer.byteLength(chunk);
      stdoutBuf = tailText(stdoutBuf + tailText(String(chunk)));
      try {
        if (!finalized) writeArtifact(repoRoot, jobId, "stdout.partial.log", stdoutBuf);
      } catch (error) { logError(error); stopExecutor("ARTIFACT_WRITE_FAILED"); }
      if (stdoutBytes > MAX_CAPTURE_BYTES) stopExecutor("OUTPUT_LIMIT");
    });
  }

  if (proc.stderr) {
    proc.stderr.on("data", (chunk) => {
      stderrBytes += Buffer.byteLength(chunk);
      stderrBuf = tailText(stderrBuf + tailText(String(chunk)));
      try {
        if (!finalized) writeArtifact(repoRoot, jobId, "stderr.partial.log", stderrBuf);
      } catch (error) { logError(error); stopExecutor("ARTIFACT_WRITE_FAILED"); }
      if (stderrBytes > MAX_CAPTURE_BYTES) stopExecutor("OUTPUT_LIMIT");
    });
  }

  const timer = setTimeout(() => {
    timeoutFired = true;
    stopExecutor("TIMEOUT");
  }, timeoutMs);
  ownedJobs.add(stopExecutor);

  // Single idempotent finalize path — all terminal events converge here.
  function doFinalize(reason, { code, errMsg } = {}) {
    if (finalized) return;
    finalized = true;
    clearTimeout(timer);
    clearTimeout(terminationTimer);
    clearTimeout(confirmationTimer);
    ownedJobs.delete(stopExecutor);
    // The child owns a separate POSIX group; do not leave its descendants behind.
    if (process.platform !== "win32" && Number.isInteger(proc.pid) && proc.pid > 0) {
      if (!signalExecutor("SIGKILL")) {
        reportUnconfirmed();
        return;
      }
    }

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAt;

    const jobStatus =
      reason === "timeout" || timeoutFired
        ? "timed_out"
        : reason === "error" || stopReason
        ? "failed"
        : typeof code === "number" && code === 0
        ? "completed"
        : "failed";

    const stdout = tailText(stdoutBuf);
    const stderr = reason === "error" && errMsg ? tailText(errMsg) : tailText(stderrBuf);

    // result.json written before status.json (result-before-status invariant)
    const result = {
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
      stdout_bytes: stdoutBytes,
      stderr_bytes: stderrBytes,
      timeout_fired: timeoutFired,
      ...(reason === "error" ? { error_code: "RUNNER_EXCEPTION" } : {}),
      ...(stopReason && stopReason !== "TIMEOUT" ? { error_code: stopReason } : {}),
    };

    try {
      writeJson("result.json", result);
      writeArtifact(repoRoot, jobId, "stdout.md", stdout);
      writeArtifact(repoRoot, jobId, "stderr.log", stderr);
      writeJson("status.json", {
        job_id: jobId,
        active_packet_id: context.activePacket,
        status: jobStatus,
        started_at: now.toISOString(),
        completed_at: completedAt,
      });
      slot.release();
      if (deps.onComplete) deps.onComplete(result);
    } catch (error) {
      logError(error);
      if (deps.onComplete) deps.onComplete({ status: "error", job_id: jobId, error_code: "ARTIFACT_WRITE_FAILED" });
    }
  }

  proc.on("close", (code, signal) => {
    doFinalize("close", { code });
  });

  proc.on("error", (err) => {
    const errMsg = err && err.message ? err.message : String(err);
    logError(err);
    if (proc.pid) stopExecutor("RUNNER_EXCEPTION");
    else doFinalize("error", { errMsg });
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
  if (!validJobId(jobId)) {
    return {
      tool: "scaffoldai_executor_plan_status",
      status: "invalid_request",
      job_id: null,
      active_packet_id: null,
      error: "A canonical UUIDv4 job_id is required.",
    };
  }

  return readJob(repoRoot, jobId, "status.json", "scaffoldai_executor_plan_status");
}

function readJob(repoRoot, jobId, name, tool) {
  try {
    const data = readArtifact(repoRoot, jobId, name);
    if (!data || data.job_id !== jobId || typeof data.status !== "string") {
      throw new Error("Invalid executor artifact identity or status.");
    }
    return { ...data, tool };
  } catch (error) {
    const status = error.code === "ENOENT" ? "not_found"
      : error.code === "UNSAFE_ARTIFACT_PATH" ? "invalid_request" : "error";
    if (status === "error") logError(error);
    return { tool, job_id: jobId, active_packet_id: null, status,
      error: status === "not_found" ? "Job artifact not found." : "Job artifact is invalid or inaccessible." };
  }
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
  if (!validJobId(jobId)) {
    return {
      tool: "scaffoldai_executor_plan_result",
      status: "invalid_request",
      job_id: null,
      active_packet_id: null,
      result_available: false,
      error: "A canonical UUIDv4 job_id is required.",
    };
  }

  const data = readJob(repoRoot, jobId, "result.json", "scaffoldai_executor_plan_result");
  if (data.status === "not_found") {
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

  if (data.status === "error" || data.status === "invalid_request") {
    return { ...data, result_available: false };
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
 * Running or uncertain jobs are always preserved. Cleanup never cancels a process.
 *
 * @param {string} repoRoot
 * @param {object} opts - { max_age_ms? }
 * @returns {{ removed: number, cancelled: number, jobs: string[], cancelled_jobs: string[] }}
 */
function cleanupJobs(repoRoot, opts = {}) {
  const removed = [];
  const errors = [];
  let lock;
  try {
    const dir = artifactRoot(repoRoot);
    if (fs.existsSync(dir)) {
      lock = acquireArtifactLock(repoRoot);
      const maxAgeMs = Number.isFinite(opts.max_age_ms) && opts.max_age_ms > 0
        ? opts.max_age_ms : DEFAULT_CLEANUP_AGE_MS;
      for (const id of fs.readdirSync(dir).filter(validJobId)) {
        try {
          const status = readArtifact(repoRoot, id, "status.json");
          if (!status || status.job_id !== id ||
              !["completed", "failed", "timed_out"].includes(status.status)) continue;
          const completedAt = Date.parse(status.completed_at);
          if (!Number.isFinite(completedAt) || Date.now() - completedAt < maxAgeMs) continue;
          const result = readArtifact(repoRoot, id, "result.json");
          if (!result || result.job_id !== id || result.status !== status.status ||
              result.completed_at !== status.completed_at) {
            throw Object.assign(new Error("Terminal executor evidence is inconsistent."), { code: "INVALID_ARTIFACT" });
          }
          const target = jobPath(repoRoot, id);
          const files = fs.readdirSync(target);
          if (!files.every((name) => ARTIFACT_NAMES.has(name))) continue;
          for (const name of files) jobPath(repoRoot, id, name);
          fs.rmSync(target, { recursive: true });
          removed.push(id);
      } catch (error) {
        logError(error);
        errors.push({ job_id: id, code: error.code || "INVALID_ARTIFACT" });
      }
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      logError(error);
      errors.push({ code: error.code || "ARTIFACT_ERROR" });
    }
  } finally {
    if (lock) lock.release();
  }
  return {
    tool: "scaffoldai_executor_plan_cleanup",
    removed: removed.length, cancelled: 0, jobs: removed, cancelled_jobs: [], errors,
    next_safe_action: errors.length ? "Inspect local cleanup diagnostics; uncertain artifacts were preserved."
      : `Removed ${removed.length} terminal job(s). Running and uncertain artifacts were preserved.`,
  };
}

function runPlanAndWait(repoRoot, args = {}, deps = {}) {
  return new Promise((resolve) => {
    const result = createAndStartJob(repoRoot, args, { ...deps, onComplete: resolve });
    if (result.status !== "running") resolve(result);
  });
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
  runPlanAndWait,
  MAX_CAPTURE_BYTES,
  stopOwnedPlanJobs,
};
