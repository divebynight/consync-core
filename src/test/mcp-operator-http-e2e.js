"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const TEST_NAME = "mcp-operator-http-e2e";
const repoRoot = path.resolve(__dirname, "..", "..");
const serverPath = path.join(repoRoot, "src", "scaffoldai", "mcp-operator", "http.js");
const port = Number.parseInt(process.env.TEST_MCP_OPERATOR_PORT || "3134", 10);
const baseUrl = `http://127.0.0.1:${port}`;
const mcpUrl = `${baseUrl}/mcp`;

const EXPECTED_TOOLS = [
  "scaffoldai_identity",
  "scaffoldai_status",
  "scaffoldai_packet_visibility",
  "scaffoldai_pending_questions",
  "scaffoldai_completion_status",
  "scaffoldai_submit_sdc_candidate",
  "scaffoldai_executor_plan",
  "scaffoldai_executor_plan_start",
  "scaffoldai_executor_plan_status",
  "scaffoldai_executor_plan_result",
  "scaffoldai_executor_plan_cleanup",
];

const FORBIDDEN_TOOLS = [
  "scaffoldai_preflight",
  "scaffoldai_question",
  "scaffoldai_verify_recommend",
  "scaffoldai_closeout_readiness",
  "scaffoldai_signal",
  "scaffoldai_memory_write",
  "scaffoldai_memory_read",
  "scaffoldai_verify_run",
  "scaffoldai_packet_activate",
  "scaffoldai_packet_claim",
  "scaffoldai_closeout",
  "scaffoldai_cleanup",
];

const UNIQUE_STEM = `operator-submit-${process.pid}`;
const UNIQUE_TITLE = `HTTPS Operator Submit ${process.pid}`;

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
  throw new Error("HTTP operator MCP server did not become healthy");
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
  return { response, text, data: parseMcpBody(text) };
}

function readTextIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function buildCandidateContent(title) {
  return [
    `# SDC — ${title}`,
    "",
    "MODE: PROCESS_REFACTOR",
    "EXECUTION SURFACE: LOCAL_REPOSITORY_ONLY",
    "",
    "APPROVAL:",
    "  execute: PENDING",
    "  commit: PENDING",
    "",
    "GOAL:",
    "Exercise HTTPS operator submit-only boundary.",
    "",
    "TASKS:",
    "1. Submit candidate through operator surface.",
    "",
    "VERIFY:",
    "- npm run verify:scaffoldai",
    "",
    "OUTPUT:",
    "1. submit response",
    "",
    "CONSTRAINTS:",
    "- no activation",
    "- no claim",
    "- no execute",
    "- no closeout",
    "- no cleanup",
    "- no commit",
    "",
  ].join("\n");
}

