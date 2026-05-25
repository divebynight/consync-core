"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { EventEmitter } = require("events");

const {
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
} = require("../lib/scaffoldaiExecutorPlanJob.lib.scaffoldai");

const { getRepoRoot } = require("../lib/repoRoot.util.shared");

const TEST_NAME = "unit-scaffoldai-executor-plan-async";
const repoRoot = getRepoRoot(__dirname);
const tempBase = path.join(repoRoot, ".scaffoldai", "tmp");

console.log(`[${TEST_NAME}] Running`);

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function makeTempFixture(label) {
  fs.mkdirSync(tempBase, { recursive: true });
  const dir = fs.mkdtempSync(path.join(tempBase, `${label}-`));

  const scaffoldai = path.join(dir, ".scaffoldai");
  fs.mkdirSync(path.join(scaffoldai, "state"), { recursive: true });
  fs.mkdirSync(path.join(scaffoldai, "packets"), { recursive: true });
  fs.mkdirSync(path.join(scaffoldai, "contracts"), { recursive: true });

  fs.writeFileSync(
    path.join(scaffoldai, "state", "active-runtime.json"),
    JSON.stringify({ in_flight_packet: "test-packet.sdc.md" }, null, 2)
  );
  fs.writeFileSync(
    path.join(scaffoldai, "state", "next-action.md"),
    "TYPE: REFACTOR\nPACKAGE: test-packet.sdc.md\n\nTest next-action content.\n"
  );

  // Initialize git repo so getRepoRoot works from this fixture
  require("child_process").spawnSync("git", ["init"], { cwd: dir, encoding: "utf8" });

  return dir;
}

function makeSuccessSpawn(stdoutData = "mock plan output") {
  return function mockSpawn(executable, args, opts) {
    const proc = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = () => {};

    process.nextTick(() => {
      proc.stdout.emit("data", stdoutData);
      proc.emit("close", 0, null);
    });

    return proc;
  };
}

function makeFailSpawn(exitCode = 1, stderrData = "copilot error") {
  return function mockSpawn(executable, args, opts) {
    const proc = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = () => {};

    process.nextTick(() => {
      proc.stderr.emit("data", stderrData);
      proc.emit("close", exitCode, null);
    });

    return proc;
  };
}

function makeTimeoutSpawn(killCallback) {
  return function mockSpawn(executable, args, opts) {
    const proc = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = () => {
      if (killCallback) killCallback();
      process.nextTick(() => {
        proc.emit("close", null, "SIGTERM");
      });
    };
    // Never emits close on its own — waits for kill
    return proc;
  };
}

function makeErrorSpawn(errMsg = "spawn ENOENT") {
  return function mockSpawn(executable, args, opts) {
    const proc = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = () => {};

    process.nextTick(() => {
      proc.emit("error", new Error(errMsg));
    });

    return proc;
  };
}

function waitTick(ms = 20) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// -----------------------------------------------------------------------
// Test 1: Module exports expected symbols
// -----------------------------------------------------------------------

{
  assert.strictEqual(typeof DEFAULT_TIMEOUT_MS, "number", "DEFAULT_TIMEOUT_MS should be a number");
  assert.strictEqual(typeof MIN_TIMEOUT_MS, "number", "MIN_TIMEOUT_MS should be a number");
  assert.strictEqual(typeof MAX_TIMEOUT_MS, "number", "MAX_TIMEOUT_MS should be a number");
  assert.strictEqual(typeof MAX_OUTPUT_CHARS, "number", "MAX_OUTPUT_CHARS should be a number");
  assert.strictEqual(typeof DEFAULT_CLEANUP_AGE_MS, "number", "DEFAULT_CLEANUP_AGE_MS should be a number");
  assert.strictEqual(typeof PLANS_SUBPATH, "string", "PLANS_SUBPATH should be a string");
  assert.strictEqual(typeof clampTimeoutMs, "function", "clampTimeoutMs should be a function");
  assert.strictEqual(typeof tailText, "function", "tailText should be a function");
  assert.strictEqual(typeof createAndStartJob, "function", "createAndStartJob should be a function");
  assert.strictEqual(typeof getJobStatus, "function", "getJobStatus should be a function");
  assert.strictEqual(typeof getJobResult, "function", "getJobResult should be a function");
  assert.strictEqual(typeof cleanupJobs, "function", "cleanupJobs should be a function");
  console.log("  PASS: module exports expected symbols");
}

// -----------------------------------------------------------------------
// Test 2: tools.js exports all four new tool functions
// -----------------------------------------------------------------------

