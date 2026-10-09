const fs = require("fs");
const path = require("path");
const readline = require("readline");

const { parseHandoff } = require("./stateIntegrityCheck.check.scaffoldai");
const { readGatekeeperState, updateStreamSummary } = require("./gatekeeperMount.auth.scaffoldai");
const scaffoldaiState = require("./scaffoldaiState.state.scaffoldai");

const STREAMS_ROOT = path.join(".scaffoldai", "streams");
const STATE_ROOT = path.join(".scaffoldai", "state");

// ---------------------------------------------------------------------------
// Mode detection
// ---------------------------------------------------------------------------

function detectCloseMode(state) {
  const { nextAction, handoff, activeStreamName, activeStreamText } = state;

  // Allow closeout even when runtime state (active-stream.md) is missing
  // This enables clean-checkout closeout after verification passes
  const hasRuntimeState = Boolean(activeStreamText && activeStreamName);

  if (!nextAction || !nextAction.packageName) {
    return { mode: "REFUSE", reason: "next-action.md has no mounted package — nothing to close" };
  }

  // Mode B: handoff already records a terminal status for this exact package
  if (
    handoff &&
    handoff.packageName === nextAction.packageName &&
    (handoff.status === "PASS" || handoff.status === "FAIL")
  ) {
    return {
      mode: "B",
      packageName: nextAction.packageName,
      type: nextAction.type,
      handoffStatus: handoff.status,
      hasRuntimeState,
    };
  }

  // Mode A: open package, no matching terminal handoff
  return {
    mode: "A",
    packageName: nextAction.packageName,
    type: nextAction.type,
    hasRuntimeState,
  };
}

// ---------------------------------------------------------------------------
// Content builders
// ---------------------------------------------------------------------------

function buildHandoffContent(type, packageName, status, summary) {
  return [
    `TYPE: ${type}`,
    `PACKAGE: ${packageName}`,
    "",
    "STATUS",
    "",
    status,
    "",
    "SUMMARY",
    "",
    summary,
    "",
    "FILES CREATED",
    "",
    "- (recorded by agent during work)",
    "",
    "FILES MODIFIED",
    "",
    "- (recorded by agent during work)",
    "",
    "FILES DELETED",
    "",
    "- none",
    "",
    "COMMANDS TO RUN",
    "",
    "- none",
    "",
    "HUMAN VERIFICATION",
    "",
    "- confirm goal is met",
    "",
    "VERIFICATION NOTES",
    "",
    "(written via gatekeeper close)",
    "",
  ].join("\n");
}

function clearSnapshotCurrentPackage(snapshotText) {
  const lines = snapshotText.split("\n");
  const sectionIndex = lines.findIndex(line => line.trim() === "## Current Package");

  if (sectionIndex === -1) {
    return null;
  }

  let endIndex = lines.length;

  for (let i = sectionIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      endIndex = i;
      break;
    }
  }

  const before = lines.slice(0, sectionIndex + 1);
  const after = lines.slice(endIndex);
  const newSection = ["", "- none", ""];

  return [...before, ...newSection, ...after].join("\n");
}

