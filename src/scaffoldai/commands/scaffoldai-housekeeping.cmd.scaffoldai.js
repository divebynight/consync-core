"use strict";

const {
  gatherHousekeepingStatus,
  resetRuntimeState,
} = require("../../lib/scaffoldaiHousekeeping.auth.scaffoldai");
const { getRepoRoot } = require("../../lib/repoRoot.util.shared");

const repoRoot = getRepoRoot(__dirname);

function printUsage() {
  console.log("Usage: scaffoldai housekeeping <status|reset-runtime-state> [--include-runtime-logs]");
}

function parseArgs(argv = []) {
  const action = argv[0];
  let includeRuntimeLogs = false;

  for (const arg of argv.slice(1)) {
    if (arg === "--include-runtime-logs") {
      includeRuntimeLogs = true;
      continue;
    }

    return {
      action,
      includeRuntimeLogs,
      error: `Unknown flag: ${arg}`,
    };
  }

  return {
    action,
    includeRuntimeLogs,
  };
}

function printStatus(result) {
  const {
    runtime_state_catalog: catalog,
    runtime_changes: runtimeChanges,
    durable_policy_changes: durablePolicyChanges,
    implementation_changes: implementationChanges,
    safe_to_reset: safeToReset,
    runtime_logs_detected: runtimeLogsDetected,
  } = result.data;

  console.log("[scaffoldai housekeeping status]");
  console.log("");
  console.log("RUNTIME STATE CATALOG:");
  for (const entry of catalog) {
    const resetTag = entry.safe_to_reset ? "safe to reset" : "preserve by default";
    console.log(`  - ${entry.path} (${entry.category}; ${resetTag})`);
    console.log(`    reason: ${entry.reason}`);
  }

  console.log("");
  console.log(`RUNTIME CHANGES:       ${runtimeChanges.length}`);
  for (const entry of runtimeChanges) {
    console.log(`  - ${entry.line} [${entry.category}]`);
  }

  console.log(`DURABLE POLICY CHANGES: ${durablePolicyChanges.length}`);
  for (const entry of durablePolicyChanges) {
    console.log(`  - ${entry.line} [${entry.category}]`);
  }

  console.log(`IMPLEMENTATION CHANGES: ${implementationChanges.length}`);
  for (const entry of implementationChanges) {
    console.log(`  - ${entry.line}`);
  }

  console.log(`SAFE TO RESET:         ${safeToReset.length}`);
  for (const entry of safeToReset) {
    console.log(`  - ${entry.path}`);
  }

  console.log(`RUNTIME LOGS DETECTED: ${runtimeLogsDetected.length}`);
  for (const entry of runtimeLogsDetected) {
    console.log(`  - ${entry.path}`);
  }

  console.log("");
  console.log(`NEXT SAFE ACTION: ${result.next_safe_action}`);
  console.log(`STATUS: ${result.status}`);
}

function printReset(result) {
  console.log("[scaffoldai housekeeping reset-runtime-state]");
  console.log("");

  if (result.blockers && result.blockers.length > 0) {
    for (const blocker of result.blockers) {
      console.log(`BLOCKER: ${blocker}`);
    }
  }

  console.log(`INCLUDE RUNTIME LOGS: ${result.data.include_runtime_logs ? "yes" : "no"}`);
  console.log(`PACKETS PRESERVED:    ${result.data.packet_files_preserved ? "yes" : "no"}`);
  console.log(`PACKET FILE COUNT:    ${result.data.packet_file_count}`);

  console.log("TOUCHED FILES:");
  if (result.data.touched.length === 0) {
    console.log("  - none");
  } else {
    for (const item of result.data.touched) {
      console.log(`  - ${item}`);
    }
  }

  console.log("SKIPPED FILES:");
  if (result.data.skipped.length === 0) {
    console.log("  - none");
  } else {
    for (const item of result.data.skipped) {
      console.log(`  - ${item.path} (${item.reason})`);
    }
  }

  if (result.warnings && result.warnings.length > 0) {
    for (const warning of result.warnings) {
      console.log(`WARNING: ${warning}`);
    }
  }

  console.log("");
  console.log(`NEXT SAFE ACTION: ${result.next_safe_action}`);
  console.log(`STATUS: ${result.status}`);
}

function runScaffoldaiHousekeepingCommand(argv = []) {
  const args = parseArgs(argv);

  if (args.error) {
    console.error(`[scaffoldai housekeeping] Error: ${args.error}`);
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (args.action === "status") {
    printStatus(gatherHousekeepingStatus(repoRoot));
    return;
  }

  if (args.action === "reset-runtime-state") {
    const result = resetRuntimeState(repoRoot, {
      includeRuntimeLogs: args.includeRuntimeLogs,
    });
    printReset(result);

    if (result.status === "BLOCKED") {
      process.exitCode = 1;
    }
    return;
  }

  printUsage();
  process.exitCode = 1;
}

module.exports = {
  parseArgs,
  runScaffoldaiHousekeepingCommand,
};