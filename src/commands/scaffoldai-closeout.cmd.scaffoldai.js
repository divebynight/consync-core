const { gatherCloseoutReadiness } = require("../lib/scaffoldaiCloseout.auth.scaffoldai");
const { getRepoRoot } = require("../lib/repoRoot.util.shared");

const repoRoot = getRepoRoot(__dirname);

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
// CLI Command — Thin wrapper for terminal output
// -----------------------------------------------------------------------

function runScaffoldaiCloseoutCommand(argv) {
  const args = parseArgs(argv || []);

  if (args.error) {
    console.error(`[scaffoldai closeout] Error: ${args.error}`);
    console.error(`Usage: node src/index.js scaffoldai closeout [--verify-passed]`);
    process.exitCode = 1;
    return;
  }

  const result = gatherCloseoutReadiness(repoRoot, { verifyPassed: args.verifyPassed });
  const { blockers, warnings, status, data } = result;
  const { inFlightPacket, git, resolvedVerify, commitPrefix, commitSuggestion, hasChanges, verificationEvidence } = data;

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
  const verifyCommand = resolvedVerify.error ? "(unavailable)" : resolvedVerify.command;

  const commitPrefixLine = hasChanges
    ? (commitPrefix || "(none — mixed or unclear changes)")
    : "(none — no changed files)";
  const commitSuggestionLine = hasChanges
    ? commitSuggestion
    : "(none — no changed files)";

  // --- Next safe action ---
  let nextSafeAction;
  if (status === "BLOCKED") {
    nextSafeAction = "Resolve blockers listed above before committing.";
  } else if (status === "CLEAN") {
    nextSafeAction = "No uncommitted changes. Nothing to commit.";
  } else if (status === "NEEDS_VERIFICATION") {
    nextSafeAction = `Run ${verifyCommand}, then re-run: node src/index.js scaffoldai closeout --verify-passed`;
  } else if (status === "WARNING") {
    nextSafeAction = `Review warnings above. If acceptable, commit with: git commit -m "${commitSuggestion}"`;
  } else {
    // READY_FOR_REVIEW
    nextSafeAction = `Commit with: git commit -m "${commitSuggestion}"`;
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

module.exports = { runScaffoldaiCloseoutCommand, parseArgs };
