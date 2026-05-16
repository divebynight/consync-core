"use strict";

const { z } = require("zod");
const { createReadonlyMcpServer } = require("../mcp-readonly");
const { runSubmitSdcCandidateTool } = require("../mcp/submit-sdc-candidate");

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

  return server;
}

module.exports = { createOperatorMcpServer };
