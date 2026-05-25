"use strict";

const { z } = require("zod");
const { createReadonlyMcpServer } = require("../mcp-readonly");
const { runSubmitSdcCandidateTool } = require("../mcp/submit-sdc-candidate");
const {
  runExecutorPlanToolMcp,
  runExecutorPlanStartTool,
  runExecutorPlanStatusTool,
  runExecutorPlanResultTool,
  runExecutorPlanCleanupTool,
} = require("../mcp/tools");

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
        "[TRANSITIONAL — blocking synchronous path. New coordinators should use scaffoldai_executor_plan_start / _status / _result / _cleanup.] " +
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

  server.registerTool(
    "scaffoldai_executor_plan_start",
    {
      description:
        "Start an async artifact-backed executor planning job. Resolves active packet context internally — no arbitrary prompt input accepted. Spawns Copilot in read-only planning mode (shell: false, --deny-tool=shell(*)). Returns job_id immediately for polling. Use scaffoldai_executor_plan_status to poll, scaffoldai_executor_plan_result to retrieve output.",
      inputSchema: z.object({
        timeout_ms: z.number().int().min(10000).max(600000).optional().describe("Optional timeout in milliseconds (10000-600000, default 120000)."),
      }),
    },
    async (args) => {
      const result = runExecutorPlanStartTool(args || {}, deps);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    "scaffoldai_executor_plan_status",
    {
      description:
        "Poll the status of an async executor planning job by job_id. Reads persisted status.json artifact — does not re-invoke Copilot. Returns lifecycle state: running | completed | failed | timed_out.",
      inputSchema: z.object({
        job_id: z.string().describe("Job ID returned by scaffoldai_executor_plan_start."),
      }),
    },
    async (args) => {
      const result = runExecutorPlanStatusTool(args || {});
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    "scaffoldai_executor_plan_result",
    {
      description:
        "Retrieve the full result of a completed async executor planning job by job_id. Reads persisted result.json artifact — does not re-invoke Copilot. Returns stdout, stderr, exit_code, active_packet_id, and structured status.",
      inputSchema: z.object({
        job_id: z.string().describe("Job ID returned by scaffoldai_executor_plan_start."),
      }),
    },
    async (args) => {
      const result = runExecutorPlanResultTool(args || {});
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    "scaffoldai_executor_plan_cleanup",
    {
      description:
        "Clean up old completed executor planning job artifacts under .scaffoldai/runtime/executor-plans/. Never removes running jobs. Never removes accepted packets or append-only logs.",
      inputSchema: z.object({
        max_age_ms: z.number().int().min(0).optional().describe("Maximum age in milliseconds for completed jobs to retain (default: 86400000 = 24h)."),
      }),
    },
    async (args) => {
      const result = runExecutorPlanCleanupTool(args || {});
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  return server;
}

module.exports = { createOperatorMcpServer };
