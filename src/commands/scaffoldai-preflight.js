const fs = require("fs");
const path = require("path");
const { getInFlightPacket } = require("../lib/getInFlightPacket");
const { getGitStatus } = require("../lib/gitStatus.shared");

const repoRoot = path.resolve(__dirname, "..", "..");
const STATE_DIR = path.join(repoRoot, ".scaffoldai", "state");
const PKG_PATH = path.join(repoRoot, "package.json");

const REQUIRED_STATE_FILES = [
  "active-stream.md",
  "active-contract.json",
  "next-action.md",
];

const REQUIRED_VERIFY_SCRIPTS = [
  "verify",
  "verify:consync",
  "verify:scaffoldai",
  "verify:full",
];

// -----------------------------------------------------------------------
// Checks
// -----------------------------------------------------------------------

function checkStateFiles() {
  const results = [];

  for (const filename of REQUIRED_STATE_FILES) {
    const fullPath = path.join(STATE_DIR, filename);
    const exists = fs.existsSync(fullPath);
    results.push({ filename, exists });
  }

  return results;
}

function checkContract() {
  const contractPath = path.join(STATE_DIR, "active-contract.json");

  try {
    const raw = fs.readFileSync(contractPath, "utf8");
    const contract = JSON.parse(raw);

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
  } catch {
    return { ok: false, contract: null, reason: "active-contract.json missing or malformed" };
  }
}

function checkVerifyScripts() {
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

function formatStateFileRow(results) {
  return results.map((r) => `${r.filename} ${r.exists ? "✓" : "✗"}`).join("  ");
}

function formatScriptRow(results) {
  return results.map((r) => `${r.name} ${r.exists ? "✓" : "✗"}`).join("  ");
}

// -----------------------------------------------------------------------
// Main command
// -----------------------------------------------------------------------

function runScaffoldaiPreflightCommand() {
  const blockers = [];
  const warnings = [];

  // --- Check 1: required state files ---
  const stateFileResults = checkStateFiles();
  const missingStateFiles = stateFileResults.filter((r) => !r.exists);

  if (missingStateFiles.length > 0) {
    for (const f of missingStateFiles) {
      blockers.push(`Missing required state file: ${f.filename}`);
    }
  }

  // --- Check 2: active-contract integrity ---
  const contractCheck = checkContract();
  if (!contractCheck.ok) {
    blockers.push(contractCheck.reason);
  }

  // --- Check 3: active packet ---
  const inFlightPacket = getInFlightPacket(repoRoot);
  // An active packet is informational, not a blocker — it means work is in flight.
  // Only a conflict (packet blocked by contract) would be a blocker (caught above).
  if (inFlightPacket) {
    warnings.push(`Active in-flight packet detected: ${inFlightPacket}`);
  }

  // --- Check 4: git status ---
  const git = getGitStatus(repoRoot);
  if (!git.clean) {
    warnings.push(`${git.count} uncommitted file(s) in working tree`);
  }

  // --- Check 5: verify scripts ---
  const scriptResults = checkVerifyScripts();
  const missingScripts = scriptResults.filter((r) => !r.exists);

  if (missingScripts.length > 0) {
    for (const s of missingScripts) {
      blockers.push(`Missing required npm script: ${s.name}`);
    }
  }

  // --- Determine overall status ---
  let status;

  if (blockers.length > 0) {
    status = "BLOCKED";
  } else if (warnings.length > 0) {
    status = "WARNING";
  } else {
    status = "PASS";
  }

  // --- Format git lines ---
  let gitLine;
  if (git.error) {
    gitLine = `(unavailable — ${git.error})`;
  } else if (git.clean) {
    gitLine = "Clean — no uncommitted changes";
  } else {
    gitLine = `${git.count} modified/untracked file(s)`;
    for (const f of git.files) {
      gitLine += `\n                  ${f}`;
    }
  }

  // --- Format blocker / warning lines ---
  const blockerLines =
    blockers.length === 0 ? "none" : blockers.map((b) => `BLOCKER: ${b}`).join("\n              ");

  const warningLines =
    warnings.length === 0 ? "none" : warnings.map((w) => `WARNING: ${w}`).join("\n              ");

  // --- Print output ---
  console.log("[scaffoldai preflight]");
  console.log("");
  console.log(`STATE FILES:      ${formatStateFileRow(stateFileResults)}`);
  console.log(`ACTIVE PACKET:    ${inFlightPacket ? inFlightPacket : "(none)"}`);
  console.log(`GIT STATUS:       ${gitLine}`);
  console.log(`VERIFY SCRIPTS:   ${formatScriptRow(scriptResults)}`);
  console.log(`BLOCKERS:         ${blockerLines}`);
  console.log(`WARNINGS:         ${warningLines}`);
  console.log("");
  console.log(`STATUS: ${status}`);

  if (status === "BLOCKED") {
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------
// Exported data gatherer — reusable by MCP and other non-CLI surfaces
// -----------------------------------------------------------------------

/**
 * Run all preflight checks and return the raw result object.
 * Does not print anything, does not set process.exitCode.
 *
 * @returns {{ blockers: string[], warnings: string[], status: string }}
 */
function gatherPreflightResults() {
  const blockers = [];
  const warnings = [];

  const stateFileResults = checkStateFiles();
  for (const f of stateFileResults.filter((r) => !r.exists)) {
    blockers.push(`Missing required state file: ${f.filename}`);
  }

  const contractCheck = checkContract();
  if (!contractCheck.ok) {
    blockers.push(contractCheck.reason);
  }

  const inFlightPacket = getInFlightPacket(repoRoot);
  if (inFlightPacket) {
    warnings.push(`Active in-flight packet detected: ${inFlightPacket}`);
  }

  const git = getGitStatus(repoRoot);
  if (!git.clean) {
    warnings.push(`${git.count} uncommitted file(s) in working tree`);
  }

  const scriptResults = checkVerifyScripts();
  for (const s of scriptResults.filter((r) => !r.exists)) {
    blockers.push(`Missing required npm script: ${s.name}`);
  }

  let status;
  if (blockers.length > 0) status = "BLOCKED";
  else if (warnings.length > 0) status = "WARNING";
  else status = "PASS";

  return { blockers, warnings, status };
}

module.exports = { runScaffoldaiPreflightCommand, gatherPreflightResults };
