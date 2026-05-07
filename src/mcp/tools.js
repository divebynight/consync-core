"use strict";

const { readActiveContract, resolveVerifyCommand } = require("../lib/resolveVerifyCommand");
const { getInFlightPacket } = require("../lib/getInFlightPacket");
const { getGitStatus } = require("../lib/gitStatus");
const { gatherQuestions } = require("../commands/scaffoldai-question");
const { gatherPreflightResults } = require("../commands/scaffoldai-preflight");
const { inferCommitPrefix } = require("../commands/scaffoldai-closeout");

const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const EXECUTION_CLASS = "READ_ONLY";

// -----------------------------------------------------------------------
// scaffoldai_status
// -----------------------------------------------------------------------

function runStatusTool() {
  const contract = readActiveContract(repoRoot);
  const inFlightPacket = getInFlightPacket(repoRoot);
  const git = getGitStatus(repoRoot);
  const resolved = resolveVerifyCommand(contract, {});

  let status = "ON_TRACK";
  if (!contract) status = "BLOCKED";
  else if (!git.clean) status = "WARNING";

  return {
    tool: "scaffoldai_status",
    execution_class: EXECUTION_CLASS,
    status,
    data: {
      contract: contract || null,
      in_flight_packet: inFlightPacket || null,
      git_clean: git.clean,
      git_file_count: git.count,
      verify_command: resolved.error ? null : resolved.command,
    },
    next_safe_action:
      status === "BLOCKED"
        ? "Resolve missing or malformed active-contract.json before continuing."
        : status === "WARNING"
        ? "Review uncommitted changes before proceeding."
        : "Repo is on track. Run scaffoldai preflight to confirm readiness.",
  };
}

// -----------------------------------------------------------------------
// scaffoldai_preflight
// -----------------------------------------------------------------------

function runPreflightTool() {
  const result = gatherPreflightResults();

  return {
    tool: "scaffoldai_preflight",
    execution_class: EXECUTION_CLASS,
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
  const result = gatherQuestions();

  return {
    tool: "scaffoldai_question",
    execution_class: EXECUTION_CLASS,
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
      error: true,
      error_message: resolved.error,
    };
  }

  return {
    tool: "scaffoldai_verify_recommend",
    execution_class: EXECUTION_CLASS,
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
    status,
    data: {
      changed_file_count: git.clean ? 0 : git.count,
      changed_files: git.clean ? [] : (git.files || []),
      commit_prefix_suggestion: commitPrefix || null,
      verify_command: resolved.error ? null : resolved.command,
      verify_evidence: "not provided",
      in_flight_packet: inFlightPacket || null,
    },
    next_safe_action: "Run verify and pass --verify-passed to scaffoldai closeout.",
  };
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
};
