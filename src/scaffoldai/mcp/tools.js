"use strict";

const { readActiveContract, resolveVerifyCommand } = require("../../lib/resolveVerifyCommand.query.scaffoldai");
const { getInFlightPacket } = require("../../lib/getInFlightPacket.query.scaffoldai");
const { getGitStatus } = require("../../lib/gitStatus.util.shared");
const { gatherQuestions } = require("../../lib/scaffoldaiQuestion.query.scaffoldai");
const { gatherPreflightResults } = require("../../lib/scaffoldaiPreflight.auth.scaffoldai");
const { inferCommitPrefix } = require("../../lib/scaffoldaiCloseout.auth.scaffoldai");
const { gatherStatus } = require("../../lib/scaffoldaiStatus.query.scaffoldai");
const { resolveProfile } = require("../../lib/profileResolver.process.scaffoldai");
const { getRepoRoot } = require("../../lib/repoRoot.util.shared");
const { gatherCompletionStatus } = require("../../lib/scaffoldaiCompletionStatus.query.scaffoldai");
const { runVerifyTool } = require("../../lib/scaffoldaiVerifyRun.auth.scaffoldai");
const { runExecutorPlanTool } = require("../../lib/scaffoldaiExecutorPlan.tool.scaffoldai");

const repoRoot = getRepoRoot(__dirname);
const EXECUTION_CLASS = "READ_ONLY";

// Resolve profile once at module load
const PROFILE = resolveProfile();

// -----------------------------------------------------------------------
// scaffoldai_status
// -----------------------------------------------------------------------

function runStatusTool() {
  const status = gatherStatus(repoRoot, { includeGit: true });
  const git = status.data.git;

  let mcpStatus = "ON_TRACK";
  if (status.status === "BLOCKED") {
    mcpStatus = "BLOCKED";
  } else if (!git || git.error || !git.clean) {
    mcpStatus = "WARNING";
  }

  return {
    tool: "scaffoldai_status",
    execution_class: EXECUTION_CLASS,
    profile: PROFILE.profile,
    interaction_mode: PROFILE.interaction_mode,
    execution_mode: PROFILE.execution_mode,
    status: mcpStatus,
    data: {
      contract: status.data.contract,
      active_stream: status.data.active_stream,
      in_flight_packet: status.data.active_packet,
      git_clean: git ? git.clean : null,
      git_file_count: git ? git.count : null,
      verify_command: status.data.verify_command,
    },
    next_safe_action:
      mcpStatus === "BLOCKED"
        ? "Resolve missing or malformed active-policy.json or active-runtime.json before continuing."
        : mcpStatus === "WARNING"
        ? "Review uncommitted changes before proceeding."
        : "Repo is on track. Run scaffoldai preflight to confirm readiness.",
  };
}

// -----------------------------------------------------------------------
// scaffoldai_preflight
// -----------------------------------------------------------------------

function runPreflightTool() {
  const result = gatherPreflightResults(repoRoot);

  return {
    tool: "scaffoldai_preflight",
    execution_class: EXECUTION_CLASS,
    profile: PROFILE.profile,
    interaction_mode: PROFILE.interaction_mode,
    execution_mode: PROFILE.execution_mode,
    status: result.status,
    data: {
      blockers: result.blockers,
      warnings: result.warnings,
    },
    next_safe_action:
      result.status === "BLOCKED"
        ? "Resolve all BLOCKED conditions before starting work."
        : result.status === "WARNING"
        ? "Review warnings. Proceed with caution."
        : "Preflight PASS. Safe to begin work.",
  };
}

// -----------------------------------------------------------------------
// scaffoldai_question
// -----------------------------------------------------------------------

