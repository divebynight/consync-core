"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { test } = require("node:test");
const { authFixture, startAuthServer, ISSUER, AUDIENCE } = require("./helpers/scaffoldai-auth-fixture");
const { createOperatorHttpServer } = require("../scaffoldai/mcp-operator/http");
const jobs = require("../lib/scaffoldaiExecutorPlanJob.lib.scaffoldai");
const ID = "11111111-1111-4111-8111-111111111111";
const request = (token, extra = {}) => ({ headers: {
  ...(token ? { "cf-access-jwt-assertion": token } : {}), ...extra,
} });

test("HTTP factory refuses missing production authentication configuration", () => {
  assert.throws(() => createOperatorHttpServer({ authEnvironment: {} }), /authentication configuration/i);
});

test("credential-free HTTP cannot initialize, discover, invoke or read health", async (t) => {
  // A failing verifier seam makes this regression exercise the existing HTTP path before auth exists.
  const s = await startAuthServer(t, { verifyAssertion: async () => {
    throw Object.assign(new Error("Authentication required."), { status: 401 });
  } });
  for (const body of [
    { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26",
      capabilities: {}, clientInfo: { name: "anonymous", version: "1" } } },
    { jsonrpc: "2.0", id: 2, method: "tools/list" },
    { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "scaffoldai_identity", arguments: {} } },
  ]) assert.equal((await s.post(body, undefined, null)).response.status, 401);
  assert.equal((await fetch(`${s.base}/health`)).status, 401);
});

test("real verifier derives immutable approved human principal with metadata only", async () => {
  const f = await authFixture();
  const principal = await f.verifier()(request(f.token));
  assert.equal(principal.issuer, ISSUER);
  assert.equal(principal.subject, "fixture-alice");
  assert.deepEqual(principal.capabilities, ["metadata:read"]);
  assert.ok(Object.isFrozen(principal));
  assert.ok(Object.isFrozen(principal.capabilities));
  assert.ok(!JSON.stringify(principal).includes(f.token));
});

const invalidClaims = [
  ["wrong issuer", { iss: "https://other.cloudflareaccess.com" }, 401],
  ["wrong audience", { aud: ["b".repeat(64)] }, 401],
  ["expired", { exp: 1 }, 401],
  ["not yet valid", { nbf: 4102444800 }, 401],
  ["future issuance", { iat: 4102444800 }, 401],
  ["missing expiry", { exp: undefined }, 401],
  ["missing issuance", { iat: undefined }, 401],
  ["missing subject", { sub: undefined }, 401],
  ["empty subject", { sub: "" }, 401],
  ["service identity", { sub: "", common_name: "fixture-service.access" }, 401],
  ["service claim with human subject", { common_name: "fixture-service.access" }, 401],
  ["organization token", { type: "org" }, 401],
  ["unapproved subject", { sub: "unapproved-user" }, 403],
];
for (const [name, claims, status] of invalidClaims) {
  test(`real verifier rejects ${name} without revealing assertion`, async () => {
    const f = await authFixture();
    const token = await f.sign(claims);
    await assert.rejects(f.verifier()(request(token)), (error) => {
      assert.equal(error.status, status);
      assert.ok(!String(error).includes(token));
      return true;
    });
  });
}

test("missing, malformed, duplicate and unsigned identity claims cannot authenticate", async () => {
  const f = await authFixture();
  const verify = f.verifier();
  for (const r of [request(null), request("not-a-jwt"),
    request(`${f.token}, ${f.token}`), request(null, { "cf-access-authenticated-user-email": "fixture@example.invalid",
      "x-forwarded-user": "fixture-alice", "mcp-session-id": "stolen" }),
    { ...request(f.token), rawHeaders: ["Cf-Access-Jwt-Assertion", f.token, "cf-access-jwt-assertion", f.token] }]) {
    await assert.rejects(verify(r), (e) => e.status === 401);
  }
});

test("bad signature, unknown signing key and disallowed algorithm fail closed", async () => {
  const f = await authFixture();
  const jose = await import("jose");
  const hmac = await new jose.SignJWT({ iss: ISSUER, aud: AUDIENCE, sub: "fixture-alice" })
    .setProtectedHeader({ alg: "HS256", kid: "fixture-key" }).sign(new Uint8Array(32));
  for (const token of [await f.sign({}, {}, f.otherKey.privateKey),
    await f.sign({}, { kid: "unknown-key" }), hmac]) {
    await assert.rejects(f.verifier()(request(token)), (e) => e.status === 401);
  }
});

