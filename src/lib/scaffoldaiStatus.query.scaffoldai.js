const fs = require("fs");
const path = require("path");
const scaffoldaiState = require("./scaffoldaiState.state.scaffoldai");
const { getInFlightPacket } = require("./getInFlightPacket.query.scaffoldai");
const { readLatestIntakeResult } = require("./scaffoldaiPacketIntake.auth.scaffoldai");
const scaffoldaiVerifyEvidence = require("./scaffoldaiVerifyEvidence.state.scaffoldai");

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

  // Active policy/runtime composition
  const contract = readActiveContract(repoRoot);
  if (!contract) {
    warnings.push("active-policy.json or active-runtime.json missing or malformed");
  }

  // Active packet
  const inFlightPacket = getInFlightPacket(repoRoot);

  // Claim state
  const runtime = scaffoldaiState.readActiveRuntime(repoRoot);
  const claimState = {
    claimed_by: (runtime && runtime.claimed_by) || null,
    claim_status: (runtime && runtime.claim_status) || null,
    claimed_at: (runtime && runtime.claimed_at) || null,
    claim_message: (runtime && runtime.claim_message) || null,
    claim_expires_at: (runtime && runtime.claim_expires_at) || null,
    busy: Boolean(runtime && runtime.claimed_by),
    next_safe_action: runtime && runtime.claimed_by
      ? `Packet is claimed by "${runtime.claimed_by}". Observe and wait, or use force-release if authorized.`
      : inFlightPacket
      ? "Packet is active and unclaimed. You may claim it."
      : "No active packet. Activate a packet before claiming.",
  };

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

  // Migrated ScaffoldAI process directories must not return to .consync/
  // (.consync/ itself may contain Consync product artifacts like history/)
  const consyncStateDir = path.join(repoRoot, ".consync", "state");
  const consyncStreamsDir = path.join(repoRoot, ".consync", "streams");
  const consyncPacketsDir = path.join(repoRoot, ".consync", "packets");

  if (fs.existsSync(consyncStateDir)) {
    warnings.push(".consync/state/ exists — migrated ScaffoldAI state must not return here");
  }
  if (fs.existsSync(consyncStreamsDir)) {
    warnings.push(".consync/streams/ exists — migrated ScaffoldAI streams must not return here");
  }
  if (fs.existsSync(consyncPacketsDir)) {
    warnings.push(".consync/packets/ exists — migrated ScaffoldAI packets must not return here");
  }

  // Blocker: runtime in-flight says mounted but next-action says NONE
  if (
    contract &&
    contract.in_flight_packet !== null &&
    contract.in_flight_packet !== undefined &&
    !inFlightPacket
  ) {
    warnings.push(
      `BLOCKER: active-runtime.json declares in_flight_packet "${contract.in_flight_packet}" but next-action.md has no active packet`
    );
  }

  // Git status
  let git = null;
  if (includeGit) {
    const { getGitStatus } = require("./gitStatus.util.shared");
    git = getGitStatus(repoRoot);
  }

  // Verify command
  const verifySurface = recommendedVerifySurface(contract);
  const latestIntake = readLatestIntakeResult(repoRoot);

  // Contextual next safe action for operators.
  let computedNextSafeAction = nextActionSummary || "(none — see next-action.md)";

  if (claimState.busy) {
    computedNextSafeAction = claimState.next_safe_action;
  } else if (inFlightPacket) {
    if (!git || git.error) {
      computedNextSafeAction = "Resolve git status availability before lifecycle transitions.";
    } else if (!git.clean) {
      computedNextSafeAction =
        "Active packet in progress with uncommitted artifacts. Review git status and commit intentional changes before lifecycle transitions.";
    } else {
      const evidence = scaffoldaiVerifyEvidence.validateVerifyEvidence(repoRoot, inFlightPacket);
      if (evidence.valid) {
        computedNextSafeAction = "Verification evidence is valid. Run npm run scaffoldai:close-feature to close and clean the active packet.";
      } else if (evidence.reason === "no_verify_evidence") {
        computedNextSafeAction = `Run ${verifySurface} for the active packet, then run npm run scaffoldai:close-feature.`;
      } else if (evidence.reason === "verify_evidence_failed") {
        computedNextSafeAction = `Verification failed. Fix issues, rerun ${verifySurface}, then run npm run scaffoldai:close-feature.`;
      } else {
        computedNextSafeAction = `Refresh verification evidence with ${verifySurface}, then run npm run scaffoldai:close-feature.`;
      }
    }
  } else if (git && !git.error && !git.clean) {
    computedNextSafeAction =
      "No active packet, but local artifacts are uncommitted. Review git status and commit intentional closeout artifacts, then intake the next packet.";
  } else if (!inFlightPacket) {
    computedNextSafeAction = "No active packet. Intake latest with npm run scaffoldai:intake-latest or activate latest with npm run scaffoldai:activate-latest.";
  }

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
      claim: claimState,
      claim_owner: claimState.claimed_by,
      claim_status: claimState.claim_status,
      claim_busy: claimState.busy,
      claim_next_safe_action: claimState.next_safe_action,
      latest_intake: latestIntake,
      next_safe_action: computedNextSafeAction,
      contract: contract || null,
      verify_command: verifySurface,
      warnings,
      ...(includeGit ? { git } : { git: "not included" }),
    },
    next_safe_action: computedNextSafeAction,
  };
}

module.exports = {
  gatherStatus,
  readActiveStream,
  readActiveContract,
  readNextActionSummary,
  recommendedVerifySurface,
};
