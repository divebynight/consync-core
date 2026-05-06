const fs = require("fs");
const path = require("path");
const { getGitStatus } = require("../lib/gitStatus");
const { resolveVerifyCommand, readActiveContract } = require("../lib/resolveVerifyCommand");
const { getInFlightPacket } = require("../lib/getInFlightPacket");

const repoRoot = path.resolve(__dirname, "..", "..");

// -----------------------------------------------------------------------
// Argument parsing
// -----------------------------------------------------------------------

/**
 * @param {string[]} argv - process.argv slice starting after subcommand
 * @returns {{ verifyPassed: boolean, error?: string }}
 */
function parseArgs(argv) {
  let verifyPassed = false;

  for (const arg of argv) {
    if (arg === "--verify-passed") {
      verifyPassed = true;
      continue;
    }

    return { verifyPassed: false, error: `Unknown flag: ${arg}` };
  }

  return { verifyPassed };
}

// -----------------------------------------------------------------------
// Commit prefix inference
// -----------------------------------------------------------------------

/**
 * Infer an advisory commit prefix from changed file paths and contract state.
 *
 * @param {string[]} files - git status --short lines (e.g. "M src/commands/foo.js")
 * @param {object|null} contract
 * @returns {string|null}
 */
function inferCommitPrefix(files, contract) {
  if (!files || files.length === 0) return null;

  const paths = files.map((line) => line.replace(/^..\s+/, "").trim());

  const hasScaffoldai = paths.some((p) => p.startsWith(".scaffoldai/"));
  const hasSrcCommands = paths.some((p) => p.startsWith("src/commands/") || p.startsWith("src/lib/") || p.startsWith("src/cli/"));
  const hasSrcTest = paths.some((p) => p.startsWith("src/test/"));
  const hasDocs = paths.some((p) => p.endsWith(".md") || p.startsWith("docs/"));
  const hasPackageJson = paths.some((p) => p === "package.json");
  const hasSrc = paths.some((p) => p.startsWith("src/"));

  // Contract-informed override: process/planning packets dominate
  if (contract) {
    const allowed = contract.allowed_packet_types || [];
    const isProcessContext =
      allowed.includes("process") ||
      allowed.includes("contract") ||
      allowed.includes("planning");

    if (isProcessContext && (hasScaffoldai || hasSrcCommands)) {
      return "process:";
    }
  }

  // Path-based heuristic (order matters — most specific first)
  if (hasScaffoldai && !hasSrc) return "process:";
  if (hasScaffoldai && hasSrcCommands) return "process:";
  if (hasScaffoldai && hasSrcTest) return "process:";
  if (hasSrcTest && !hasSrcCommands && !hasScaffoldai) return "test:";
  if (hasSrcCommands && !hasScaffoldai) return "feat:";
  if (hasDocs && !hasSrc && !hasScaffoldai) return "docs:";
  if (hasPackageJson && paths.length === 1) return "chore:";

  return null;
}

/**
 * Build a commit suggestion string from prefix and active packet.
 *
 * @param {string|null} prefix
 * @param {string|null} inFlightPacket
 * @returns {string}
 */
function buildCommitSuggestion(prefix, inFlightPacket) {
  if (!prefix) return "(no suggestion — prefix unclear)";

  const bare = prefix.replace(/:$/, "");

  if (inFlightPacket) {
    // Convert packet-id underscores/hyphens to readable form
    const label = inFlightPacket.replace(/[-_]/g, " ");
    return `${prefix} ${label}`;
  }

  return `${prefix} <describe the change>`;
}

// -----------------------------------------------------------------------
// Main command
// -----------------------------------------------------------------------

