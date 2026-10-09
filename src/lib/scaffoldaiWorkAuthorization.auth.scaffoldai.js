"use strict";

const path = require("path");

const scaffoldaiState = require("./scaffoldaiState.state.scaffoldai");
const acceptance = require("./scaffoldaiTaskAcceptance.auth.scaffoldai");
const { normalizeTaskId, readTaskState } = require("./scaffoldaiTaskState.query.scaffoldai");
const {
  LEGACY_APPROVAL_COMPATIBILITY,
  checkReviewHash,
  evaluatePacketApproval,
} = require("./scaffoldaiPacketIntake.auth.scaffoldai");

// Task-bound work authorization (Proposal B).
//
// Acceptance selects the reviewed instructions; it does not authorize work.
// Work needs a separate record, created only by an explicit local human command
// (scaffoldai packet authorize-work, or packet activate --authorize-work). The
// record is bound to one acceptance instance: packet id, packet file, packet
// and next-action hashes, and accepted_at. It is usable only while every bound
// field equals the current acceptance record and the task is open, so a
// re-accepted, replaced, cleared, reset or closed task makes it inert. Activation
// and clear also remove it before changing task state.
//
// Limits: file and surface scope inside the instructions are not enforced
// here. The record does not prove who created it; any process running as the
// same user can write it. The check runs when scaffoldai work generates the
// prompt and command; a command already printed cannot be revoked by it.

const WORK_AUTHORIZATION_SCHEMA = "scaffoldai.work-authorization.v1";
const WORK_MODE = "work";
const BOUND_FIELDS = ["packet_id", "packet_file", "packet_sha256", "next_action_sha256", "accepted_at"];
const AUTHORIZE_ACTION =
  "Authorize the accepted task explicitly with: scaffoldai packet authorize-work <packet> --sha256 <review hash>";
const AUTHORIZE_HASH_GUIDANCE =
  "Run scaffoldai packet preview .scaffoldai/packets/<packet>.md, review the accepted text, then rerun with --sha256 <review hash>.";

function readWorkAuthorizationRecord(rootPath) {
  const raw = scaffoldaiState.readWorkAuthorizationRaw(rootPath);
  if (raw === null) return null;
  try {
    const record = JSON.parse(raw);
    return record && record.schema === WORK_AUTHORIZATION_SCHEMA ? record : null;
  } catch {
    return null;
  }
}

// Removes any work authorization. Returns true if a record existed.
function clearWorkAuthorization(rootPath) {
  return scaffoldaiState.removeWorkAuthorization(rootPath);
}

function blocked(packetId, reason, message, nextSafeAction, extra = {}) {
  return {
    action: "authorize-work",
    status: "BLOCKED",
    reason,
    packet_id: packetId,
    message,
    next_safe_action: nextSafeAction,
    ...extra,
  };
}

