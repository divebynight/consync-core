"use strict";

const assert = require("assert");
const path = require("path");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

const TEST_NAME = "mcp-readonly-stdio-e2e";
const repoRoot = path.resolve(__dirname, "..", "..");
const serverPath = path.join(repoRoot, "src", "mcp-readonly", "stdio.js");
const EXPECTED_TOOLS = ["scaffoldai_identity", "scaffoldai_status"];
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

async function callTool(client, name) {
  const result = await client.callTool({ name, arguments: {} }, undefined, { timeout: 5000 });
  const text = result.content && result.content[0] && result.content[0].text;
  assert.ok(text, `${name} should return text content`);
  return JSON.parse(text);
}

async function main() {
  console.log(`[${TEST_NAME}] Running`);

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  });
  const client = new Client({ name: TEST_NAME, version: "1.0.0" });

  try {
    await client.connect(transport);
    console.log("  PASS: initialized stdio MCP client");

    const list = await client.listTools({}, { timeout: 5000 });
    const names = (list.tools || []).map((tool) => tool.name).sort();
    assert.deepStrictEqual(names, EXPECTED_TOOLS.slice().sort(), "stdio tools/list should expose only Phase 1 tools");
    for (const forbidden of FORBIDDEN_TOOLS) {
      assert.ok(!names.includes(forbidden), `stdio tools/list must not expose ${forbidden}`);
    }
    console.log("  PASS: tools/list exposes only Phase 1 tools");

    for (const name of EXPECTED_TOOLS) {
      const parsed = await callTool(client, name);
      assert.strictEqual(parsed.tool, name, `${name} payload should identify tool`);
      assert.strictEqual(parsed.execution_class, "READ_ONLY", `${name} should be READ_ONLY`);
      console.log(`  PASS: ${name} call returns parseable READ_ONLY JSON`);
    }
  } finally {
    await client.close().catch(() => {});
  }

  console.log(`[${TEST_NAME}] PASS`);
}

main().catch((error) => {
  console.error(`[${TEST_NAME}] FAIL: ${error.message}`);
  process.exitCode = 1;
});