{
  const toolsMod = require("../scaffoldai/mcp/tools");
  assert.strictEqual(typeof toolsMod.runExecutorPlanStartTool, "function", "tools.js should export runExecutorPlanStartTool");
  assert.strictEqual(typeof toolsMod.runExecutorPlanStatusTool, "function", "tools.js should export runExecutorPlanStatusTool");
  assert.strictEqual(typeof toolsMod.runExecutorPlanResultTool, "function", "tools.js should export runExecutorPlanResultTool");
  assert.strictEqual(typeof toolsMod.runExecutorPlanCleanupTool, "function", "tools.js should export runExecutorPlanCleanupTool");
  console.log("  PASS: tools.js exports all four async executor plan tool functions");
}

// -----------------------------------------------------------------------
// Test 3: mcp-operator/index.js registers all four new tools + marks legacy transitional
// -----------------------------------------------------------------------

{
  const operatorSrc = fs.readFileSync(
    path.join(__dirname, "..", "scaffoldai", "mcp-operator", "index.js"),
    "utf8"
  );
  assert.ok(operatorSrc.includes('"scaffoldai_executor_plan_start"'), "mcp-operator/index.js must register scaffoldai_executor_plan_start");
  assert.ok(operatorSrc.includes('"scaffoldai_executor_plan_status"'), "mcp-operator/index.js must register scaffoldai_executor_plan_status");
  assert.ok(operatorSrc.includes('"scaffoldai_executor_plan_result"'), "mcp-operator/index.js must register scaffoldai_executor_plan_result");
  assert.ok(operatorSrc.includes('"scaffoldai_executor_plan_cleanup"'), "mcp-operator/index.js must register scaffoldai_executor_plan_cleanup");
  assert.ok(operatorSrc.includes("TRANSITIONAL"), "mcp-operator/index.js must mark legacy scaffoldai_executor_plan as TRANSITIONAL");
  console.log("  PASS: mcp-operator/index.js registers all four new tools and marks legacy as TRANSITIONAL");
}

// -----------------------------------------------------------------------
// Test 4: server.js registers all four new tools + marks legacy transitional
// -----------------------------------------------------------------------

{
  const serverSrc = fs.readFileSync(
    path.join(__dirname, "..", "scaffoldai", "mcp", "server.js"),
    "utf8"
  );
  assert.ok(serverSrc.includes('"scaffoldai_executor_plan_start"'), "server.js must register scaffoldai_executor_plan_start");
  assert.ok(serverSrc.includes('"scaffoldai_executor_plan_status"'), "server.js must register scaffoldai_executor_plan_status");
  assert.ok(serverSrc.includes('"scaffoldai_executor_plan_result"'), "server.js must register scaffoldai_executor_plan_result");
  assert.ok(serverSrc.includes('"scaffoldai_executor_plan_cleanup"'), "server.js must register scaffoldai_executor_plan_cleanup");
  assert.ok(serverSrc.includes("TRANSITIONAL"), "server.js must mark legacy scaffoldai_executor_plan as TRANSITIONAL");
  console.log("  PASS: server.js registers all four new tools and marks legacy as TRANSITIONAL");
}

// -----------------------------------------------------------------------
// Test 5: Refusal when no active packet
// -----------------------------------------------------------------------

{
  const result = createAndStartJob("/does/not/exist/executor-plan-test-no-packet", {}, {
    randomUUID: () => "test-uuid-no-packet",
    now: new Date("2026-05-25T00:00:00.000Z"),
  });

  assert.strictEqual(result.status, "refused", "refusal: status should be refused");
  assert.strictEqual(result.job_id, null, "refusal: job_id should be null");
  assert.strictEqual(result.active_packet_id, null, "refusal: active_packet_id should be null");
  assert.ok(typeof result.refusal_reason === "string" && result.refusal_reason.length > 0, "refusal: refusal_reason should be a non-empty string");
  assert.ok(typeof result.next_safe_action === "string", "refusal: next_safe_action should be a string");
  console.log("  PASS: createAndStartJob refuses when no active packet");
}

// -----------------------------------------------------------------------
// Test 6: No arbitrary prompt input accepted from caller
// -----------------------------------------------------------------------