// Creates the work authorization for the currently accepted, open task. Every
// check runs before the single write; a refusal changes nothing.
function authorizeWork(rootPath, packetInput, options = {}) {
  const packetId = typeof packetInput === "string" && packetInput.trim()
    ? normalizeTaskId(path.basename(packetInput.trim()))
    : null;
  if (!packetId) {
    return blocked(null, "invalid_arguments", "A packet name or path is required.",
      "Run scaffoldai packet authorize-work <packet> --sha256 <review hash>.");
  }

  const record = acceptance.readAcceptanceRecord(rootPath);
  if (!record) {
    return blocked(packetId, "acceptance_missing",
      "No acceptance record exists. Work can be authorized only for an accepted task.",
      "Accept the reviewed packet first with: scaffoldai packet activate <packet> --sha256 <review hash>");
  }
  if (record.packet_id !== packetId) {
    return blocked(packetId, "acceptance_packet_mismatch",
      `The accepted task is "${record.packet_id}", not "${packetId}".`,
      "Authorize only the accepted task, or accept this packet first.");
  }

  const taskState = readTaskState(rootPath);
  if (taskState.status !== "open" || taskState.task_id !== packetId) {
    return blocked(packetId, "task_not_open",
      `Task "${packetId}" is not open (status: ${taskState.status}).`,
      "Create and accept a new packet for any further work.");
  }

  try {
    acceptance.assertAcceptedTask(rootPath, {
      activePacket: packetId,
      nextActionContent: scaffoldaiState.readNextAction(rootPath),
    });
  } catch (error) {
    return blocked(packetId, "acceptance_invalid",
      `The acceptance check failed (${error.code || "error"}).`,
      "Re-accept the reviewed packet with: scaffoldai packet activate <packet> --sha256 <review hash>",
      { acceptance_code: error.code || null });
  }

  // The hash and approval checks use these bytes, which must still be the
  // accepted packet.
  const packetContent = acceptance.readPacketFile(rootPath, record.packet_file);
  if (packetContent === null || acceptance.sha256(packetContent) !== record.packet_sha256) {
    return blocked(packetId, "acceptance_invalid",
      "The accepted packet file is missing or has changed since acceptance.",
      "Re-accept the reviewed packet with: scaffoldai packet activate <packet> --sha256 <review hash>",
      { acceptance_code: "ACCEPTANCE_STALE" });
  }

  const hashError = checkReviewHash(packetContent, options.expectedPacketSha256);
  if (hashError) {
    return blocked(packetId, hashError,
      hashError === "review_hash_required"
        ? "Work authorization requires the review hash of the accepted packet."
        : "The accepted packet does not match the reviewed hash.",
      AUTHORIZE_HASH_GUIDANCE);
  }

  const approval = evaluatePacketApproval(packetContent);
  if (!approval.ok) {
    return blocked(packetId, "packet_approval_not_pending",
      "The accepted packet's APPROVAL text is not PENDING. Packet text cannot grant approval, so work cannot be authorized for it.",
      "Submit a new proposal with APPROVAL execute/commit PENDING, then preview, intake and activate it with --sha256.",
      { approval: approval.values });
  }
  const compatibility = approval.legacy ? { approval_compatibility: LEGACY_APPROVAL_COMPATIBILITY } : {};

  const authorization = {
    schema: WORK_AUTHORIZATION_SCHEMA,
    packet_id: record.packet_id,
    packet_file: record.packet_file,
    packet_sha256: record.packet_sha256,
    next_action_sha256: record.next_action_sha256,
    accepted_at: record.accepted_at,
    mode: WORK_MODE,
    authorized_at: (options.now || new Date()).toISOString(),
    authorized_via: options.via || "scaffoldai packet authorize-work",
    ...compatibility,
  };
  scaffoldaiState.writeWorkAuthorizationRaw(rootPath, JSON.stringify(authorization, null, 2) + "\n");

  return {
    action: "authorize-work",
    status: "PASS",
    packet_id: record.packet_id,
    packet_file: record.packet_file,
    accepted_at: record.accepted_at,
    authorized_at: authorization.authorized_at,
    mode: WORK_MODE,
    ...compatibility,
    next_safe_action:
      "Run scaffoldai work to print the work prompt and command. Re-acceptance, clear, reset or closing the task ends this authorization.",
  };
}

function notAuthorized(message, extra = {}) {
  return Object.assign(new Error(`${message} ${AUTHORIZE_ACTION}`), { code: "EXECUTION_NOT_AUTHORIZED", ...extra });
}

// Reads each context field exactly once, verifies acceptance and the work
// authorization against that snapshot, and returns it, so the work prompt
// embeds precisely the text that was verified.
function authorizedWorkInput(context) {
  const source = context || {};
  const snapshot = Object.freeze({
    repoRoot: source.repoRoot,
    activePacket: source.activePacket,
    nextActionContent: source.nextActionContent,
  });

  let record;
  try {
    record = acceptance.assertAcceptedTask(snapshot.repoRoot, snapshot);
  } catch (error) {
    throw notAuthorized(`Work is not authorized: ${error.message}`, { acceptance_code: error.code || null });
  }

  const authorization = readWorkAuthorizationRecord(snapshot.repoRoot);
  if (!authorization) {
    throw notAuthorized("No work authorization exists for the accepted task.");
  }
  const bound = authorization.mode === WORK_MODE && BOUND_FIELDS.every((field) =>
    typeof authorization[field] === "string" && authorization[field] !== "" && authorization[field] === record[field]);
  if (!bound) {
    throw notAuthorized("The work authorization does not match the current acceptance.");
  }
  return snapshot;
}

module.exports = {
  WORK_AUTHORIZATION_SCHEMA,
  readWorkAuthorizationRecord,
  clearWorkAuthorization,
  authorizeWork,
  authorizedWorkInput,
};