function runQuestionTool() {
  const result = gatherQuestions(repoRoot);

  return {
    tool: "scaffoldai_question",
    execution_class: EXECUTION_CLASS,
    profile: PROFILE.profile,
    interaction_mode: PROFILE.interaction_mode,
    execution_mode: PROFILE.execution_mode,
    status: result.status,
    data: {
      question_count: result.questions.length,
      questions: result.questions,
      in_flight_packet: result.inFlightPacket || null,
      stream: result.streamName,
    },
    next_safe_action:
      result.status === "CLEAR"
        ? "No open structural questions. Run the recommended VERIFY COMMAND before closeout."
        : "Review the question(s) above. No automatic action is taken.",
  };
}

// -----------------------------------------------------------------------
// scaffoldai_verify_recommend
// -----------------------------------------------------------------------

function runVerifyRecommendTool() {
  const contract = readActiveContract(repoRoot);
  const resolved = resolveVerifyCommand(contract, {});

  if (resolved.error) {
    return {
      tool: "scaffoldai_verify_recommend",
      execution_class: EXECUTION_CLASS,
      profile: PROFILE.profile,
      interaction_mode: PROFILE.interaction_mode,
      execution_mode: PROFILE.execution_mode,
      error: true,
      error_message: resolved.error,
    };
  }

  return {
    tool: "scaffoldai_verify_recommend",
    execution_class: EXECUTION_CLASS,
    profile: PROFILE.profile,
    interaction_mode: PROFILE.interaction_mode,
    execution_mode: PROFILE.execution_mode,
    status: "RECOMMEND",
    data: {
      verify_command: resolved.command,
      target: resolved.target || null,
      reason: resolved.reason || null,
    },
    next_safe_action: `Run: ${resolved.command}`,
  };
}

// -----------------------------------------------------------------------
// scaffoldai_closeout_readiness
// -----------------------------------------------------------------------

function runCloseoutReadinessTool() {
  const contract = readActiveContract(repoRoot);
  const git = getGitStatus(repoRoot);
  const inFlightPacket = getInFlightPacket(repoRoot);
  const resolved = resolveVerifyCommand(contract, {});
  const commitPrefix = inferCommitPrefix(git.files || [], contract);

  // verifyPassed is always false for MCP v0 — never return READY_FOR_REVIEW
  let status;
  if (!contract) {
    status = "BLOCKED";
  } else if (!git.clean && git.count > 0) {
    status = "NEEDS_VERIFICATION";
  } else {
    status = "WARNING";
  }

  return {
    tool: "scaffoldai_closeout_readiness",
    execution_class: EXECUTION_CLASS,
    profile: PROFILE.profile,
    interaction_mode: PROFILE.interaction_mode,
    execution_mode: PROFILE.execution_mode,
    status,
    data: {
      changed_file_count: git.clean ? 0 : git.count,
      changed_files: git.clean ? [] : (git.files || []),
      commit_prefix_suggestion: commitPrefix || null,
      verify_command: resolved.error ? null : resolved.command,
      verify_evidence: "not provided",
      in_flight_packet: inFlightPacket || null,
    },
    next_safe_action: "Run verify, then run scaffoldai closeout.",
  };
}

// -----------------------------------------------------------------------
// scaffoldai_completion_status
// -----------------------------------------------------------------------

function runCompletionStatusTool(args = {}) {
  const result = gatherCompletionStatus(repoRoot, args);

  return {
    ...result,
    profile: PROFILE.profile,
    interaction_mode: PROFILE.interaction_mode,
    execution_mode: PROFILE.execution_mode,
  };
}

// -----------------------------------------------------------------------
// scaffoldai_verify_run
// -----------------------------------------------------------------------

function runVerifyRunTool(args = {}, deps = {}) {
  return runVerifyTool(repoRoot, args, deps);
}

// -----------------------------------------------------------------------
// scaffoldai_executor_plan
// -----------------------------------------------------------------------

function runExecutorPlanToolMcp(args = {}, deps = {}) {
  return runExecutorPlanTool(repoRoot, args, deps);
}

// -----------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------

module.exports = {
  runStatusTool,
  runPreflightTool,
  runQuestionTool,
  runVerifyRecommendTool,
  runCloseoutReadinessTool,
  runCompletionStatusTool,
  runVerifyRunTool,
  runExecutorPlanToolMcp,
};
