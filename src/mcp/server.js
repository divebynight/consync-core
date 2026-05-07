"use strict";

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");

const {
  runStatusTool,
  runPreflightTool,
  runQuestionTool,
  runVerifyRecommendTool,
  runCloseoutReadinessTool,
} = require("./tools");

const server = new McpServer({
  name: "scaffoldai-consync",
  version: "0.1.0",
});

server.tool(
  "scaffoldai_status",
  "Read-only ScaffoldAI status: contract, in-flight packet, git status, verify command.",
  {},
  async () => {
    const result = runStatusTool();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "scaffoldai_preflight",
  "Read-only ScaffoldAI preflight check: state files, contract integrity, git cleanliness, verify scripts.",
  {},
  async () => {
    const result = runPreflightTool();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "scaffoldai_question",
  "Read-only ScaffoldAI structural questions: surfaces uncertainty, ambiguity, and process gaps.",
  {},
  async () => {
    const result = runQuestionTool();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "scaffoldai_verify_recommend",
  "Recommend the correct verify command for the current contract target. Does not execute.",
  {},
  async () => {
    const result = runVerifyRecommendTool();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "scaffoldai_closeout_readiness",
  "Read-only closeout readiness check: changed files, commit prefix suggestion, verify evidence gate.",
  {},
  async () => {
    const result = runCloseoutReadinessTool();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

const transport = new StdioServerTransport();

server.connect(transport).catch((err) => {
  console.error("MCP server error:", err.message);
  process.exitCode = 1;
});