function assertSubmitInvariantFlags(payload, contextLabel) {
  assert.strictEqual(payload.accepted, false, `${contextLabel}: accepted must remain false`);
  assert.strictEqual(payload.activated, false, `${contextLabel}: activated must remain false`);
  assert.strictEqual(payload.claimed, false, `${contextLabel}: claimed must remain false`);
  assert.strictEqual(payload.active_runtime_mutated, false, `${contextLabel}: active runtime must not mutate`);
  assert.strictEqual(payload.next_action_mutated, false, `${contextLabel}: next-action must not mutate`);
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

  const activeRuntimePath = path.join(repoRoot, ".scaffoldai", "state", "active-runtime.json");
  const nextActionPath = path.join(repoRoot, ".scaffoldai", "state", "next-action.md");
  const packetsDir = path.join(repoRoot, ".scaffoldai", "packets");
  const inboxCandidatePath = path.join(repoRoot, ".scaffoldai", "inbox", `${UNIQUE_STEM}.sdc.md`);

  const activeRuntimeBefore = readTextIfExists(activeRuntimePath);
  const nextActionBefore = readTextIfExists(nextActionPath);
  const packetsBefore = fs.existsSync(packetsDir)
    ? fs.readdirSync(packetsDir).filter((entry) => entry.endsWith(".sdc.md"))
    : [];

  try {
    try {
      fs.unlinkSync(inboxCandidatePath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    const healthResponse = await waitForHealth();
    const health = await healthResponse.json();
    assert.strictEqual(health.status, "healthy", "/health should report healthy");
    assert.strictEqual(health.server, "scaffoldai-operator", "/health should identify operator server");
    console.log("  PASS: /health reports healthy operator server");

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
    assert.deepStrictEqual(names, EXPECTED_TOOLS.slice().sort(), "operator tools/list should expose readonly + submit only");
    for (const forbidden of FORBIDDEN_TOOLS) {
      assert.ok(!names.includes(forbidden), `operator tools/list must not expose ${forbidden}`);
    }
    console.log("  PASS: operator tools/list exposes readonly + submit only");

    const validSubmit = await postMcp(
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "scaffoldai_submit_sdc_candidate",
          arguments: {
            content: buildCandidateContent(UNIQUE_TITLE),
            suggestedFileName: UNIQUE_STEM,
            submittedBy: "mcp-operator-e2e",
          },
        },
      },
      sessionId
    );

    assert.ok(validSubmit.response.ok, "submit call should succeed");
    const submitPayload = JSON.parse(validSubmit.data.result.content[0].text);
    assert.strictEqual(submitPayload.status, "accepted", "valid submit should be accepted");
    assert.strictEqual(submitPayload.execution_class, "LOCAL_CANDIDATE_INBOX_WRITE_ONLY", "submit execution class should stay bounded");
    assert.strictEqual(submitPayload.candidate_submitted, true, "valid submit should write candidate");
    assert.strictEqual(submitPayload.error_category, null, "valid submit should not set error category");
    assert.ok(
      typeof submitPayload.candidate_path === "string" && submitPayload.candidate_path.startsWith(".scaffoldai/inbox/"),
      "submit candidate path should remain inside .scaffoldai/inbox/"
    );
    assertSubmitInvariantFlags(submitPayload, "valid submit");
    assert.ok(fs.existsSync(inboxCandidatePath), "submit should only write inbox candidate file");
    console.log("  PASS: operator submit writes only to bounded inbox candidate surface");

    const missingContent = await postMcp(
      {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "scaffoldai_submit_sdc_candidate",
          arguments: { suggestedFileName: `${UNIQUE_STEM}-missing` },
        },
      },
      sessionId
    );
    assert.ok(missingContent.response.ok, "missing content call should return MCP response envelope");
    const missingPayload = JSON.parse(missingContent.data.result.content[0].text);
    assert.strictEqual(missingPayload.status, "rejected", "missing content should be rejected");
    assert.strictEqual(missingPayload.error_category, "schema_input_mismatch", "missing content should match local schema rejection");
    assertSubmitInvariantFlags(missingPayload, "missing content rejection");

    const pathStyleInput = await postMcp(
      {
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: {
          name: "scaffoldai_submit_sdc_candidate",
          arguments: {
            content: buildCandidateContent(`${UNIQUE_TITLE} Path Attempt`),
            path: ".scaffoldai/inbox/forbidden.sdc.md",
          },
        },
      },
      sessionId
    );
    assert.ok(pathStyleInput.response.ok, "path-style input call should return MCP response envelope");
    const pathPayload = JSON.parse(pathStyleInput.data.result.content[0].text);
    assert.strictEqual(pathPayload.status, "rejected", "path-style submission should be rejected");
    assert.strictEqual(pathPayload.error_category, "schema_input_mismatch", "path-style submission should match local schema rejection");
    assertSubmitInvariantFlags(pathPayload, "path-style rejection");

    const duplicatePending = await postMcp(
      {
        jsonrpc: "2.0",
        id: 6,
        method: "tools/call",
        params: {
          name: "scaffoldai_submit_sdc_candidate",
          arguments: {
            content: buildCandidateContent(UNIQUE_TITLE),
            suggestedFileName: `${UNIQUE_STEM}-different-file`,
            submittedBy: "mcp-operator-e2e",
          },
        },
      },
      sessionId
    );
    assert.ok(duplicatePending.response.ok, "duplicate pending call should return MCP response envelope");
    const duplicatePayload = JSON.parse(duplicatePending.data.result.content[0].text);
    assert.strictEqual(duplicatePayload.status, "rejected", "duplicate pending packet id should be rejected");
    assert.strictEqual(
      duplicatePayload.error_category,
      "duplicate_or_pending_candidate_guard",
      "duplicate pending packet id should match local duplicate guard category"
    );
    assertSubmitInvariantFlags(duplicatePayload, "duplicate pending rejection");

    const activeRuntimeAfter = readTextIfExists(activeRuntimePath);
    const nextActionAfter = readTextIfExists(nextActionPath);
    const packetsAfter = fs.existsSync(packetsDir)
      ? fs.readdirSync(packetsDir).filter((entry) => entry.endsWith(".sdc.md"))
      : [];

    assert.strictEqual(activeRuntimeAfter, activeRuntimeBefore, "operator submit must not mutate active-runtime state");
    assert.strictEqual(nextActionAfter, nextActionBefore, "operator submit must not mutate next-action state");
    assert.deepStrictEqual(packetsAfter, packetsBefore, "operator submit must not mutate durable packets archive");
    console.log("  PASS: operator submit does not mutate lifecycle/runtime state");
  } finally {
    child.kill("SIGTERM");
    await wait(250);
    if (!child.killed) child.kill("SIGKILL");

    try {
      fs.unlinkSync(inboxCandidatePath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  assert.ok(stderr.includes("[MCP operator]"), "operator server should log diagnostics to stderr");
  console.log(`[${TEST_NAME}] PASS`);
}

main().catch((error) => {
  console.error(`[${TEST_NAME}] FAIL: ${error.message}`);
  process.exitCode = 1;
});
