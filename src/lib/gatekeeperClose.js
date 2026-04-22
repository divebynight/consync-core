const fs = require("fs");
const path = require("path");
const readline = require("readline");

const { parseHandoff } = require("./stateIntegrityCheck");
const { readGatekeeperState, updateStreamSummary } = require("./gatekeeperMount");

const STREAMS_ROOT = path.join(".consync", "streams");
const STATE_ROOT = path.join(".consync", "state");

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

function readFile(rootPath, relativePath) {
  const absolutePath = path.join(rootPath, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return fs.readFileSync(absolutePath, "utf8");
}

function writeFile(rootPath, relativePath, content) {
  const absolutePath = path.join(rootPath, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
}

// ---------------------------------------------------------------------------
// Mode detection
// ---------------------------------------------------------------------------

function detectCloseMode(state) {
  const { nextAction, handoff, activeStreamName, activeStreamText } = state;

  if (!activeStreamText || !activeStreamName) {
    return { mode: "REFUSE", reason: "active-stream.md is missing or unreadable" };
  }

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
    };
  }

  // Mode A: open package, no matching terminal handoff
  return {
    mode: "A",
    packageName: nextAction.packageName,
    type: nextAction.type,
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

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

function executeCloseWritesA(rootPath, packageName, type, status, summary, activeStreamName) {
  // 1. Write handoff.md first
  const handoffContent = buildHandoffContent(type, packageName, status, summary);
  writeFile(rootPath, path.join(STATE_ROOT, "handoff.md"), handoffContent);

  // 2. Update snapshot.md Current Package section
  const snapshotText = readFile(rootPath, path.join(STATE_ROOT, "snapshot.md"));

  if (snapshotText) {
    const updated = clearSnapshotCurrentPackage(snapshotText);

    if (updated) {
      writeFile(rootPath, path.join(STATE_ROOT, "snapshot.md"), updated);
    } else {
      console.warn("warning: could not update snapshot.md Current Package section — update manually");
    }
  }

  // 3. Update stream.md summary line
  const streamDocPath = path.join(STREAMS_ROOT, activeStreamName, "stream.md");
  const streamDocText = readFile(rootPath, streamDocPath);

  if (streamDocText) {
    const updated = updateStreamSummary(streamDocText, `active — last package: ${packageName} (${status})`);
    writeFile(rootPath, streamDocPath, updated);
  } else {
    console.warn("warning: could not update stream.md summary — update manually");
  }
}

function executeCloseWritesB(rootPath, packageName, handoffStatus, activeStreamName) {
  // 1. Update snapshot.md — do NOT touch handoff.md or next-action.md
  const snapshotText = readFile(rootPath, path.join(STATE_ROOT, "snapshot.md"));

  if (snapshotText) {
    const updated = clearSnapshotCurrentPackage(snapshotText);

    if (updated) {
      writeFile(rootPath, path.join(STATE_ROOT, "snapshot.md"), updated);
    } else {
      console.warn("warning: could not update snapshot.md Current Package section — update manually");
    }
  }

  // 2. Update stream.md summary line
  const streamDocPath = path.join(STREAMS_ROOT, activeStreamName, "stream.md");
  const streamDocText = readFile(rootPath, streamDocPath);

  if (streamDocText) {
    const updated = updateStreamSummary(streamDocText, `active — last package: ${packageName} (${handoffStatus})`);
    writeFile(rootPath, streamDocPath, updated);
  } else {
    console.warn("warning: could not update stream.md summary — update manually");
  }
}

// ---------------------------------------------------------------------------
// Interactive helpers
// ---------------------------------------------------------------------------

async function promptConfirmation(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function promptLine(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

async function runGatekeeperClose(rootPath) {
  const state = readGatekeeperState(rootPath);
  const closeMode = detectCloseMode(state);

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
    return;
  }

  // -------------------------------------------------------------------------
  // Mode B — reconciliation close
  // -------------------------------------------------------------------------

  if (closeMode.mode === "B") {
    console.log("DECISION: READY_TO_CLOSE (Mode B — reconciliation)");
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
    console.log("    .consync/state/snapshot.md (Current Package section only)");
    console.log(`    .consync/streams/${state.activeStreamName}/stream.md (summary line only)`);
    console.log("- files NOT touched:");
    console.log("    .consync/state/handoff.md");
    console.log("    .consync/state/next-action.md");
    console.log("");

    const answer = await promptConfirmation("CONFIRM? (yes / no): ");

    if (answer !== "yes") {
      console.log("Aborted. No files written.");
      if (answer !== "no") process.exitCode = 1;
      return;
    }

    executeCloseWritesB(rootPath, closeMode.packageName, closeMode.handoffStatus, state.activeStreamName);

    console.log("");
    console.log(`closed (reconciliation): ${closeMode.packageName}`);
    console.log(`stream: ${state.activeStreamName}`);
    console.log(`files written: snapshot.md, streams/${state.activeStreamName}/stream.md`);
    console.log(`files unchanged: handoff.md, next-action.md`);
    console.log(`next: run gatekeeper mount to mount the next package`);
    return;
  }

  // -------------------------------------------------------------------------
  // Mode A — normal close
  // -------------------------------------------------------------------------

  console.log("DECISION: READY_TO_CLOSE (Mode A — normal)");
  console.log("");
  console.log(`PACKAGE: ${closeMode.packageName}`);
  console.log("");

  const statusInput = await promptLine("STATUS (PASS / FAIL): ");
  const status = statusInput.toUpperCase();

  if (status !== "PASS" && status !== "FAIL") {
    console.log(`Invalid status "${statusInput}". Must be PASS or FAIL. Aborted.`);
    process.exitCode = 1;
    return;
  }

  const summary = await promptLine("SUMMARY (one line): ");

  if (!summary) {
    console.log("Summary is required. Aborted.");
    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log("PROPOSED ACTION:");
  console.log("- operation: close");
  console.log(`- package: ${closeMode.packageName}`);
  console.log(`- status: ${status}`);
  console.log(`- summary: ${summary}`);
  console.log("- files to be written:");
  console.log("    .consync/state/handoff.md");
  console.log("    .consync/state/snapshot.md (Current Package section only)");
  console.log(`    .consync/streams/${state.activeStreamName}/stream.md (summary line only)`);
  console.log("- files NOT touched:");
  console.log("    .consync/state/next-action.md");
  console.log("");

  const answer = await promptConfirmation("CONFIRM? (yes / no): ");

  if (answer !== "yes") {
    console.log("Aborted. No files written.");
    if (answer !== "no") process.exitCode = 1;
    return;
  }

  executeCloseWritesA(rootPath, closeMode.packageName, closeMode.type, status, summary, state.activeStreamName);

  console.log("");
  console.log(`closed: ${closeMode.packageName}`);
  console.log(`stream: ${state.activeStreamName}`);
  console.log(`status: ${status}`);
  console.log(`files written: handoff.md, snapshot.md, streams/${state.activeStreamName}/stream.md`);
  console.log(`files unchanged: next-action.md`);
  console.log(`next: run gatekeeper mount to mount the next package`);
}

module.exports = {
  runGatekeeperClose,
  detectCloseMode,
};
