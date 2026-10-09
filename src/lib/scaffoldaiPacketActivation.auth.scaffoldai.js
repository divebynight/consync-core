"use strict";

const fs = require("fs");
const path = require("path");

const scaffoldaiState = require("./scaffoldaiState.state.scaffoldai");
const { getInFlightPacket } = require("./getInFlightPacket.query.scaffoldai");
const { detectCategory, extractTitle } = require("./scaffoldaiPacketVisibility.query.scaffoldai");
const { checkWorkspaceCleanliness } = require("./workspaceCleanlinessCheck.auth.scaffoldai");
const { readTaskState } = require("./scaffoldaiTaskState.query.scaffoldai");
const acceptance = require("./scaffoldaiTaskAcceptance.auth.scaffoldai");

const PACKETS_DIR_RELATIVE = path.join(".scaffoldai", "packets");

function normalizePacketId(value) {
  if (!value || typeof value !== "string") return null;
  return value.trim().toLowerCase().replace(/\.md$/i, "");
}

function findPacketFileMatchesById(rootPath, packetId) {
  const normalized = normalizePacketId(packetId);
  if (!normalized) return [];

  const packetsRoot = path.resolve(rootPath, PACKETS_DIR_RELATIVE);
  if (!fs.existsSync(packetsRoot)) return [];

  const matches = [];
  for (const entry of fs.readdirSync(packetsRoot, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith(".md")) continue;
    if (entry.name.toLowerCase() === "readme.md") continue;

    if (normalizePacketId(entry.name) === normalized) {
      matches.push({
        absolutePath: path.join(packetsRoot, entry.name),
        fileName: entry.name,
        packetId: normalizePacketId(entry.name),
      });
    }
  }

  return matches;
}

function parseActiveStreamName(activeStreamText) {
  if (!activeStreamText) return null;

  const lines = activeStreamText.split(/\r?\n/);
  const sectionIndex = lines.findIndex((line) => line.trim() === "ACTIVE STREAM");

  if (sectionIndex === -1) return null;

  for (const line of lines.slice(sectionIndex + 1)) {
    const trimmed = line.trim();
    if (trimmed) return trimmed;
  }

  return null;
}

function isWithinDirectory(candidatePath, parentDirectory) {
  const relative = path.relative(parentDirectory, candidatePath);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function resolvePacketPath(rootPath, inputPath) {
  if (!inputPath || !String(inputPath).trim()) {
    throw new Error("packet path or filename is required");
  }

  const packetsRoot = path.resolve(rootPath, PACKETS_DIR_RELATIVE);
  const rawInput = String(inputPath).trim();
  const looksLikePath =
    path.isAbsolute(rawInput) ||
    rawInput.includes("/") ||
    rawInput.includes("\\") ||
    rawInput.startsWith(".");

  let candidatePath = looksLikePath
    ? path.resolve(rootPath, rawInput)
    : path.resolve(packetsRoot, rawInput);

  if (!candidatePath.toLowerCase().endsWith(".md")) {
    candidatePath += ".md";
  }

  if (!isWithinDirectory(candidatePath, packetsRoot)) {
    throw new Error("packet path must stay under .scaffoldai/packets/");
  }

  if (!fs.existsSync(candidatePath) || !fs.statSync(candidatePath).isFile()) {
    if (!looksLikePath) {
      const matches = findPacketFileMatchesById(rootPath, rawInput);
      if (matches.length > 1) {
        const candidateNames = matches.map((entry) => entry.fileName).join(", ");
        throw new Error(`ambiguous packet id: ${rawInput}; matches: ${candidateNames}`);
      }
      if (matches.length === 1) {
        candidatePath = matches[0].absolutePath;
      }
    }

    if (!fs.existsSync(candidatePath) || !fs.statSync(candidatePath).isFile()) {
      throw new Error(`packet not found: ${path.relative(rootPath, candidatePath)}`);
    }
  }

  const fileName = path.basename(candidatePath);

  if (fileName.toLowerCase() === "readme.md") {
    throw new Error("README.md is not an activatable packet");
  }

  return {
    packetsRoot,
    absolutePath: candidatePath,
    fileName,
    packetId: normalizePacketId(fileName),
  };
}

function findPacketFileById(rootPath, packetId) {
  const matches = findPacketFileMatchesById(rootPath, packetId);
  if (matches.length === 0) return null;
  if (matches.length > 1) {
    return {
      ambiguous: true,
      matches: matches.map((entry) => entry.fileName),
    };
  }
  return matches[0];
}

function readPacketMetadata(packetPath, fileName) {
  const content = fs.readFileSync(packetPath, "utf8");
  return {
    title: extractTitle(content),
    category: detectCategory(fileName, content),
  };
}

function replaceSnapshotPointer(snapshotText, packetIdOrNull, packetCategoryOrNull) {
  if (!snapshotText) return null;

  const packetValue = packetIdOrNull || "NONE";
  const typeValue = packetCategoryOrNull ? packetCategoryOrNull.toUpperCase() : "REFACTOR";

  let updated = snapshotText;

  if (/^(- type:\s*)`[^`]*`$/m.test(updated)) {
    updated = updated.replace(/^(- type:\s*)`[^`]*`$/m, `$1\`${typeValue}\``);
  }

  if (/^(- package:\s*)`[^`]*`$/m.test(updated)) {
    updated = updated.replace(/^(- package:\s*)`[^`]*`$/m, `$1\`${packetValue}\``);
  }

  return updated;
}

