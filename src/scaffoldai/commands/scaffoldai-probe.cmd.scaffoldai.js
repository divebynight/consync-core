"use strict";

const { getRepoRoot } = require("../../lib/repoRoot.util.shared");
const {
  runLifecycleProbe,
  validateProbeReport,
} = require("../../lib/scaffoldaiLifecycleProbe.lib.scaffoldai");

const defaultRepoRoot = getRepoRoot(__dirname);

function printUsage() {
  console.log("Usage: scaffoldai probe [--report]");
  console.log("");
  console.log("Options:");
  console.log("  --report   Print full probe report JSON (default: summary only)");
  console.log("");
  console.log("Runs a deterministic lifecycle probe in an isolated fixture.");
  console.log("Does not modify live runtime state.");
}

function parseProbeOptions(argv) {
  const opts = { report: false };
  for (const arg of argv) {
    if (arg === "--report") {
      opts.report = true;
    } else if (arg === "--help" || arg === "-h") {
      opts.help = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return opts;
}

function runScaffoldaiProbeCommand(argv = [], repoRoot = defaultRepoRoot) {
  let opts;
  try {
    opts = parseProbeOptions(argv);
  } catch (error) {
    console.error(`[scaffoldai probe] ${error.message}`);
    console.error("");
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (opts.help) {
    printUsage();
    return;
  }

  console.log("[scaffoldai probe] Running lifecycle probe...");
  console.log("");

  const report = runLifecycleProbe(repoRoot);
  const validation = validateProbeReport(report);

  if (opts.report) {
    console.log(JSON.stringify(report, null, 2));
    console.log("");
  }

  console.log(`STATUS:           ${report.ok ? "PASS" : "FAIL"}`);
  console.log(`PROBE ID:         ${report.probe_id}`);
  console.log(`PHASES REACHED:   ${report.phases_reached.length}`);
  console.log(`  ${report.phases_reached.join("\n  ")}`);

  if (report.blocked_transitions.length > 0) {
    console.log(`BLOCKED:          ${report.blocked_transitions.map((b) => b.transition).join(", ")}`);
  }

  if (report.errors.length > 0) {
    console.log(`ERRORS:`);
    for (const error of report.errors) {
      console.log(`  ${error.phase}: ${error.reason || error.message || "unknown"}`);
    }
  }

  if (validation.missing_phases.length > 0) {
    console.log(`MISSING PHASES:   ${validation.missing_phases.join(", ")}`);
  }

  console.log(`MCP TOOLS:        ${report.mcp_tools_exercised.join(", ")}`);

  if (!report.ok || !validation.valid) {
    process.exitCode = 1;
  }
}

module.exports = {
  runScaffoldaiProbeCommand,
};
