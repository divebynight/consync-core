const fs = require("fs");
const path = require("path");
const { getInFlightPacket } = require("./getInFlightPacket.query.scaffoldai");
const { getGitStatus } = require("./gitStatus.util.shared");
const scaffoldaiState = require("./scaffoldaiState.state.scaffoldai");

const REQUIRED_STATE_FILES = [
  "active-stream.md",
  "active-runtime.json",
  "next-action.md",
];

const REQUIRED_VERIFY_SCRIPTS = [
  "verify",
  "verify:consync",
  "verify:scaffoldai",
  "verify:full",
];

// -----------------------------------------------------------------------
// State file checks
// -----------------------------------------------------------------------

function checkStateFiles(repoRoot) {
  const STATE_DIR = path.join(repoRoot, ".scaffoldai", "state");
  const results = [];

  for (const filename of REQUIRED_STATE_FILES) {
    const fullPath = path.join(STATE_DIR, filename);
    const exists = fs.existsSync(fullPath);
    results.push({ filename, exists });
  }

  return results;
}

function checkContract(repoRoot) {
  const policy = scaffoldaiState.readActivePolicy(repoRoot);
  const runtime = scaffoldaiState.readActiveRuntime(repoRoot);
  const contract = scaffoldaiState.readActiveContract(repoRoot);

  if (!policy || !runtime || !contract) {
    return { ok: false, contract: null, reason: "active-policy.json or active-runtime.json missing or malformed" };
  }

  // Detect conflict: in_flight_packet is in blocked_packet_types
  const inFlight = contract.in_flight_packet;
  const blocked = contract.blocked_packet_types || [];

  if (inFlight && blocked.includes(inFlight)) {
    return {
      ok: false,
      contract,
      reason: `in_flight_packet "${inFlight}" is in blocked_packet_types`,
    };
  }

  return { ok: true, contract };
}

function checkVerifyScripts(repoRoot) {
  const PKG_PATH = path.join(repoRoot, "package.json");
  const results = [];

  try {
    const raw = fs.readFileSync(PKG_PATH, "utf8");
    const pkg = JSON.parse(raw);
    const scripts = pkg.scripts || {};

    for (const name of REQUIRED_VERIFY_SCRIPTS) {
      results.push({ name, exists: Object.prototype.hasOwnProperty.call(scripts, name) });
    }
  } catch {
    for (const name of REQUIRED_VERIFY_SCRIPTS) {
      results.push({ name, exists: false });
    }
  }

  return results;
}

// -----------------------------------------------------------------------
// Formatting helpers
// -----------------------------------------------------------------------

function formatStateFileRow(results) {
  return results.map((r) => `${r.filename} ${r.exists ? "✓" : "✗"}`).join("  ");
}

function formatScriptRow(results) {
  return results.map((r) => `${r.name} ${r.exists ? "✓" : "✗"}`).join("  ");
}

// -----------------------------------------------------------------------
// Main preflight gathering function
// -----------------------------------------------------------------------

/**
 * Run all preflight checks and return the raw result object.
 * Does not print anything, does not set process.exitCode.
 *
 * @param {string} repoRoot - absolute path to repository root
 * @returns {{
 *   blockers: string[],
 *   warnings: string[],
 *   status: string,
 *   data: {
 *     stateFileResults: Array<{filename: string, exists: boolean}>,
 *     scriptResults: Array<{name: string, exists: boolean}>,
 *     inFlightPacket: string|null,
 *     git: object,
 *     contract: object|null
 *   }
 * }}
 */
function gatherPreflightResults(repoRoot) {
  const blockers = [];
  const warnings = [];

  // Check 1: required state files
  const stateFileResults = checkStateFiles(repoRoot);
  for (const f of stateFileResults.filter((r) => !r.exists)) {
    blockers.push(`Missing required state file: ${f.filename}`);
  }

  // Check 2: active-contract integrity
  const contractCheck = checkContract(repoRoot);
  if (!contractCheck.ok) {
    blockers.push(contractCheck.reason);
  }

  // Check 3: active packet
  const inFlightPacket = getInFlightPacket(repoRoot);
  if (inFlightPacket) {
    warnings.push(`Active in-flight packet detected: ${inFlightPacket}`);
  }

  // Check 4: git status
  const git = getGitStatus(repoRoot);
  if (!git.clean) {
    warnings.push(`${git.count} uncommitted file(s) in working tree`);
  }

  // Check 5: verify scripts
  const scriptResults = checkVerifyScripts(repoRoot);
  for (const s of scriptResults.filter((r) => !r.exists)) {
    blockers.push(`Missing required npm script: ${s.name}`);
  }

  // Determine overall status
  let status;
  if (blockers.length > 0) status = "BLOCKED";
  else if (warnings.length > 0) status = "WARNING";
  else status = "PASS";

  return {
    blockers,
    warnings,
    status,
    data: {
      stateFileResults,
      scriptResults,
      inFlightPacket: inFlightPacket || null,
      git,
      contract: contractCheck.contract || null,
    },
  };
}

module.exports = {
  gatherPreflightResults,
  checkStateFiles,
  checkContract,
  checkVerifyScripts,
  formatStateFileRow,
  formatScriptRow,
};
