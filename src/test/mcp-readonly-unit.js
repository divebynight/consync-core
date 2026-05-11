"use strict";

const assert = require("assert");
const { createIdentityTool } = require("../mcp-readonly/tools/identity");
const { createStatusTool } = require("../mcp-readonly/tools/status");

const TEST_NAME = "mcp-readonly-unit";

function parseToolResult(result) {
  assert.ok(result && Array.isArray(result.content), "Expected MCP content array");
  assert.strictEqual(result.content[0].type, "text");
  return JSON.parse(result.content[0].text);
}

async function main() {
  console.log(`[${TEST_NAME}] Running`);

  {
    let called = false;
    const payload = {
      tool: "scaffoldai_identity",
      execution_class: "READ_ONLY",
      status: "ON_TRACK",
      data: { source: "unit-helper" },
    };
    const tool = createIdentityTool({
      gatherScaffoldAIIdentity: () => {
        called = true;
        return payload;
      },
    });

    const result = parseToolResult(await tool({ unexpected: "ignored by helper test" }));
    assert.strictEqual(called, true, "identity MCP tool should call gatherScaffoldAIIdentity");
    assert.deepStrictEqual(result, payload, "identity MCP tool should return helper payload unchanged");
    console.log("  PASS: scaffoldai_identity calls operational helper");
  }

  {
    let receivedOptions = null;
    const payload = {
      tool: "scaffoldai_status",
      execution_class: "READ_ONLY",
      status: "ON_TRACK",
      data: { source: "unit-helper" },
    };
    const tool = createStatusTool({
      gatherStatus: (options) => {
        receivedOptions = options;
        return payload;
      },
    });

    const result = parseToolResult(await tool({}));
    assert.deepStrictEqual(
      receivedOptions,
      { includeGit: false },
      "status MCP tool should call gatherStatus with includeGit false"
    );
    assert.deepStrictEqual(result, payload, "status MCP tool should return helper payload unchanged");
    console.log("  PASS: scaffoldai_status calls operational helper with includeGit false");
  }

  console.log(`[${TEST_NAME}] PASS`);
}

main().catch((error) => {
  console.error(`[${TEST_NAME}] FAIL: ${error.message}`);
  process.exitCode = 1;
});
