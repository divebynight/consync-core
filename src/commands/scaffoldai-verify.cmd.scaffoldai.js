const { spawnSync } = require("child_process");
const { resolveVerifyCommand, readActiveContract } = require("../lib/resolveVerifyCommand.query.scaffoldai");

const repoRoot = require("path").resolve(__dirname, "..", "..");

const VALID_TARGETS = ["scaffoldai", "consync", "full"];

// -----------------------------------------------------------------------
// Argument parsing
// -----------------------------------------------------------------------

/**
 * @param {string[]} argv - process.argv slice starting after subcommand
 * @returns {{ run: boolean, target: string|undefined, error?: string }}
 */
function parseArgs(argv) {
  let run = false;
  let target;

  for (const arg of argv) {
    if (arg === "--run") {
      run = true;
      continue;
    }

    if (arg.startsWith("--target=")) {
      target = arg.slice("--target=".length);
      continue;
    }

    return { run: false, target: undefined, error: `Unknown flag: ${arg}` };
  }

  return { run, target };
}

// -----------------------------------------------------------------------
// Main command
// -----------------------------------------------------------------------

function runScaffoldaiVerifyCommand(argv) {
  const args = parseArgs(argv || []);

  if (args.error) {
    console.error(`[scaffoldai verify] Error: ${args.error}`);
    console.error(`Usage: node src/index.js scaffoldai verify [--run] [--target=scaffoldai|consync|full]`);
    process.exitCode = 1;
    return;
  }

  const { run, target } = args;

  // Read current contract
  const contract = readActiveContract(repoRoot);

  // Resolve the verify command
  const resolved = resolveVerifyCommand(contract, { target });

  if (resolved.error) {
    console.error(`[scaffoldai verify] Error: ${resolved.reason}`);
    console.error(`Valid --target values: ${VALID_TARGETS.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  // ---- Recommend-only mode ----
  if (!run) {
    console.log("[scaffoldai verify]");
    console.log("");
    console.log(`RECOMMENDED VERIFY:   ${resolved.command}`);
    console.log(`TARGET:               ${resolved.target}`);
    console.log(`REASON:               ${resolved.reason}`);
    console.log("");
    console.log(`Run with:  node src/index.js scaffoldai verify --run`);
    if (target) {
      console.log(`           (or with --target=${target} --run to pin this target)`);
    }
    console.log("");
    console.log("STATUS: RECOMMEND");
    return;
  }

  // ---- Run mode ----
  // Safety: never silently auto-run full verify. It must be explicitly targeted.
  if (!target && resolved.target === "full") {
    console.error("[scaffoldai verify] Error: full verify must be explicitly requested with --target=full");
    process.exitCode = 1;
    return;
  }

  console.log("[scaffoldai verify]");
  console.log("");
  console.log(`SELECTED VERIFY:   ${resolved.command}`);
  console.log(`TARGET:            ${resolved.target}`);
  console.log("");
  console.log(`Running ${resolved.command} ...`);
  console.log("");

  // Execute the resolved npm run script
  // resolved.command is always "npm run <script>"
  const scriptName = resolved.command.replace(/^npm run /, "");

  const result = spawnSync("npm", ["run", scriptName], {
    cwd: repoRoot,
    stdio: "inherit",
    encoding: "utf8",
  });

  if (result.error) {
    console.error(`[scaffoldai verify] Failed to spawn: ${result.error.message}`);
    process.exitCode = 1;
    return;
  }

  console.log("");

  if (result.status === 0) {
    console.log("STATUS: PASS");
  } else {
    console.log("STATUS: FAIL");
    process.exitCode = result.status;
  }
}

module.exports = { runScaffoldaiVerifyCommand };
