"use strict";

const { z } = require("zod");
const { createReadonlyMcpServer } = require("../mcp-readonly");
const { runSubmitSdcCandidateTool } = require("../mcp/submit-sdc-candidate");
const { runExecutorPlanToolMcp } = require("../mcp/tools");

function createOperatorMcpServer(deps = {}) {
  const server = createReadonlyMcpServer(deps);

  server.registerTool(
    "scaffoldai_submit_sdc_candidate",
    {
      description:
        "Submit a candidate SDC packet into .scaffoldai/inbox/ with bounded inbox-only authority. Does not intake, activate, claim, execute, closeout, cleanup, or commit.",
      inputSchema: z
        .object({
          content: z.any().optional().describe("Candidate SDC markdown content."),
          suggestedFileName: z.any().optional().describe("Optional suggested candidate filename or label (sanitized, inbox-bounded)."),
          submittedBy: z.any().optional().describe("Optional submitter identifier (alphanumeric plus . _ -)."),
        })
        .passthrough(),
    },
    async (args) => {
      const result = runSubmitSdcCandidateTool(args || {});
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    "scaffoldai_executor_plan",
    {
      description:
        "Bounded MCP executor planning tool. Resolves active packet context, constructs the deterministic planning-mode Copilot CLI command boundary, invokes Copilot in read-only planning mode, and returns structured plan output. No arbitrary shell execution. No work-mode execution. Planning only.",
      inputSchema: z.object({
        timeout_ms: z.number().int().min(10000).max(600000).optional().describe("Optional timeout in milliseconds (10000-600000, default 120000)."),
      }),
    },
    async (args) => {
      const result = runExecutorPlanToolMcp(args || {}, deps);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  return server;
}

module.exports = { createOperatorMcpServer };
