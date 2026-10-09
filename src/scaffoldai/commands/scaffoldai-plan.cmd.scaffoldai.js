const { getRepoRoot } = require("../../lib/repoRoot.util.shared");
const {
  resolveExecutorContext,
  buildPlanCommand,
  buildPlanPrompt,
} = require("../../lib/executorAdapter.lib.scaffoldai");

const repoRoot = getRepoRoot(__dirname);

// -----------------------------------------------------------------------
// scaffold-plan: Read-only planning/analysis runner
// -----------------------------------------------------------------------
//
// Capability boundary:
//   ✅ Read files and repository state
//   ✅ Analyze code and documentation
//   ✅ Answer questions and plan approaches
//   ❌ Cannot write to source files
//   ❌ Cannot execute shell commands
//   ❌ Cannot modify git state
//   ❌ Cannot activate or close packets
//   ❌ Cannot commit changes
//
// This is a runner capability boundary enforced by the Copilot CLI flags,
// not by prompt wording.
// -----------------------------------------------------------------------

/**
 * scaffold-plan command runner.
 *
 * Sequence (coordinator-reviewed separation):
 *   1. Command layer resolves context with resolveExecutorContext(repoRoot)
 *   2. Command layer builds prompt from context
 *   3. Command layer calls buildPlanCommand({ repoRoot, prompt })
 *   4. Command layer invokes Copilot
 */
function runScaffoldPlanCommand(options = {}) {
  console.log("[scaffold-plan] Read-only planning/analysis runner");
  console.log("");

  // 1. Resolve context
  let context;
  try {
    context = resolveExecutorContext(repoRoot);
  } catch (err) {
    console.error("[scaffold-plan] ERROR: " + err.message);
    process.exitCode = 1;
    return;
  }

  console.log("MODE:             PLAN (read-only)");
  console.log("CAPABILITY:       No file writes, no shell execution");
  console.log("ACTIVE PACKET:    " + context.activePacket);
  console.log("PACKAGE:          " + context.packageName);
  console.log("");

  // 2. Build prompt from context
  const prompt = buildPlanPrompt(context);

  // 3. Build command
  const command = buildPlanCommand({ repoRoot, prompt });

  // 4. Print invocation surface (operator reviews before running)
  console.log("EXECUTOR COMMAND:");
  console.log("  " + command.executable + " " + formatArgs(command.args));
  console.log("");
  console.log("CAPABILITY FLAGS:");
  console.log("  --plan                  Read-only planning mode");
  console.log("  --deny-tool=write       File writes blocked");
  console.log("  --deny-tool=shell(*)    Shell execution blocked");
  console.log("  --disable-builtin-mcps  Built-in MCPs disabled");
  console.log("");
  console.log("To invoke: copy the command above, or integrate via MCP executor tool.");
  console.log("See: .scaffoldai/process/capability-boundary-model.process.md");
}

/**
 * Format args array for display, quoting entries that contain spaces or special chars.
 *
 * @param {string[]} args
 * @returns {string}
 */
function formatArgs(args) {
  return args
    .map((arg) => (arg.includes(" ") || arg.includes("(") ? `'${arg}'` : arg))
    .join(" ");
}

module.exports = { runScaffoldPlanCommand, buildPlanPrompt };