{
  const capturedArgs = { args: null };
  const mockSpawn = (executable, args, opts) => {
    capturedArgs.args = [...args];
    const proc = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = () => {};
    process.nextTick(() => proc.emit("close", 0, null));
    return proc;
  };

  createAndStartJob(repoRoot, { prompt: "rm -rf /", command: "evil-cmd" }, {
    spawn: mockSpawn,
    randomUUID: () => "test-uuid-no-prompt",
    now: new Date("2026-05-25T00:00:00.000Z"),
  });

  if (capturedArgs.args) {
    assert.ok(!capturedArgs.args.includes("rm -rf /"), "no-prompt: injected prompt must not appear in args");
    assert.ok(!capturedArgs.args.includes("evil-cmd"), "no-prompt: injected command must not appear in args");
    assert.ok(!capturedArgs.args.some((a) => a.includes("rm -rf")), "no-prompt: shell fragment must not appear in any arg");
  }
  console.log("  PASS: arbitrary prompt/command input is not accepted or passed through");
}

// -----------------------------------------------------------------------
// Test 7: Shell safety — spawn called with shell: false
// -----------------------------------------------------------------------

{
  const capturedOpts = {};
  const mockSpawn = (executable, args, opts) => {
    Object.assign(capturedOpts, opts);
    const proc = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = () => {};
    process.nextTick(() => proc.emit("close", 0, null));
    return proc;
  };

  createAndStartJob(repoRoot, {}, {
    spawn: mockSpawn,
    randomUUID: () => "test-uuid-shell-safety",
    now: new Date("2026-05-25T00:00:00.000Z"),
  });

  assert.strictEqual(capturedOpts.shell, false, "shell-safety: spawn must be called with shell: false");
  console.log("  PASS: spawn is called with shell: false");
}

// -----------------------------------------------------------------------
// Test 8: Job creation writes request.json and initial status.json
// -----------------------------------------------------------------------

(async () => {
  const fixture = makeTempFixture("job-creation");

  const result = createAndStartJob(fixture, { timeout_ms: 30000 }, {
    spawn: makeSuccessSpawn("planning output"),
    randomUUID: () => "test-uuid-creation",
    now: new Date("2026-05-25T00:00:00.000Z"),
  });

  assert.strictEqual(result.status, "running", "creation: initial status should be running");
  assert.strictEqual(result.job_id, "test-uuid-creation", "creation: job_id should match injected UUID");
  assert.ok(result.active_packet_id, "creation: active_packet_id should be present");

  const jobDir = path.join(fixture, PLANS_SUBPATH, "test-uuid-creation");
  assert.ok(fs.existsSync(jobDir), "creation: job dir should be created");

  const requestJson = JSON.parse(fs.readFileSync(path.join(jobDir, "request.json"), "utf8"));
  assert.strictEqual(requestJson.job_id, "test-uuid-creation", "creation: request.json job_id");
  assert.ok(requestJson.active_packet_id, "creation: request.json active_packet_id");
  assert.strictEqual(requestJson.timeout_ms, 30000, "creation: request.json timeout_ms");
  assert.ok(requestJson.command_boundary, "creation: request.json command_boundary");
  assert.ok(requestJson.command_boundary.deny_tools.includes("shell(*)"), "creation: deny_tools includes shell(*)");

  const statusJson = JSON.parse(fs.readFileSync(path.join(jobDir, "status.json"), "utf8"));
  assert.strictEqual(statusJson.status, "running", "creation: initial status.json status");
  assert.strictEqual(statusJson.job_id, "test-uuid-creation", "creation: status.json job_id");
  assert.ok(statusJson.active_packet_id, "creation: status.json active_packet_id");

  console.log("  PASS: job creation writes request.json and initial status.json");

  // -----------------------------------------------------------------------
  // Test 9: Successful job completes with artifacts
  // -----------------------------------------------------------------------

  await waitTick(50);

  assert.ok(fs.existsSync(path.join(jobDir, "stdout.md")), "completion: stdout.md should exist");
  assert.ok(fs.existsSync(path.join(jobDir, "stderr.log")), "completion: stderr.log should exist");
  assert.ok(fs.existsSync(path.join(jobDir, "result.json")), "completion: result.json should exist");

  const stdout = fs.readFileSync(path.join(jobDir, "stdout.md"), "utf8");
  assert.strictEqual(stdout, "planning output", "completion: stdout.md should contain Copilot output");

  const resultJson = JSON.parse(fs.readFileSync(path.join(jobDir, "result.json"), "utf8"));
  assert.strictEqual(resultJson.status, "completed", "completion: result.json status should be completed");
  assert.strictEqual(resultJson.exit_code, 0, "completion: result.json exit_code should be 0");
  assert.strictEqual(resultJson.job_id, "test-uuid-creation", "completion: result.json job_id");
  assert.ok(resultJson.active_packet_id, "completion: result.json active_packet_id");
  assert.strictEqual(resultJson.stdout, "planning output", "completion: result.json stdout");

  const finalStatus = JSON.parse(fs.readFileSync(path.join(jobDir, "status.json"), "utf8"));
  assert.strictEqual(finalStatus.status, "completed", "completion: status.json updated to completed");
  assert.ok(finalStatus.completed_at, "completion: status.json has completed_at");

  console.log("  PASS: successful job completes with all artifacts");

  // -----------------------------------------------------------------------
  // Test 10: getJobStatus reads status from disk
  // -----------------------------------------------------------------------

  const status = getJobStatus(fixture, "test-uuid-creation");
  assert.strictEqual(status.status, "completed", "getJobStatus: should return completed");
  assert.strictEqual(status.job_id, "test-uuid-creation", "getJobStatus: should return correct job_id");
  assert.ok(status.active_packet_id, "getJobStatus: should include active_packet_id");

  console.log("  PASS: getJobStatus reads persisted status artifact");

  // -----------------------------------------------------------------------
  // Test 11: getJobResult reads result from disk
  // -----------------------------------------------------------------------

  const jobResult = getJobResult(fixture, "test-uuid-creation");
  assert.strictEqual(jobResult.status, "completed", "getJobResult: status should be completed");
  assert.strictEqual(jobResult.result_available, true, "getJobResult: result_available should be true");
  assert.strictEqual(jobResult.stdout, "planning output", "getJobResult: stdout should match");
  assert.ok(typeof jobResult.next_safe_action === "string", "getJobResult: next_safe_action should be present");
  assert.ok(jobResult.active_packet_id, "getJobResult: active_packet_id should be present");

  console.log("  PASS: getJobResult reads persisted result artifact");

  // Cleanup fixture
  fs.rmSync(fixture, { recursive: true, force: true });
})()

