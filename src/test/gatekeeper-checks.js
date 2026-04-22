const assert = require("node:assert");
const { evaluateReadiness } = require("../lib/gatekeeperMount");
const { detectCloseMode } = require("../lib/gatekeeperClose");

// ---------------------------------------------------------------------------
// State builder helpers
// ---------------------------------------------------------------------------

function makeState({ activeStreamName = "process", packageStatus = "closed", handoffStatus = "PASS", streamStatus = "active" } = {}) {
  const packageName = packageStatus === "open" ? "current_package" : "previous_package";
  const nextActionPackage = packageStatus === "absent" ? null : "current_package";

  const handoffPackage = packageStatus === "open" ? "previous_package" : "current_package";

  return {
    activeStreamText: `ACTIVE STREAM\n\n${activeStreamName}\n`,
    activeStreamName,
    nextActionText: nextActionPackage
      ? `TYPE: PROCESS\nPACKAGE: ${nextActionPackage}\n`
      : null,
    handoffText: `TYPE: PROCESS\nPACKAGE: ${handoffPackage}\n\nSTATUS\n\n${handoffStatus}\n`,
    snapshotText: [
      "# Consync Snapshot",
      "",
      "## Active Stream",
      "",
      `- recorded active stream: \`${activeStreamName}\``,
      "",
      "## Current Package",
      "",
      `- package: \`${nextActionPackage || "none"}\``,
      "",
      "## Next Likely Packages",
      "",
      "- another package",
      "",
    ].join("\n"),
    streamDocText: [
      "# Stream",
      "",
      `- id: ${activeStreamName}`,
      `- status: ${streamStatus}`,
      "- summary: active",
      "",
    ].join("\n"),
    nextAction: nextActionPackage
      ? { type: "PROCESS", packageName: nextActionPackage }
      : null,
    handoff: { type: "PROCESS", packageName: handoffPackage, status: handoffStatus },
  };
}

// ---------------------------------------------------------------------------
// evaluateReadiness — mount decision tests
// ---------------------------------------------------------------------------

function testMountReadyToMount() {
  const state = makeState({ packageStatus: "closed" });
  const result = evaluateReadiness(state, "implement the validation logic in the core library handler module");

  assert.strictEqual(result.decision, "READY_TO_MOUNT", `expected READY_TO_MOUNT, got ${result.decision}`);
  assert.ok(result.proposedPackage, "expected a proposedPackage");
  assert.strictEqual(result.activeStreamName, "process");

  console.log("  PASS testMountReadyToMount");
}

function testMountRefuseOpenPackage() {
  const state = makeState({ packageStatus: "open", handoffStatus: "PASS" });
  // handoff names a *different* package so this stays open
  const result = evaluateReadiness(state, "add a new feature to the renderer");

  assert.strictEqual(result.decision, "REFUSE", `expected REFUSE, got ${result.decision}`);
  assert.ok(result.reason.includes("still open"), `unexpected reason: ${result.reason}`);

  console.log("  PASS testMountRefuseOpenPackage");
}

function testMountRefuseStreamStatusNotActive() {
  const state = makeState({ packageStatus: "closed", streamStatus: "paused" });
  const result = evaluateReadiness(state, "implement the validation logic in the core library handler module");

  assert.strictEqual(result.decision, "REFUSE", `expected REFUSE, got ${result.decision}`);
  assert.ok(result.reason.includes("status"), `unexpected reason: ${result.reason}`);

  console.log("  PASS testMountRefuseStreamStatusNotActive");
}

function testMountRefuseMissingActiveStream() {
  const state = makeState({ packageStatus: "closed" });
  state.activeStreamText = null;
  state.activeStreamName = null;
  const result = evaluateReadiness(state, "implement the validation logic in the core library handler module");

  assert.strictEqual(result.decision, "REFUSE", `expected REFUSE, got ${result.decision}`);

  console.log("  PASS testMountRefuseMissingActiveStream");
}

function testMountNeedsClarificationShortRequest() {
  const state = makeState({ packageStatus: "closed" });
  const result = evaluateReadiness(state, "fix something");

  assert.strictEqual(result.decision, "NEEDS_CLARIFICATION", `expected NEEDS_CLARIFICATION, got ${result.decision}`);

  console.log("  PASS testMountNeedsClarificationShortRequest");
}

