const fs = require("fs");
const path = require("path");

const TARGET_MAP = {
  scaffoldai: "npm run verify:scaffoldai",
  consync: "npm run verify:consync",
  full: "npm run verify:full",
};

/**
 * Resolve the recommended verify command given an active contract and flags.
 *
 * @param {object|null} contract - parsed active-contract.json, or null if unavailable
 * @param {{ target?: string }} flags
 * @returns {{ command: string, reason: string, target: string }}
 */
function resolveVerifyCommand(contract, flags) {
  const { target } = flags || {};

  // Explicit --target always wins
  if (target) {
    const command = TARGET_MAP[target];

    if (!command) {
      return {
        command: null,
        reason: `Unknown --target value: "${target}". Valid values: ${Object.keys(TARGET_MAP).join(", ")}`,
        target,
        error: true,
      };
    }

    return {
      command,
      reason: `--target=${target} explicitly specified`,
      target,
      error: false,
    };
  }

  // Contract-derived resolution
  if (contract) {
    const inFlight = contract.in_flight_packet;
    const allowed = contract.allowed_packet_types || [];

    // Prefer in_flight_packet type if set
    if (inFlight) {
      if (["process", "contract", "planning"].includes(inFlight)) {
        return {
          command: TARGET_MAP.scaffoldai,
          reason: `in_flight_packet type "${inFlight}" maps to scaffoldai surface`,
          target: "scaffoldai",
          error: false,
        };
      }

      if (["product", "agent"].includes(inFlight)) {
        return {
          command: TARGET_MAP.consync,
          reason: `in_flight_packet type "${inFlight}" maps to consync surface`,
          target: "consync",
          error: false,
        };
      }
    }

    // Fall back to allowed_packet_types
    if (
      allowed.includes("process") ||
      allowed.includes("contract") ||
      allowed.includes("planning")
    ) {
      return {
        command: TARGET_MAP.scaffoldai,
        reason: "allowed_packet_types includes process/contract/planning",
        target: "scaffoldai",
        error: false,
      };
    }

    if (allowed.includes("product") || allowed.includes("agent")) {
      return {
        command: TARGET_MAP.consync,
        reason: "allowed_packet_types includes product/agent",
        target: "consync",
        error: false,
      };
    }
  }

  // Default: general verify
  return {
    command: "npm run verify",
    reason: "no contract or unrecognised packet types — defaulting to general verify",
    target: "general",
    error: false,
  };
}

/**
 * Read and parse active-contract.json from the given repo root.
 * Returns null if the file is missing or malformed.
 *
 * @param {string} repoRoot
 * @returns {object|null}
 */
function readActiveContract(repoRoot) {
  const contractPath = path.join(repoRoot, ".scaffoldai", "state", "active-contract.json");

  try {
    const raw = fs.readFileSync(contractPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

module.exports = { resolveVerifyCommand, readActiveContract };
