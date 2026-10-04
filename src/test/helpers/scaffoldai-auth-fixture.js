"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { once } = require("node:events");

const ISSUER = "https://scaffoldai-fixture.cloudflareaccess.com";
const AUDIENCE = "a".repeat(64);
let signingKeys;

async function authFixture(options = {}) {
  const jose = await import("jose");
  signingKeys ||= Promise.all([jose.generateKeyPair("RS256"), jose.generateKeyPair("RS256")]);
  const [key, otherKey] = await signingKeys;
  const jwk = { ...await jose.exportJWK(key.publicKey), kid: "fixture-key", alg: "RS256", use: "sig" };
  const config = { issuer: ISSUER, audience: AUDIENCE, subjects: ["fixture-alice", "fixture-bob"] };
  async function sign(claims = {}, header = {}, privateKey = key.privateKey) {
    const now = Math.floor(Date.now() / 1000);
    return new jose.SignJWT({
      iss: ISSUER, aud: [AUDIENCE], sub: "fixture-alice", type: "app",
      email: "fixture@example.invalid", iat: now, nbf: now - 1, exp: now + 300, ...claims,
    }).setProtectedHeader({ alg: "RS256", kid: "fixture-key", ...header }).sign(privateKey);
  }
  const fetchKeys = async (url) => {
    assert.equal(String(url), `${ISSUER}/cdn-cgi/access/certs`);
    return Response.json({ keys: [jwk] });
  };
  function verifier(deps = {}) {
    const location = `${__dirname}/../../scaffoldai/mcp-operator/auth.js`;
    assert.ok(fs.existsSync(location), "Access assertion verifier must exist");
    return require(location).createAccessVerifier(config, { fetch: fetchKeys, ...deps });
  }
  return { config, jwk, sign, otherKey, verifier, token: await sign(), ...options };
}

async function startAuthServer(t, options = {}) {
  const f = options.fixture || await authFixture();
  const { createOperatorHttpServer } = require("../../scaffoldai/mcp-operator/http");
  const { createOperatorMcpServer } = require("../../scaffoldai/mcp-operator");
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "scaffoldai-auth-http-"));
  fs.mkdirSync(path.join(repoRoot, ".scaffoldai/state"), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, ".scaffoldai/state/next-action.md"),
    "TYPE: REFACTOR\nPACKAGE: auth-fixture.sdc\n\nRead package.json only.\n");
  const server = createOperatorHttpServer({
    limits: options.limits,
    verifyAssertion: options.verifyAssertion || f.verifier(),
    createMcpServer: options.createMcpServer || (() => createOperatorMcpServer({
      remote: true, repoRoot, spawn: () => { throw new Error("Fixture forbids executor spawn."); },
    })),
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const close = async () => {
    if (!server.listening) return;
    const closed = once(server, "close");
    server.closeAllConnections();
    server.close();
    await closed;
    fs.rmSync(repoRoot, { recursive: true, force: true });
  };
  if (t) t.after(close);
  const base = `http://127.0.0.1:${server.address().port}`;
  function headers(token = f.token) {
    return token ? { "cf-access-jwt-assertion": token } : {};
  }
  async function post(body, session, token = f.token) {
    const response = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { ...headers(token), "content-type": "application/json",
        accept: "application/json, text/event-stream", ...(session ? { "mcp-session-id": session } : {}) },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
    const text = await response.text();
    return { response, text, data: text ? JSON.parse(text) : null };
  }
  const initialize = (token = f.token) => post({
    jsonrpc: "2.0", id: 1, method: "initialize",
    params: { protocolVersion: "2025-03-26", capabilities: {},
      clientInfo: { name: "auth-fixture", version: "1" } },
  }, undefined, token);
  return { base, post, initialize, headers, fixture: f, close, repoRoot };
}

module.exports = { authFixture, startAuthServer, ISSUER, AUDIENCE };
