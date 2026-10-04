"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { EventEmitter } = require("node:events");
const { test } = require("node:test");
const jobs = require("../lib/scaffoldaiExecutorPlanJob.lib.scaffoldai");
const { runExecutorPlanTool } = require("../lib/scaffoldaiExecutorPlan.tool.scaffoldai");
const { spawn: realSpawn, execFileSync } = require("node:child_process");
const { once } = require("node:events");

const ID = "11111111-1111-4111-8111-111111111111";
const ID2 = "22222222-2222-4222-8222-222222222222";

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "scaffoldai-security-"));
  const children = [];
  fs.mkdirSync(path.join(root, ".scaffoldai/state"), { recursive: true });
  fs.writeFileSync(path.join(root, ".scaffoldai/state/next-action.md"),
    "TYPE: REFACTOR\nPACKAGE: security-test.sdc\n\nRead package.json only.\n");
  const artifactRoot = path.join(root, jobs.PLANS_SUBPATH);
  fs.mkdirSync(artifactRoot, { recursive: true });
  t.after(() => {
    for (const child of children) child.emit("close", 0);
    fs.rmSync(root, { recursive: true, force: true });
  });
  const spawn = (executable, args, options) => {
    assert.equal(executable, "copilot");
    assert.equal(options.shell, false);
    assert.deepEqual(options.stdio, ["ignore", "pipe", "pipe"]);
    assert.equal(options.cwd, root);
    for (const flag of ["--plan", "--disable-builtin-mcps", "--deny-tool=write", "--deny-tool=shell(*)"]) {
      assert.ok(args.includes(flag), flag);
    }
    assert.ok(!args.includes("--allow-tool=write"));
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.signals = [];
    child.kill = (signal) => { child.signals.push(signal); return true; };
    children.push(child);
    return child;
  };
  function writeJob(id, status = "completed") {
    const dir = path.join(artifactRoot, id);
    fs.mkdirSync(dir);
    const data = { job_id: id, status, completed_at: "2020-01-01T00:00:00Z", stdout: "safe result" };
    fs.writeFileSync(path.join(dir, "status.json"), JSON.stringify(data));
    fs.writeFileSync(path.join(dir, "result.json"), JSON.stringify(data));
    return dir;
  }
  return { root, artifactRoot, children, spawn, writeJob };
}

test("rejects malformed and traversal job IDs before reading artifacts", (t) => {
  const f = fixture(t);
  for (const id of ["../outside", "../../../outside", "/tmp/other", "..\\outside", "%2e%2e", "", "legacy-label",
    "11111111-1111-1111-8111-111111111111", `${ID}/..`, null, {}, `${ID}\0`]) {
    assert.equal(jobs.getJobStatus(f.root, id).status, "invalid_request", String(id));
    assert.equal(jobs.getJobResult(f.root, id).status, "invalid_request", String(id));
  }
});

test("valid generated IDs retain status and result retrieval", (t) => {
  const f = fixture(t);
  f.writeJob(ID);
  assert.equal(jobs.getJobStatus(f.root, ID).status, "completed");
  assert.equal(jobs.getJobResult(f.root, ID).stdout, "safe result");
  assert.equal(jobs.getJobResult(f.root, ID2).status, "not_found");
});

test("rejects symlinked job directories and artifact files without reading targets", (t) => {
  const f = fixture(t);
  const outside = path.join(f.root, "outside");
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, "result.json"), '{"stdout":"outside sentinel"}');
  fs.symlinkSync(outside, path.join(f.artifactRoot, ID), "dir");
  assert.equal(jobs.getJobResult(f.root, ID).status, "invalid_request");
  const dir = f.writeJob(ID2);
  fs.unlinkSync(path.join(dir, "result.json"));
  fs.symlinkSync(path.join(outside, "result.json"), path.join(dir, "result.json"));
  assert.equal(jobs.getJobResult(f.root, ID2).status, "invalid_request");
});

test("rejects an artifact root redirected through a symlink", (t) => {
  const f = fixture(t);
  const outside = path.join(f.root, "outside");
  fs.renameSync(f.artifactRoot, outside);
  fs.symlinkSync(outside, f.artifactRoot, "dir");
  assert.equal(jobs.getJobStatus(f.root, ID).status, "invalid_request");
  const result = jobs.createAndStartJob(f.root, {}, { spawn: f.spawn });
  assert.equal(result.status, "refused");
  assert.equal(f.children.length, 0);
});