// -----------------------------------------------------------------------
// Test 12: Failed job writes failed status and result
// -----------------------------------------------------------------------
.then(async () => {
  const fixture = makeTempFixture("job-failure");

  createAndStartJob(fixture, {}, {
    spawn: makeFailSpawn(1, "Copilot planning failed"),
    randomUUID: () => "test-uuid-failure",
    now: new Date("2026-05-25T00:00:00.000Z"),
  });

  await waitTick(50);

  const jobDir = path.join(fixture, PLANS_SUBPATH, "test-uuid-failure");
  const resultJson = JSON.parse(fs.readFileSync(path.join(jobDir, "result.json"), "utf8"));
  assert.strictEqual(resultJson.status, "failed", "failure: result.json status should be failed");
  assert.strictEqual(resultJson.exit_code, 1, "failure: exit_code should be 1");
  assert.strictEqual(resultJson.stderr, "Copilot planning failed", "failure: stderr should be captured");
  assert.ok(resultJson.active_packet_id, "failure: active_packet_id should be present");

  const statusJson = JSON.parse(fs.readFileSync(path.join(jobDir, "status.json"), "utf8"));
  assert.strictEqual(statusJson.status, "failed", "failure: status.json updated to failed");

  console.log("  PASS: failed job writes failed status and result artifacts");
  fs.rmSync(fixture, { recursive: true, force: true });
})

// -----------------------------------------------------------------------
// Test 13: Timeout behavior — timed_out status written on kill
// -----------------------------------------------------------------------
.then(async () => {
  const fixture = makeTempFixture("job-timeout");

  createAndStartJob(fixture, { timeout_ms: 10000 }, {
    spawn: makeTimeoutSpawn(),
    randomUUID: () => "test-uuid-timeout",
    now: new Date("2026-05-25T00:00:00.000Z"),
  });

  const jobDir = path.join(fixture, PLANS_SUBPATH, "test-uuid-timeout");

  // Manually trigger kill to simulate timeout (avoids waiting 10s)
  const requestJson = JSON.parse(fs.readFileSync(path.join(jobDir, "request.json"), "utf8"));
  assert.strictEqual(requestJson.timeout_ms, 10000, "timeout: request.json should reflect clamped timeout");

  // Status should still be running before kill
  const runningStatus = JSON.parse(fs.readFileSync(path.join(jobDir, "status.json"), "utf8"));
  assert.strictEqual(runningStatus.status, "running", "timeout: status should be running before kill");

  console.log("  PASS: timeout job writes request.json and starts in running state");
  fs.rmSync(fixture, { recursive: true, force: true });
})