test("JWKS successes and failures coalesce and cannot cause refresh floods", async () => {
  const f = await authFixture();
  let calls = 0;
  const failing = f.verifier({ fetch: async () => { calls++; throw new Error("private upstream diagnostic"); } });
  await Promise.all(Array.from({ length: 20 }, () => assert.rejects(failing(request(f.token)), /Invalid authentication/)));
  await assert.rejects(failing(request(f.token)), /Invalid authentication/);
  assert.equal(calls, 1);
  calls = 0;
  const verify = f.verifier({ fetch: async () => { calls++; return Response.json({ keys: [f.jwk] }); } });
  await Promise.all(Array.from({ length: 20 }, () => verify(request(f.token))));
  const unknown = await f.sign({}, { kid: "unknown" });
  await assert.rejects(verify(request(unknown)));
  await verify(request(f.token));
  assert.equal(calls, 1);
});

test("oversized or redirected JWKS responses fail closed", async () => {
  const f = await authFixture();
  for (const response of [new Response(" ".repeat(65537)), new Response(null, { status: 302,
    headers: { location: "https://untrusted.example.invalid/keys" } })]) {
    await assert.rejects(f.verifier({ fetch: async () => response })(request(f.token)), (e) => e.status === 401);
  }
});

test("JWKS timeout fails closed without waiting indefinitely for a fetch", { timeout: 5000 }, async () => {
  const f = await authFixture();
  const start = Date.now();
  await assert.rejects(f.verifier({ fetch: () => new Promise(() => {}) })(request(f.token)),
    (e) => e.status === 401);
  assert.ok(Date.now() - start < 4000);
});

test("JWKS stalled body and cancellation cannot outlive the retrieval deadline", { timeout: 5000 }, async () => {
  const f = await authFixture();
  const response = new Response(new ReadableStream({
    pull() { return new Promise(() => {}); },
    cancel() { return new Promise(() => {}); },
  }));
  await assert.rejects(f.verifier({ fetch: async () => response })(request(f.token)), (e) => e.status === 401);
});

test("key rotation refreshes after cooldown and stale keys fail closed on outage", async (t) => {
  const f = await authFixture();
  const jose = await import("jose");
  const replacement = { ...await jose.exportJWK(f.otherKey.publicKey), kid: "rotated", alg: "RS256" };
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  let calls = 0;
  const verify = f.verifier({ fetch: async () => {
    calls++;
    if (calls > 2) throw new Error("offline");
    return Response.json({ keys: [calls === 1 ? f.jwk : replacement] });
  } });
  await verify(request(f.token));
  const rotated = await f.sign({}, { kid: "rotated" }, f.otherKey.privateKey);
  await assert.rejects(verify(request(rotated)));
  t.mock.timers.tick(31000);
  assert.equal((await verify(request(rotated))).subject, "fixture-alice");
  assert.equal(calls, 2);
  t.mock.timers.tick(601000);
  await assert.rejects(verify(request(await f.sign({}, { kid: "rotated" }, f.otherKey.privateKey))));
  assert.equal(calls, 3);
});

test("production configuration rejects alternate JWKS URLs and capability grants", async () => {
  const f = await authFixture();
  f.verifier();
  const { loadAuthConfig } = require("../scaffoldai/mcp-operator/auth");
  const env = { SCAFFOLDAI_ACCESS_ISSUER: ISSUER, SCAFFOLDAI_ACCESS_AUD: AUDIENCE,
    SCAFFOLDAI_ACCESS_SUBJECTS: '["fixture-alice"]' };
  assert.deepEqual(loadAuthConfig(env), { issuer: ISSUER, audience: AUDIENCE, subjects: ["fixture-alice"] });
  for (const values of [{}, { ...env, SCAFFOLDAI_ACCESS_ISSUER: "http://localhost" },
    { ...env, SCAFFOLDAI_ACCESS_ISSUER: `${ISSUER}/other` },
    { ...env, SCAFFOLDAI_ACCESS_AUD: "" }, { ...env, SCAFFOLDAI_ACCESS_SUBJECTS: "[]" },
    { ...env, SCAFFOLDAI_ACCESS_SUBJECTS: '[{"subject":"fixture-alice","capabilities":["executor:plan:start"]}]' }]) {
    assert.throws(() => loadAuthConfig(values), /authentication configuration/i);
  }
});

test("HTTP reauthenticates every request and binds sessions to verified subject", async (t) => {
  const s = await startAuthServer(t, { limits: { maxSessions: 1 } });
  assert.equal((await s.initialize(null)).response.status, 401);
  const init = await s.initialize();
  assert.equal(init.response.status, 200);
  const session = init.response.headers.get("mcp-session-id");
  const list = { jsonrpc: "2.0", id: 2, method: "tools/list" };
  assert.equal((await s.post(list, session, null)).response.status, 401);
  assert.equal((await s.post(list, session, await s.fixture.sign({ exp: 1 }))).response.status, 401);
  const bob = await s.fixture.sign({ sub: "fixture-bob" });
  assert.equal((await s.post(list, session, bob)).response.status, 403);
  assert.equal((await fetch(`${s.base}/mcp`, { method: "DELETE",
    headers: { ...s.headers(bob), "mcp-session-id": session } })).status, 403);
  assert.equal((await s.post(list, session)).response.status, 200);
  assert.equal((await fetch(`${s.base}/health`, { headers: s.headers() })).status, 200);
});

