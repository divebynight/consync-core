/**
 * Pure Gatekeeper decision function.
 *
 * Applies the decision rules defined in:
 *   .scaffoldai/agents/gatekeeper.agent.md
 *
 * Takes an input object and contract config; returns a decision object.
 * Does not read files, write files, or produce output.
 */

const VALID_REQUEST_TYPES = ["SDC", "CLOSEOUT", "RECOVERY", "DRY_RUN", "CANCEL", "SUPERSEDE"];
const VALID_PACKET_TYPES = ["product", "process", "contract", "agent", "planning", "docs", "recovery", "closeout"];

/**
 * @typedef {Object} GatekeeperInput
 * @property {string} requestType   - SDC | CLOSEOUT | RECOVERY | DRY_RUN | CANCEL | SUPERSEDE
 * @property {string} packetId      - proposed packet identifier
 * @property {string} packetType    - product | process | contract | agent | planning | docs | recovery | closeout
 * @property {string} gitStatus     - clean | dirty
 * @property {string|null} inFlightPacket - null or active packet id
 * @property {string} mode          - from active-contract.json
 */

/**
 * @typedef {Object} ActiveContract
 * @property {string} mode
 * @property {string[]} allowed_packet_types
 * @property {string[]} blocked_packet_types
 * @property {string|null} in_flight_packet
 * @property {boolean} require_clean_git
 * @property {boolean} require_dry_run
 */

/**
 * @typedef {Object} GatekeeperDecision
 * @property {string} decision
 * @property {string} reason
 * @property {string} nextRequiredAction
 */

/**
 * Apply Gatekeeper decision rules.
 *
 * @param {GatekeeperInput} input
 * @param {ActiveContract} contract
 * @returns {GatekeeperDecision}
 */
function applyGatekeeperRules(input, contract) {
  const { requestType, packetId, packetType, gitStatus, inFlightPacket } = input;
  const { allowed_packet_types, blocked_packet_types } = contract;

  // Step 1 — DRY_RUN passthrough (inspect only, no blocking checks apply)
  if (requestType === "DRY_RUN") {
    return {
      decision: "ALLOW",
      reason: "request_type is DRY_RUN; inspect mode, no execution will occur.",
      nextRequiredAction: "NONE",
    };
  }

  // Step 2 — In-flight check
  if (
    inFlightPacket !== null &&
    inFlightPacket !== undefined &&
    !["CLOSEOUT", "RECOVERY", "CANCEL", "SUPERSEDE"].includes(requestType)
  ) {
    return {
      decision: "CLOSEOUT_REQUIRED",
      reason: `in_flight_packet "${inFlightPacket}" is active. Close it out before starting a new ${requestType}.`,
      nextRequiredAction: `Run closeout for ${inFlightPacket}.`,
    };
  }

  // Step 3 — Supersede check
  if (
    inFlightPacket !== null &&
    inFlightPacket !== undefined &&
    requestType === "SUPERSEDE"
  ) {
    return {
      decision: "SUPERSEDE_REQUIRES_APPROVAL",
      reason: `in_flight_packet "${inFlightPacket}" is active. Superseding requires explicit user approval.`,
      nextRequiredAction: "Obtain explicit user approval before superseding the active packet.",
    };
  }

  // Step 4 — CLOSEOUT passthrough
  if (requestType === "CLOSEOUT") {
    return {
      decision: "ALLOW",
      reason: "request_type is CLOSEOUT; dirty state and in-flight packet are expected during closeout.",
      nextRequiredAction: "NONE",
    };
  }

  // Step 5 — RECOVERY passthrough
  if (requestType === "RECOVERY") {
    return {
      decision: "ALLOW",
      reason: "request_type is RECOVERY; recovery is permitted regardless of mode.",
      nextRequiredAction: "NONE",
    };
  }

  // Step 6 — Mode / packet type check
  if (blocked_packet_types.includes(packetType)) {
    return {
      decision: "BLOCK",
      reason: `packet_type "${packetType}" is in blocked_packet_types for current mode.`,
      nextRequiredAction: "Choose a packet type that is allowed in the current mode.",
    };
  }

  if (!allowed_packet_types.includes(packetType)) {
    return {
      decision: "BLOCK",
      reason: `packet_type "${packetType}" is not in allowed_packet_types for current mode.`,
      nextRequiredAction: "Choose a packet type that is allowed in the current mode.",
    };
  }

  // Step 7 — Clean git check (for SDC requests)
  if (requestType === "SDC" && contract.require_clean_git && gitStatus === "dirty") {
    return {
      decision: "CLOSEOUT_REQUIRED",
      reason: "git_status is dirty. Commit or discard uncommitted changes before proceeding.",
      nextRequiredAction: "Commit or discard changes in working tree.",
    };
  }

  // Step 8 — Allow
  return {
    decision: "ALLOW",
    reason: `packet_type "${packetType}" is allowed; git ${gitStatus}; no blocking condition matched.`,
    nextRequiredAction: "NONE",
  };
}

module.exports = { applyGatekeeperRules };