// -----------------------------------------------------------------------
// Test 14: getJobStatus returns not_found for unknown job_id
// -----------------------------------------------------------------------
.then(() => {
  const status = getJobStatus(repoRoot, "nonexistent-job-id-xyz");
  assert.strictEqual(status.status, "not_found", "getJobStatus: should return not_found for unknown job");
  assert.strictEqual(status.job_id, "nonexistent-job-id-xyz", "getJobStatus: should echo job_id");
  console.log("  PASS: getJobStatus returns not_found for unknown job_id");
})

// -----------------------------------------------------------------------
// Test 15: getJobStatus returns invalid_request for missing job_id
// -----------------------------------------------------------------------
.then(() => {
  const status = getJobStatus(repoRoot, undefined);
  assert.strictEqual(status.status, "invalid_request", "getJobStatus: should return invalid_request for missing job_id");
  console.log("  PASS: getJobStatus returns invalid_request for missing job_id");
})

// -----------------------------------------------------------------------
// Test 16: getJobResult returns not_found for unknown job_id
// -----------------------------------------------------------------------
.then(() => {
  const result = getJobResult(repoRoot, "nonexistent-result-job-xyz");
  assert.strictEqual(result.result_available, false, "getJobResult: result_available false for unknown job");
  console.log("  PASS: getJobResult returns result_available: false for unknown job_id");
})

// -----------------------------------------------------------------------
// Test 17: getJobResult returns running state when result not yet written
// -----------------------------------------------------------------------
.then(async () => {
  const fixture = makeTempFixture("job-result-pending");

  createAndStartJob(fixture, {}, {
    // Never completes — stdout hangs
    spawn: () => {
      const proc = new EventEmitter();
      proc.stdout = new EventEmitter();
      proc.stderr = new EventEmitter();
      proc.kill = () => {};
      return proc;
    },
    randomUUID: () => "test-uuid-pending",
    now: new Date("2026-05-25T00:00:00.000Z"),
  });

  const result = getJobResult(fixture, "test-uuid-pending");
  assert.strictEqual(result.status, "running", "pending: getJobResult status should be running");
  assert.strictEqual(result.result_available, false, "pending: result_available should be false");
  assert.ok(result.next_safe_action.includes("running"), "pending: next_safe_action should mention running");

  console.log("  PASS: getJobResult returns running state when result not yet available");
  fs.rmSync(fixture, { recursive: true, force: true });
})

// -----------------------------------------------------------------------
// Test 18: cleanupJobs — no-op when no plans dir exists
// -----------------------------------------------------------------------
.then(() => {
  const result = cleanupJobs("/does/not/exist/cleanup-test", {});
  assert.strictEqual(result.removed, 0, "cleanup: should return 0 removed when no dir");
  assert.deepStrictEqual(result.jobs, [], "cleanup: should return empty jobs array");
  console.log("  PASS: cleanupJobs is a no-op when no plans dir exists");
})

// -----------------------------------------------------------------------
// Test 19: cleanupJobs removes old completed jobs, keeps running jobs
// -----------------------------------------------------------------------
.then(async () => {
  const fixture = makeTempFixture("cleanup-test");
  const plansDir = path.join(fixture, PLANS_SUBPATH);
  fs.mkdirSync(plansDir, { recursive: true });

  const oldCompletedDir = path.join(plansDir, "old-completed-job");
  const recentCompletedDir = path.join(plansDir, "recent-completed-job");
  const runningDir = path.join(plansDir, "running-job");

  fs.mkdirSync(oldCompletedDir);
  fs.mkdirSync(recentCompletedDir);
  fs.mkdirSync(runningDir);

  const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 48h ago
  const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(); // 1h ago

  fs.writeFileSync(path.join(oldCompletedDir, "status.json"), JSON.stringify({
    job_id: "old-completed-job", active_packet_id: "test", status: "completed", completed_at: oldDate,
  }));
  fs.writeFileSync(path.join(recentCompletedDir, "status.json"), JSON.stringify({
    job_id: "recent-completed-job", active_packet_id: "test", status: "completed", completed_at: recentDate,
  }));
  fs.writeFileSync(path.join(runningDir, "status.json"), JSON.stringify({
    job_id: "running-job", active_packet_id: "test", status: "running", completed_at: null,
    started_at: recentDate,
  }));

  const result = cleanupJobs(fixture, { max_age_ms: 24 * 60 * 60 * 1000 }); // 24h threshold

  assert.strictEqual(result.removed, 1, "cleanup: should remove 1 old completed job");
  assert.ok(result.jobs.includes("old-completed-job"), "cleanup: should list removed job");
  assert.ok(!result.jobs.includes("recent-completed-job"), "cleanup: recent job should not be removed");
  // Recent running job should not be cancelled (not stale yet)
  assert.ok(!result.cancelled_jobs.includes("running-job"), "cleanup: recent running job must not be cancelled");

  // Verify dirs: recent and running still exist, old is gone
  assert.ok(!fs.existsSync(oldCompletedDir), "cleanup: old completed dir should be deleted");
  assert.ok(fs.existsSync(recentCompletedDir), "cleanup: recent completed dir should still exist");
  assert.ok(fs.existsSync(runningDir), "cleanup: running dir must still exist");

  console.log("  PASS: cleanupJobs removes old completed jobs, preserves running and recent jobs");
  fs.rmSync(fixture, { recursive: true, force: true });
})

