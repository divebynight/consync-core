"use strict";

// SDK version assumption: @modelcontextprotocol/sdk@1.29.0
// Transport: StdioClientTransport (CJS: @modelcontextprotocol/sdk/client/stdio.js)
// Client:    Client              (CJS: @modelcontextprotocol/sdk/client/index.js)

const path = require("path");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

const TEST_NAME = "mcp-smoke";
const OVERALL_TIMEOUT_MS = 30000;
const CALL_TIMEOUT_MS = 5000;

const repoRoot = path.resolve(__dirname, "..", "..");
const SERVER_PATH = path.join(repoRoot, "src", "mcp", "server.js");

const EXPECTED_TOOLS = [
  "scaffoldai_status",
  "scaffoldai_preflight",
  "scaffoldai_question",
  "scaffoldai_verify_recommend",
  "scaffoldai_closeout_readiness",
  "scaffoldai_signal",
];

// Write-capable patterns that must never appear in any tool name
const WRITE_PATTERNS = ["write", "create", "delete", "remove", "update", "append", "execute", "run"];

function pass(msg) {
  console.log(`  PASS: ${msg}`);
}

function fail(msg) {
  console.error(`  FAIL: ${msg}`);
  process.exitCode = 1;
}

function check(condition, msg) {
  if (condition) pass(msg);
  else fail(msg);
}

async function main() {
  console.log(`[${TEST_NAME}] Running`);

  const transport = new StdioClientTransport({
    command: "node",
    args: [SERVER_PATH],
  });

  const client = new Client({ name: "mcp-smoke-client", version: "0.1.0" });

  try {
    await client.connect(transport);
    pass("server starts and connects without error");
  } catch (err) {
    fail(`server failed to connect: ${err.message}`);
    process.exit(1);
  }

  try {
    // -----------------------------------------------------------------------
    // Test: tools/list returns results
    // -----------------------------------------------------------------------

    let listResult;
    try {
      listResult = await client.listTools({}, { timeout: CALL_TIMEOUT_MS });
    } catch (err) {
      fail(`tools/list call failed: ${err.message}`);
      return;
    }

    const tools = listResult.tools || [];

    check(tools.length > 0, "tools/list returns a non-empty result");
    check(tools.length === EXPECTED_TOOLS.length, `tools/list returns exactly ${EXPECTED_TOOLS.length} tools (got ${tools.length})`);

    // -----------------------------------------------------------------------
    // Test: each expected tool is present
    // -----------------------------------------------------------------------

    const toolNames = tools.map((t) => t.name);

    for (const expected of EXPECTED_TOOLS) {
      check(toolNames.includes(expected), `tool "${expected}" is listed`);
    }

    // -----------------------------------------------------------------------
    // Test: no write-capable tool names
    // -----------------------------------------------------------------------

    for (const tool of tools) {
      const nameLower = (tool.name || "").toLowerCase();
      for (const pattern of WRITE_PATTERNS) {
        check(
          !nameLower.includes(pattern),
          `tool "${tool.name}" name does not contain write-capable pattern "${pattern}"`
        );
      }
    }

    // -----------------------------------------------------------------------
    // Test: all tools have a non-empty description
    // -----------------------------------------------------------------------

    for (const tool of tools) {
      check(
        typeof tool.description === "string" && tool.description.trim().length > 0,
        `tool "${tool.name}" has a non-empty description`
      );
    }

  } finally {
    await client.close().catch(() => {});
  }

  if (process.exitCode !== 1) {
    console.log(`[${TEST_NAME}] PASS`);
  }
}

function withOverallTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Test timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
    if (typeof timeoutId.unref === "function") timeoutId.unref();
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise,
  ]);
}

withOverallTimeout(main(), OVERALL_TIMEOUT_MS).catch((err) => {
  console.error(`[${TEST_NAME}] FATAL: ${err.message}`);
  process.exitCode = 1;
  process.exit(1);
});