test("all inherited metadata tools are allowed but other capabilities are denied", async (t) => {
  const s = await startAuthServer(t);
  const init = await s.initialize();
  const session = init.response.headers.get("mcp-session-id");
  for (const name of ["scaffoldai_identity", "scaffoldai_status", "scaffoldai_packet_visibility",
    "scaffoldai_pending_questions", "scaffoldai_completion_status"]) {
    const call = await s.post({ jsonrpc: "2.0", id: 2, method: "tools/call",
      params: { name, arguments: {} } }, session);
    assert.equal(call.response.status, 200);
    assert.ok(!call.data.error && !call.data.result.isError, name);
  }
  for (const name of ["scaffoldai_submit_sdc_candidate", "scaffoldai_executor_plan", "scaffoldai_executor_plan_start",
    "scaffoldai_executor_plan_status", "scaffoldai_executor_plan_result", "scaffoldai_executor_plan_cleanup"]) {
    const call = await s.post({ jsonrpc: "2.0", id: 3, method: "tools/call",
      params: { name, arguments: name.endsWith("_status") || name.endsWith("_result") ? { job_id: ID } : {} } }, session);
    assert.ok(call.data.error || call.data.result.isError, name);
  }
  assert.equal(fs.existsSync(path.join(s.repoRoot, jobs.PLANS_SUBPATH)), false);
  assert.equal(fs.existsSync(path.join(s.repoRoot, ".scaffoldai/inbox")), false);
});

test("inherited read-only handlers check capabilities at invocation, not merely discovery", async (t) => {
  const f = await authFixture();
  const verify = f.verifier();
  const s = await startAuthServer(t, { fixture: f,
    verifyAssertion: async (req) => ({ ...await verify(req), capabilities: [] }) });
  const init = await s.initialize();
  const session = init.response.headers.get("mcp-session-id");
  const listed = await s.post({ jsonrpc: "2.0", id: 2, method: "tools/list" }, session);
  assert.ok(listed.data.result.tools.some((tool) => tool.name === "scaffoldai_identity"));
  for (const name of ["scaffoldai_identity", "scaffoldai_status", "scaffoldai_packet_visibility",
    "scaffoldai_pending_questions", "scaffoldai_completion_status"]) {
    const call = await s.post({ jsonrpc: "2.0", id: 3, method: "tools/call",
      params: { name, arguments: {} } }, session);
    assert.equal(call.data.result.isError, true, name);
    assert.equal(JSON.parse(call.data.result.content[0].text).error_code, "FORBIDDEN");
  }
});

test("request principals remain isolated concurrently and credentials do not reach handlers", async (t) => {
  const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
  const { authorizeTool, getPrincipal } = require("../scaffoldai/authorization");
  let release;
  let waiting = 0;
  const barrier = new Promise((resolve) => { release = resolve; });
  const s = await startAuthServer(t, { createMcpServer: () => {
    const server = new McpServer({ name: "context-fixture", version: "1" });
    server.registerTool("scaffoldai_identity", { inputSchema: {} },
      authorizeTool("scaffoldai_identity", async (_args, extra) => {
        const before = getPrincipal().subject;
        if (++waiting === 2) release();
        await barrier;
        return { content: [{ type: "text", text: JSON.stringify({
          before, after: getPrincipal().subject, headers: extra.requestInfo?.headers,
        }) }] };
      }, { remote: true }));
    return server;
  } });
  const bob = await s.fixture.sign({ sub: "fixture-bob" });
  const sessions = await Promise.all([s.initialize(), s.initialize(bob)]);
  const calls = await Promise.all(sessions.map((init, i) => s.post({
    jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "scaffoldai_identity", arguments: {} },
  }, init.response.headers.get("mcp-session-id"), i === 0 ? s.fixture.token : bob)));
  for (let i = 0; i < 2; i++) {
    const result = JSON.parse(calls[i].data.result.content[0].text);
    assert.equal(result.before, i === 0 ? "fixture-alice" : "fixture-bob");
    assert.equal(result.after, result.before);
    assert.ok(!calls[i].text.includes(s.fixture.token) && !calls[i].text.includes(bob));
    assert.ok(!Object.hasOwn(result.headers, "cf-access-jwt-assertion"));
  }
});