function runScaffoldaiCloseoutCommand(argv) {
  const args = parseArgs(argv || []);

  if (args.error) {
    console.error(`[scaffoldai closeout] Error: ${args.error}`);
    console.error(`Usage: node src/index.js scaffoldai closeout [--verify-passed]`);
    process.exitCode = 1;
    return;
  }

  const { verifyPassed } = args;

  const blockers = [];
  const warnings = [];

  // --- Read state ---
  const contract = readActiveContract(repoRoot);
  const inFlightPacket = getInFlightPacket(repoRoot);
  const git = getGitStatus(repoRoot);
  const resolved = resolveVerifyCommand(contract, {});

  // --- Check contract coherence ---
  if (contract) {
    const blocked = contract.blocked_packet_types || [];
    if (inFlightPacket && blocked.includes(inFlightPacket)) {
      blockers.push(`in_flight_packet "${inFlightPacket}" is in blocked_packet_types`);
    }
  } else {
    blockers.push("active-contract.json missing or malformed");
  }

  // --- Git status ---
  if (git.error) {
    blockers.push("git status failed — cannot evaluate changed files");
  }

  const hasChanges = !git.clean && !git.error;

  // --- Format CHANGED FILES section ---
  let changedFilesLine;
  if (git.error) {
    changedFilesLine = "error — git status unavailable";
  } else if (git.clean) {
    changedFilesLine = "none — working tree is clean";
  } else {
    changedFilesLine = `${git.count} file(s)`;
    for (const f of git.files) {
      changedFilesLine += `\n                  ${f}`;
    }
  }

  // --- Verify command ---
  const verifyCommand = resolved.error ? "(unavailable)" : resolved.command;

  // --- Verification evidence ---
  let verificationEvidence;
  if (verifyPassed) {
    verificationEvidence = "--verify-passed provided (human attestation)";
  } else {
    verificationEvidence = "none — run verify and re-run with --verify-passed";
    if (hasChanges) {
      warnings.push("no verification evidence — run verify before committing");
    }
  }

  // --- Commit recommendation ---
  const prefix = inferCommitPrefix(git.files, contract);
  const suggestion = buildCommitSuggestion(prefix, inFlightPacket);

  const commitPrefixLine = prefix || "(none — mixed or unclear changes)";
  const commitSuggestionLine = suggestion;

  // --- Determine STATUS ---
  let status;

  if (blockers.length > 0) {
    status = "BLOCKED";
  } else if (!hasChanges) {
    // Nothing to commit
    status = "CLEAN";
  } else if (verifyPassed) {
    status = warnings.length > 0 ? "WARNING" : "READY_FOR_REVIEW";
  } else {
    status = "NEEDS_VERIFICATION";
  }

  // --- Next safe action ---
  let nextSafeAction;
  if (status === "BLOCKED") {
    nextSafeAction = "Resolve blockers listed above before committing.";
  } else if (status === "CLEAN") {
    nextSafeAction = "No uncommitted changes. Nothing to commit.";
  } else if (status === "NEEDS_VERIFICATION") {
    nextSafeAction = `Run ${verifyCommand}, then re-run: node src/index.js scaffoldai closeout --verify-passed`;
  } else if (status === "WARNING") {
    nextSafeAction = `Review warnings above. If acceptable, commit with: git commit -m "${suggestion}"`;
  } else {
    // READY_FOR_REVIEW
    nextSafeAction = `Commit with: git commit -m "${suggestion}"`;
  }

  // --- Format blockers / warnings ---
  const blockerLines =
    blockers.length === 0
      ? "none"
      : blockers.map((b) => `BLOCKER: ${b}`).join("\n              ");

  const warningLines =
    warnings.length === 0
      ? "none"
      : warnings.map((w) => `WARNING: ${w}`).join("\n              ");

  // --- Print output ---
  console.log("[scaffoldai closeout]");
  console.log("");
  console.log(`ACTIVE PACKET:        ${inFlightPacket || "(none)"}`);
  console.log(`CHANGED FILES:        ${changedFilesLine}`);
  console.log("");
  console.log(`VERIFY COMMAND:       ${verifyCommand}`);
  console.log(`VERIFICATION EVIDENCE: ${verificationEvidence}`);
  console.log("");
  console.log(`COMMIT PREFIX:        ${commitPrefixLine}`);
  console.log(`COMMIT SUGGESTION:    ${commitSuggestionLine}`);
  console.log("");
  console.log(`BLOCKERS:             ${blockerLines}`);
  console.log(`WARNINGS:             ${warningLines}`);
  console.log("");
  console.log(`NEXT SAFE ACTION:     ${nextSafeAction}`);
  console.log("");
  console.log(`STATUS: ${status}`);

  if (status === "BLOCKED") {
    process.exitCode = 1;
  }
}

module.exports = { runScaffoldaiCloseoutCommand, inferCommitPrefix, parseArgs };