function setActiveRuntimeInFlight(rootPath, packetIdOrNull) {
  const policy = scaffoldaiState.readActivePolicy(rootPath);

  if (!policy || typeof policy !== "object") {
    throw new Error("active-policy.json missing or malformed");
  }

  scaffoldaiState.writeActiveRuntime(rootPath, {
    in_flight_packet: packetIdOrNull || null,
  });
}

// Replaces next-action.md wholesale. Any acceptance record is removed first,
// so no intermediate state is ever runnable.
function writePacketPointerState(rootPath, packetIdOrNull, packetCategoryOrNull, nextActionContent) {
  acceptance.clearAcceptanceRecord(rootPath);
  scaffoldaiState.writeNextAction(rootPath, nextActionContent);

  setActiveRuntimeInFlight(rootPath, packetIdOrNull);

  const snapshot = scaffoldaiState.readSnapshot(rootPath);
  const updatedSnapshot = replaceSnapshotPointer(snapshot, packetIdOrNull, packetCategoryOrNull);
  if (updatedSnapshot !== null) {
    scaffoldaiState.writeSnapshot(rootPath, updatedSnapshot);
  }
}

const ROLLBACK_STATE_FILES = ["next-action.md", "active-runtime.json", "snapshot.md"];

function saveTaskFiles(rootPath) {
  return {
    files: ROLLBACK_STATE_FILES.map((fileName) => ({
      fileName,
      content: scaffoldaiState.readStateFileRaw(rootPath, fileName),
    })),
    acceptance: acceptance.readAcceptanceRaw(rootPath),
  };
}

// Restore task files through the state authority module, then the acceptance
// record last, so a failed restore leaves the task unrunnable rather than
// runnable with mismatched content.
function restoreTaskFiles(rootPath, saved) {
  acceptance.clearAcceptanceRecord(rootPath);
  for (const { fileName, content } of saved.files) {
    scaffoldaiState.restoreStateFileRaw(rootPath, fileName, content);
  }
  acceptance.writeAcceptanceRaw(rootPath, saved.acceptance);
}

function appendPointerHistory(rootPath, packetIdOrNull, action) {
  const activeStreamText = scaffoldaiState.readActiveStream(rootPath);
  const streamName = parseActiveStreamName(activeStreamText);

  if (action === "activate") {
    scaffoldaiState.appendHistory(rootPath, {
      operation: "mount",
      surface: "cli",
      stream: streamName || undefined,
      package: packetIdOrNull,
      summary: `activated packet pointer: ${packetIdOrNull}`,
    });
    return;
  }

  scaffoldaiState.appendHistory(rootPath, {
    operation: "close",
    surface: "cli",
    stream: streamName || undefined,
    package: packetIdOrNull || undefined,
    status: "PASS",
    summary: "cleared active packet pointer",
  });
}

