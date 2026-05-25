"use strict";

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");

const {
  runStatusTool,
  runPreflightTool,
  runQuestionTool,
  runVerifyRecommendTool,
  runCloseoutReadinessTool,
  runCompletionStatusTool,
  runVerifyRunTool,
  runExecutorPlanToolMcp,
  runExecutorPlanStartTool,
  runExecutorPlanStatusTool,
  runExecutorPlanResultTool,
  runExecutorPlanCleanupTool,
} = require("./tools");
const { runSignalTool } = require("./signal");
const { runMemoryWriteTool, runMemoryReadTool } = require("./shared-memory");
const { runSubmitSdcCandidateTool } = require("./submit-sdc-candidate");

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

function formatLogToken(value) {
  if (typeof value !== "string" || value.length === 0) return "(unknown)";
  return value.replace(/[^A-Za-z0-9_.-]/g, "?").slice(0, 64);
}

function withToolLogging(name, handler) {
  return async (args) => {
    logMcp(`tool call: ${name}`);
    try {
      const response = await handler(args);
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

server.registerTool(
  "scaffoldai_completion_status",
  {
    description:
      "Read-only completion handshake visibility from append-only packet_completed signals with advisory closeout recommendations.",
    inputSchema: z.object({
      packet: z.string().optional().describe("Optional packet id to filter completion signals."),
      activePacketOnly: z.boolean().optional().describe("Filter to active packet only when true."),
      latestOnly: z.boolean().optional().describe("Return only the latest completion when true."),
      limit: z.number().int().min(1).max(25).optional().describe("Max completion records (1-25)."),
    }),
  },
  withToolLogging("scaffoldai_completion_status", async (args) => {
    const result = runCompletionStatusTool(args || {});
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "scaffoldai_verify_run",
  {
    description:
      "Run an allowlisted local verification command through a bounded stdio runner. No arbitrary shell execution.",
    inputSchema: z.object({
      command: z.string().optional().describe("Optional allowlisted verify command. Default resolves to current ScaffoldAI recommendation."),
      timeout_ms: z.number().int().min(1000).max(600000).optional().describe("Optional timeout in milliseconds (1000-600000)."),
    }),
  },
  withToolLogging("scaffoldai_verify_run", async (args) => {
    const result = runVerifyRunTool(args || {});
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "scaffoldai_signal",
  {
    description:
      "Append one bounded local ScaffoldAI client signal for presence and connection testing. Non-authoritative and not general write access.",
    inputSchema: z.object({}).passthrough(),
  },
  withToolLogging("scaffoldai_signal", async (args) => {
    const result = runSignalTool(args || {});
    const clientId = formatLogToken(result.client_id);
    const signalType = formatLogToken(result.signal_type);

    if (result.status === "accepted") {
      logMcp(`signal accepted: ${signalType} ${clientId}`);
    } else {
      logMcp(`signal rejected: ${signalType} ${clientId}`);
    }

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "scaffoldai_submit_sdc_candidate",
  {
    description:
      "Submit a candidate SDC packet into .scaffoldai/inbox/ with bounded inbox-only authority. Does not intake, activate, claim, execute, closeout, cleanup, or commit.",
    inputSchema: z.object({
      content: z.any().optional().describe("Candidate SDC markdown content."),
      suggestedFileName: z.any().optional().describe("Optional suggested candidate filename or label (sanitized, inbox-bounded)."),
      submittedBy: z.any().optional().describe("Optional submitter identifier (alphanumeric plus . _ -)."),
    }).passthrough(),
  },
  withToolLogging("scaffoldai_submit_sdc_candidate", async (args) => {
    const result = runSubmitSdcCandidateTool(args || {});
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "scaffoldai_memory_write",
  {
    description:
      "Append a message to the ScaffoldAI shared memory surface. Used for MCP-mediated communication between AI clients. Append-only; no delete or edit.",
    inputSchema: z.object({
      from: z.string().describe("Sender identity (required, max 80 chars)."),
      to: z.string().describe("Recipient identity or 'all' (required, max 80 chars)."),
      topic: z.string().optional().describe("Optional topic label (max 80 chars)."),
      message: z.string().describe("Message body (required, max 1000 chars)."),
    }),
  },
  withToolLogging("scaffoldai_memory_write", async (args) => {
    const result = runMemoryWriteTool(args || {});
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "scaffoldai_memory_read",
  {
    description:
      "Read recent messages from the ScaffoldAI shared memory surface for a given audience. Read-only.",
    inputSchema: z.object({
      audience: z.string().describe("Recipient to filter by (required)."),
      limit: z.number().optional().describe("Max messages to return (1–25, default 10)."),
      includeAll: z.boolean().optional().describe("Also include messages addressed to 'all' (default true)."),
    }),
  },
  withToolLogging("scaffoldai_memory_read", async (args) => {
    const result = runMemoryReadTool(args || {});
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "scaffoldai_executor_plan",
  {
    description:
      "[TRANSITIONAL — blocking synchronous path. New coordinators should use scaffoldai_executor_plan_start / _status / _result / _cleanup.] " +
      "Bounded MCP executor planning tool. Resolves active packet context, constructs the deterministic planning-mode Copilot CLI command boundary, invokes Copilot in read-only planning mode, and returns structured plan output. No arbitrary shell execution. No work-mode execution. Planning only.",
    inputSchema: z.object({
      timeout_ms: z.number().int().min(10000).max(600000).optional().describe("Optional timeout in milliseconds (10000-600000, default 120000)."),
    }),
  },
  withToolLogging("scaffoldai_executor_plan", async (args) => {
    const result = runExecutorPlanToolMcp(args || {});
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "scaffoldai_executor_plan_start",
  {
    description:
      "Start an async artifact-backed executor planning job. Resolves active packet context internally — no arbitrary prompt input accepted. Spawns Copilot in read-only planning mode (shell: false, --deny-tool=shell(*)). Returns job_id immediately for polling.",
    inputSchema: z.object({
      timeout_ms: z.number().int().min(10000).max(600000).optional().describe("Optional timeout in milliseconds (10000-600000, default 120000)."),
    }),
  },
  withToolLogging("scaffoldai_executor_plan_start", async (args) => {
    const result = runExecutorPlanStartTool(args || {});
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "scaffoldai_executor_plan_status",
  {
    description:
      "Poll the status of an async executor planning job by job_id. Reads persisted status.json artifact — does not re-invoke Copilot.",
    inputSchema: z.object({
      job_id: z.string().describe("Job ID returned by scaffoldai_executor_plan_start."),
    }),
  },
  withToolLogging("scaffoldai_executor_plan_status", async (args) => {
    const result = runExecutorPlanStatusTool(args || {});
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "scaffoldai_executor_plan_result",
  {
    description:
      "Retrieve the full result of a completed async executor planning job by job_id. Reads persisted result.json artifact — does not re-invoke Copilot.",
    inputSchema: z.object({
      job_id: z.string().describe("Job ID returned by scaffoldai_executor_plan_start."),
    }),
  },
  withToolLogging("scaffoldai_executor_plan_result", async (args) => {
    const result = runExecutorPlanResultTool(args || {});
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "scaffoldai_executor_plan_cleanup",
  {
    description:
      "Clean up old completed executor planning job artifacts under .scaffoldai/runtime/executor-plans/. Never removes running jobs.",
    inputSchema: z.object({
      max_age_ms: z.number().int().min(0).optional().describe("Maximum age in milliseconds for completed jobs to retain (default: 86400000 = 24h)."),
    }),
  },
  withToolLogging("scaffoldai_executor_plan_cleanup", async (args) => {
    const result = runExecutorPlanCleanupTool(args || {});
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
