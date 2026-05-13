const { gatherStatus, readActiveStream } = require("../../lib/scaffoldaiStatus.query.scaffoldai");
const { getRepoRoot } = require("../../lib/repoRoot.util.shared");

const repoRoot = getRepoRoot(__dirname);

// -----------------------------------------------------------------------
// CLI command wrapper
// -----------------------------------------------------------------------

function runScaffoldaiStatusCommand() {
  const result = gatherStatus(repoRoot, { includeGit: true });
  const git = result.data.git;

  console.log("[scaffoldai status]");
  console.log("");
  console.log(`ACTIVE STREAM:    ${result.data.active_stream || "(unknown)"}`);
  console.log(`ACTIVE PACKET:    ${result.data.active_packet || "(none)"}`);
  console.log(`NEXT SAFE ACTION: ${result.next_safe_action}`);

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

  console.log(`VERIFY COMMAND:   ${result.data.verify_command}`);

  if (result.data.warnings.length === 0) {
    console.log("WARNINGS:         none");
  } else {
    for (const warning of result.data.warnings) {
      console.log(`WARNING:          ${warning}`);
    }
  }

  console.log("");
  console.log(`STATUS: ${result.status}`);
}

module.exports = { runScaffoldaiStatusCommand, readActiveStream, gatherStatus };