test("authentication work consumes capacity before allocating sessions", async (t) => {
  const f = await authFixture();
  let release;
  let started;
  const pending = new Promise((resolve) => { started = resolve; });
  const verify = f.verifier({ fetch: () => { started(); return new Promise((resolve) => { release = resolve; }); } });
  const s = await startAuthServer(t, { fixture: f, verifyAssertion: verify, limits: { maxRequests: 1 } });
  const first = s.initialize();
  await pending;
  assert.equal((await s.initialize()).response.status, 503);
  assert.equal((await fetch(`${s.base}/health`, { headers: s.headers() })).status, 503);
  release(Response.json({ keys: [f.jwk] }));
  assert.equal((await first).response.status, 200);
});

test("disconnected authentication requests retain admission until verification settles", async (t) => {
  const f = await authFixture();
  let release;
  let started;
  const pending = new Promise((resolve) => { started = resolve; });
  const verify = f.verifier({ fetch: () => { started(); return new Promise((resolve) => { release = resolve; }); } });
  const s = await startAuthServer(t, { fixture: f, verifyAssertion: verify,
    limits: { maxRequests: 1, maxSessions: 1 } });
  const req = http.request(`${s.base}/health`, { headers: s.headers() });
  req.on("error", (error) => assert.equal(error.code, "ECONNRESET"));
  const closed = new Promise((resolve) => req.once("close", resolve));
  req.end();
  await pending;
  req.destroy();
  await closed;
  try {
    const response = await fetch(`${s.base}/health`, { headers: s.headers(), signal: AbortSignal.timeout(250) });
    assert.equal(response.status, 503);
  } finally {
    release(Response.json({ keys: [f.jwk] }));
  }
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal((await s.initialize()).response.status, 200);
});

test("SSE access requires authentication and expires with the assertion", { timeout: 5000 }, async (t) => {
  const s = await startAuthServer(t);
  assert.equal((await fetch(`${s.base}/mcp`, { headers: { accept: "text/event-stream" } })).status, 401);
  const token = await s.fixture.sign({ exp: Math.floor(Date.now() / 1000) + 2 });
  const response = await fetch(`${s.base}/mcp`, {
    headers: { ...s.headers(token), accept: "text/event-stream" }, signal: AbortSignal.timeout(3500),
  });
  assert.equal(response.status, 200);
  await response.text();
});

test("authentication failures never echo credentials or private diagnostics", async (t) => {
  const f = await authFixture();
  let logs = "";
  t.mock.method(process.stderr, "write", (chunk) => { logs += String(chunk); return true; });
  const s = await startAuthServer(t, { fixture: f,
    verifyAssertion: () => { throw new Error(`${f.token} private-diagnostic`); } });
  const result = await s.initialize();
  assert.equal(result.response.status, 401);
  assert.ok(!result.text.includes(f.token) && !result.text.includes("private-diagnostic"));
  assert.ok(!logs.includes(f.token) && !logs.includes("private-diagnostic"));
});

test("remote ownership rejects mismatches and historical jobs without affecting local reads", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "scaffoldai-owner-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dir = path.join(root, jobs.PLANS_SUBPATH, ID);
  fs.mkdirSync(dir, { recursive: true });
  const data = { job_id: ID, status: "completed", stdout: "owned evidence" };
  for (const name of ["status.json", "result.json"]) fs.writeFileSync(path.join(dir, name), JSON.stringify(data));
  const principal = { issuer: ISSUER, subject: "fixture-alice" };
  for (const read of [jobs.getJobStatus, jobs.getJobResult]) {
    assert.equal(read(root, ID, { remote: true, principal }).status, "not_found");
    assert.equal(read(root, ID).status, "completed");
  }
  fs.writeFileSync(path.join(dir, "request.json"), JSON.stringify({ job_id: ID, owner: principal }));
  for (const read of [jobs.getJobStatus, jobs.getJobResult]) {
    assert.equal(read(root, ID, { remote: true, principal }).status, "completed");
    for (const other of [{ ...principal, subject: "fixture-bob" }, { ...principal, issuer: "https://other.invalid" }, null]) {
      const result = read(root, ID, { remote: true, principal: other });
      assert.equal(result.status, "not_found");
      assert.ok(!JSON.stringify(result).includes("owned evidence"));
    }
  }
  const { withPrincipal } = require("../scaffoldai/authorization");
  const { runExecutorPlanStatusTool, runExecutorPlanResultTool } = require("../scaffoldai/mcp/tools");
  for (const read of [runExecutorPlanStatusTool, runExecutorPlanResultTool]) {
    const deps = { remote: true, repoRoot: root, principal };
    assert.equal(withPrincipal(principal, () => read({ job_id: ID }, deps)).status, "completed");
    assert.equal(withPrincipal({ ...principal, subject: "fixture-bob" },
      () => read({ job_id: ID, principal }, deps)).status, "not_found");
  }
});