function buildCloseoutDiagnostics({ packetClosed, packageName, status, handoffStatus = null, reason = null }) {
  return {
    tool: "scaffoldai_gatekeeper_close",
    execution_class: "LOCAL_CLOSEOUT_BOUNDED",
    packet_closed: packetClosed,
    cleanup_performed: false,
    inbox_candidate_removed: false,
    removed_paths: [],
    skipped_paths: [],
    validation_errors: [],
    guard_errors: reason ? [reason] : [],
    error_category: reason ? "guard_failure" : null,
    package_name: packageName || null,
    status: status || null,
    handoff_status: handoffStatus,
  };
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

function executeCloseWritesA(rootPath, packageName, type, status, summary, activeStreamName) {
  // 1. Write handoff.md first
  const handoffContent = buildHandoffContent(type, packageName, status, summary);
  scaffoldaiState.writeHandoff(rootPath, handoffContent);

  // 2. Update snapshot.md Current Package section
  const snapshotText = scaffoldaiState.readSnapshot(rootPath);

  if (snapshotText) {
    const updated = clearSnapshotCurrentPackage(snapshotText);

    if (updated) {
      scaffoldaiState.writeSnapshot(rootPath, updated);
    } else {
      console.warn("warning: could not update snapshot.md Current Package section — update manually");
    }
  }

  // 3. Update stream.md summary line (skip if stream name unknown due to missing runtime state)
  if (activeStreamName) {
    const streamDocText = scaffoldaiState.readStreamDoc(rootPath, activeStreamName);

    if (streamDocText) {
      const updated = updateStreamSummary(streamDocText, `active — last package: ${packageName} (${status})`);
      scaffoldaiState.writeStreamDoc(rootPath, activeStreamName, updated);
    } else {
      console.warn("warning: could not update stream.md summary — update manually");
    }
  } else {
    console.warn("warning: stream.md not updated — active stream unknown (runtime state missing)");
  }

  // 4. Append history after successful state writes (skip if stream name unknown)
  if (activeStreamName) {
    scaffoldaiState.appendHistory(rootPath, {
      operation: "close",
      surface: "cli",
      stream: activeStreamName,
      package: packageName,
      status: status,
      summary: `closed: ${packageName} (${status})`,
    });
  } else {
    console.warn("warning: history.jsonl not updated — active stream unknown (runtime state missing)");
  }
}

function executeCloseWritesB(rootPath, packageName, handoffStatus, activeStreamName) {
  // 1. Update snapshot.md — do NOT touch handoff.md or next-action.md
  const snapshotText = scaffoldaiState.readSnapshot(rootPath);

  if (snapshotText) {
    const updated = clearSnapshotCurrentPackage(snapshotText);

    if (updated) {
      scaffoldaiState.writeSnapshot(rootPath, updated);
    } else {
      console.warn("warning: could not update snapshot.md Current Package section — update manually");
    }
  }

  // 2. Update stream.md summary line (skip if stream name unknown due to missing runtime state)
  if (activeStreamName) {
    const streamDocText = scaffoldaiState.readStreamDoc(rootPath, activeStreamName);

    if (streamDocText) {
      const updated = updateStreamSummary(streamDocText, `active — last package: ${packageName} (${handoffStatus})`);
      scaffoldaiState.writeStreamDoc(rootPath, activeStreamName, updated);
    } else {
      console.warn("warning: could not update stream.md summary — update manually");
    }
  } else {
    console.warn("warning: stream.md not updated — active stream unknown (runtime state missing)");
  }

  // 3. Append history after successful state writes (reconciliation) (skip if stream name unknown)
  if (activeStreamName) {
    scaffoldaiState.appendHistory(rootPath, {
      operation: "close",
      surface: "cli",
      stream: activeStreamName,
      package: packageName,
      status: handoffStatus,
      summary: `closed (reconciliation): ${packageName} (${handoffStatus})`,
    });
  } else {
    console.warn("warning: history.jsonl not updated — active stream unknown (runtime state missing)");
  }
}

// ---------------------------------------------------------------------------
// Interactive helpers
// ---------------------------------------------------------------------------

// Creates a prompt session that works for both TTY and piped input.
// Lines arriving before ask() is called are queued; lines arriving after
// are handed to the waiting resolver. This avoids the readline race where
// piped input is consumed before a second question callback is registered.
function makePromptSession() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  const lineQueue = [];
  const waiters = [];

  rl.on("line", line => {
    if (waiters.length > 0) {
      waiters.shift()(line.trim());
    } else {
      lineQueue.push(line.trim());
    }
  });

  return {
    ask(question) {
      process.stdout.write(question);
      return new Promise(resolve => {
        if (lineQueue.length > 0) {
          resolve(lineQueue.shift());
        } else {
          waiters.push(resolve);
        }
      });
    },
    close() {
      rl.close();
    },
  };
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

async function runGatekeeperClose(rootPath, options = {}) {
  const state = readGatekeeperState(rootPath);
  const closeMode = detectCloseMode(state);
  const nonInteractive = options && options.nonInteractive === true;

  // Always print current state summary
  console.log("CURRENT STATE:");
  console.log(`- active stream: ${state.activeStreamName || "unknown"}`);
  console.log(`- open package: ${state.nextAction && state.nextAction.packageName ? state.nextAction.packageName : "none"}`);
  console.log(
    `- last handoff: ${state.handoff && state.handoff.packageName ? `${state.handoff.packageName} (${state.handoff.status})` : "none"}`
  );
  console.log("");

  if (closeMode.mode === "REFUSE") {
    console.log("DECISION: REFUSE");
    console.log(`REASON: ${closeMode.reason}`);
    process.exitCode = 1;
    return buildCloseoutDiagnostics({
      packetClosed: false,
      packageName: null,
      status: "REFUSE",
      reason: closeMode.reason,
    });
  }

  // -------------------------------------------------------------------------
  // Mode B — reconciliation close
  // -------------------------------------------------------------------------

  if (closeMode.mode === "B") {
    console.log("DECISION: READY_TO_CLOSE (Mode B — reconciliation)");
    if (!closeMode.hasRuntimeState) {
      console.log("NOTE: Runtime state missing — stream updates will be skipped");
    }
    console.log("");
    console.log(
      `NOTE: handoff.md already records ${closeMode.packageName} as ${closeMode.handoffStatus} — handoff.md will NOT be rewritten`
    );
    console.log("");
    console.log("PROPOSED ACTION:");
    console.log("- operation: reconciliation close");
    console.log(`- package: ${closeMode.packageName}`);
    console.log(`- handoff status: ${closeMode.handoffStatus} (existing)`);
    console.log("- files to be written:");
    console.log("    .scaffoldai/state/snapshot.md (Current Package section only)");
    if (state.activeStreamName) {
      console.log(`    .scaffoldai/streams/${state.activeStreamName}/stream.md (summary line only)`);
    }
    console.log("- files NOT touched:");
    console.log("    .scaffoldai/state/handoff.md");
    console.log("    .scaffoldai/state/next-action.md");
    if (!state.activeStreamName) {
      console.log("- files SKIPPED (runtime state missing):");
      console.log("    .scaffoldai/streams/*/stream.md");
      console.log("    .scaffoldai/state/history.jsonl");
    }
    console.log("");

    let answer;
    if (nonInteractive) {
      answer = options.confirm === false ? "no" : "yes";
    } else {
      const session = makePromptSession();
      answer = (await session.ask("CONFIRM? (yes / no): ")).toLowerCase();
      session.close();
    }

    if (answer !== "yes") {
      console.log("Aborted. No files written.");
      if (answer !== "no") process.exitCode = 1;
      return;
    }

    executeCloseWritesB(rootPath, closeMode.packageName, closeMode.handoffStatus, state.activeStreamName);

    console.log("");
    console.log(`closed (reconciliation): ${closeMode.packageName}`);
    if (state.activeStreamName) {
      console.log(`stream: ${state.activeStreamName}`);
      console.log(`files written: snapshot.md, streams/${state.activeStreamName}/stream.md`);
    } else {
      console.log(`stream: (unknown — runtime state missing)`);
      console.log(`files written: snapshot.md`);
      console.log(`files skipped: stream.md, history.jsonl`);
    }
    console.log(`files unchanged: handoff.md, next-action.md`);
    console.log(`next: run gatekeeper mount to mount the next package`);
    return buildCloseoutDiagnostics({
      packetClosed: true,
      packageName: closeMode.packageName,
      status: closeMode.handoffStatus,
      handoffStatus: closeMode.handoffStatus,
    });
  }

  // -------------------------------------------------------------------------
  // Mode A — normal close
  // -------------------------------------------------------------------------

  console.log("DECISION: READY_TO_CLOSE (Mode A — normal)");
  if (!closeMode.hasRuntimeState) {
    console.log("NOTE: Runtime state missing — stream updates will be skipped");
  }
  console.log("");
  console.log(`PACKAGE: ${closeMode.packageName}`);
  console.log("");

  let statusInput;
  let status;
  let summary;
  let confirmAnswer;

  if (nonInteractive) {
    statusInput = typeof options.status === "string" ? options.status : "";
    status = statusInput.toUpperCase();
    summary = typeof options.summary === "string" ? options.summary.trim() : "";
    confirmAnswer = options.confirm === false ? "no" : "yes";
  } else {
    const session = makePromptSession();

    statusInput = await session.ask("STATUS (PASS / FAIL): ");
    status = statusInput.toUpperCase();

    if (status !== "PASS" && status !== "FAIL" && status !== "CANCELLED" && status !== "ABANDONED") {
      session.close();
      console.log(`Invalid status "${statusInput}". Must be PASS, FAIL, CANCELLED, or ABANDONED. Aborted.`);
      process.exitCode = 1;
      return buildCloseoutDiagnostics({
        packetClosed: false,
        packageName: closeMode.packageName,
        status: "ABORTED",
        reason: `invalid status: ${statusInput}`,
      });
    }

    summary = await session.ask("SUMMARY (one line): ");

    if (!summary) {
      session.close();
      console.log("Summary is required. Aborted.");
      process.exitCode = 1;
      return buildCloseoutDiagnostics({
        packetClosed: false,
        packageName: closeMode.packageName,
        status: "ABORTED",
        reason: "summary is required",
      });
    }

    confirmAnswer = (await session.ask("CONFIRM? (yes / no): ")).toLowerCase();
    session.close();
  }

  if (status !== "PASS" && status !== "FAIL" && status !== "CANCELLED" && status !== "ABANDONED") {
    console.log(`Invalid status "${statusInput}". Must be PASS, FAIL, CANCELLED, or ABANDONED. Aborted.`);
    process.exitCode = 1;
    return buildCloseoutDiagnostics({
      packetClosed: false,
      packageName: closeMode.packageName,
      status: "ABORTED",
      reason: `invalid status: ${statusInput}`,
    });
  }

  if (!summary) {
    console.log("Summary is required. Aborted.");
    process.exitCode = 1;
    return buildCloseoutDiagnostics({
      packetClosed: false,
      packageName: closeMode.packageName,
      status: "ABORTED",
      reason: "summary is required",
    });
  }

  console.log("");
  console.log("PROPOSED ACTION:");
  console.log("- operation: close");
  console.log(`- package: ${closeMode.packageName}`);
  console.log(`- status: ${status}`);
  console.log(`- summary: ${summary}`);
  console.log("- files to be written:");
  console.log("    .scaffoldai/state/handoff.md");
  console.log("    .scaffoldai/state/snapshot.md (Current Package section only)");
  if (state.activeStreamName) {
    console.log(`    .scaffoldai/streams/${state.activeStreamName}/stream.md (summary line only)`);
  }
  console.log("- files NOT touched:");
  console.log("    .scaffoldai/state/next-action.md");
  if (!state.activeStreamName) {
    console.log("- files SKIPPED (runtime state missing):");
    console.log("    .scaffoldai/streams/*/stream.md");
    console.log("    .scaffoldai/state/history.jsonl");
  }
  console.log("");

  if (confirmAnswer !== "yes") {
    console.log("Aborted. No files written.");
    if (confirmAnswer !== "no") process.exitCode = 1;
    return buildCloseoutDiagnostics({
      packetClosed: false,
      packageName: closeMode.packageName,
      status: "ABORTED",
      reason: "closeout not confirmed",
    });
  }

  executeCloseWritesA(rootPath, closeMode.packageName, closeMode.type, status, summary, state.activeStreamName);

  console.log("");
  console.log(`closed: ${closeMode.packageName}`);
  if (state.activeStreamName) {
    console.log(`stream: ${state.activeStreamName}`);
  } else {
    console.log(`stream: (unknown — runtime state missing)`);
  }
  console.log(`status: ${status}`);
  if (state.activeStreamName) {
    console.log(`files written: handoff.md, snapshot.md, streams/${state.activeStreamName}/stream.md`);
  } else {
    console.log(`files written: handoff.md, snapshot.md`);
    console.log(`files skipped: stream.md, history.jsonl`);
  }
  console.log(`files unchanged: next-action.md`);
  console.log(`next: run gatekeeper mount to mount the next package`);

  return buildCloseoutDiagnostics({
    packetClosed: true,
    packageName: closeMode.packageName,
    status,
    handoffStatus: status,
  });
}

module.exports = {
  runGatekeeperClose,
  detectCloseMode,
};