test("cleanup preserves running, malformed, and symlinked evidence", (t) => {
  const f = fixture(t);
  const running = f.writeJob(ID, "running");
  const before = fs.readFileSync(path.join(running, "status.json"), "utf8");
  const outside = path.join(f.root, "outside");
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, "status.json"), '{"status":"completed","completed_at":"2020-01-01"}');
  fs.symlinkSync(outside, path.join(f.artifactRoot, ID2), "dir");
  f.writeJob("legacy-label");
  const result = jobs.cleanupJobs(f.root, { max_age_ms: 1 });
  assert.equal(result.removed, 0);
  assert.equal(result.cancelled, 0);
  assert.equal(fs.readFileSync(path.join(running, "status.json"), "utf8"), before);
  assert.ok(fs.existsSync(path.join(outside, "status.json")));
  assert.ok(fs.existsSync(path.join(f.artifactRoot, "legacy-label")));
});

test("cleanup preserves missing or contradictory terminal result evidence", (t) => {
  const f = fixture(t);
  const first = f.writeJob(ID);
  fs.unlinkSync(path.join(first, "result.json"));
  const second = f.writeJob(ID2);
  fs.writeFileSync(path.join(second, "result.json"),
    JSON.stringify({ job_id: ID2, status: "running", completed_at: null }));
  assert.equal(jobs.cleanupJobs(f.root, { max_age_ms: 1 }).removed, 0);
  assert.ok(fs.existsSync(first));
  assert.ok(fs.existsSync(second));
});

test("concurrent async and blocking starts share admission, released after exit", (t) => {
  const f = fixture(t);
  const first = jobs.createAndStartJob(f.root, {}, { spawn: f.spawn, randomUUID: () => ID });
  assert.equal(first.status, "running");
  assert.equal(jobs.createAndStartJob(f.root, {}, { spawn: f.spawn, randomUUID: () => ID2 }).status, "refused");
  const blocking = runExecutorPlanTool(f.root, {}, { execute: () => assert.fail("must not execute") });
  assert.equal(blocking.status, "refused");
  assert.equal(f.children.length, 1);
  f.children[0].emit("close", 0);
  assert.equal(jobs.createAndStartJob(f.root, {}, { spawn: f.spawn, randomUUID: () => ID2 }).status, "running");
});

test("a separate process cannot bypass repository admission", (t) => {
  const f = fixture(t);
  jobs.createAndStartJob(f.root, {}, { spawn: f.spawn, randomUUID: () => ID });
  const script = `
    const jobs = require(process.argv[1]);
    const result = jobs.createAndStartJob(process.argv[2], {}, {
      spawn() { throw new Error("unexpected executor spawn"); }
    });
    console.log(JSON.stringify(result));
  `;
  const output = execFileSync(process.execPath, ["-e", script,
    require.resolve("../lib/scaffoldaiExecutorPlanJob.lib.scaffoldai"), f.root], { encoding: "utf8" });
  const result = JSON.parse(output);
  assert.equal(result.status, "refused");
  assert.equal(result.error_code, "EXECUTOR_BUSY");
});

test("artifact writes reject a redirected job directory without touching its target", (t) => {
  const f = fixture(t);
  jobs.createAndStartJob(f.root, {}, { spawn: f.spawn, randomUUID: () => ID });
  const dir = path.join(f.artifactRoot, ID);
  fs.renameSync(dir, path.join(f.root, "saved-job"));
  const outside = path.join(f.root, "outside");
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, "stdout.partial.log"), "sentinel");
  fs.symlinkSync(outside, dir, "dir");
  f.children[0].stdout.emit("data", "must stay inside the job");
  assert.deepEqual(f.children[0].signals, ["SIGTERM"]);
  f.children[0].emit("close", null, "SIGTERM");
  assert.equal(fs.readFileSync(path.join(outside, "stdout.partial.log"), "utf8"), "sentinel");
  assert.deepEqual(fs.readdirSync(outside), ["stdout.partial.log"]);
});

test("retention limit refuses new jobs without deleting existing evidence", (t) => {
  const f = fixture(t);
  for (let i = 0; i < 100; i++) f.writeJob(`11111111-1111-4111-8111-${String(i).padStart(12, "0")}`);
  assert.equal(jobs.createAndStartJob(f.root, {}, { spawn: f.spawn }).status, "refused");
  assert.equal(f.children.length, 0);
  assert.equal(fs.readdirSync(f.artifactRoot).length, 100);
});

