const { getGitStatus } = require("./gitStatus.util.shared");
const { resolveVerifyCommand, readActiveContract } = require("./resolveVerifyCommand.query.scaffoldai");
const { getInFlightPacket } = require("./getInFlightPacket.query.scaffoldai");
const scaffoldaiVerifyEvidence = require("./scaffoldaiVerifyEvidence.state.scaffoldai");

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
  const hasSrcCommands = paths.some(
    (p) =>
      p.startsWith("src/commands/") ||
      p.startsWith("src/scaffoldai/commands/") ||
      p.startsWith("src/lib/") ||
      p.startsWith("src/cli/")
  );
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
// Main closeout readiness gathering function
// -----------------------------------------------------------------------

/**
 * Gather closeout readiness data.
 * Does not print anything, does not set process.exitCode.
 *
 * @param {string} repoRoot - absolute path to repository root
 * @param {{ verifyPassed: boolean }} options
 * @returns {{
 *   blockers: string[],
 *   warnings: string[],
 *   status: string,
 *   data: {
 *     contract: object|null,
 *     inFlightPacket: string|null,
 *     git: object,
 *     resolvedVerify: object,
 *     commitPrefix: string|null,
 *     commitSuggestion: string,
 *     hasChanges: boolean,
 *     verificationEvidence: string
 *   }
 * }}
 */
function gatherCloseoutReadiness(repoRoot, options) {
  const { verifyPassed } = options || { verifyPassed: false };

  const blockers = [];
  const warnings = [];

  // --- Read state ---
  const contract = readActiveContract(repoRoot);
  const inFlightPacket = getInFlightPacket(repoRoot);
  const git = getGitStatus(repoRoot);
  const resolvedVerify = resolveVerifyCommand(contract, {});

  // --- Check contract coherence ---
  if (contract) {
    const blocked = contract.blocked_packet_types || [];
    if (inFlightPacket && blocked.includes(inFlightPacket)) {
      blockers.push(`in_flight_packet "${inFlightPacket}" is in blocked_packet_types`);
    }
  } else {
    blockers.push("active-policy.json or active-runtime.json missing or malformed");
  }

  // --- Git status ---
  if (git.error) {
    blockers.push("git status failed — cannot evaluate changed files");
  }

  const hasChanges = !git.clean && !git.error;

  // --- Verification evidence ---
  let verificationEvidenceRecord = null;
  let verificationEvidenceState = "not_requested";
  let verificationEvidenceReason = null;
  let verificationEvidence;
  if (verifyPassed) {
    const packetId = inFlightPacket || null;
    const validation = scaffoldaiVerifyEvidence.validateVerifyEvidence(repoRoot, packetId);

    if (!validation.valid) {
      verificationEvidenceState = "invalid";
      verificationEvidenceReason = validation.reason;
      verificationEvidenceRecord = validation.evidence || scaffoldaiVerifyEvidence.readVerifyEvidence(repoRoot);
      verificationEvidence = verificationEvidenceRecord
        ? `--verify-passed provided (human attestation); ${validation.reason} — ${scaffoldaiVerifyEvidence.formatVerifyEvidence(verificationEvidenceRecord)}`
        : `--verify-passed provided (human attestation); ${validation.reason}`;
      blockers.push(`verification evidence invalid: ${validation.reason}`);
    } else {
      verificationEvidenceState = "valid";
      verificationEvidenceRecord = validation.evidence;
      verificationEvidence = `--verify-passed provided (human attestation); ${scaffoldaiVerifyEvidence.formatVerifyEvidence(validation.evidence)}`;
    }
  } else {
    verificationEvidence = "none — run verify and re-run with --verify-passed";
    if (hasChanges) {
      warnings.push("no verification evidence — run verify before committing");
    }
  }

  // --- Commit recommendation ---
  const commitPrefix = inferCommitPrefix(git.files, contract);
  const commitSuggestion = buildCommitSuggestion(commitPrefix, inFlightPacket);

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

  return {
    blockers,
    warnings,
    status,
    data: {
      contract,
      inFlightPacket: inFlightPacket || null,
      git,
      resolvedVerify,
      commitPrefix: commitPrefix || null,
      commitSuggestion,
      hasChanges,
      verificationEvidence,
      verificationEvidenceRecord,
      verificationEvidenceState,
      verificationEvidenceReason,
    },
  };
}

module.exports = {
  gatherCloseoutReadiness,
  inferCommitPrefix,
  buildCommitSuggestion,
};
