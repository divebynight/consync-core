"use strict";

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { z } = require("zod");
const { createIdentityTool } = require("./tools/identity");
const { createStatusTool } = require("./tools/status");

function createReadonlyMcpServer(deps = {}) {
  const server = new McpServer({
    name: "scaffoldai-readonly",
    version: "1.0.0",
  });

  server.registerTool(
    "scaffoldai_identity",
    {
      description: "Expose canonical ScaffoldAI identity and authority boundaries.",
      inputSchema: z.object({}).strict(),
    },
    createIdentityTool(deps)
  );

  server.registerTool(
    "scaffoldai_status",
    {
      description: "Expose canonical ScaffoldAI status observation without command execution.",
      inputSchema: z.object({}).strict(),
    },
    createStatusTool(deps)
  );

  return server;
}

module.exports = { createReadonlyMcpServer };
