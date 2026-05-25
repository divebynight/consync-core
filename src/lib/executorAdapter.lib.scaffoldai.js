const fs = require("fs");
const path = require("path");
const { getInFlightPacket } = require("./getInFlightPacket.query.scaffoldai");

// -----------------------------------------------------------------------
// Executor Adapter — Copilot CLI (CLI-first, MCP-ready boundary)
// -----------------------------------------------------------------------
//
// Design rules:
//   1. resolveExecutorContext reads disk state and validates preconditions.
//   2. buildPlanCommand and buildWorkCommand are PURE — they receive
//      { repoRoot, prompt } and return a command descriptor.
//      They never call resolveExecutorContext internally.
//   3. The command layer is responsible for:
//        a. resolveExecutorContext(repoRoot)
//        b. building the prompt from context
//        c. calling buildPlanCommand / buildWorkCommand
//        d. invoking Copilot
//
// This separation keeps command builders testable without disk I/O and
// makes the boundary safe for future MCP tool exposure.
// -----------------------------------------------------------------------

/**
 * Resolve executor context from disk.
 *
 * Reads the active in-flight packet and next-action from the repository.
 * Throws if preconditions are not met so the command layer can surface
 * a clear refusal message.
 *
 * @param {string} repoRoot - Absolute path to repository root
 * @returns {{ repoRoot, activePacket, packageName, nextActionContent, nextActionPath }}
 * @throws {Error} if repoRoot is invalid, no active packet, or next-action is missing/invalid
 */
function resolveExecutorContext(repoRoot) {
  if (!repoRoot) {
    throw new Error("resolveExecutorContext: repoRoot is required");
  }

  if (!fs.existsSync(repoRoot)) {
    throw new Error(`resolveExecutorContext: repository root not found: ${repoRoot}`);
  }

  const activePacket = getInFlightPacket(repoRoot);

  if (!activePacket) {
    throw new Error(
      "No active packet. Mount a packet before invoking the executor.\n" +
      "  Run: make scaffold-activate"
    );
  }

  const nextActionPath = path.join(repoRoot, ".scaffoldai", "state", "next-action.md");

  if (!fs.existsSync(nextActionPath)) {
    throw new Error(
      "next-action.md not found. Run scaffold-activate to mount the active packet."
    );
  }

  const nextActionContent = fs.readFileSync(nextActionPath, "utf8");

  const packageMatch = nextActionContent.match(/^PACKAGE:\s*(.+)$/m);
  const packageName = packageMatch ? packageMatch[1].trim() : null;

  if (!packageName || packageName === "NONE" || packageName.includes("No active")) {
    throw new Error(
      "next-action.md does not specify a valid package.\n" +
      "  Run: make scaffold-activate"
    );
  }

  return {
    repoRoot,
    activePacket,
    packageName,
    nextActionContent,
    nextActionPath,
  };
}

/**
 * Build a bounded planning-mode Copilot CLI command descriptor.
 *
 * PURE — does not read disk or call resolveExecutorContext.
 * The command layer must resolve context and build the prompt before calling this.
 *
 * Capability boundary:
 *   ✅ Read files and repository state
 *   ✅ Analyze code and plan
 *   ❌ Write to source files (--deny-tool=write)
 *   ❌ Execute shell commands (--deny-tool=shell(*))
 *   ❌ Modify git state
 *
 * Equivalent shell invocation:
 *   copilot -C <repoRoot> --plan --silent --disable-builtin-mcps \
 *     --deny-tool=write --deny-tool='shell(*)' -p "<prompt>"
 *
 * @param {{ repoRoot: string, prompt: string }} params
 * @returns {{ executable: string, args: string[], spawnOptions: object }}
 */
function buildPlanCommand({ repoRoot, prompt }) {
  if (!repoRoot) throw new Error("buildPlanCommand: repoRoot is required");
  if (!prompt) throw new Error("buildPlanCommand: prompt is required");

  return {
    executable: "copilot",
    args: [
      "-C", repoRoot,
      "--plan",
      "--silent",
      "--disable-builtin-mcps",
      "--deny-tool=write",
      "--deny-tool=shell(*)",
      "-p", prompt,
    ],
    spawnOptions: {
      cwd: repoRoot,
    },
  };
}

/**
 * Build a bounded work-mode Copilot CLI command descriptor.
 *
 * PURE — does not read disk or call resolveExecutorContext.
 * The command layer must resolve context and build the prompt before calling this.
 *
 * Capability boundary:
 *   ✅ Read and write files within approved work surface (--allow-tool=write)
 *   ✅ Execute approved next-action tasks
 *   ❌ Execute shell commands (--deny-tool=shell(*))
 *   ❌ Commit changes (human operator only)
 *   ❌ Activate or close packets (human operator only)
 *
 * Equivalent shell invocation:
 *   copilot -C <repoRoot> --silent --allow-tool=write \
 *     --deny-tool='shell(*)' -p "<prompt>"
 *
 * @param {{ repoRoot: string, prompt: string }} params
 * @returns {{ executable: string, args: string[], spawnOptions: object }}
 */
function buildWorkCommand({ repoRoot, prompt }) {
  if (!repoRoot) throw new Error("buildWorkCommand: repoRoot is required");
  if (!prompt) throw new Error("buildWorkCommand: prompt is required");

  return {
    executable: "copilot",
    args: [
      "-C", repoRoot,
      "--silent",
      "--allow-tool=write",
      "--deny-tool=shell(*)",
      "-p", prompt,
    ],
    spawnOptions: {
      cwd: repoRoot,
    },
  };
}

/**
 * Build the standard planning-mode prompt from resolved executor context.
 *
 * PURE — receives context fields and returns a prompt string.
 * Defined here so both the CLI command and MCP tool can reuse without
 * lib → commands import inversion.
 *
 * @param {{ activePacket: string, nextActionContent: string }} context
 * @returns {string}
 */
function buildPlanPrompt(context) {
  return [
    "You are in ScaffoldAI planning mode (READ-ONLY).",
    "",
    `Active packet: ${context.activePacket}`,
    "",
    "Next-action:",
    "---",
    context.nextActionContent.trim(),
    "---",
    "",
    "Analyze the repository and create a detailed implementation plan for the next-action above.",
    "Report findings, analysis, and recommendations only.",
    "Do not write any files. Do not execute any shell commands.",
  ].join("\n");
}

module.exports = {
  resolveExecutorContext,
  buildPlanCommand,
  buildWorkCommand,
  buildPlanPrompt,
};
