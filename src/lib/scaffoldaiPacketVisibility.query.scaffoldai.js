"use strict";

const fs = require("fs");
const path = require("path");
const { getInFlightPacket } = require("./getInFlightPacket.query.scaffoldai");

const PACKETS_DIR_RELATIVE = path.join(".scaffoldai", "packets");
const MAX_PACKET_LIMIT = 25;

function clampLimit(limit) {
  if (!Number.isFinite(limit)) return MAX_PACKET_LIMIT;
  const integerLimit = Math.trunc(limit);
  if (integerLimit < 1) return 1;
  if (integerLimit > MAX_PACKET_LIMIT) return MAX_PACKET_LIMIT;
  return integerLimit;
}

function normalizePacketId(value) {
  if (!value || typeof value !== "string") return null;
  return value.trim().toLowerCase().replace(/\.md$/, "");
}

function extractTitle(content) {
  if (!content) return null;

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      return trimmed.slice(2).trim() || null;
    }
  }

  return null;
}

function extractSummary(content) {
  if (!content) return null;

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    const goalMatch = trimmed.match(/^GOAL:\s*(.+)$/i);
    if (goalMatch && goalMatch[1].trim()) {
      return goalMatch[1].trim();
    }
  }

  return null;
}

function detectCategory(fileName, content) {
  const stem = fileName.replace(/\.md$/i, "").toLowerCase();
  const lines = (content || "").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    const explicitType = trimmed.match(/^(PACKET_TYPE|TYPE|CATEGORY):\s*(.+)$/i);
    if (explicitType && explicitType[2].trim()) {
      return explicitType[2].trim().toLowerCase();
    }

    const mode = trimmed.match(/^MODE:\s*([A-Z_]+)/);
    if (mode && mode[1]) {
      const modePrefix = mode[1].split("_")[0].toLowerCase();
      if (modePrefix) return modePrefix;
    }
  }

  if (stem.endsWith(".sdc")) return "sdc";
  return null;
}

function createMissingInFlightRecord(inFlightPacket) {
  const normalized = normalizePacketId(inFlightPacket);
  const expectedFile = inFlightPacket && inFlightPacket.endsWith(".md")
    ? inFlightPacket
    : `${inFlightPacket || ""}.md`;

  return {
    filename: expectedFile,
    packet_category: null,
    exists: false,
    title: null,
    summary: null,
    in_flight_relation: normalized ? "active_missing" : "not_in_flight",
  };
}

function createPacketRecord(fileName, content, inFlightPacket, includeSummary) {
  const normalizedInFlight = normalizePacketId(inFlightPacket);
  const normalizedFile = normalizePacketId(fileName);
  const isInFlight = Boolean(normalizedInFlight && normalizedFile === normalizedInFlight);

  return {
    filename: fileName,
    packet_category: detectCategory(fileName, content),
    exists: true,
    title: extractTitle(content),
    summary: includeSummary ? extractSummary(content) : null,
    in_flight_relation: isInFlight ? "active" : "not_in_flight",
  };
}

function listPacketFiles(packetDir) {
  if (!fs.existsSync(packetDir)) return [];

  return fs
    .readdirSync(packetDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.toLowerCase().endsWith(".md"))
    .filter((name) => name.toLowerCase() !== "readme.md")
    .sort();
}

function findPacketFileName(packetFiles, inFlightPacket) {
  const normalizedInFlight = normalizePacketId(inFlightPacket);
  if (!normalizedInFlight) return null;

  for (const name of packetFiles) {
    if (normalizePacketId(name) === normalizedInFlight) {
      return name;
    }
  }

  return null;
}

function gatherPacketVisibility(repoRoot, options = {}) {
  const scope = options.scope === "all" ? "all" : "in_flight";
  const includeSummary = options.includeSummary !== false;
  const limit = clampLimit(options.limit);

  const packetDir = path.join(repoRoot, PACKETS_DIR_RELATIVE);
  const inFlightPacket = getInFlightPacket(repoRoot);
  const packetFiles = listPacketFiles(packetDir);

  const packets = [];

  if (scope === "all") {
    for (const fileName of packetFiles.slice(0, limit)) {
      const fullPath = path.join(packetDir, fileName);
      const content = fs.readFileSync(fullPath, "utf8");
      packets.push(createPacketRecord(fileName, content, inFlightPacket, includeSummary));
    }

    const hasInFlightMatch = findPacketFileName(packetFiles, inFlightPacket);
    if (inFlightPacket && !hasInFlightMatch) {
      packets.push(createMissingInFlightRecord(inFlightPacket));
    }
  } else if (inFlightPacket) {
    const inFlightFile = findPacketFileName(packetFiles, inFlightPacket);
    if (!inFlightFile) {
      packets.push(createMissingInFlightRecord(inFlightPacket));
    } else {
      const content = fs.readFileSync(path.join(packetDir, inFlightFile), "utf8");
      packets.push(createPacketRecord(inFlightFile, content, inFlightPacket, includeSummary));
    }
  }

  return {
    tool: "scaffoldai_packet_visibility",
    execution_class: "READ_ONLY",
    status: "OBSERVE",
    data: {
      packet_directory: PACKETS_DIR_RELATIVE.split(path.sep).join("/"),
      scope,
      limit,
      in_flight_packet: inFlightPacket || null,
      packet_count: packets.length,
      packets,
    },
    next_safe_action:
      packets.length === 0
        ? "No visible packets in scope. Use scaffoldai_status to confirm active packet state."
        : "Use packet metadata for read-only operational visibility.",
  };
}

module.exports = {
  gatherPacketVisibility,
  extractTitle,
  extractSummary,
  detectCategory,
};
