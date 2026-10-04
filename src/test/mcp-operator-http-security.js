"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const { test } = require("node:test");
const http = require("node:http");

async function startServer(t, limits = {}) {
  const entry = path.resolve(__dirname, "../scaffoldai/mcp-operator/http.js");
  const bootstrap = `
    const http = require("http");
    const listen = http.Server.prototype.listen;
    http.Server.prototype.listen = function (...args) {
      this.once("listening", () => console.log(JSON.stringify({ port: this.address().port })));
      return listen.apply(this, args);
    };
    const mod = require(process.argv[1]);
    if (mod.createOperatorHttpServer) {
      mod.createOperatorHttpServer({ limits: JSON.parse(process.argv[2]) }).listen(0, "127.0.0.1");
    }
  `;
  const child = spawn(process.execPath, ["-e", bootstrap, entry, JSON.stringify(limits)], {
    env: { ...process.env, HOST: "127.0.0.1", PORT: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const exited = once(child, "exit");
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  t.after(async () => {
    child.kill("SIGTERM");
    const timer = setTimeout(() => child.kill("SIGKILL"), 2000);
    await exited;
    clearTimeout(timer);
  });
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`test server startup failed: ${stderr}`)), 5000);
    child.stdout.once("data", (chunk) => {
      clearTimeout(timer);
      resolve(JSON.parse(String(chunk).trim()).port);
    });
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
  });
  const base = `http://127.0.0.1:${port}`;
  async function post(body, session) {
    const response = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json", accept: "application/json, text/event-stream",
        ...(session ? { "mcp-session-id": session } : {}),
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
    const text = await response.text();
    const line = text.split("\n").find((value) => value.startsWith("data: "));
    return { response, data: text ? JSON.parse(line ? line.slice(6) : text) : null };
  }
  async function initialize() {
    return post({ jsonrpc: "2.0", id: 1, method: "initialize", params: {
      protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "security-test", version: "1" },
    } });
  }
  return { base, post, initialize };
}

test("HTTP rejects oversized bodies and remains responsive", async (t) => {
  const s = await startServer(t);
  assert.equal((await s.post(" ".repeat(256 * 1024 + 1))).response.status, 413);
  assert.equal((await fetch(`${s.base}/health`)).status, 200);
  assert.equal((await s.initialize()).response.status, 200);
});

test("POST responses use JSON instead of bypassing GET SSE limits", async (t) => {
  const s = await startServer(t);
  const init = await s.initialize();
  assert.match(init.response.headers.get("content-type"), /^application\/json/);
  const session = init.response.headers.get("mcp-session-id");
  const list = await s.post({ jsonrpc: "2.0", id: 2, method: "tools/list" }, session);
  assert.match(list.response.headers.get("content-type"), /^application\/json/);
});

test("HTTP cleanup is neither discoverable nor callable", async (t) => {
  const s = await startServer(t);
  const init = await s.initialize();
  const session = init.response.headers.get("mcp-session-id");
  const list = await s.post({ jsonrpc: "2.0", id: 2, method: "tools/list" }, session);
  const names = list.data.result.tools.map((tool) => tool.name);
  assert.ok(!names.includes("scaffoldai_executor_plan_cleanup"));
  for (const name of ["scaffoldai_executor_plan", "scaffoldai_executor_plan_start",
    "scaffoldai_executor_plan_status", "scaffoldai_executor_plan_result", "scaffoldai_submit_sdc_candidate"]) {
    assert.ok(names.includes(name), name);
  }
  const call = await s.post({ jsonrpc: "2.0", id: 3, method: "tools/call",
    params: { name: "scaffoldai_executor_plan_cleanup", arguments: {} } }, session);
  assert.ok(call.data.error || call.data.result.isError);
});

test("session cap refuses initialization until a session is closed", async (t) => {
  const s = await startServer(t, { maxSessions: 2 });
  const first = await s.initialize();
  assert.equal((await s.initialize()).response.status, 200);
  assert.equal((await s.initialize()).response.status, 503);
  await fetch(`${s.base}/mcp`, { method: "DELETE",
    headers: { "mcp-session-id": first.response.headers.get("mcp-session-id") } });
  assert.equal((await s.initialize()).response.status, 200);
});

test("idle sessions expire without becoming new anonymous sessions", async (t) => {
  const s = await startServer(t, { sessionIdleMs: 100 });
  const init = await s.initialize();
  const session = init.response.headers.get("mcp-session-id");
  await new Promise((resolve) => setTimeout(resolve, 200));
  const result = await s.post({ jsonrpc: "2.0", id: 2, method: "tools/list" }, session);
  assert.equal(result.response.status, 400);
});

test("anonymous SSE streams are bounded", async (t) => {
  const s = await startServer(t, { maxStreams: 2 });
  const controllers = [new AbortController(), new AbortController(), new AbortController()];
  t.after(() => controllers.forEach((controller) => controller.abort()));
  for (let i = 0; i < 2; i++) {
    const response = await fetch(`${s.base}/mcp`, {
      headers: { accept: "text/event-stream" }, signal: controllers[i].signal,
    });
    assert.equal(response.status, 200);
  }
  const refused = await fetch(`${s.base}/mcp`, {
    headers: { accept: "text/event-stream" }, signal: controllers[2].signal,
  });
  assert.equal(refused.status, 503);
});

test("request capacity includes streams without blocking health", async (t) => {
  const s = await startServer(t, { maxRequests: 1 });
  const controller = new AbortController();
  t.after(() => controller.abort());
  await fetch(`${s.base}/mcp`, { headers: { accept: "text/event-stream" }, signal: controller.signal });
  assert.equal((await s.initialize()).response.status, 503);
  assert.equal((await fetch(`${s.base}/health`)).status, 200);
});

test("slow bodies time out and exactly-sized bodies are not rejected as oversized", async (t) => {
  const s = await startServer(t, { bodyTimeoutMs: 100 });
  assert.notEqual((await s.post(" ".repeat(256 * 1024))).response.status, 413);
  const status = await new Promise((resolve, reject) => {
    const request = http.request(`${s.base}/mcp`, { method: "POST",
      headers: { "content-type": "application/json" } }, (response) => {
      response.resume();
      resolve(response.statusCode);
    });
    request.on("error", reject);
    request.write("{");
  });
  assert.equal(status, 408);
});

test("entry point refuses non-loopback HOST without opening a listener", async () => {
  const entry = path.resolve(__dirname, "../scaffoldai/mcp-operator/http.js");
  const child = spawn(process.execPath, [entry], {
    env: { ...process.env, HOST: "0.0.0.0", PORT: "0" }, stdio: "ignore",
  });
  const [code] = await once(child, "exit");
  assert.notEqual(code, 0);
});
