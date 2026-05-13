const {
  gatherPreflightResults,
  formatStateFileRow,
  formatScriptRow,
} = require("../../lib/scaffoldaiPreflight.auth.scaffoldai");
const { getRepoRoot } = require("../../lib/repoRoot.util.shared");

const repoRoot = getRepoRoot(__dirname);

// -----------------------------------------------------------------------
// CLI Command — Thin wrapper for terminal output
// -----------------------------------------------------------------------

function runScaffoldaiPreflightCommand() {
  const result = gatherPreflightResults(repoRoot);

  const { blockers, warnings, status, data } = result;
  const { stateFileResults, scriptResults, inFlightPacket, git } = data;

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

module.exports = { runScaffoldaiPreflightCommand };
