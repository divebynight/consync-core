"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const scaffoldaiState = require("./scaffoldaiState.state.scaffoldai");
const { normalizeTaskId, readTaskState } = require("./scaffoldaiTaskState.query.scaffoldai");

// Task-integrity enforcement for executor prompts.
//
// Packet activation (the human acceptance path) is the only writer of the
// acceptance record. The record binds the accepted packet id to sha256 hashes
// of the packet file and of the exact next-action text that prompt builders
// embed. A hash alone is not approval: prompt builders also require the record
// to name the currently open task and the packet file to be unchanged.
//
// This guarantees which instructions reach a worker. It does not constrain
// what a worker does with them.

const ACCEPTANCE_RELATIVE = scaffoldaiState.ACCEPTED_TASK_RELATIVE;
const ACCEPTANCE_SCHEMA = "scaffoldai.accepted-task.v1";
const PACKETS_DIR_RELATIVE = path.join(".scaffoldai", "packets");
const REACCEPT_ACTION = "Re-accept the task explicitly with: scaffoldai packet activate <packet>";

const NO_TASK_NEXT_ACTION = [
  "TYPE: REFACTOR",
  "PACKAGE: NONE",
  "",
  "No active task. Activate an accepted packet to create executable instructions.",
  "",
].join("\n");

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

// next-action.md for an accepted packet: pointer header plus the packet text
// verbatim. Nothing from any previous next-action survives.
function buildAcceptedNextAction({ packetId, category, packetContent }) {
  const type = category ? String(category).toUpperCase() : "REFACTOR";
  return [
    `TYPE: ${type}`,
    `PACKAGE: ${packetId}`,
    "",
    "ACCEPTED PACKET",
    "",
    packetContent.trimEnd(),
    "",
  ].join("\n");
}

function buildAcceptanceRecord({ packetId, packetFile, packetContent, nextActionContent, now }) {
  return {
    schema: ACCEPTANCE_SCHEMA,
    packet_id: packetId,
    packet_file: packetFile,
    packet_sha256: sha256(packetContent),
    next_action_sha256: sha256(nextActionContent),
    accepted_at: (now || new Date()).toISOString(),
    accepted_via: "scaffoldai packet activate",
  };
}

function readAcceptanceRaw(rootPath) {
  return scaffoldaiState.readAcceptedTaskRaw(rootPath);
}

// All acceptance-record writes go through the state authority module, which
// writes atomically (temp file + rename). null removes the record.
function writeAcceptanceRaw(rootPath, raw) {
  if (raw === null) {
    scaffoldaiState.removeAcceptedTask(rootPath);
    return;
  }
  scaffoldaiState.writeAcceptedTaskRaw(rootPath, raw);
}

function writeAcceptanceRecord(rootPath, record) {
  writeAcceptanceRaw(rootPath, JSON.stringify(record, null, 2) + "\n");
}

function clearAcceptanceRecord(rootPath) {
  writeAcceptanceRaw(rootPath, null);
}

function readAcceptanceRecord(rootPath) {
  const raw = readAcceptanceRaw(rootPath);
  if (raw === null) return null;
  try {
    const record = JSON.parse(raw);
    return record && record.schema === ACCEPTANCE_SCHEMA ? record : null;
  } catch {
    return null;
  }
}

function refusal(code, message) {
  return Object.assign(new Error(`${message} ${REACCEPT_ACTION}`), { code });
}

// Real path of a packet file only when it resolves (after symlinks) to a
// regular file inside .scaffoldai/packets/; otherwise null.
function containedPacketRealPath(rootPath, packetPath) {
  try {
    const packetsRoot = fs.realpathSync(path.resolve(rootPath, PACKETS_DIR_RELATIVE));
    const real = fs.realpathSync(path.resolve(rootPath, packetPath));
    const relative = path.relative(packetsRoot, real);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;
    return fs.statSync(real).isFile() ? real : null;
  } catch {
    return null;
  }
}

function readPacketFile(rootPath, packetFile) {
  if (typeof packetFile !== "string" || !packetFile) return null;
  const real = containedPacketRealPath(rootPath, packetFile);
  if (!real) return null;
  try {
    return fs.readFileSync(real, "utf8");
  } catch {
    return null;
  }
}

// Reads a packet for acceptance; throws if it resolves outside the packets dir.
function readContainedPacket(rootPath, packetPath) {
  const real = containedPacketRealPath(rootPath, packetPath);
  if (!real) throw new Error("packet path must stay under .scaffoldai/packets/");
  return fs.readFileSync(real, "utf8");
}

// Throws (with error.code) unless nextActionContent is exactly what the
// acceptance path recorded for the currently open task.
function assertAcceptedTask(rootPath, { activePacket, nextActionContent } = {}) {
  if (!rootPath) throw refusal("ACCEPTANCE_MISSING", "No repository root for acceptance check.");
  if (typeof nextActionContent !== "string") {
    throw refusal("ACCEPTANCE_CONTENT_MISMATCH", "No task content to verify.");
  }

  const record = readAcceptanceRecord(rootPath);
  if (!record) {
    throw refusal("ACCEPTANCE_MISSING", "No valid acceptance record for the current task.");
  }

  const taskId = normalizeTaskId(activePacket);
  if (!taskId || record.packet_id !== taskId) {
    throw refusal("ACCEPTANCE_PACKET_MISMATCH",
      "Acceptance record does not match the active task.");
  }

  if (sha256(nextActionContent) !== record.next_action_sha256) {
    throw refusal("ACCEPTANCE_CONTENT_MISMATCH",
      "next-action.md differs from the accepted task content.");
  }

  const packetContent = readPacketFile(rootPath, record.packet_file);
  if (packetContent === null || sha256(packetContent) !== record.packet_sha256) {
    throw refusal("ACCEPTANCE_STALE", "The accepted packet file is missing or has changed since acceptance.");
  }

  const taskState = readTaskState(rootPath);
  if (taskState.status !== "open" || taskState.task_id !== taskId) {
    throw refusal("ACCEPTANCE_STALE", "The accepted task is no longer open.");
  }

  return record;
}

// Reads each context field exactly once, verifies that snapshot, and returns
// it, so prompt builders embed precisely the text that was verified.
function acceptedPromptInput(context) {
  const source = context || {};
  const snapshot = Object.freeze({
    repoRoot: source.repoRoot,
    activePacket: source.activePacket,
    nextActionContent: source.nextActionContent,
  });
  assertAcceptedTask(snapshot.repoRoot, snapshot);
  return snapshot;
}

module.exports = {
  ACCEPTANCE_RELATIVE,
  NO_TASK_NEXT_ACTION,
  sha256,
  buildAcceptedNextAction,
  buildAcceptanceRecord,
  readAcceptanceRaw,
  writeAcceptanceRaw,
  writeAcceptanceRecord,
  clearAcceptanceRecord,
  readAcceptanceRecord,
  assertAcceptedTask,
  acceptedPromptInput,
  readContainedPacket,
  readPacketFile,
};
