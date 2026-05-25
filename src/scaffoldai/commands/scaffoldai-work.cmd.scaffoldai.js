const { getRepoRoot } = require("../../lib/repoRoot.util.shared");
const {
  resolveExecutorContext,
  buildWorkCommand,
} = require("../../lib/executorAdapter.lib.scaffoldai");

const repoRoot = getRepoRoot(__dirname);

// -----------------------------------------------------------------------
// scaffold-work: Bounded writable execution runner
// -----------------------------------------------------------------------
//
// Capability boundary:
//   ✅ Read and write files within approved work surface (--allow-tool=write)
//   ✅ Execute approved next-action tasks
//   ❌ Cannot run arbitrary shell commands (--deny-tool=shell(*))
//   ❌ Cannot commit (human operator only)
//   ❌ Cannot activate or close packets (human operator only)
//
// Prerequisites:
//   - Active packet must be mounted (run 'make scaffold-activate')
//   - next-action.md must specify a valid package
//   - Human operator approval required before invocation
//
// This is a runner capability boundary enforced by Copilot CLI flags,
// not by prompt wording.
// -----------------------------------------------------------------------

/**
 * Build the prompt for work mode from resolved executor context.
 *
 * @param {{ activePacket: string, packageName: string, nextActionContent: string }} context
 * @returns {string}
 */
function buildWorkPrompt(context) {
  return [
    "You are in ScaffoldAI work mode (BOUNDED WRITES).",
    "",
    `Active packet: ${context.activePacket}`,
    "",
    "Next-action:",
    "---",
    context.nextActionContent.trim(),
    "---",
    "",
    "Execute the approved next-action above.",
    "Write files as specified. Do not run arbitrary shell commands.",
    "Do not activate or close packets. Do not commit changes.",
    "Lifecycle operations are reserved for the human operator.",
  ].join("\n");
}

/**
 * scaffold-work command runner.
 *
 * Sequence (coordinator-reviewed separation):
 *   1. Command layer resolves context with resolveExecutorContext(repoRoot)
 *   2. Command layer builds prompt from context
 *   3. Command layer calls buildWorkCommand({ repoRoot, prompt })
 *   4. Command layer invokes Copilot
 */
function runScaffoldWorkCommand(options = {}) {
  console.log("[scaffold-work] Bounded writable execution runner");
  console.log("");

  // 1. Resolve context
  let context;
  try {
    context = resolveExecutorContext(repoRoot);
  } catch (err) {
    console.error("[scaffold-work] ERROR: " + err.message);
    process.exitCode = 1;
    return;
  }

  console.log("MODE:             WORK (write within approved surface)");
  console.log("CAPABILITY:       File writes enabled, shell execution blocked");
  console.log("ACTIVE PACKET:    " + context.activePacket);
  console.log("PACKAGE:          " + context.packageName);
  console.log("");

  // 2. Build prompt from context
  const prompt = buildWorkPrompt(context);

  // 3. Build command
  const command = buildWorkCommand({ repoRoot, prompt });

  // 4. Print invocation surface (operator reviews before running)
  console.log("EXECUTOR COMMAND:");
  console.log("  " + command.executable + " " + formatArgs(command.args));
  console.log("");
  console.log("CAPABILITY FLAGS:");
  console.log("  --allow-tool=write      File writes enabled (bounded to next-action scope)");
  console.log("  --deny-tool=shell(*)    Shell execution blocked");
  console.log("");
  console.log("LIFECYCLE SEPARATION:");
  console.log("  Packet activation, closeout, and commits are operator-only operations.");
  console.log("  This runner cannot mutate approval state or workflow phases.");
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

module.exports = { runScaffoldWorkCommand, buildWorkPrompt };
