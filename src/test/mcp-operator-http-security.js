"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const http = require("node:http");
const { startAuthServer } = require("./helpers/scaffoldai-auth-fixture");

async function startServer(t, limits = {}) {
  return startAuthServer(t, { limits });
}

test("HTTP rejects oversized bodies and remains responsive", async (t) => {
  const s = await startServer(t);
  assert.equal((await s.post(" ".repeat(256 * 1024 + 1))).response.status, 413);
  assert.equal((await fetch(`${s.base}/health`, { headers: s.headers() })).status, 200);
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
    headers: { ...s.headers(), "mcp-session-id": first.response.headers.get("mcp-session-id") } });
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

test("authenticated SSE streams are bounded", async (t) => {
  const s = await startServer(t, { maxStreams: 2 });
  const controllers = [new AbortController(), new AbortController(), new AbortController()];
  t.after(() => controllers.forEach((controller) => controller.abort()));
  for (let i = 0; i < 2; i++) {
    const response = await fetch(`${s.base}/mcp`, {
      headers: { ...s.headers(), accept: "text/event-stream" }, signal: controllers[i].signal,
    });
    assert.equal(response.status, 200);
  }
  const refused = await fetch(`${s.base}/mcp`, {
    headers: { ...s.headers(), accept: "text/event-stream" }, signal: controllers[2].signal,
  });
  assert.equal(refused.status, 503);
});

test("request capacity bounds authenticated streams and health together", async (t) => {
  const s = await startServer(t, { maxRequests: 1 });
  const controller = new AbortController();
  t.after(() => controller.abort());
  await fetch(`${s.base}/mcp`, { headers: { ...s.headers(), accept: "text/event-stream" }, signal: controller.signal });
  assert.equal((await s.initialize()).response.status, 503);
  assert.equal((await fetch(`${s.base}/health`, { headers: s.headers() })).status, 503);
});

test("slow bodies time out and exactly-sized bodies are not rejected as oversized", async (t) => {
  const s = await startServer(t, { bodyTimeoutMs: 100 });
  assert.notEqual((await s.post(" ".repeat(256 * 1024))).response.status, 413);
  const status = await new Promise((resolve, reject) => {
    const request = http.request(`${s.base}/mcp`, { method: "POST",
      headers: { ...s.headers(), "content-type": "application/json" } }, (response) => {
      response.resume();
      resolve(response.statusCode);
    });
    request.on("error", reject);
    request.write("{");
  });
  assert.equal(status, 408);
});

test("production address validation refuses non-loopback HOST without a listener", () => {
  const { operatorAddress } = require("../scaffoldai/mcp-operator/http");
  assert.equal(typeof operatorAddress, "function");
  assert.throws(() => operatorAddress({ HOST: "0.0.0.0" }), /127.0.0.1/);
  assert.throws(() => operatorAddress({ PORT: "-1" }), /port/i);
  assert.deepEqual(operatorAddress({}), { host: "127.0.0.1", port: 3133 });
});
