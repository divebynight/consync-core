"use strict";

const assert = require("assert");
const { createIdentityTool } = require("../scaffoldai/mcp-readonly/tools/identity");
const { createStatusTool } = require("../scaffoldai/mcp-readonly/tools/status");
const { createPacketVisibilityTool } = require("../scaffoldai/mcp-readonly/tools/packet-visibility");
const { createPendingQuestionsTool } = require("../scaffoldai/mcp-readonly/tools/pending-questions");
const { createCompletionStatusTool } = require("../scaffoldai/mcp-readonly/tools/completion-status");

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
    let receivedRepoRoot = null;
    let receivedOptions = null;
    const payload = {
      tool: "scaffoldai_status",
      execution_class: "READ_ONLY",
      status: "ON_TRACK",
      data: { source: "unit-helper" },
    };
    const tool = createStatusTool({
      gatherStatus: (repoRoot, options) => {
        receivedRepoRoot = repoRoot;
        receivedOptions = options;
        return payload;
      },
      repoRoot: "/test/repo/root",
    });

    const result = parseToolResult(await tool({}));
    assert.strictEqual(receivedRepoRoot, "/test/repo/root", "status MCP tool should pass repoRoot to gatherStatus");
    assert.deepStrictEqual(
      receivedOptions,
      { includeGit: false },
      "status MCP tool should call gatherStatus with includeGit false"
    );
    assert.deepStrictEqual(result, payload, "status MCP tool should return helper payload unchanged");
    console.log("  PASS: scaffoldai_status calls operational helper with includeGit false");
  }

  {
    let receivedRepoRoot = null;
    let receivedArgs = null;
    const payload = {
      tool: "scaffoldai_packet_visibility",
      execution_class: "READ_ONLY",
      status: "OBSERVE",
      data: { packet_count: 1 },
    };
    const tool = createPacketVisibilityTool({
      gatherPacketVisibility: (repoRoot, args) => {
        receivedRepoRoot = repoRoot;
        receivedArgs = args;
        return payload;
      },
      repoRoot: "/test/repo/root",
    });

    const args = { scope: "all", limit: 5, includeSummary: false };
    const result = parseToolResult(await tool(args));
    assert.strictEqual(receivedRepoRoot, "/test/repo/root", "packet visibility MCP tool should pass repoRoot");
    assert.deepStrictEqual(receivedArgs, args, "packet visibility MCP tool should pass arguments through");
    assert.deepStrictEqual(result, payload, "packet visibility MCP tool should return helper payload unchanged");
    console.log("  PASS: scaffoldai_packet_visibility calls bounded packet visibility helper");
  }

  {
    let receivedRepoRoot = null;
    let receivedArgs = null;
    const payload = {
      tool: "scaffoldai_pending_questions",
      execution_class: "READ_ONLY",
      status: "OBSERVE",
      data: { returned_count: 1 },
    };
    const tool = createPendingQuestionsTool({
      gatherPendingQuestions: (repoRoot, args) => {
        receivedRepoRoot = repoRoot;
        receivedArgs = args;
        return payload;
      },
      repoRoot: "/test/repo/root",
    });

    const args = { limit: 3, unresolvedOnly: true };
    const result = parseToolResult(await tool(args));
    assert.strictEqual(receivedRepoRoot, "/test/repo/root", "pending questions MCP tool should pass repoRoot");
    assert.deepStrictEqual(receivedArgs, args, "pending questions MCP tool should pass arguments through");
    assert.deepStrictEqual(result, payload, "pending questions MCP tool should return helper payload unchanged");
    console.log("  PASS: scaffoldai_pending_questions calls pending question helper");
  }

  {
    let receivedRepoRoot = null;
    let receivedArgs = null;
    const payload = {
      tool: "scaffoldai_completion_status",
      execution_class: "READ_ONLY",
      status: "OBSERVE",
      data: { returned_count: 0, completions: [] },
    };
    const tool = createCompletionStatusTool({
      gatherCompletionStatus: (repoRoot, args) => {
        receivedRepoRoot = repoRoot;
        receivedArgs = args;
        return payload;
      },
      repoRoot: "/test/repo/root",
    });

    const args = { latestOnly: true, limit: 1 };
    const result = parseToolResult(await tool(args));
    assert.strictEqual(receivedRepoRoot, "/test/repo/root", "completion status MCP tool should pass repoRoot");
    assert.deepStrictEqual(receivedArgs, args, "completion status MCP tool should pass arguments through");
    assert.deepStrictEqual(result, payload, "completion status MCP tool should return helper payload unchanged");
    console.log("  PASS: scaffoldai_completion_status calls completion helper");
  }

  console.log(`[${TEST_NAME}] PASS`);
}

main().catch((error) => {
  console.error(`[${TEST_NAME}] FAIL: ${error.message}`);
  process.exitCode = 1;
});