test("timeout escalates to SIGKILL and does not report terminal state before exit", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture(t);
  jobs.createAndStartJob(f.root, { timeout_ms: 10000 }, { spawn: f.spawn, randomUUID: () => ID });
  t.mock.timers.tick(10000);
  assert.deepEqual(f.children[0].signals, ["SIGTERM"]);
  t.mock.timers.tick(2000);
  assert.deepEqual(f.children[0].signals, ["SIGTERM", "SIGKILL"]);
  assert.equal(jobs.getJobStatus(f.root, ID).status, "running");
  f.children[0].emit("close", null, "SIGKILL");
  assert.equal(jobs.getJobResult(f.root, ID).status, "timed_out");
});

test("excessive output triggers termination and preserves bounded tails and byte counts", (t) => {
  const f = fixture(t);
  jobs.createAndStartJob(f.root, {}, { spawn: f.spawn, randomUUID: () => ID });
  for (let i = 0; i < 17; i++) f.children[0].stdout.emit("data", Buffer.alloc(65536, "x"));
  assert.deepEqual(f.children[0].signals, ["SIGTERM"]);
  f.children[0].emit("close", null, "SIGTERM");
  const result = jobs.getJobResult(f.root, ID);
  assert.equal(result.status, "failed");
  assert.equal(result.error_code, "OUTPUT_LIMIT");
  assert.equal(result.stdout.length, 8000);
  assert.equal(result.stdout_bytes, 17 * 65536);
});

test("admission remains locked when termination cannot be confirmed", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture(t);
  jobs.createAndStartJob(f.root, { timeout_ms: 10000 }, { spawn: f.spawn, randomUUID: () => ID });
  t.mock.timers.tick(10000);
  t.mock.timers.tick(2000);
  t.mock.timers.tick(2000);
  assert.equal(jobs.getJobStatus(f.root, ID).error_code, "TERMINATION_UNCONFIRMED");
  assert.equal(jobs.createAndStartJob(f.root, {}, { spawn: f.spawn }).status, "refused");
  assert.equal(jobs.cleanupJobs(f.root, { max_age_ms: 1 }).removed, 0);
});

test("generated ID collisions cannot overwrite evidence", (t) => {
  const f = fixture(t);
  const dir = f.writeJob(ID);
  const before = fs.readFileSync(path.join(dir, "result.json"), "utf8");
  assert.equal(jobs.createAndStartJob(f.root, {}, { spawn: f.spawn, randomUUID: () => ID }).status, "refused");
  assert.equal(f.children.length, 0);
  assert.equal(fs.readFileSync(path.join(dir, "result.json"), "utf8"), before);
});

test("artifact hard links and oversized JSON are refused", (t) => {
  const f = fixture(t);
  const dir = f.writeJob(ID);
  fs.linkSync(path.join(dir, "result.json"), path.join(f.root, "linked.json"));
  assert.equal(jobs.getJobResult(f.root, ID).status, "invalid_request");
  const dir2 = f.writeJob(ID2);
  fs.writeFileSync(path.join(dir2, "result.json"), " ".repeat(128 * 1024 + 1));
  assert.equal(jobs.getJobResult(f.root, ID2).status, "invalid_request");
});

test("shutdown stops only executors owned by this runtime and waits for exit", (t) => {
  const f = fixture(t);
  jobs.createAndStartJob(f.root, {}, { spawn: f.spawn, randomUUID: () => ID });
  assert.equal(typeof jobs.stopOwnedPlanJobs, "function");
  jobs.stopOwnedPlanJobs();
  assert.deepEqual(f.children[0].signals, ["SIGTERM"]);
  assert.equal(jobs.getJobStatus(f.root, ID).status, "running");
  f.children[0].emit("close", null, "SIGTERM");
  assert.equal(jobs.getJobResult(f.root, ID).error_code, "OPERATOR_SHUTDOWN");
});

