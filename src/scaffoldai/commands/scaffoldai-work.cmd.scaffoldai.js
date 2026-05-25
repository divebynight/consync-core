const path = require("path");
const fs = require("fs");
const { getRepoRoot } = require("../../lib/repoRoot.util.shared");
const { gatherStatus } = require("../../lib/scaffoldaiStatus.query.scaffoldai");

const repoRoot = getRepoRoot(__dirname);

// -----------------------------------------------------------------------
// scaffold-work: Bounded writable execution runner
// -----------------------------------------------------------------------

/**
 * scaffold-work runner
 * 
 * Purpose: Execute approved next-action within bounded workspace
 * 
 * Capability Boundary:
 * - ✅ Read and write files within approved work surface
 * - ✅ Execute approved next-action tasks
 * - ✅ Create/modify files specified in next-action
 * - ✅ Run verification commands
 * - ❌ Cannot run arbitrary shell commands outside safe list
 * - ❌ Cannot modify files outside approved work surface
 * - ❌ Cannot commit (human operator only)
 * - ❌ Cannot activate/close packets (human operator only)
 * 
 * Prerequisites:
 * - Active next-action must be mounted (run 'make scaffold-activate')
 * - Work surface must be defined in next-action
 * - Human operator approval required
 * 
 * This is a runner capability boundary, not a prompt instruction.
 */

function runScaffoldWorkCommand(options = {}) {
  const status = gatherStatus(repoRoot, { includeGit: false });
  const activePacket = status.data.active_packet;
  
  console.log("[scaffold-work] Bounded writable execution runner");
  console.log("");
  console.log("MODE:             WORK (write within approved surface)");
  console.log("CAPABILITY:       File writes bounded to next-action scope");
  console.log("ACTIVE PACKET:    " + (activePacket || "(none)"));
  console.log("");
  
  // Check if next-action is mounted
  const nextActionPath = path.join(repoRoot, ".scaffoldai", "state", "next-action.md");
  
  if (!activePacket || activePacket === "(none)") {
    console.log("ERROR: No active packet mounted.");
    console.log("");
    console.log("Before running scaffold-work:");
    console.log("  1. Review proposals in .scaffoldai/inbox/");
    console.log("  2. Run 'make scaffold-intake' to accept a proposal");
    console.log("  3. Run 'make scaffold-activate' to mount as next-action");
    console.log("  4. Then run 'make scaffold-work' to execute");
    console.log("");
    process.exitCode = 1;
    return;
  }
  
  if (!fs.existsSync(nextActionPath)) {
    console.log("WARNING: next-action.md not found.");
    console.log("         Run 'make scaffold-activate' to mount the active packet.");
    console.log("");
    process.exitCode = 1;
    return;
  }
  
  const nextActionContent = fs.readFileSync(nextActionPath, "utf8");
  
  // Parse basic info from next-action
  const typeMatch = nextActionContent.match(/^TYPE:\s*(.+)$/m);
  const packageMatch = nextActionContent.match(/^PACKAGE:\s*(.+)$/m);
  
  const type = typeMatch ? typeMatch[1].trim() : "(unknown)";
  const packageName = packageMatch ? packageMatch[1].trim() : "(unknown)";
  
  console.log("NEXT-ACTION:");
  console.log(`  Type:    ${type}`);
  console.log(`  Package: ${packageName}`);
  console.log("");
  
  if (packageName === "(unknown)" || packageName.includes("No active")) {
    console.log("ERROR: next-action does not specify a valid package.");
    console.log("       Run 'make scaffold-activate' to mount a valid packet.");
    console.log("");
    process.exitCode = 1;
    return;
  }
  
  // In a full implementation, this would:
  // 1. Parse the work surface from next-action
  // 2. Invoke Copilot CLI or similar with:
  //    - write tools enabled
  //    - workspace bounded to approved files
  //    - shell restricted to safe verification commands
  //    - no lifecycle control (no activate/close/commit)
  // 3. Monitor and log execution
  // 4. Verify changes before completion
  
  console.log("WORK RUNNER STUB:");
  console.log("  This is a capability boundary wrapper stub.");
  console.log("  Full implementation would:");
  console.log("  - Parse approved work surface from next-action");
  console.log("  - Invoke Copilot CLI with write tools enabled");
  console.log("  - Restrict file writes to approved surface only");
  console.log("  - Restrict shell to verification commands only");
  console.log("  - Block lifecycle operations (human operator only)");
  console.log("  - Run verification before completion");
  console.log("");
  console.log("  For now: Execute work manually according to next-action.");
  console.log("           When complete, run 'make scaffold-close'.");
  console.log("");
  console.log("See: .scaffoldai/process/capability-boundary-model.process.md");
  console.log("");
  console.log("NEXT-ACTION CONTENT:");
  console.log("---");
  console.log(nextActionContent);
  console.log("---");
}

module.exports = { runScaffoldWorkCommand };
