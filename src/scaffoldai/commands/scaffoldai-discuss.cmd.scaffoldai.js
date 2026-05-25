const path = require("path");
const fs = require("fs");
const { getRepoRoot } = require("../../lib/repoRoot.util.shared");
const { readActiveStream, gatherStatus } = require("../../lib/scaffoldaiStatus.query.scaffoldai");

const repoRoot = getRepoRoot(__dirname);

// -----------------------------------------------------------------------
// scaffold-discuss: Read-only planning/discussion runner
// -----------------------------------------------------------------------

/**
 * scaffold-discuss runner
 * 
 * Purpose: Read-only planning, analysis, and question answering
 * 
 * Capability Boundary:
 * - ✅ Read files and repository state
 * - ✅ Analyze code and documentation  
 * - ✅ Answer questions
 * - ✅ Plan and discuss approaches
 * - ❌ Cannot write to source files
 * - ❌ Cannot execute shell commands
 * - ❌ Cannot modify git state
 * - ❌ Cannot activate or close packets
 * - ❌ Cannot commit changes
 * 
 * This is a runner capability boundary, not a prompt instruction.
 */

function runScaffoldDiscussCommand(options = {}) {
  const status = gatherStatus(repoRoot, { includeGit: false });
  
  console.log("[scaffold-discuss] Read-only planning/discussion runner");
  console.log("");
  console.log("MODE:             DISCUSS (read-only)");
  console.log("CAPABILITY:       No file writes, no shell execution");
  console.log("ACTIVE PACKET:    " + (status.data.active_packet || "(none)"));
  console.log("");
  
  // Check for discussion artifacts in .scaffoldai/planning/ or .scaffoldai/tmp/
  const planningDir = path.join(repoRoot, ".scaffoldai", "planning");
  const tmpDir = path.join(repoRoot, ".scaffoldai", "tmp");
  
  const discussionArtifacts = [];
  
  if (fs.existsSync(planningDir)) {
    const files = fs.readdirSync(planningDir)
      .filter(f => f.endsWith(".md") && (f.includes("question") || f.includes("discussion") || f.includes("plan")));
    discussionArtifacts.push(...files.map(f => path.join("planning", f)));
  }
  
  if (discussionArtifacts.length > 0) {
    console.log("DISCUSSION ARTIFACTS FOUND:");
    for (const artifact of discussionArtifacts) {
      console.log(`  .scaffoldai/${artifact}`);
    }
    console.log("");
  } else {
    console.log("No discussion artifacts found in .scaffoldai/planning/");
    console.log("");
    console.log("Usage patterns:");
    console.log("  1. Ask questions about the codebase");
    console.log("  2. Plan approaches before creating next-action");
    console.log("  3. Analyze code structure and patterns");
    console.log("  4. Review and discuss proposals");
    console.log("");
    console.log("Discussion artifacts (optional):");
    console.log("  Place *.md files in .scaffoldai/planning/ with questions or topics");
    console.log("  Runner will read them as context for discussion");
    console.log("");
  }
  
  console.log("NOTE: This runner operates in READ-ONLY mode.");
  console.log("      Source files cannot be modified from this mode.");
  console.log("      Use 'make scaffold-work' to execute approved next-action.");
  console.log("");
  console.log("See: .scaffoldai/process/capability-boundary-model.process.md");
  
  // In a full implementation, this would invoke Copilot CLI or similar
  // with read-only tool restrictions. For now, it's a documented wrapper.
  console.log("");
  console.log("[scaffold-discuss] To invoke AI in read-only mode:");
  console.log("  This is a capability boundary wrapper stub.");
  console.log("  Full implementation would invoke Copilot CLI with:");
  console.log("  - plan mode or equivalent read-only mode");
  console.log("  - write tools denied");
  console.log("  - shell tools denied");
  console.log("  - builtin MCPs disabled");
  console.log("");
  console.log("  For now: Use this as a reminder to work in read-only context.");
}

module.exports = { runScaffoldDiscussCommand };
