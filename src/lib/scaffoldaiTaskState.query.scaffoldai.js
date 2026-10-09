"use strict";

const scaffoldaiState = require("./scaffoldaiState.state.scaffoldai");
const { parseNextAction, parseHandoff } = require("./stateIntegrityCheck.check.scaffoldai");

// Single definition of task state shared by packet activation, gatekeeper
// mount/switch, and the executor acceptance check.
//
//   absent — next-action names no task (missing, empty, or PACKAGE: NONE)
//   closed — handoff records PASS or FAIL for the task next-action names
//   open   — next-action names a task with no terminal handoff

const TERMINAL_HANDOFF_STATUSES = new Set(["PASS", "FAIL"]);

function normalizeTaskId(value) {
  if (!value || typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/\.md$/i, "");
  return normalized && normalized !== "none" ? normalized : null;
}

function deriveTaskStatus(nextAction, handoff) {
  const taskId = normalizeTaskId(nextAction && nextAction.packageName);
  if (!taskId) return "absent";

  if (
    handoff &&
    normalizeTaskId(handoff.packageName) === taskId &&
    TERMINAL_HANDOFF_STATUSES.has(handoff.status)
  ) {
    return "closed";
  }

  return "open";
}

function readTaskState(rootPath) {
  const nextActionText = scaffoldaiState.readNextAction(rootPath);
  const handoffText = scaffoldaiState.readHandoff(rootPath);
  const nextAction = nextActionText ? parseNextAction(nextActionText) : null;
  const handoff = handoffText ? parseHandoff(handoffText) : null;
  const status = deriveTaskStatus(nextAction, handoff);

  return {
    status,
    task_id: status === "absent" ? null : normalizeTaskId(nextAction.packageName),
    package_name: status === "absent" ? null : nextAction.packageName,
    handoff_status: handoff ? handoff.status || null : null,
  };
}

module.exports = {
  normalizeTaskId,
  deriveTaskStatus,
  readTaskState,
};