test("candidate quota rejects further submissions without deleting evidence", (t) => {
  const f = fixture(t);
  const { runSubmitSdcCandidateTool } = require("../scaffoldai/mcp/submit-sdc-candidate");
  const inbox = path.join(f.root, ".scaffoldai/inbox");
  fs.mkdirSync(inbox);
  for (let i = 0; i < 100; i++) fs.writeFileSync(path.join(inbox, `${i}.sdc.md`), "# existing evidence\n");
  const content = [
    "# SDC — Candidate Quota", "MODE: PROCESS_REFACTOR", "EXECUTION SURFACE: LOCAL_REPOSITORY_ONLY",
    "APPROVAL:", "  execute: PENDING", "  commit: PENDING",
    "GOAL:", "Observe quota.", "TASKS:", "1. Read only.",
    "VERIFY:", "- manual observation", "OUTPUT:", "1. observation", "CONSTRAINTS:", "- no execution",
  ].join("\n");
  const result = runSubmitSdcCandidateTool({ content }, { repoRoot: f.root });
  assert.equal(result.status, "rejected");
  assert.equal(result.error_category, "inbox_capacity");
  assert.equal(fs.readdirSync(inbox).length, 100);
});

test("legacy HTTP planning awaits bounded execution while health remains responsive", async (t) => {
  const f = fixture(t);
  const { createOperatorHttpServer } = require("../scaffoldai/mcp-operator/http");
  const { createOperatorMcpServer } = require("../scaffoldai/mcp-operator");
  const server = createOperatorHttpServer({
    createMcpServer: () => createOperatorMcpServer({ remote: true, repoRoot: f.root, spawn: f.spawn }),
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { "content-type": "application/json", accept: "application/json, text/event-stream" };
  const init = await fetch(`${base}/mcp`, { method: "POST", headers, body: JSON.stringify({
    jsonrpc: "2.0", id: 1, method: "initialize", params: {
      protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "1" },
    },
  }) });
  headers["mcp-session-id"] = init.headers.get("mcp-session-id");
  await init.text();
  const pending = fetch(`${base}/mcp`, { method: "POST", headers, body: JSON.stringify({
    jsonrpc: "2.0", id: 2, method: "tools/call",
    params: { name: "scaffoldai_executor_plan", arguments: {} },
  }) });
  for (let i = 0; i < 100 && f.children.length === 0; i++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal(f.children.length, 1);
  assert.equal((await fetch(`${base}/health`)).status, 200);
  f.children[0].stdout.emit("data", `Safe result from ${f.root}`);
  f.children[0].emit("close", 0);
  const response = await pending;
  const raw = await response.text();
  assert.ok(!raw.includes(f.root));
  assert.match(response.headers.get("content-type"), /^application\/json/);
  const data = JSON.parse(raw);
  const result = JSON.parse(data.result.content[0].text);
  assert.equal(result.status, "complete");
  assert.equal(result.repo_root, undefined);
  assert.equal(result.pid, undefined);
  assert.ok(result.stdout.includes("<repository>"));
});

test("POSIX deadline kills an owned process group whose members ignore SIGTERM",
  { skip: process.platform === "win32", timeout: 20000 }, async (t) => {
    const f = fixture(t);
    let child;
    let grandchildPid;
    const resultPromise = jobs.runPlanAndWait(f.root, { timeout_ms: 10000 }, {
      spawn: (_executable, _args, options) => {
        const script = `
          process.on("SIGTERM", () => {});
          const child = require("child_process").spawn(process.execPath,
            ["-e", 'process.on("SIGTERM",()=>{}); setInterval(()=>{},1000)'], {stdio:"ignore"});
          console.log("GRANDCHILD=" + child.pid);
          setInterval(()=>{},1000);
        `;
        child = realSpawn(process.execPath, ["-e", script], options);
        child.stdout.on("data", (chunk) => {
          const match = String(chunk).match(/GRANDCHILD=(\d+)/);
          if (match) grandchildPid = Number(match[1]);
        });
        return child;
      },
    });
    t.after(() => {
      if (child && child.exitCode === null && child.signalCode === null) {
        try { process.kill(-child.pid, "SIGKILL"); } catch (error) {
          if (error.code !== "ESRCH") throw error;
        }
      }
    });
    const result = await resultPromise;
    assert.equal(result.status, "timed_out");
    assert.equal(child.signalCode, "SIGKILL");
    assert.ok(grandchildPid);
    for (let i = 0; i < 50; i++) {
      try { process.kill(grandchildPid, 0); } catch (error) {
        assert.equal(error.code, "ESRCH");
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.fail("owned grandchild survived process-group termination");
  });