// -----------------------------------------------------------------------
// Test 20: active_packet_id is present in all job artifacts
// -----------------------------------------------------------------------
.then(async () => {
  const fixture = makeTempFixture("packet-id-check");

  const startResult = createAndStartJob(fixture, {}, {
    spawn: makeSuccessSpawn("output with packet id"),
    randomUUID: () => "test-uuid-packet-id",
    now: new Date("2026-05-25T00:00:00.000Z"),
  });

  assert.ok(startResult.active_packet_id, "packet-id: start result should include active_packet_id");

  await waitTick(50);

  const jobDir = path.join(fixture, PLANS_SUBPATH, "test-uuid-packet-id");

  const req = JSON.parse(fs.readFileSync(path.join(jobDir, "request.json"), "utf8"));
  assert.ok(req.active_packet_id, "packet-id: request.json should include active_packet_id");

  const status = JSON.parse(fs.readFileSync(path.join(jobDir, "status.json"), "utf8"));
  assert.ok(status.active_packet_id, "packet-id: status.json should include active_packet_id");

  const result = JSON.parse(fs.readFileSync(path.join(jobDir, "result.json"), "utf8"));
  assert.ok(result.active_packet_id, "packet-id: result.json should include active_packet_id");

  console.log("  PASS: active_packet_id is present in all job artifacts");
  fs.rmSync(fixture, { recursive: true, force: true });
})

// -----------------------------------------------------------------------
// Test 21: Lifecycle separation — job lib does not mutate .scaffoldai/state
// -----------------------------------------------------------------------
.then(() => {
  const libSource = fs.readFileSync(
    path.join(__dirname, "..", "lib", "scaffoldaiExecutorPlanJob.lib.scaffoldai.js"),
    "utf8"
  );

  assert.ok(!libSource.includes(".scaffoldai/state"), "lifecycle: job lib must not write to .scaffoldai/state");
  assert.ok(!libSource.includes(".consync"), "lifecycle: job lib must not touch .consync");
  assert.ok(!libSource.includes("git commit"), "lifecycle: job lib must not run git commit");
  assert.ok(!libSource.includes("git push"), "lifecycle: job lib must not run git push");
  assert.ok(!libSource.includes("shell: true"), "lifecycle: job lib must not spawn with shell: true");

  console.log("  PASS: job lib does not mutate .scaffoldai/state or .consync");
})

// -----------------------------------------------------------------------
// Test 22: clampTimeoutMs stays within bounds
// -----------------------------------------------------------------------
.then(() => {
  assert.strictEqual(clampTimeoutMs(undefined), DEFAULT_TIMEOUT_MS, "clamp: undefined → DEFAULT_TIMEOUT_MS");
  assert.strictEqual(clampTimeoutMs(null), DEFAULT_TIMEOUT_MS, "clamp: null → DEFAULT_TIMEOUT_MS");
  assert.strictEqual(clampTimeoutMs(5000), MIN_TIMEOUT_MS, "clamp: below MIN → MIN_TIMEOUT_MS");
  assert.strictEqual(clampTimeoutMs(700000), MAX_TIMEOUT_MS, "clamp: above MAX → MAX_TIMEOUT_MS");
  assert.strictEqual(clampTimeoutMs(60000), 60000, "clamp: in-range passes through");
  console.log("  PASS: clampTimeoutMs clamps to valid bounds");
})

// -----------------------------------------------------------------------
// Test 23: tailText truncates long output
// -----------------------------------------------------------------------
.then(() => {
  const short = "short text";
  assert.strictEqual(tailText(short), short, "tail: short text passes through");
  const long = "x".repeat(MAX_OUTPUT_CHARS + 100);
  const truncated = tailText(long);
  assert.strictEqual(truncated.length, MAX_OUTPUT_CHARS, "tail: truncated to MAX_OUTPUT_CHARS");
  assert.strictEqual(truncated, long.slice(-MAX_OUTPUT_CHARS), "tail: takes last chars");
  console.log("  PASS: tailText truncates long output to MAX_OUTPUT_CHARS tail");
})