function testMountNeedsClarificationStreamMismatch() {
  const state = makeState({ packageStatus: "closed", activeStreamName: "process" });
  // Request clearly signals electron_ui stream
  const result = evaluateReadiness(state, "render the timeline panel in the electron ui desktop window");

  assert.strictEqual(result.decision, "NEEDS_CLARIFICATION", `expected NEEDS_CLARIFICATION, got ${result.decision}`);
  assert.ok(result.question, "expected a clarifying question");

  console.log("  PASS testMountNeedsClarificationStreamMismatch");
}

function testMountNeedsDecomposition() {
  const state = makeState({ packageStatus: "closed" });
  // Two clear action verbs connected by "and"
  const result = evaluateReadiness(state, "implement the validation handler and write the integration tests for the new format");

  assert.strictEqual(result.decision, "NEEDS_DECOMPOSITION", `expected NEEDS_DECOMPOSITION, got ${result.decision}: ${result.reason}`);

  console.log("  PASS testMountNeedsDecomposition");
}

// ---------------------------------------------------------------------------
// detectCloseMode — close decision tests
// ---------------------------------------------------------------------------

function testCloseModeAOpenPackage() {
  const state = makeState({ packageStatus: "open", handoffStatus: "PASS" });
  // handoff names a different package so this is a genuine open
  const result = detectCloseMode(state);

  assert.strictEqual(result.mode, "A", `expected Mode A, got ${result.mode}`);
  assert.strictEqual(result.packageName, "current_package");

  console.log("  PASS testCloseModeAOpenPackage");
}

function testCloseModeBHandoffPass() {
  // handoff already records the same package as PASS
  const state = makeState({ packageStatus: "closed", handoffStatus: "PASS" });
  // Force handoff package to match next-action package
  state.nextAction = { type: "PROCESS", packageName: "current_package" };
  state.handoff = { type: "PROCESS", packageName: "current_package", status: "PASS" };

  const result = detectCloseMode(state);

  assert.strictEqual(result.mode, "B", `expected Mode B, got ${result.mode}`);
  assert.strictEqual(result.handoffStatus, "PASS");
  assert.strictEqual(result.packageName, "current_package");

  console.log("  PASS testCloseModeBHandoffPass");
}

function testCloseModeBHandoffFail() {
  const state = makeState({ packageStatus: "closed", handoffStatus: "FAIL" });
  state.nextAction = { type: "PROCESS", packageName: "current_package" };
  state.handoff = { type: "PROCESS", packageName: "current_package", status: "FAIL" };

  const result = detectCloseMode(state);

  assert.strictEqual(result.mode, "B", `expected Mode B, got ${result.mode}`);
  assert.strictEqual(result.handoffStatus, "FAIL");

  console.log("  PASS testCloseModeBHandoffFail");
}

function testCloseModeRefuseNoActiveStream() {
  const state = makeState({ packageStatus: "open" });
  state.activeStreamText = null;
  state.activeStreamName = null;

  const result = detectCloseMode(state);

  assert.strictEqual(result.mode, "REFUSE", `expected REFUSE, got ${result.mode}`);

  console.log("  PASS testCloseModeRefuseNoActiveStream");
}

function testCloseModeRefuseNoMountedPackage() {
  const state = makeState({ packageStatus: "absent" });
  state.nextAction = null;

  const result = detectCloseMode(state);

  assert.strictEqual(result.mode, "REFUSE", `expected REFUSE, got ${result.mode}`);
  assert.ok(result.reason.includes("nothing to close"), `unexpected reason: ${result.reason}`);

  console.log("  PASS testCloseModeRefuseNoMountedPackage");
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function main() {
  console.log("evaluateReadiness (mount decisions):");
  testMountReadyToMount();
  testMountRefuseOpenPackage();
  testMountRefuseStreamStatusNotActive();
  testMountRefuseMissingActiveStream();
  testMountNeedsClarificationShortRequest();
  testMountNeedsClarificationStreamMismatch();
  testMountNeedsDecomposition();

  console.log("detectCloseMode (close decisions):");
  testCloseModeAOpenPackage();
  testCloseModeBHandoffPass();
  testCloseModeBHandoffFail();
  testCloseModeRefuseNoActiveStream();
  testCloseModeRefuseNoMountedPackage();

  console.log("PASS");
}

main();
