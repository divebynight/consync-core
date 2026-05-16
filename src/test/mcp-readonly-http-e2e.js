"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const TEST_NAME = "mcp-readonly-http-e2e";
const repoRoot = path.resolve(__dirname, "..", "..");
const serverPath = path.join(repoRoot, "src", "scaffoldai", "mcp-readonly", "http.js");
const port = Number.parseInt(process.env.TEST_MCP_READONLY_PORT || "3131", 10);
const baseUrl = `http://127.0.0.1:${port}`;
const mcpUrl = `${baseUrl}/mcp`;
const EXPECTED_TOOLS = [
  "scaffoldai_identity",
  "scaffoldai_status",
  "scaffoldai_packet_visibility",
  "scaffoldai_pending_questions",
  "scaffoldai_completion_status",
];
const signalPath = path.join(repoRoot, ".scaffoldai", "runtime", "mcp", "signals.jsonl");

function seedSignalsForPendingQuestions() {
  fs.mkdirSync(path.dirname(signalPath), { recursive: true });
  const rows = [
    {
      timestamp: "2026-05-14T00:00:00.000Z",
      client_id: "copilot",
      signal_type: "question",
      packet: "packet-alpha.sdc.md",
      severity: "needs_decision",
      message: "Pick canonical packet identifier",
      options: ["filename", "frontmatter"],
    },
    {
      timestamp: "2026-05-14T00:01:00.000Z",
      client_id: "copilot",
      signal_type: "question_resolved",
      packet: "packet-alpha.sdc.md",
      severity: "info",
      question_text: "Pick canonical packet identifier",
      resolved_by: "human.owner",
      resolution_note: "Decision logged in packet notes",
      message: "Resolved by human",
    },
    {
      timestamp: "2026-05-14T00:02:00.000Z",
      client_id: "copilot",
      signal_type: "blocker",
      packet: "packet-alpha.sdc.md",
      severity: "blocked",
      message: "Need human decision on resolution model",
      options: ["append-only", "authoritative"],
    },
  ];
  fs.writeFileSync(signalPath, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
}

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

  seedSignalsForPendingQuestions();

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

    const submitAttempt = await postMcp(
      {
        jsonrpc: "2.0",
        id: 200,
        method: "tools/call",
        params: {
          name: "scaffoldai_submit_sdc_candidate",
          arguments: {
            content: "# SDC — Observer Submit Attempt\n\nMODE: PROCESS_REFACTOR\nEXECUTION SURFACE: LOCAL_REPOSITORY_ONLY\n\nAPPROVAL:\n  execute: PENDING\n  commit: PENDING\n\nGOAL:\nforbidden\n\nTASKS:\n1. no-op\n\nVERIFY:\n- npm run verify:scaffoldai\n\nOUTPUT:\n1. no-op\n\nCONSTRAINTS:\n- none\n",
          },
        },
      },
      sessionId
    );
    assert.ok(submitAttempt.response.ok, "observer submit attempt should return MCP error envelope");
    assert.strictEqual(submitAttempt.data.result.isError, true, "observer submit attempt should set isError");
    assert.match(
      submitAttempt.data.result.content[0].text,
      /not found|Unknown tool/i,
      "observer submit attempt should be rejected as unknown tool"
    );
    console.log("  PASS: observer HTTPS cannot call scaffoldai_submit_sdc_candidate");

    for (const name of EXPECTED_TOOLS) {
      const args = name === "scaffoldai_pending_questions"
        ? { unresolvedOnly: false, limit: 5 }
        : name === "scaffoldai_completion_status"
        ? { latestOnly: true, limit: 5 }
        : {};
      const result = await postMcp(
        {
          jsonrpc: "2.0",
          id: name,
          method: "tools/call",
          params: { name, arguments: args },
        },
        sessionId
      );
      assert.ok(result.response.ok, `${name} call should succeed`);
      const text = result.data.result.content[0].text;
      const payload = JSON.parse(text);
      assert.strictEqual(payload.tool, name, `${name} payload should identify tool`);
      assert.strictEqual(payload.execution_class, "READ_ONLY", `${name} should be READ_ONLY`);
      if (name === "scaffoldai_pending_questions") {
        assert.strictEqual(payload.data.limit, 5, "scaffoldai_pending_questions should honor limit");
        assert.ok(payload.data.returned_count <= 5, "scaffoldai_pending_questions should return bounded results");
        assert.ok(Array.isArray(payload.data.pending_questions), "scaffoldai_pending_questions should include pending_questions array");
        const resolved = payload.data.pending_questions.find((entry) => entry.resolution_status === "resolved");
        assert.ok(resolved, "scaffoldai_pending_questions should include resolved history when unresolvedOnly=false");
        assert.strictEqual(
          resolved.resolved_by,
          "human.owner",
          "scaffoldai_pending_questions should surface resolved_by when detectable"
        );
        assert.ok(
          typeof resolved.resolved_at === "string" && resolved.resolved_at.length > 0,
          "scaffoldai_pending_questions should surface resolved_at when detectable"
        );
      }
      if (name === "scaffoldai_completion_status") {
        assert.strictEqual(payload.data.filter.latest_only, true, "completion status should reflect latestOnly filter");
        assert.ok(Array.isArray(payload.data.completions), "completion status should include completions array");
      }
      console.log(`  PASS: ${name} call returns parseable READ_ONLY JSON`);
    }
  } finally {
    child.kill("SIGTERM");
    await wait(250);
    if (!child.killed) child.kill("SIGKILL");
    try {
      fs.unlinkSync(signalPath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  assert.strictEqual(stderr.includes("console.log"), false, "server diagnostics should not mention console.log");
  console.log(`[${TEST_NAME}] PASS`);
}

main().catch((error) => {
  console.error(`[${TEST_NAME}] FAIL: ${error.message}`);
  process.exitCode = 1;
});