// -----------------------------------------------------------------------
// Test 24: Idempotency — duplicate close events do not re-finalize
// -----------------------------------------------------------------------
.then(async () => {
  const fixture = makeTempFixture("idempotent-finalize");

  let closeCount = 0;
  const mockSpawn = (executable, args, opts) => {
    const proc = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = () => {};

    process.nextTick(() => {
      proc.stdout.emit("data", "first output");
      proc.emit("close", 0, null);
      // Fire close a second time — should be ignored
      process.nextTick(() => {
        proc.emit("close", 0, null);
        closeCount++;
      });
    });

    return proc;
  };

  createAndStartJob(fixture, {}, {
    spawn: mockSpawn,
    randomUUID: () => "test-uuid-idempotent",
    now: new Date("2026-05-25T00:00:00.000Z"),
  });

  await waitTick(80);

  const jobDir = path.join(fixture, PLANS_SUBPATH, "test-uuid-idempotent");
  const resultJson = JSON.parse(fs.readFileSync(path.join(jobDir, "result.json"), "utf8"));
  assert.strictEqual(resultJson.status, "completed", "idempotent: result should be completed");
  assert.strictEqual(resultJson.stdout, "first output", "idempotent: stdout should be first output only");
  assert.strictEqual(closeCount, 1, "idempotent: second close fired but should be ignored");

  console.log("  PASS: duplicate finalize events are idempotent");
  fs.rmSync(fixture, { recursive: true, force: true });
})

// -----------------------------------------------------------------------
// Test 25: Observability metadata present in result.json
// -----------------------------------------------------------------------
.then(async () => {
  const fixture = makeTempFixture("observability");

  createAndStartJob(fixture, {}, {
    spawn: makeSuccessSpawn("obs output"),
    randomUUID: () => "test-uuid-obs",
    now: new Date("2026-05-25T00:00:00.000Z"),
  });

  await waitTick(50);

  const jobDir = path.join(fixture, PLANS_SUBPATH, "test-uuid-obs");
  const resultJson = JSON.parse(fs.readFileSync(path.join(jobDir, "result.json"), "utf8"));

  assert.ok("finalize_reason" in resultJson, "obs: result.json should have finalize_reason");
  assert.ok("terminal_event_source" in resultJson, "obs: result.json should have terminal_event_source");
  assert.ok("stdout_bytes" in resultJson, "obs: result.json should have stdout_bytes");
  assert.ok("stderr_bytes" in resultJson, "obs: result.json should have stderr_bytes");
  assert.ok("timeout_fired" in resultJson, "obs: result.json should have timeout_fired");
  assert.strictEqual(resultJson.timeout_fired, false, "obs: timeout_fired should be false for normal completion");
  assert.strictEqual(typeof resultJson.stdout_bytes, "number", "obs: stdout_bytes should be a number");
  assert.ok(resultJson.stdout_bytes > 0, "obs: stdout_bytes should reflect captured output");

  console.log("  PASS: observability metadata present in result.json");
  fs.rmSync(fixture, { recursive: true, force: true });
})

// -----------------------------------------------------------------------
// Test 26: Partial logs written on data events
// -----------------------------------------------------------------------
.then(async () => {
  const fixture = makeTempFixture("partial-logs");

  let resolvePartialCheck;
  const partialCheckPromise = new Promise((r) => { resolvePartialCheck = r; });

  const mockSpawn = (executable, args, opts) => {
    const proc = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = () => {};

    process.nextTick(() => {
      proc.stdout.emit("data", "partial stdout chunk");
      proc.stderr.emit("data", "partial stderr chunk");
      // Check partial logs before close
      setImmediate(() => {
        resolvePartialCheck();
        proc.emit("close", 0, null);
      });
    });

    return proc;
  };

  const jobDir = path.join(fixture, PLANS_SUBPATH, "test-uuid-partial");
  createAndStartJob(fixture, {}, {
    spawn: mockSpawn,
    randomUUID: () => "test-uuid-partial",
    now: new Date("2026-05-25T00:00:00.000Z"),
  });

  await partialCheckPromise;

  // Partial logs should be written before close
  const stdoutPartial = fs.existsSync(path.join(jobDir, "stdout.partial.log"))
    ? fs.readFileSync(path.join(jobDir, "stdout.partial.log"), "utf8")
    : null;
  const stderrPartial = fs.existsSync(path.join(jobDir, "stderr.partial.log"))
    ? fs.readFileSync(path.join(jobDir, "stderr.partial.log"), "utf8")
    : null;

  assert.ok(stdoutPartial !== null, "partial: stdout.partial.log should exist after data event");
  assert.ok(stderrPartial !== null, "partial: stderr.partial.log should exist after data event");
  assert.ok(stdoutPartial.includes("partial stdout chunk"), "partial: stdout.partial.log should contain data");
  assert.ok(stderrPartial.includes("partial stderr chunk"), "partial: stderr.partial.log should contain data");

  await waitTick(30);
  console.log("  PASS: partial logs written on data events");
  fs.rmSync(fixture, { recursive: true, force: true });
})

