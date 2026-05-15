"use strict";

const assert = require("assert");
const path = require("path");
const { spawn } = require("child_process");
const { getRepoRoot } = require("../lib/repoRoot.util.shared");

const TEST_NAME = "mcp-readonly-chatgpt-compatibility";
const repoRoot = getRepoRoot(__dirname);
const serverPath = path.join(repoRoot, "src", "scaffoldai", "mcp-readonly", "http.js");
const port = Number.parseInt(process.env.TEST_MCP_READONLY_CHATGPT_PORT || "3132", 10);
const baseUrl = `http://127.0.0.1:${port}`;
const mcpUrl = `${baseUrl}/mcp`;

const EXPECTED_TOOLS = ["scaffoldai_identity", "scaffoldai_status", "scaffoldai_packet_visibility"];
const FORBIDDEN_TOOLS = [
  "scaffoldai_preflight",
  "scaffoldai_question",
  "scaffoldai_verify_recommend",
  "scaffoldai_closeout_readiness",
  "scaffoldai_signal",
  "scaffoldai_memory_write",
  "scaffoldai_memory_read",
  "scaffoldai_feature_contract_create",
  "scaffoldai_feature_status_update",
  "scaffoldai_feature_closeout",
  "scaffoldai_feature_verify_closeout",
];

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

async function postRaw(body, sessionId) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;

  const response = await fetch(mcpUrl, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await response.text();
  return { response, text, data: parseMcpBody(text) };
}

async function postMcp(method, params, id, sessionId) {
  return postRaw(
    {
      jsonrpc: "2.0",
      id,
      method,
      params,
    },
    sessionId
  );
}

async function openSseBootstrap() {
  const controller = new AbortController();
  const responsePromise = fetch(mcpUrl, {
    method: "GET",
    headers: { accept: "text/event-stream" },
    signal: controller.signal,
  });

  const response = await responsePromise;
  controller.abort();
  return response;
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
    assert.strictEqual(healthResponse.status, 200, "/health should return 200");
    assert.strictEqual(health.status, "healthy", "/health should return healthy JSON");
    assert.strictEqual(health.server, "scaffoldai-readonly", "/health should identify server");
    console.log("  PASS: /health returns healthy JSON");

    const sseResponse = await openSseBootstrap();
    assert.strictEqual(sseResponse.status, 200, "anonymous GET /mcp SSE bootstrap should return 200");
    assert.ok(
      String(sseResponse.headers.get("content-type") || "").includes("text/event-stream"),
      "anonymous GET /mcp should return text/event-stream"
    );
    console.log("  PASS: anonymous GET /mcp provides SSE bootstrap");

    const jsonGet = await fetch(mcpUrl, {
      method: "GET",
      headers: { accept: "text/event-stream" },
    });
    assert.notStrictEqual(jsonGet.headers.get("content-type"), "application/json");
    assert.strictEqual(jsonGet.status, 200);
    jsonGet.body.cancel();
    console.log("  PASS: SSE bootstrap does not return JSON session error");

    const noSessionList = await postMcp("tools/list", {}, 10);
    assert.strictEqual(noSessionList.response.status, 400, "tools/list without session should be rejected");
    assert.match(noSessionList.text, /No valid session ID provided/, "missing-session error should be deterministic");
    console.log("  PASS: tools/list requires a valid initialized session");

    const initialize = await postRaw({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {
          experimental: {
            "openai/visibility": {
              enabled: true,
            },
          },
          extensions: {
            "io.modelcontextprotocol/ui": {
              mimeTypes: ["text/html;profile=mcp-app"],
            },
          },
        },
        clientInfo: {
          name: "openai-mcp",
          version: "1.0.0",
        },
      },
    });

    assert.ok(initialize.response.ok, `initialize should succeed: ${initialize.response.status}`);
    assert.ok(initialize.data.result && initialize.data.result.protocolVersion, "initialize should negotiate protocolVersion");
    assert.ok(
      typeof initialize.data.result.protocolVersion === "string" &&
        initialize.data.result.protocolVersion.length > 0,
      "initialize protocolVersion should be compatible"
    );
    const sessionId = initialize.response.headers.get("mcp-session-id");
    assert.ok(sessionId && /^[A-Za-z0-9_.:-]+$/.test(sessionId), "initialize should return valid mcp-session-id");
    console.log("  PASS: ChatGPT-like initialize payload succeeds and returns session");

    await postRaw(
      {
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {},
      },
      sessionId
    );

    const list = await postMcp("tools/list", {}, 2, sessionId);
    assert.ok(list.response.ok, "tools/list with valid session should succeed");
    const toolNames = (list.data.result.tools || []).map((tool) => tool.name).sort();
    assert.deepStrictEqual(toolNames, EXPECTED_TOOLS.slice().sort(), "tools/list should expose exactly readonly tools");
    for (const forbidden of FORBIDDEN_TOOLS) {
      assert.ok(!toolNames.includes(forbidden), `tools/list must not expose ${forbidden}`);
    }
    console.log("  PASS: tools/list exposes exactly readonly tools");

    for (const toolName of EXPECTED_TOOLS) {
      const call = await postMcp("tools/call", { name: toolName, arguments: {} }, toolName, sessionId);
      assert.ok(call.response.ok, `${toolName} should be callable`);
      const payload = JSON.parse(call.data.result.content[0].text);
      assert.strictEqual(payload.tool, toolName, `${toolName} payload should identify tool`);
      assert.strictEqual(payload.execution_class, "READ_ONLY", `${toolName} should be READ_ONLY`);
      console.log(`  PASS: ${toolName} call succeeds`);
    }

    const unknown = await postMcp(
      "tools/call",
      { name: "scaffoldai_unknown_tool", arguments: {} },
      500,
      sessionId
    );
    assert.ok(unknown.response.ok, "unknown tool should return MCP tool error envelope");
    assert.strictEqual(unknown.data.result.isError, true, "unknown tool should set isError");
    assert.match(unknown.data.result.content[0].text, /not found|Unknown tool/i, "unknown tool error should be deterministic");
    console.log("  PASS: unknown tool returns deterministic MCP-compatible error");

    const malformed = await postRaw("{ this is not json", sessionId);
    assert.strictEqual(malformed.response.status, 400, "malformed JSON should return 400");
    assert.match(malformed.text, /Parse error/, "malformed JSON error should be deterministic");
    console.log("  PASS: malformed JSON-RPC returns deterministic parse error");
  } finally {
    child.kill("SIGTERM");
    await wait(250);
    if (!child.killed) child.kill("SIGKILL");
  }

  assert.ok(stderr.includes("[MCP readonly]"), "server should log diagnostics to stderr");
  console.log(`[${TEST_NAME}] PASS`);
}

main().catch((error) => {
  console.error(`[${TEST_NAME}] FAIL: ${error.message}`);
  process.exitCode = 1;
});