function activatePacket(rootPath, packetInput) {
  // Check workspace cleanliness before activation (warning only, not blocking).
  const cleanliness = checkWorkspaceCleanliness(rootPath);
  let workspaceWarning = null;
  
  if (!cleanliness.clean) {
    workspaceWarning = {
      reason: cleanliness.reason,
      message: cleanliness.message,
      dirty_files_count: cleanliness.count,
      dirty_files: cleanliness.files,
      lifecycle_owned_files_count: cleanliness.lifecycle_owned_files_count || 0,
      operator_owned_files_count: cleanliness.operator_owned_files_count || 0,
      lifecycle_owned_files: cleanliness.lifecycle_owned_files || [],
      operator_owned_files: cleanliness.operator_owned_files || [],
      advisory: cleanliness.next_safe_action,
    };
  }

  const resolved = resolvePacketPath(rootPath, packetInput);
  const metadata = readPacketMetadata(resolved.absolutePath, resolved.fileName);

  const taskState = readTaskState(rootPath);
  const currentRuntime = scaffoldaiState.readActiveRuntime(rootPath) || {};
  const packetFile = path.join(PACKETS_DIR_RELATIVE, resolved.fileName).split(path.sep).join("/");

  if (taskState.status === "open" && taskState.task_id !== resolved.packetId) {
    const claimedBy = currentRuntime.claimed_by || null;
    const claimStatus = currentRuntime.claim_status || null;
    const currentActivePacket = taskState.package_name;

    return {
      action: "activate",
      status: "BLOCKED",
      reason: "active_packet_exists",
      packet_id: resolved.packetId,
      packet_file: packetFile,
      exists: true,
      title: metadata.title,
      category: metadata.category,
      active_packet: currentActivePacket,
      claimed_by: claimedBy,
      claim_status: claimStatus,
      message: `Active packet \"${currentActivePacket}\" must be cleared before activating \"${resolved.packetId}\".`,
      next_safe_action: claimedBy
        ? `Release claim from \"${claimedBy}\", then run scaffoldai packet clear before activating a successor packet.`
        : "Run scaffoldai packet clear before activating a successor packet.",
    };
  }

  if (taskState.status === "closed" && taskState.task_id === resolved.packetId) {
    return {
      action: "activate",
      status: "BLOCKED",
      reason: "packet_already_closed",
      packet_id: resolved.packetId,
      packet_file: packetFile,
      exists: true,
      title: metadata.title,
      category: metadata.category,
      message: `Handoff records \"${resolved.packetId}\" as ${taskState.handoff_status}. A closed task cannot be re-accepted.`,
      next_safe_action: "Create and accept a new packet for any further work.",
    };
  }

  let reaccepted = false;
  if (taskState.status === "open") {
    try {
      acceptance.assertAcceptedTask(rootPath, {
        activePacket: resolved.packetId,
        nextActionContent: scaffoldaiState.readNextAction(rootPath),
      });
      return {
        action: "activate",
        status: "PASS",
        idempotent: true,
        packet_id: resolved.packetId,
        packet_file: packetFile,
        exists: true,
        title: metadata.title,
        category: metadata.category,
        next_safe_action: "Packet already active and accepted. Proceed with the current packet or clear it explicitly before switching.",
        workspace_warning: workspaceWarning,
      };
    } catch {
      // Same packet is open but its acceptance is missing, stale, or does not
      // match: this activation is the explicit re-acceptance.
      reaccepted = true;
    }
  }

  const packetContent = acceptance.readContainedPacket(rootPath, resolved.absolutePath);
  const nextActionContent = acceptance.buildAcceptedNextAction({
    packetId: resolved.packetId,
    category: metadata.category,
    packetContent,
  });
  const saved = saveTaskFiles(rootPath);

  try {
    writePacketPointerState(rootPath, resolved.packetId, metadata.category, nextActionContent);
    acceptance.writeAcceptanceRecord(rootPath, acceptance.buildAcceptanceRecord({
      packetId: resolved.packetId,
      packetFile,
      packetContent,
      nextActionContent,
    }));
  } catch (error) {
    try {
      restoreTaskFiles(rootPath, saved);
    } catch {
      acceptance.clearAcceptanceRecord(rootPath);
    }
    throw error;
  }

  appendPointerHistory(rootPath, resolved.packetId, "activate");

  return {
    action: "activate",
    status: "PASS",
    packet_id: resolved.packetId,
    packet_file: path.join(PACKETS_DIR_RELATIVE, resolved.fileName).split(path.sep).join("/"),
    exists: true,
    title: metadata.title,
    category: metadata.category,
    ...(reaccepted ? { reaccepted: true } : {}),
    next_safe_action: "Run scaffoldai status or scaffoldai packet status to confirm active packet context.",
    workspace_warning: workspaceWarning,
  };
}

function getPacketStatus(rootPath) {
  const inFlight = getInFlightPacket(rootPath);

  if (!inFlight) {
    return {
      action: "status",
      active_packet: null,
      packet_file: null,
      exists: false,
      title: null,
      category: null,
      next_safe_action: "Activate a packet with: scaffoldai packet activate <filename-or-path>",
    };
  }

  const resolved = findPacketFileById(rootPath, inFlight);

  if (!resolved) {
    return {
      action: "status",
      active_packet: inFlight,
      packet_file: path.join(PACKETS_DIR_RELATIVE, `${inFlight}.md`).split(path.sep).join("/"),
      exists: false,
      title: null,
      category: null,
      next_safe_action: "Active pointer file is missing. Clear pointer or activate an existing packet.",
    };
  }

  if (resolved.ambiguous) {
    return {
      action: "status",
      active_packet: inFlight,
      packet_file: null,
      exists: false,
      title: null,
      category: null,
      ambiguous_identity: true,
      ambiguous_matches: resolved.matches,
      next_safe_action: "Resolve duplicate normalized packet ids in .scaffoldai/packets before continuing lifecycle operations.",
    };
  }

  const metadata = readPacketMetadata(resolved.absolutePath, resolved.fileName);

  return {
    action: "status",
    active_packet: inFlight,
    packet_file: path.join(PACKETS_DIR_RELATIVE, resolved.fileName).split(path.sep).join("/"),
    exists: true,
    title: metadata.title,
    category: metadata.category,
    next_safe_action: "Proceed with human-approved work for the active packet or clear it when done.",
  };
}

function clearActivePacket(rootPath) {
  const previousPacket = getInFlightPacket(rootPath);

  writePacketPointerState(rootPath, null, null, acceptance.NO_TASK_NEXT_ACTION);
  appendPointerHistory(rootPath, previousPacket, "clear");

  return {
    action: "clear",
    previous_packet: previousPacket || null,
    active_packet: null,
    next_safe_action: "Activate the next packet intentionally when ready.",
  };
}

module.exports = {
  activatePacket,
  getPacketStatus,
  clearActivePacket,
  resolvePacketPath,
};