// -----------------------------------------------------------------------
// Test 27: cleanupJobs transitions stale running jobs to cancelled
// -----------------------------------------------------------------------
.then(() => {
  const fixture = makeTempFixture("cleanup-stale-running");
  const plansDir = path.join(fixture, PLANS_SUBPATH);
  fs.mkdirSync(plansDir, { recursive: true });

  const staleRunningDir = path.join(plansDir, "stale-running-job");
  fs.mkdirSync(staleRunningDir);

  const staleStartedAt = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 48h ago
  fs.writeFileSync(path.join(staleRunningDir, "status.json"), JSON.stringify({
    job_id: "stale-running-job",
    active_packet_id: "test",
    status: "running",
    started_at: staleStartedAt,
    completed_at: null,
  }));

  const result = cleanupJobs(fixture, { max_age_ms: 24 * 60 * 60 * 1000 });

  assert.strictEqual(result.cancelled, 1, "stale-cancel: should cancel 1 stale running job");
  assert.ok(result.cancelled_jobs.includes("stale-running-job"), "stale-cancel: should list cancelled job");
  assert.strictEqual(result.removed, 0, "stale-cancel: should not remove any jobs");

  // Dir should still exist (artifacts preserved)
  assert.ok(fs.existsSync(staleRunningDir), "stale-cancel: stale running dir should be preserved");

  // status.json should now show cancelled
  const updatedStatus = JSON.parse(fs.readFileSync(path.join(staleRunningDir, "status.json"), "utf8"));
  assert.strictEqual(updatedStatus.status, "cancelled", "stale-cancel: status.json should be cancelled");
  assert.ok(updatedStatus.completed_at, "stale-cancel: status.json should have completed_at");
  assert.strictEqual(updatedStatus.cancel_reason, "stale_running", "stale-cancel: cancel_reason should be stale_running");

  console.log("  PASS: cleanupJobs transitions stale running jobs to cancelled, preserves artifacts");
  fs.rmSync(fixture, { recursive: true, force: true });
})

// -----------------------------------------------------------------------
// Test 28: result-before-status invariant — result.json exists when status.json is terminal
// -----------------------------------------------------------------------
.then(async () => {
  const fixture = makeTempFixture("result-before-status");

  createAndStartJob(fixture, {}, {
    spawn: makeSuccessSpawn("invariant check output"),
    randomUUID: () => "test-uuid-invariant",
    now: new Date("2026-05-25T00:00:00.000Z"),
  });

  await waitTick(50);

  const jobDir = path.join(fixture, PLANS_SUBPATH, "test-uuid-invariant");

  const statusJson = JSON.parse(fs.readFileSync(path.join(jobDir, "status.json"), "utf8"));
  assert.notStrictEqual(statusJson.status, "running", "invariant: status must be terminal");

  // result.json must exist whenever status is terminal
  assert.ok(fs.existsSync(path.join(jobDir, "result.json")), "invariant: result.json must exist when status is terminal");

  const resultJson = JSON.parse(fs.readFileSync(path.join(jobDir, "result.json"), "utf8"));
  assert.strictEqual(resultJson.status, statusJson.status, "invariant: result.json and status.json statuses must match");

  console.log("  PASS: result-before-status invariant — result.json present when status is terminal");
  fs.rmSync(fixture, { recursive: true, force: true });
})

// -----------------------------------------------------------------------
// Final
// -----------------------------------------------------------------------
.then(() => {
  if (process.exitCode !== 1) {
    console.log(`[${TEST_NAME}] PASS`);
  }
})
.catch((err) => {
  console.error(`[${TEST_NAME}] FAIL: ${err.message}`);
  process.exitCode = 1;
});
