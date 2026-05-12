const fs = require("fs");
const path = require("path");
const scaffoldaiState = require("./scaffoldaiState.state.scaffoldai");
const { getInFlightPacket } = require("./getInFlightPacket.query.scaffoldai");

// -----------------------------------------------------------------------
// State file readers
// -----------------------------------------------------------------------

function readActiveStream(repoRoot) {
  const content = scaffoldaiState.readActiveStream(repoRoot);

  if (!content) {
    return null;
  }

  const lines = content.split(/\r?\n/);
  const idx = lines.findIndex((l) => l.trim() === "ACTIVE STREAM");

  if (idx === -1) return null;

  for (const line of lines.slice(idx + 1)) {
    const v = line.trim();
    if (v) return v;
  }

  return null;
}

function readActiveContract(repoRoot) {
  return scaffoldaiState.readActiveContract(repoRoot);
}

function readNextActionSummary(repoRoot) {
  const content = scaffoldaiState.readNextAction(repoRoot);

  if (!content) {
    return null;
  }

  // Return first non-empty, non-heading line that looks like a summary.
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (
      trimmed &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("---") &&
      trimmed.length > 4
    ) {
      return trimmed.length > 120 ? trimmed.slice(0, 117) + "..." : trimmed;
    }
  }

  return null;
}

// -----------------------------------------------------------------------
// Verify command recommendation
// -----------------------------------------------------------------------

function recommendedVerifySurface(contract) {
  if (!contract) return "npm run verify";

  const packetTypes = contract.allowed_packet_types || [];

  if (
    packetTypes.includes("process") ||
    packetTypes.includes("contract") ||
    packetTypes.includes("planning")
  ) {
    return "npm run verify:scaffoldai";
  }

  if (packetTypes.includes("product") || packetTypes.includes("agent")) {
    return "npm run verify:consync";
  }

  return "npm run verify";
}

// -----------------------------------------------------------------------
// Main status gathering function
// -----------------------------------------------------------------------

function gatherStatus(repoRoot, options = {}) {
  const includeGit = options.includeGit !== false;
  const warnings = [];

  const STATE_DIR = path.join(repoRoot, ".scaffoldai", "state");
  const HANDOFF_PATH = path.join(STATE_DIR, "handoff.md");

  // Active stream
  const activeStream = readActiveStream(repoRoot);
  if (!activeStream) {
    warnings.push("active-stream.md missing or unreadable");
  }

  // Active contract
  const contract = readActiveContract(repoRoot);
  if (!contract) {
    warnings.push("active-contract.json missing or malformed");
  }

  // Active packet
  const inFlightPacket = getInFlightPacket(repoRoot);

  // Next action
  const nextActionSummary = readNextActionSummary(repoRoot);
  if (!nextActionSummary) {
    warnings.push("next-action.md missing or empty — run reentry or preflight");
  }

  // Handoff present
  const handoffPresent = fs.existsSync(HANDOFF_PATH);
  if (!handoffPresent) {
    warnings.push("handoff.md not found — expected after each closeout");
  }

  // .consync/ at repo root is an architecture violation
  if (fs.existsSync(path.join(repoRoot, ".consync"))) {
    warnings.push(".consync/ exists at repo root — architecture violation; must be removed");
  }

  // Blocker: contract says in_flight but next-action says NONE
  if (
    contract &&
    contract.in_flight_packet !== null &&
    contract.in_flight_packet !== undefined &&
    !inFlightPacket
  ) {
    warnings.push(
      `BLOCKER: active-contract.json declares in_flight_packet "${contract.in_flight_packet}" but next-action.md has no active packet`
    );
  }

  // Git status
  let git = null;
  if (includeGit) {
    const { getGitStatus } = require("./gitStatus.shared");
    git = getGitStatus(repoRoot);
  }

  // Verify command
  const verifySurface = recommendedVerifySurface(contract);

  // ---- Overall status ----
  const hasBlocker = warnings.some((w) => w.startsWith("BLOCKER"));
  const overallStatus = hasBlocker ? "BLOCKED" : "ON_TRACK";

  return {
    tool: "scaffoldai_status",
    execution_class: "READ_ONLY",
    status: overallStatus,
    data: {
      active_stream: activeStream || null,
      active_packet: inFlightPacket || null,
      next_safe_action: nextActionSummary || "(none — see next-action.md)",
      contract: contract || null,
      verify_command: verifySurface,
      warnings,
      ...(includeGit ? { git } : { git: "not included" }),
    },
    next_safe_action: nextActionSummary || "(none — see next-action.md)",
  };
}

module.exports = {
  gatherStatus,
  readActiveStream,
  readActiveContract,
  readNextActionSummary,
  recommendedVerifySurface,
};
