const fs = require("fs");
const path = require("path");
const readline = require("readline");

const { parseActiveStream, parseNextAction, parseHandoff } = require("./stateIntegrityCheck");

const STREAMS_ROOT = path.join(".consync", "streams");
const STATE_ROOT = path.join(".consync", "state");

const FIXED_STREAMS = ["process", "electron_ui"];

const STREAM_TYPE_MAP = {
  process: "PROCESS",
  electron_ui: "FEATURE",
};

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

function readFile(rootPath, relativePath) {
  const absolutePath = path.join(rootPath, relativePath);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  return fs.readFileSync(absolutePath, "utf8");
}

function writeFile(rootPath, relativePath, content) {
  const absolutePath = path.join(rootPath, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
}

// ---------------------------------------------------------------------------
// State reading
// ---------------------------------------------------------------------------

function readGatekeeperState(rootPath) {
  const activeStreamText = readFile(rootPath, path.join(STATE_ROOT, "active-stream.md"));
  const nextActionText = readFile(rootPath, path.join(STATE_ROOT, "next-action.md"));
  const handoffText = readFile(rootPath, path.join(STATE_ROOT, "handoff.md"));
  const snapshotText = readFile(rootPath, path.join(STATE_ROOT, "snapshot.md"));

  const activeStream = activeStreamText ? parseActiveStream(activeStreamText) : null;
  const nextAction = nextActionText ? parseNextAction(nextActionText) : null;
  const handoff = handoffText ? parseHandoff(handoffText) : null;

  const activeStreamName = activeStream ? activeStream.activeStream : null;
  const streamDocText = activeStreamName
    ? readFile(rootPath, path.join(STREAMS_ROOT, activeStreamName, "stream.md"))
    : null;

  return {
    activeStreamText,
    nextActionText,
    handoffText,
    snapshotText,
    streamDocText,
    activeStream,
    nextAction,
    handoff,
    activeStreamName,
  };
}

// ---------------------------------------------------------------------------
// Derived facts
// ---------------------------------------------------------------------------

function derivePackageStatus(nextAction, handoff) {
  if (!nextAction || !nextAction.type || !nextAction.packageName) {
    return "absent";
  }

  if (
    handoff &&
    handoff.packageName &&
    handoff.packageName === nextAction.packageName &&
    (handoff.status === "PASS" || handoff.status === "FAIL")
  ) {
    return "closed";
  }

  return "open";
}

function extractStreamStatus(streamDocText) {
  if (!streamDocText) {
    return null;
  }

  const match = streamDocText.match(/^- status:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

function hasNamedBlocker(snapshotText) {
  if (!snapshotText) {
    return false;
  }

  const lower = snapshotText.toLowerCase();
  return lower.includes("blocker") || lower.includes("blocked");
}

// ---------------------------------------------------------------------------
// Request analysis
// ---------------------------------------------------------------------------

function toPackageName(requestText) {
  return requestText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 60);
}

function inferStreamFromRequest(requestText, activeStreamName) {
  const lower = requestText.toLowerCase();

  const streamSignals = {
    process: ["process", "governance", "integrity", "runbook", "stream", "workflow", "gatekeeper", "contract"],
    electron_ui: ["electron", "ui", "renderer", "timeline", "bookmark", "search", "desktop", "window", "react", "app"],
  };

  const matched = [];

  for (const streamName of FIXED_STREAMS) {
    const signals = streamSignals[streamName];
    if (signals.some(signal => lower.includes(signal))) {
      matched.push(streamName);
    }
  }

  // Unambiguous: exactly one stream matched
  if (matched.length === 1) {
    return { stream: matched[0], confident: true };
  }

  // Both matched or neither matched — not confident
  // Fall back to active stream only if request gives no stream signals
  if (matched.length === 0) {
    return { stream: activeStreamName, confident: false };
  }

  // Ambiguous: multiple streams matched
  return { stream: null, confident: false };
}

function looksBounded(requestText) {
  const lower = requestText.toLowerCase();

  // Too short to evaluate
  if (requestText.trim().split(/\s+/).length < 4) {
    return false;
  }

  // Signs of multiple deliverables
  const multipartSignals = [" and then ", " then ", " after that ", " next, ", " also ", " additionally "];
  if (multipartSignals.some(signal => lower.includes(signal))) {
    return false;
  }

  return true;
}

function looksMultipart(requestText) {
  const lower = requestText.toLowerCase();

  const phraseSignals = [" and then ", " then ", " after that ", " next, ", " also ", " additionally ", " followed by "];
  if (phraseSignals.some(signal => lower.includes(signal))) {
    return true;
  }

  // Catch "verb ... and verb" — two action verbs connected by plain "and"
  const actionVerbs = [
    "add", "create", "build", "implement", "define", "write", "update",
    "remove", "delete", "refactor", "fix", "extract", "move", "replace",
    "integrate", "connect", "expose", "bind", "render", "test", "verify",
    "simplify", "reduce", "extend", "generate", "read", "parse", "display",
    "allow", "enable", "support", "introduce", "migrate", "wire",
  ];

  if (lower.includes(" and ")) {
    const parts = lower.split(" and ");
    const partsWithVerb = parts.filter(part =>
      actionVerbs.some(verb => part.trim().startsWith(verb) || part.trim().includes(` ${verb} `))
    );
    if (partsWithVerb.length >= 2) {
      return true;
    }
  }

  return false;
}

function hasMinimalWorkInstructions(requestText) {
  // Must be able to form at least one concrete instruction from the request.
  // Reject if request is only a noun phrase with no verb (action) component.
  const words = requestText.trim().split(/\s+/);

  if (words.length < 5) {
    return false;
  }

  const actionVerbs = [
    "add", "create", "build", "implement", "define", "write", "update",
    "remove", "delete", "refactor", "fix", "extract", "move", "replace",
    "integrate", "connect", "expose", "bind", "render", "test", "verify",
    "simplify", "reduce", "extend", "generate", "read", "parse", "display",
  ];

  const lower = requestText.toLowerCase();
  return actionVerbs.some(verb => lower.includes(verb));
}

function deriveIntegrityLevel(activeStreamName, requestText) {
  if (activeStreamName === "process") {
    return "heavy";
  }

  const lower = requestText.toLowerCase();

  if (
    lower.includes("stream") ||
    lower.includes("active-stream") ||
    lower.includes("snapshot") ||
    lower.includes("integrity") ||
    lower.includes("state")
  ) {
    return "elevated";
  }

  return "light";
}

// ---------------------------------------------------------------------------
// Readiness evaluation
// ---------------------------------------------------------------------------

function evaluateReadiness(state, requestText) {
  const { activeStreamName, nextAction, handoff, streamDocText, snapshotText } = state;

  // Hard refuses — surface before anything else

  if (!state.activeStreamText) {
    return { decision: "REFUSE", reason: "active-stream.md is missing — repo state cannot be determined" };
  }

  if (!activeStreamName) {
    return { decision: "REFUSE", reason: "active-stream.md does not declare an active stream" };
  }

  if (!streamDocText) {
    return {
      decision: "REFUSE",
      reason: `streams/${activeStreamName}/stream.md is missing — create it before mounting`,
    };
  }

  const streamStatus = extractStreamStatus(streamDocText);

  if (streamStatus !== "active") {
    return {
      decision: "REFUSE",
      reason: `streams/${activeStreamName}/stream.md status is "${streamStatus}" but active-stream.md declares it active — reconcile before mounting`,
    };
  }

  const packageStatus = derivePackageStatus(nextAction, handoff);

  if (packageStatus === "open") {
    return {
      decision: "REFUSE",
      reason: `package "${nextAction.packageName}" is still open — close it before mounting new work`,
    };
  }

  // Request quality checks

  if (!requestText || requestText.trim().split(/\s+/).length < 4) {
    return {
      decision: "NEEDS_CLARIFICATION",
      reason: "request is too short to evaluate",
      question: "What should this package deliver, and what does done look like?",
    };
  }

  // Stream inference runs before multipart check so stream mismatch always blocks first
  const streamInference = inferStreamFromRequest(requestText, activeStreamName);

  if (!streamInference.confident && streamInference.stream !== activeStreamName) {
    return {
      decision: "NEEDS_CLARIFICATION",
      reason: "cannot determine which stream this work belongs to",
      question: `The active stream is "${activeStreamName}". Does this work belong to that stream? If not, which stream (${FIXED_STREAMS.join(", ")})?`,
      decompositionHint: looksMultipart(requestText) ? "request also appears multipart — consider splitting into separate packages before mounting" : null,
    };
  }

  if (streamInference.stream && streamInference.stream !== activeStreamName) {
    return {
      decision: "NEEDS_CLARIFICATION",
      reason: `request signals stream "${streamInference.stream}" but active stream is "${activeStreamName}"`,
      question: `Should this be mounted on "${streamInference.stream}" instead? If so, a stream switch is required first.`,
      decompositionHint: looksMultipart(requestText) ? "request also appears multipart — consider splitting into separate packages before mounting" : null,
    };
  }

  if (looksMultipart(requestText)) {
    return {
      decision: "NEEDS_DECOMPOSITION",
      reason: "request appears to contain multiple distinct deliverables",
    };
  }

  if (!looksBounded(requestText)) {
    return {
      decision: "NEEDS_CLARIFICATION",
      reason: "request scope is unclear",
      question: "What does done look like for this work?",
    };
  }

  if (!hasMinimalWorkInstructions(requestText)) {
    return {
      decision: "NEEDS_CLARIFICATION",
      reason: "request does not contain enough detail to form work instructions",
      question: "What concrete action should be taken to complete this work?",
    };
  }

  const proposedPackage = toPackageName(requestText);
  const integrityLevel = deriveIntegrityLevel(activeStreamName, requestText);
  const blocker = hasNamedBlocker(snapshotText);

  return {
    decision: "READY_TO_MOUNT",
    proposedPackage,
    activeStreamName,
    integrityLevel,
    blockerWarning: blocker ? "snapshot.md names a blocker — review before confirming" : null,
  };
}

// ---------------------------------------------------------------------------
// Content builders
// ---------------------------------------------------------------------------

function buildNextActionContent(packageName, type, integrityLevel, requestText) {
  const preflightLine = "   - `npm run check:state-preflight`";
  const postflightLine = "   - `npm run check:state-postflight`";

  let extraReview = "   - none unless the package crosses into `state`, `control`, or `governance` changes beyond the stated scope";

  if (integrityLevel === "elevated") {
    extraReview = "   - confirm changed artifacts stayed inside expected zones of influence";
  } else if (integrityLevel === "heavy") {
    extraReview = "   - require focused human review of governance, contract, and live-loop implications before accepting the handoff";
  }

  const goal = requestText.trim();

  // Derive minimal work instructions from the request
  const workInstruction = `1. ${goal.charAt(0).toUpperCase() + goal.slice(1)}`;

  return [
    `TYPE: ${type}`,
    `PACKAGE: ${packageName}`,
    "",
    "INTEGRITY TRIGGER",
    "",
    `- level: \`${integrityLevel}\``,
    `- why: determined from stream "${type === "PROCESS" ? "process" : "electron_ui"}" and request content`,
    "- preflight checks:",
    preflightLine,
    "- postflight checks:",
    postflightLine,
    "- extra review required:",
    extraReview,
    "",
    "GOAL",
    "",
    goal,
    "",
    "SCOPE",
    "",
    "- defined by the goal above",
    "- do not expand beyond what is stated",
    "",
    "WORK INSTRUCTIONS",
    "",
    workInstruction,
    "",
    "VERIFICATION",
    "",
    "- run `npm run check:state-preflight` before starting",
    "- run `npm run check:state-postflight` after completing",
    "- confirm goal is met before closing",
    "",
  ].join("\n");
}

function updateSnapshotCurrentPackage(snapshotText, packageName, type) {
  if (!snapshotText) {
    return null;
  }

  const lines = snapshotText.split("\n");
  const sectionIndex = lines.findIndex(line => line.trim() === "## Current Package");

  if (sectionIndex === -1) {
    return null;
  }

  // Find where this section ends (next ## heading or end of file)
  let endIndex = lines.length;

  for (let i = sectionIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      endIndex = i;
      break;
    }
  }

  const before = lines.slice(0, sectionIndex + 1);
  const after = lines.slice(endIndex);
  const newSection = [
    "",
    `- type: \`${type}\``,
    `- package: \`${packageName}\``,
    "",
  ];

  return [...before, ...newSection, ...after].join("\n");
}

function updateStreamSummary(streamDocText, newSummary) {
  return streamDocText.replace(/^- summary:.*$/m, `- summary: ${newSummary}`);
}

// ---------------------------------------------------------------------------
// Interactive confirmation
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

// ---------------------------------------------------------------------------
// Mount execution
// ---------------------------------------------------------------------------

function executeMountWrites(rootPath, packageName, type, integrityLevel, requestText, activeStreamName) {
  const nextActionContent = buildNextActionContent(packageName, type, integrityLevel, requestText);

  const snapshotPath = path.join(STATE_ROOT, "snapshot.md");
  const snapshotText = readFile(rootPath, snapshotPath);
  const updatedSnapshot = snapshotText
    ? updateSnapshotCurrentPackage(snapshotText, packageName, type)
    : null;

  const streamDocPath = path.join(STREAMS_ROOT, activeStreamName, "stream.md");
  const streamDocText = readFile(rootPath, streamDocPath);
  const updatedStreamDoc = streamDocText
    ? updateStreamSummary(streamDocText, `active — mounted package: ${packageName}`)
    : null;

  // Write next-action.md first — most critical
  writeFile(rootPath, path.join(STATE_ROOT, "next-action.md"), nextActionContent);

  if (updatedSnapshot) {
    writeFile(rootPath, snapshotPath, updatedSnapshot);
  } else {
    console.warn("warning: could not update snapshot.md Current Package section — update manually");
  }

  if (updatedStreamDoc) {
    writeFile(rootPath, streamDocPath, updatedStreamDoc);
  } else {
    console.warn("warning: could not update stream.md summary — update manually");
  }
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

async function runGatekeeperMount(rootPath, requestText) {
  if (!requestText || !requestText.trim()) {
    console.log("DECISION: NEEDS_CLARIFICATION");
    console.log("CLARIFICATION NEEDED:");
    console.log("- What should this package deliver, and what does done look like?");
    process.exitCode = 1;
    return;
  }

  const state = readGatekeeperState(rootPath);
  const evaluation = evaluateReadiness(state, requestText);

  // Always print current state summary
  console.log(`CURRENT STATE:`);
  console.log(`- active stream: ${state.activeStreamName || "unknown"}`);
  console.log(`- open package: ${state.nextAction && state.nextAction.packageName ? state.nextAction.packageName : "none"}`);
  console.log(
    `- last handoff: ${state.handoff && state.handoff.packageName ? `${state.handoff.packageName} (${state.handoff.status})` : "none"}`
  );
  console.log("");

  if (evaluation.decision === "REFUSE") {
    console.log(`DECISION: REFUSE`);
    console.log(`REASON: ${evaluation.reason}`);
    process.exitCode = 1;
    return;
  }

  if (evaluation.decision === "NEEDS_CLARIFICATION") {
    console.log(`DECISION: NEEDS_CLARIFICATION`);
    console.log(`REASON: ${evaluation.reason}`);
    console.log(`CLARIFICATION NEEDED:`);
    console.log(`- ${evaluation.question}`);
    if (evaluation.decompositionHint) {
      console.log(``);
      console.log(`ADVISORY: ${evaluation.decompositionHint}`);
    }
    process.exitCode = 1;
    return;
  }

  if (evaluation.decision === "NEEDS_DECOMPOSITION") {
    console.log(`DECISION: NEEDS_DECOMPOSITION`);
    console.log(`REASON: ${evaluation.reason}`);
    console.log(`ACTION: Break this request into separate packages and mount the first one.`);
    process.exitCode = 1;
    return;
  }

  // READY_TO_MOUNT
  const { proposedPackage, activeStreamName, integrityLevel, blockerWarning } = evaluation;
  const type = STREAM_TYPE_MAP[activeStreamName] || "PROCESS";

  console.log(`DECISION: READY_TO_MOUNT`);
  console.log(``);

  if (blockerWarning) {
    console.log(`WARNING: ${blockerWarning}`);
    console.log(``);
  }

  console.log(`PROPOSED ACTION:`);
  console.log(`- operation: mount`);
  console.log(`- stream: ${activeStreamName}`);
  console.log(`- package name: ${proposedPackage}`);
  console.log(`- integrity level: ${integrityLevel}`);
  console.log(`- files to be written:`);
  console.log(`    .consync/state/next-action.md`);
  console.log(`    .consync/state/snapshot.md (Current Package section only)`);
  console.log(`    .consync/streams/${activeStreamName}/stream.md (summary line only)`);
  console.log(``);

  const answer = await promptConfirmation("CONFIRM? (yes / no / edit): ");

  if (answer === "no") {
    console.log("Aborted. No files written.");
    return;
  }

  if (answer === "edit") {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const newRequest = await new Promise(resolve => {
      rl.question("Enter revised request: ", input => {
        rl.close();
        resolve(input.trim());
      });
    });
    // Re-run with the edited request
    await runGatekeeperMount(rootPath, newRequest);
    return;
  }

  if (answer !== "yes") {
    console.log("Unrecognised input. Aborted. No files written.");
    process.exitCode = 1;
    return;
  }

  executeMountWrites(rootPath, proposedPackage, type, integrityLevel, requestText, activeStreamName);

  console.log("");
  console.log(`mounted: ${proposedPackage}`);
  console.log(`stream: ${activeStreamName}`);
  console.log(`files written: next-action.md, snapshot.md, streams/${activeStreamName}/stream.md`);
  console.log(`run: npm run check:state-preflight`);
}

module.exports = {
  runGatekeeperMount,
  readGatekeeperState,
  evaluateReadiness,
};
