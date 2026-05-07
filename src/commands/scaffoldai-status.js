const fs = require("fs");
const path = require("path");
const { getInFlightPacket } = require("../lib/getInFlightPacket");
const { getGitStatus } = require("../lib/gitStatus");

const repoRoot = path.resolve(__dirname, "..", "..");

const STATE_DIR = path.join(repoRoot, ".scaffoldai", "state");
const ACTIVE_STREAM_PATH = path.join(STATE_DIR, "active-stream.md");
const ACTIVE_CONTRACT_PATH = path.join(STATE_DIR, "active-contract.json");
const NEXT_ACTION_PATH = path.join(STATE_DIR, "next-action.md");
const HANDOFF_PATH = path.join(STATE_DIR, "handoff.md");

// -----------------------------------------------------------------------
// Readers
// -----------------------------------------------------------------------

function readActiveStream() {
  try {
    const content = fs.readFileSync(ACTIVE_STREAM_PATH, "utf8");
    const lines = content.split(/\r?\n/);
    const idx = lines.findIndex((l) => l.trim() === "ACTIVE STREAM");

    if (idx === -1) return null;

    for (const line of lines.slice(idx + 1)) {
      const v = line.trim();
      if (v) return v;
    }
  } catch {
    // file missing or unreadable
  }

  return null;
}

function readActiveContract() {
  try {
    const raw = fs.readFileSync(ACTIVE_CONTRACT_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readNextActionSummary() {
  try {
    const content = fs.readFileSync(NEXT_ACTION_PATH, "utf8");
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
  } catch {
    // file missing
  }

  return null;
}

// -----------------------------------------------------------------------
// Recommend verify command based on contract
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
// Main command
// -----------------------------------------------------------------------

function runScaffoldaiStatusCommand() {
  const warnings = [];

  // Active stream
  const activeStream = readActiveStream();
  if (!activeStream) {
    warnings.push("active-stream.md missing or unreadable");
  }

  // Active contract
  const contract = readActiveContract();
  if (!contract) {
    warnings.push("active-contract.json missing or malformed");
  }

  // Active packet
  const inFlightPacket = getInFlightPacket(repoRoot);

  // Next action
  const nextActionSummary = readNextActionSummary();
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
  const git = getGitStatus(repoRoot);

  // Verify command
  const verifySurface = recommendedVerifySurface(contract);

  // ---- Output ----
  const hasBlocker = warnings.some((w) => w.startsWith("BLOCKER"));
  const overallStatus = hasBlocker ? "BLOCKED" : "ON_TRACK";

  console.log("[scaffoldai status]");
  console.log("");
  console.log(`ACTIVE STREAM:    ${activeStream || "(unknown)"}`);
  console.log(`ACTIVE PACKET:    ${inFlightPacket || "(none)"}`);
  console.log(`NEXT SAFE ACTION: ${nextActionSummary || "(none — see next-action.md)"}`);

  if (git.error) {
    console.log(`GIT STATUS:       (unavailable — ${git.error})`);
  } else if (git.clean) {
    console.log("GIT STATUS:       Clean — no uncommitted changes");
  } else if (git.count <= 10) {
    console.log(`GIT STATUS:       ${git.count} modified/untracked file(s)`);
    for (const file of git.files) {
      console.log(`                  ${file}`);
    }
  } else {
    console.log(`GIT STATUS:       ${git.count} modified/untracked files (first 10 shown)`);
    for (const file of git.files.slice(0, 10)) {
      console.log(`                  ${file}`);
    }
  }

  console.log(`VERIFY COMMAND:   ${verifySurface}`);

  if (warnings.length === 0) {
    console.log("WARNINGS:         none");
  } else {
    for (const warning of warnings) {
      console.log(`WARNING:          ${warning}`);
    }
  }

  console.log("");
  console.log(`STATUS: ${overallStatus}`);
}

module.exports = { runScaffoldaiStatusCommand, readActiveStream };
