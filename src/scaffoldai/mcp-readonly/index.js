"use strict";

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { z } = require("zod");
const { createIdentityTool } = require("./tools/identity");
const { createStatusTool } = require("./tools/status");
const { createPacketVisibilityTool } = require("./tools/packet-visibility");
const { createPendingQuestionsTool } = require("./tools/pending-questions");
const { createCompletionStatusTool } = require("./tools/completion-status");

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

  server.registerTool(
    "scaffoldai_packet_visibility",
    {
      description:
        "Expose bounded readonly packet visibility metadata from the ScaffoldAI packet archive with optional in-flight-only scope.",
      inputSchema: z.object({
        scope: z.enum(["in_flight", "all"]).optional().describe("Packet scope (default: in_flight)."),
        limit: z.number().int().min(1).max(25).optional().describe("Max packet records when scope=all (1-25)."),
        includeSummary: z.boolean().optional().describe("Include extracted GOAL summary when available (default true)."),
      }).strict(),
    },
    createPacketVisibilityTool(deps)
  );

  server.registerTool(
    "scaffoldai_pending_questions",
    {
      description:
        "Expose bounded pending question/blocker observations from append-only MCP runtime signals.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(25).optional().describe("Max pending question records to return (1-25)."),
        unresolvedOnly: z.boolean().optional().describe("Return unresolved-only when true (default true)."),
      }).strict(),
    },
    createPendingQuestionsTool(deps)
  );

  server.registerTool(
    "scaffoldai_completion_status",
    {
      description:
        "Expose bounded completion handshake observations from append-only packet_completed signals with advisory readiness recommendations.",
      inputSchema: z.object({
        packet: z.string().optional().describe("Optional packet id to filter completion signals."),
        activePacketOnly: z.boolean().optional().describe("Filter to active packet only when true."),
        latestOnly: z.boolean().optional().describe("Return only the latest completion when true."),
        limit: z.number().int().min(1).max(25).optional().describe("Max completion records to return (1-25)."),
      }).strict(),
    },
    createCompletionStatusTool(deps)
  );

  return server;
}

module.exports = { createReadonlyMcpServer };
