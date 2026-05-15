"use strict";

const assert = require("assert");
const path = require("path");
const { spawn } = require("child_process");

const TEST_NAME = "mcp-readonly-http-e2e";
const repoRoot = path.resolve(__dirname, "..", "..");
const serverPath = path.join(repoRoot, "src", "scaffoldai", "mcp-readonly", "http.js");
const port = Number.parseInt(process.env.TEST_MCP_READONLY_PORT || "3131", 10);
const baseUrl = `http://127.0.0.1:${port}`;
const mcpUrl = `${baseUrl}/mcp`;
const EXPECTED_TOOLS = ["scaffoldai_identity", "scaffoldai_status", "scaffoldai_packet_visibility"];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth() {
  for (let index = 0; index < 30; index += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return response;
    } catch {
      // retry
    }
    await wait(250);
  }
  throw new Error("HTTP MCP server did not become healthy");
}

function parseMcpBody(text) {
  if (!text || !text.trim()) return null;
  const dataLine = text
    .split(/\r?\n/)
    .find((line) => line.startsWith("data: "));
  if (dataLine) return JSON.parse(dataLine.slice("data: ".length));
  return JSON.parse(text);
}

async function postMcp(body, sessionId) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;

  const response = await fetch(mcpUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await response.text();
  return { response, data: parseMcpBody(text) };
}

async function main() {
  console.log(`[${TEST_NAME}] Running`);

  const child = spawn("node", [serverPath], {
    cwd: repoRoot,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "ignore", "pipe"],
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    const healthResponse = await waitForHealth();
    const health = await healthResponse.json();
    assert.strictEqual(health.status, "healthy", "/health should report healthy");
    assert.strictEqual(health.server, "scaffoldai-readonly", "/health should identify read-only server");
    console.log("  PASS: /health reports healthy");

    const init = await postMcp({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: TEST_NAME, version: "1.0.0" },
      },
    });

    assert.ok(init.response.ok, `initialize should succeed: ${init.response.status}`);
    const sessionId = init.response.headers.get("mcp-session-id");
    assert.ok(sessionId, "initialize should return mcp-session-id");
    assert.ok(init.data.result && init.data.result.protocolVersion, "initialize should negotiate protocolVersion");
    console.log("  PASS: initialize/session negotiation succeeds");

    await postMcp(
      {
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {},
      },
      sessionId
    );

    const list = await postMcp(
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      },
      sessionId
    );
    assert.ok(list.response.ok, "tools/list should succeed");
    const names = (list.data.result.tools || []).map((tool) => tool.name).sort();
    assert.deepStrictEqual(names, EXPECTED_TOOLS.slice().sort(), "HTTP tools/list should expose only readonly tools");
    console.log("  PASS: tools/list exposes only readonly tools");

    for (const name of EXPECTED_TOOLS) {
      const result = await postMcp(
        {
          jsonrpc: "2.0",
          id: name,
          method: "tools/call",
          params: { name, arguments: {} },
        },
        sessionId
      );
      assert.ok(result.response.ok, `${name} call should succeed`);
      const text = result.data.result.content[0].text;
      const payload = JSON.parse(text);
      assert.strictEqual(payload.tool, name, `${name} payload should identify tool`);
      assert.strictEqual(payload.execution_class, "READ_ONLY", `${name} should be READ_ONLY`);
      console.log(`  PASS: ${name} call returns parseable READ_ONLY JSON`);
    }
  } finally {
    child.kill("SIGTERM");
    await wait(250);
    if (!child.killed) child.kill("SIGKILL");
  }

  assert.strictEqual(stderr.includes("console.log"), false, "server diagnostics should not mention console.log");
  console.log(`[${TEST_NAME}] PASS`);
}

main().catch((error) => {
  console.error(`[${TEST_NAME}] FAIL: ${error.message}`);
  process.exitCode = 1;
});
