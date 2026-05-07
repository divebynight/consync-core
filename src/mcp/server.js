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

function logMcp(message) {
  process.stderr.write(`[MCP] ${message}\n`);
}

function formatError(err) {
  return err && err.message ? err.message : String(err);
}

function withToolLogging(name, handler) {
  return async () => {
    logMcp(`tool call: ${name}`);
    try {
      const response = await handler();
      logMcp(`tool complete: ${name}`);
      return response;
    } catch (err) {
      logMcp(`tool error: ${name}: ${formatError(err)}`);
      throw err;
    }
  };
}

server.tool(
  "scaffoldai_status",
  "Read-only ScaffoldAI status: contract, in-flight packet, git status, verify command.",
  {},
  withToolLogging("scaffoldai_status", async () => {
    const result = runStatusTool();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.tool(
  "scaffoldai_preflight",
  "Read-only ScaffoldAI preflight check: state files, contract integrity, git cleanliness, verify scripts.",
  {},
  withToolLogging("scaffoldai_preflight", async () => {
    const result = runPreflightTool();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.tool(
  "scaffoldai_question",
  "Read-only ScaffoldAI structural questions: surfaces uncertainty, ambiguity, and process gaps.",
  {},
  withToolLogging("scaffoldai_question", async () => {
    const result = runQuestionTool();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.tool(
  "scaffoldai_verify_recommend",
  "Recommend the correct verify command for the current contract target. Does not execute.",
  {},
  withToolLogging("scaffoldai_verify_recommend", async () => {
    const result = runVerifyRecommendTool();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.tool(
  "scaffoldai_closeout_readiness",
  "Read-only closeout readiness check: changed files, commit prefix suggestion, verify evidence gate.",
  {},
  withToolLogging("scaffoldai_closeout_readiness", async () => {
    const result = runCloseoutReadinessTool();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

const transport = new StdioServerTransport();

process.on("exit", () => {
  logMcp("ScaffoldAI server shutdown");
});

server.connect(transport).then(() => {
  logMcp("ScaffoldAI server started");
}).catch((err) => {
  logMcp(`ScaffoldAI server error: ${formatError(err)}`);
  process.exitCode = 1;
});
