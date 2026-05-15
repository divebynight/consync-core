"use strict";

const fs = require("fs");
const path = require("path");

const scaffoldaiState = require("./scaffoldaiState.state.scaffoldai");
const { getInFlightPacket } = require("./getInFlightPacket.query.scaffoldai");
const { detectCategory, extractTitle } = require("./scaffoldaiPacketVisibility.query.scaffoldai");

const PACKETS_DIR_RELATIVE = path.join(".scaffoldai", "packets");

function normalizePacketId(value) {
  if (!value || typeof value !== "string") return null;
  return value.trim().toLowerCase().replace(/\.md$/i, "");
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
    throw new Error(`packet not found: ${path.relative(rootPath, candidatePath)}`);
  }

  const fileName = path.basename(candidatePath);

  if (fileName.toLowerCase() === "readme.md") {
    throw new Error("README.md is not an activatable packet");
  }

  return {
    packetsRoot,
    absolutePath: candidatePath,
    fileName,
    packetId: fileName.replace(/\.md$/i, ""),
  };
}

function findPacketFileById(rootPath, packetId) {
  const normalized = normalizePacketId(packetId);
  if (!normalized) return null;

  const packetsRoot = path.resolve(rootPath, PACKETS_DIR_RELATIVE);
  if (!fs.existsSync(packetsRoot)) return null;

  for (const entry of fs.readdirSync(packetsRoot, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith(".md")) continue;
    if (entry.name.toLowerCase() === "readme.md") continue;

    if (normalizePacketId(entry.name) === normalized) {
      return {
        absolutePath: path.join(packetsRoot, entry.name),
        fileName: entry.name,
        packetId: entry.name.replace(/\.md$/i, ""),
      };
    }
  }

  return null;
}

function readPacketMetadata(packetPath, fileName) {
  const content = fs.readFileSync(packetPath, "utf8");
  return {
    title: extractTitle(content),
    category: detectCategory(fileName, content),
  };
}

function replacePacketPointer(nextActionText, packetIdOrNull) {
  const value = packetIdOrNull || "NONE";

  if (!nextActionText) {
    return [
      "TYPE: REFACTOR",
      `PACKAGE: ${value}`,
      "",
      "Managed by scaffoldai packet command.",
      "",
    ].join("\n");
  }

  if (/^PACKET_ID:\s*.+$/m.test(nextActionText)) {
    return nextActionText.replace(/^PACKET_ID:\s*.+$/m, `PACKET_ID: ${value}`);
  }

  if (/^PACKAGE:\s*.+$/m.test(nextActionText)) {
    return nextActionText.replace(/^PACKAGE:\s*.+$/m, `PACKAGE: ${value}`);
  }

  const lines = nextActionText.split(/\r?\n/);
  const typeIndex = lines.findIndex((line) => /^TYPE:\s*/.test(line.trim()));

  if (typeIndex !== -1) {
    lines.splice(typeIndex + 1, 0, `PACKAGE: ${value}`);
    return lines.join("\n");
  }

  return `PACKAGE: ${value}\n\n${nextActionText}`;
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

function setActiveContractInFlight(rootPath, packetIdOrNull) {
  const contract = scaffoldaiState.readActiveContract(rootPath);

  if (!contract || typeof contract !== "object") {
    throw new Error("active-contract.json missing or malformed");
  }

  contract.in_flight_packet = packetIdOrNull || null;
  scaffoldaiState.writeActiveContract(rootPath, contract);
}

function writePacketPointerState(rootPath, packetIdOrNull, packetCategoryOrNull) {
  const nextAction = scaffoldaiState.readNextAction(rootPath);
  scaffoldaiState.writeNextAction(rootPath, replacePacketPointer(nextAction, packetIdOrNull));

  setActiveContractInFlight(rootPath, packetIdOrNull);

  const snapshot = scaffoldaiState.readSnapshot(rootPath);
  const updatedSnapshot = replaceSnapshotPointer(snapshot, packetIdOrNull, packetCategoryOrNull);
  if (updatedSnapshot !== null) {
    scaffoldaiState.writeSnapshot(rootPath, updatedSnapshot);
  }
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
  const resolved = resolvePacketPath(rootPath, packetInput);
  const metadata = readPacketMetadata(resolved.absolutePath, resolved.fileName);

  writePacketPointerState(rootPath, resolved.packetId, metadata.category);
  appendPointerHistory(rootPath, resolved.packetId, "activate");

  return {
    action: "activate",
    packet_id: resolved.packetId,
    packet_file: path.join(PACKETS_DIR_RELATIVE, resolved.fileName).split(path.sep).join("/"),
    exists: true,
    title: metadata.title,
    category: metadata.category,
    next_safe_action: "Run scaffoldai status or scaffoldai packet status to confirm active packet context.",
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

  writePacketPointerState(rootPath, null, null);
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
