const fs = require("fs");
const path = require("path");
const readline = require("readline");

const { readGatekeeperState, updateStreamSummary } = require("./gatekeeperMount");
const scaffoldaiState = require("./scaffoldaiState.scaffoldai");

const STREAMS_ROOT = path.join(".scaffoldai", "streams");
const STATE_ROOT = path.join(".scaffoldai", "state");

const FIXED_STREAMS = ["process", "electron_ui"];

// ---------------------------------------------------------------------------
// Derived facts
// ---------------------------------------------------------------------------

function derivePackageStatus(nextAction, handoff) {
  if (!nextAction || !nextAction.packageName) {
    return "absent";
  }
  if (
    handoff &&
    handoff.packageName === nextAction.packageName &&
    (handoff.status === "PASS" || handoff.status === "FAIL")
  ) {
    return "closed";
  }
  return "open";
}

function extractStreamStatus(streamDocText) {
  if (!streamDocText) return null;
  const match = streamDocText.match(/^- status:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

function hasPauseCheckpoint(streamDocText) {
  return streamDocText ? streamDocText.includes("## Pause Checkpoint") : false;
}

// ---------------------------------------------------------------------------
// Switch evaluation
// ---------------------------------------------------------------------------

function evaluateSwitch(state, targetStream) {
  const { activeStreamName, activeStreamText, nextAction, handoff } = state;

  if (!targetStream || !targetStream.trim()) {
    return {
      decision: "NEEDS_CLARIFICATION",
      reason: "no target stream provided",
      question: `Which stream should become active? Options: ${FIXED_STREAMS.join(", ")}`,
    };
  }

  if (!FIXED_STREAMS.includes(targetStream)) {
    return {
      decision: "REFUSE",
      reason: `"${targetStream}" is not a recognised stream — valid streams: ${FIXED_STREAMS.join(", ")}`,
    };
  }

  if (!activeStreamText || !activeStreamName) {
    return {
      decision: "REFUSE",
      reason: "active-stream.md is missing or unreadable",
    };
  }

  if (targetStream === activeStreamName) {
    return {
      decision: "REFUSE",
      reason: `"${targetStream}" is already the active stream`,
    };
  }

  const packageStatus = derivePackageStatus(nextAction, handoff);

  if (packageStatus === "open") {
    return {
      decision: "REFUSE",
      reason: `package "${nextAction.packageName}" is still open — close it before switching streams`,
    };
  }

  // Target stream doc is injected via state._targetStreamDocText for testability;
  // null = file was checked and is missing; undefined = not injected (treated as missing)
  const targetStreamDocText = state._targetStreamDocText;

  if (targetStreamDocText === null || targetStreamDocText === undefined) {
    return {
      decision: "REFUSE",
      reason: `streams/${targetStream}/stream.md is missing — cannot switch to an undocumented stream`,
    };
  }

  const targetStatus = extractStreamStatus(targetStreamDocText);

  if (targetStatus !== "active" && targetStatus !== "paused") {
    return {
      decision: "NEEDS_CLARIFICATION",
      reason: `streams/${targetStream}/stream.md has status "${targetStatus}" — expected "active" or "paused"`,
      question: "Resolve the target stream status before switching.",
    };
  }

  const warnings = [];

  if (targetStatus === "active") {
    warnings.push(
      `streams/${targetStream}/stream.md already shows status "active" but active-stream.md disagrees — desync noted`
    );
  }

  return {
    decision: "READY_TO_SWITCH",
    fromStream: activeStreamName,
    toStream: targetStream,
    targetHasPauseCheckpoint: hasPauseCheckpoint(targetStreamDocText),
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Content builders
// ---------------------------------------------------------------------------

function buildActiveStreamContent(toStream, fromStream, pausedStreams, switchReason) {
  const updated = pausedStreams.filter(s => s !== toStream);
  if (!updated.includes(fromStream)) {
    updated.push(fromStream);
  }
  const uniquePaused = [...new Set(updated)];
  const pausedLines = uniquePaused.length > 0
    ? uniquePaused.map(s => `- ${s}`).join("\n")
    : "- none";

  return [
    "ACTIVE STREAM",
    "",
    toStream,
    "",
    "PREVIOUS STREAM",
    "",
    fromStream,
    "",
    "SWITCH REASON",
    "",
    switchReason,
    "",
    "PAUSED STREAMS",
    "",
    pausedLines,
    "",
    "SUPPORTING STREAMS",
    "",
    "- none",
    "",
    "BLOCKED STREAMS",
    "",
    "- none",
    "",
    "LIVE OWNER NOTE",
    "",
    `Only \`${toStream}\` currently owns \`.scaffoldai/state/next-action.md\` and \`.scaffoldai/state/handoff.md\`.`,
    "",
    "The global live loop stays singular even while other streams remain durable and resumable.",
    "",
  ].join("\n");
}

function addPauseCheckpoint(streamDocText, packageName) {
  if (hasPauseCheckpoint(streamDocText)) {
    return streamDocText; // preserve existing checkpoint
  }
  const packageLine = packageName
    ? `Last open package at pause: ${packageName}.`
    : "No open package at time of pause.";
  return streamDocText.trimEnd() + "\n\n## Pause Checkpoint\n\n" + packageLine + "\n";
}

function updateSnapshotActiveStream(snapshotText, toStream) {
  if (!snapshotText) return null;
  return snapshotText.replace(
    /^(- recorded active stream:\s*)`[^`]+`$/m,
    `$1\`${toStream}\``
  );
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
// Write execution
// ---------------------------------------------------------------------------

function executeSwitchWrites(rootPath, fromStream, toStream, switchReason, pausedStreams, packageName) {
  // 1. Pause the old stream
  const fromStreamText = scaffoldaiState.readStreamDoc(rootPath, fromStream);

  if (fromStreamText) {
    let updated = fromStreamText.replace(/^(- status:\s*).*$/m, "$1paused");
    updated = updateStreamSummary(updated, `paused — switched to ${toStream}`);
    updated = addPauseCheckpoint(updated, packageName);
    scaffoldaiState.writeStreamDoc(rootPath, fromStream, updated);
  } else {
    console.warn(`warning: could not update streams/${fromStream}/stream.md — update manually`);
  }

  // 2. Activate the new stream
  const toStreamText = scaffoldaiState.readStreamDoc(rootPath, toStream);

  if (toStreamText) {
    let updated = toStreamText.replace(/^(- status:\s*).*$/m, "$1active");
    updated = updateStreamSummary(updated, "active — resumed via switch");
    scaffoldaiState.writeStreamDoc(rootPath, toStream, updated);
  } else {
    console.warn(`warning: could not update streams/${toStream}/stream.md — update manually`);
  }

  // 3. Update active-stream.md
  const activeStreamContent = buildActiveStreamContent(toStream, fromStream, pausedStreams, switchReason);
  scaffoldaiState.writeActiveStream(rootPath, activeStreamContent);

  // 4. Update snapshot.md — active stream value + clear Current Package
  const snapshotText = scaffoldaiState.readSnapshot(rootPath);

  if (snapshotText) {
    let updated = updateSnapshotActiveStream(snapshotText, toStream);

    if (updated) {
      const lines = updated.split("\n");
      const sectionIndex = lines.findIndex(l => l.trim() === "## Current Package");

      if (sectionIndex !== -1) {
        let endIndex = lines.length;
        for (let i = sectionIndex + 1; i < lines.length; i++) {
          if (lines[i].startsWith("## ")) { endIndex = i; break; }
        }
        updated = [
          ...lines.slice(0, sectionIndex + 1),
          "",
          "- none",
          "",
          ...lines.slice(endIndex),
        ].join("\n");
      }

      scaffoldaiState.writeSnapshot(rootPath, updated);
    } else {
      console.warn("warning: could not update snapshot.md active stream — update manually");
    }
  }

  // next-action.md is NOT written
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

async function runGatekeeperSwitch(rootPath, targetStream) {
  const state = readGatekeeperState(rootPath);

  // Read and inject target stream doc for evaluation
  const targetStreamDocText = targetStream
    ? scaffoldaiState.readStreamDoc(rootPath, targetStream)
    : undefined;

  state._targetStreamDocText = targetStreamDocText;

  const evaluation = evaluateSwitch(state, targetStream);

  // Print current state summary
  console.log("CURRENT STATE:");
  console.log(`- active stream: ${state.activeStreamName || "unknown"}`);
  console.log(
    `- open package: ${state.nextAction && state.nextAction.packageName ? state.nextAction.packageName : "none"}`
  );
  console.log(
    `- last handoff: ${state.handoff && state.handoff.packageName
      ? `${state.handoff.packageName} (${state.handoff.status})`
      : "none"}`
  );
  if (targetStream) {
    console.log(
      `- target stream: ${targetStream} (${targetStreamDocText
        ? (extractStreamStatus(targetStreamDocText) || "unknown")
        : "missing"})`
    );
  }
  console.log("");

  if (evaluation.decision === "REFUSE") {
    console.log("DECISION: REFUSE");
    console.log(`REASON: ${evaluation.reason}`);
    process.exitCode = 1;
    return;
  }

  if (evaluation.decision === "NEEDS_CLARIFICATION") {
    console.log("DECISION: NEEDS_CLARIFICATION");
    console.log(`REASON: ${evaluation.reason}`);
    console.log("CLARIFICATION NEEDED:");
    console.log(`- ${evaluation.question}`);
    process.exitCode = 1;
    return;
  }

  // READY_TO_SWITCH
  const { fromStream, toStream, targetHasPauseCheckpoint, warnings } = evaluation;

  if (warnings && warnings.length > 0) {
    for (const w of warnings) {
      console.log(`WARNING: ${w}`);
    }
    console.log("");
  }

  console.log("DECISION: READY_TO_SWITCH");
  console.log("");
  console.log("PROPOSED ACTION:");
  console.log("- operation: switch");
  console.log(`- from: ${fromStream}`);
  console.log(`- to: ${toStream}`);
  console.log("- files to be written:");
  console.log(`    .scaffoldai/streams/${fromStream}/stream.md (status → paused, summary, pause checkpoint)`);
  console.log(`    .scaffoldai/streams/${toStream}/stream.md (status → active, summary)`);
  console.log("    .scaffoldai/state/active-stream.md");
  console.log("    .scaffoldai/state/snapshot.md (active stream + Current Package section)");
  console.log("- files NOT touched:");
  console.log("    .scaffoldai/state/next-action.md");
  console.log("    .scaffoldai/state/handoff.md");

  if (targetHasPauseCheckpoint) {
    console.log("");
    console.log(`NOTE: streams/${toStream}/stream.md has an existing Pause Checkpoint — it will be preserved`);
  }

  console.log("");

  const session = makePromptSession();

  const answer = (await session.ask("CONFIRM? (yes / no): ")).toLowerCase();

  if (answer !== "yes") {
    session.close();
    console.log("Aborted. No files written.");
    if (answer !== "no") process.exitCode = 1;
    return;
  }

  const switchReason = await session.ask(`SWITCH REASON (one line — why switching to ${toStream}): `);
  session.close();

  if (!switchReason) {
    console.log("Switch reason is required. Aborted.");
    process.exitCode = 1;
    return;
  }

  const pausedStreams = state.activeStream && state.activeStream.pausedStreams
    ? state.activeStream.pausedStreams
    : [];

  const currentPackage = state.nextAction && state.nextAction.packageName
    ? state.nextAction.packageName
    : null;

  executeSwitchWrites(rootPath, fromStream, toStream, switchReason, pausedStreams, currentPackage);

  console.log("");
  console.log(`switched: ${fromStream} → ${toStream}`);
  console.log(
    `files written: streams/${fromStream}/stream.md, streams/${toStream}/stream.md, active-stream.md, snapshot.md`
  );
  console.log("files unchanged: next-action.md, handoff.md");
  console.log(`next: run gatekeeper mount to load work for ${toStream}`);
}

module.exports = {
  runGatekeeperSwitch,
  evaluateSwitch,
};
