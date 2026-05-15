"use strict";

const fs = require("fs");
const path = require("path");

const { gatherStatus } = require("../lib/scaffoldaiStatus.query.scaffoldai");
const { gatherPacketVisibility } = require("../lib/scaffoldaiPacketVisibility.query.scaffoldai");
const { gatherCompletionStatus } = require("../lib/scaffoldaiCompletionStatus.query.scaffoldai");

const TEST_NAME = "unit-scaffoldai-mcp-readonly";

console.log(`[${TEST_NAME}] Running`);

function pass(msg) {
  console.log(`  PASS: ${msg}`);
}

function fail(msg) {
  console.error(`  FAIL: ${msg}`);
  process.exitCode = 1;
}

function check(condition, msg) {
  if (condition) pass(msg);
  else fail(msg);
}

// -----------------------------------------------------------------------
// Test 1: tools.js loads without error
// -----------------------------------------------------------------------

let tools;
try {
  tools = require("../scaffoldai/mcp/tools");
  pass("tools.js loads without error");
} catch (err) {
  fail(`tools.js threw on require: ${err.message}`);
  process.exit(1);
}

let signal;
try {
  signal = require("../scaffoldai/mcp/signal");
  pass("signal.js loads without error");
} catch (err) {
  fail(`signal.js threw on require: ${err.message}`);
  process.exit(1);
}

// -----------------------------------------------------------------------
// Test 2: All tool functions are exported
// -----------------------------------------------------------------------

const EXPECTED_TOOL_FNS = [
  "runStatusTool",
  "runPreflightTool",
  "runQuestionTool",
  "runVerifyRecommendTool",
  "runCloseoutReadinessTool",
  "runCompletionStatusTool",
];

for (const name of EXPECTED_TOOL_FNS) {
  check(typeof tools[name] === "function", `${name} is exported as a function`);
}

// -----------------------------------------------------------------------
// Tests 3–7: Each tool returns execution_class: "READ_ONLY"
// -----------------------------------------------------------------------

const toolFns = [
  ["runStatusTool", tools.runStatusTool],
  ["runPreflightTool", tools.runPreflightTool],
  ["runQuestionTool", tools.runQuestionTool],
  ["runVerifyRecommendTool", tools.runVerifyRecommendTool],
  ["runCloseoutReadinessTool", tools.runCloseoutReadinessTool],
  ["runCompletionStatusTool", tools.runCompletionStatusTool],
];

for (const [name, fn] of toolFns) {
  try {
    const result = fn();
    check(
      result.execution_class === "READ_ONLY",
      `${name} returns execution_class "READ_ONLY"`
    );
  } catch (err) {
    fail(`${name} threw during execution: ${err.message}`);
  }
}

// -----------------------------------------------------------------------
// Test 8: runStatusTool returns active_stream when state is readable
// -----------------------------------------------------------------------

{
  const result = tools.runStatusTool();
  check(
    result.data &&
      (typeof result.data.active_stream === "string" || result.data.active_stream === null),
    "runStatusTool returns active_stream as string or null"
  );
}

// -----------------------------------------------------------------------
// Test 8b: readonly status helpers expose claim/busy visibility
// -----------------------------------------------------------------------

{
  const fixtureRoot = path.join(__dirname, "..", "..", ".scaffoldai", "tmp", "unit-scaffoldai-mcp-readonly-claim-fixture");
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
  fs.mkdirSync(path.join(fixtureRoot, ".scaffoldai", "state"), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, ".scaffoldai", "contracts"), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, ".scaffoldai", "packets"), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, ".scaffoldai", "runtime", "mcp"), { recursive: true });

  fs.writeFileSync(
    path.join(fixtureRoot, ".scaffoldai", "state", "next-action.md"),
    "TYPE: REFACTOR\nPACKET_ID: sample-packet.sdc\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(fixtureRoot, ".scaffoldai", "state", "active-runtime.json"),
    JSON.stringify(
      {
        in_flight_packet: "sample-packet.sdc",
        claimed_by: "copilot",
        claim_status: "in_progress",
        claimed_at: "2026-05-15T00:00:00.000Z",
        claim_message: "working packet",
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(fixtureRoot, ".scaffoldai", "contracts", "active-policy.json"),
    JSON.stringify({
      mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
      allowed_packet_types: ["process"],
      blocked_packet_types: ["product"],
      require_clean_git: false,
      require_dry_run: false,
    }, null, 2) + "\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(fixtureRoot, ".scaffoldai", "packets", "sample-packet.sdc.md"),
    "# Sample Packet\n\nGOAL: fixture\n",
    "utf8"
  );

  const status = gatherStatus(fixtureRoot, { includeGit: false });
  check(status.data.claim_owner === "copilot", "gatherStatus exposes claim_owner");
  check(status.data.claim_busy === true, "gatherStatus exposes claim_busy");
  check(typeof status.data.claim_next_safe_action === "string", "gatherStatus exposes claim_next_safe_action");

  const packetVisibility = gatherPacketVisibility(fixtureRoot, { scope: "in_flight" });
  check(packetVisibility.data.claim_owner === "copilot", "gatherPacketVisibility exposes claim_owner");
  check(packetVisibility.data.claim_busy === true, "gatherPacketVisibility exposes claim_busy");
  check(typeof packetVisibility.data.claim_next_safe_action === "string", "gatherPacketVisibility exposes claim_next_safe_action");

  const completionStatus = gatherCompletionStatus(fixtureRoot, { activePacketOnly: true, latestOnly: true });
  check(completionStatus.data.claim_owner === "copilot", "gatherCompletionStatus exposes claim_owner");
  check(completionStatus.data.claim_busy === true, "gatherCompletionStatus exposes claim_busy");
  check(typeof completionStatus.data.claim_next_safe_action === "string", "gatherCompletionStatus exposes claim_next_safe_action");

  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

// -----------------------------------------------------------------------
// Test 9: runQuestionTool returns 0 questions in healthy repo
// -----------------------------------------------------------------------

{
  const result = tools.runQuestionTool();
  check(
    result.data.question_count === 0,
    "runQuestionTool returns 0 questions in healthy repo"
  );
}

// -----------------------------------------------------------------------
// Test 10: runVerifyRecommendTool returns a non-empty verify_command string
// -----------------------------------------------------------------------

{
  const result = tools.runVerifyRecommendTool();
  check(
    result.data &&
      typeof result.data.verify_command === "string" &&
      result.data.verify_command.length > 0,
    "runVerifyRecommendTool returns a non-empty verify_command string"
  );
}

// -----------------------------------------------------------------------
// Test 11: runVerifyRecommendTool does NOT return PASS or FAIL status
// -----------------------------------------------------------------------

{
  const result = tools.runVerifyRecommendTool();
  const s = result.status || "";
  check(s !== "PASS" && s !== "FAIL", "runVerifyRecommendTool does not return PASS or FAIL status");
}

// -----------------------------------------------------------------------
// Test 12: runCloseoutReadinessTool status is not READY_FOR_REVIEW
// -----------------------------------------------------------------------

{
  const result = tools.runCloseoutReadinessTool();
  check(result.status !== "READY_FOR_REVIEW", "runCloseoutReadinessTool status is not READY_FOR_REVIEW");
}

// -----------------------------------------------------------------------
// Test 13: runCloseoutReadinessTool always returns verify_evidence: "not provided"
// -----------------------------------------------------------------------

{
  const result = tools.runCloseoutReadinessTool();
  check(
    result.data.verify_evidence === "not provided",
    'runCloseoutReadinessTool returns verify_evidence: "not provided"'
  );
}

// -----------------------------------------------------------------------
// Test 14: scaffoldai_signal is bounded append-only diagnostic signaling
// -----------------------------------------------------------------------

{
  function removeSignalFile(filePath) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  }

  removeSignalFile(signal.signalPath);
  removeSignalFile(signal.rotatedSignalPath);
  signal.resetSignalRateLimitsForTest();

  const accepted = signal.runSignalTool({
    client_id: "unit-signal-client",
    signal_type: "connected",
    message: "unit signal",
    capabilities: ["mcp_read_only", "signal_append_only"],
  });

  check(accepted.status === "accepted", "runSignalTool accepts a valid connected signal");
  check(
    accepted.execution_class === "LOCAL_SIGNAL_APPEND_ONLY",
    'runSignalTool returns execution_class "LOCAL_SIGNAL_APPEND_ONLY"'
  );
  check(accepted.path === ".scaffoldai/runtime/mcp/signals.jsonl", "runSignalTool reports the bounded signal path");
  check(accepted.non_authoritative === true, "runSignalTool marks accepted signals non_authoritative");
  check(fs.existsSync(signal.signalPath), "runSignalTool writes only the signal JSONL artifact");

  const line = fs.readFileSync(signal.signalPath, "utf8").trim();
  const record = JSON.parse(line);
  check(record.client_id === "unit-signal-client", "signal JSONL stores client_id");
  check(record.signal_type === "connected", "signal JSONL stores signal_type");
  check(typeof record.timestamp === "string" && record.timestamp.length > 0, "signal JSONL stores server timestamp");

  signal.resetSignalRateLimitsForTest();
  const questionSignal = signal.runSignalTool({
    client_id: "unit-question-client",
    signal_type: "question",
    packet: "packet-20260514T000000Z.sdc",
    severity: "needs_decision",
    message: "Pick metadata source",
    options: ["state-only", "runtime-signals"],
  }, { now: new Date("2026-05-07T03:00:00.000Z") });
  check(questionSignal.status === "accepted", "runSignalTool accepts question signal fields");

  const normalizedSeverity = signal.runSignalTool({
    client_id: "unit-question-client",
    signal_type: "question",
    packet: "packet-20260514T000000Z.sdc",
    severity: "urgent",
    message: "Use fallback severity",
  }, { now: new Date("2026-05-07T03:00:11.000Z") });
  check(normalizedSeverity.status === "accepted", "runSignalTool accepts invalid severity by normalization");

  const resolvedSignal = signal.runSignalTool({
    client_id: "unit-question-client",
    signal_type: "question_resolved",
    packet: "packet-20260514T000000Z.sdc",
    question_id: "q_abc123",
    question_hash: "abcdef1234567890",
    question_text: "Pick metadata source",
    resolved_by: "human.operator",
    resolution_note: "Decision captured in packet notes.",
  }, { now: new Date("2026-05-07T03:00:22.000Z") });
  check(resolvedSignal.status === "accepted", "runSignalTool accepts question resolution payload fields");

  const allRecords = fs.readFileSync(signal.signalPath, "utf8").trim().split("\n").map((lineValue) => JSON.parse(lineValue));
  const questionRecord = allRecords.find((entry) => entry.message === "Pick metadata source");
  const normalizedRecord = allRecords.find((entry) => entry.message === "Use fallback severity");
  const resolvedRecord = allRecords.find((entry) => entry.signal_type === "question_resolved");
  check(questionRecord.packet === "packet-20260514T000000Z.sdc", "signal JSONL stores packet for question signals");
  check(questionRecord.severity === "needs_decision", "signal JSONL stores valid severity");
  check(Array.isArray(questionRecord.options) && questionRecord.options.length === 2, "signal JSONL stores decision options");
  check(normalizedRecord.severity === "info", 'signal JSONL normalizes invalid severity to "info"');
  check(resolvedRecord.question_id === "q_abc123", "signal JSONL stores question_id for resolution signals");
  check(resolvedRecord.question_hash === "abcdef1234567890", "signal JSONL stores question_hash for resolution signals");
  check(resolvedRecord.resolved_by === "human.operator", "signal JSONL stores resolved_by for resolution signals");
  check(
    resolvedRecord.resolution_note === "Decision captured in packet notes.",
    "signal JSONL stores resolution_note for resolution signals"
  );

  signal.resetSignalRateLimitsForTest();
  const completedSignal = signal.runSignalTool({
    client_id: "unit-completion-client",
    signal_type: "packet_completed",
    packet: "packet-20260515T010203Z.sdc.md",
    message: "Completed packet implementation",
    verify_command: "npm run verify:scaffoldai",
    verify_status: "passed",
    changed_files: [
      "src/scaffoldai/mcp/signal.js",
      "../outside/path.js",
      "/abs/path.js",
      "src/scaffoldai/mcp/signal.js",
      "src/scaffoldai/mcp/tools.js",
    ],
    summary: "Added completion handshake signal and readonly completion visibility.",
    commit_suggestion: "scaffoldai: add packet completion handshake",
    needs_human_closeout: true,
  }, { now: new Date("2026-05-07T03:00:33.000Z") });
  check(completedSignal.status === "accepted", "runSignalTool accepts valid packet_completed payload");

  const normalizedVerifyStatus = signal.runSignalTool({
    client_id: "unit-completion-client",
    signal_type: "packet_completed",
    packet: "packet-20260515T010203Z.sdc.md",
    message: "Completed packet implementation with unknown verify status",
    verify_command: "npm run verify:scaffoldai",
    verify_status: "green",
  }, { now: new Date("2026-05-07T03:00:44.000Z") });
  check(
    normalizedVerifyStatus.status === "accepted",
    "runSignalTool accepts packet_completed with unknown verify_status by normalization"
  );

  const packetCompletedRecords = fs.readFileSync(signal.signalPath, "utf8").trim().split("\n")
    .map((lineValue) => JSON.parse(lineValue))
    .filter((entry) => entry.signal_type === "packet_completed");
  check(packetCompletedRecords.length >= 2, "signal JSONL stores packet_completed records");
  const completionRecord = packetCompletedRecords.find(
    (entry) => entry.message === "Completed packet implementation"
  );
  const normalizedCompletionRecord = packetCompletedRecords.find(
    (entry) => entry.message === "Completed packet implementation with unknown verify status"
  );
  check(completionRecord.verify_command === "npm run verify:scaffoldai", "packet_completed stores verify_command");
  check(completionRecord.verify_status === "passed", "packet_completed stores valid verify_status");
  check(
    Array.isArray(completionRecord.changed_files) &&
      completionRecord.changed_files.length === 2 &&
      completionRecord.changed_files.includes("src/scaffoldai/mcp/signal.js") &&
      completionRecord.changed_files.includes("src/scaffoldai/mcp/tools.js"),
    "packet_completed stores bounded/sanitized changed_files"
  );
  check(
    normalizedCompletionRecord.verify_status === "not_run",
    'packet_completed normalizes unknown verify_status to "not_run"'
  );

  const missingCompletionFields = signal.runSignalTool({
    client_id: "unit-completion-missing",
    signal_type: "packet_completed",
    packet: "packet-20260515T010203Z.sdc.md",
    message: "Missing verify fields",
  }, { now: new Date("2026-05-07T03:00:55.000Z") });
  check(
    missingCompletionFields.status === "rejected",
    "runSignalTool rejects packet_completed when required verify fields are missing"
  );

  const unknownField = signal.runSignalTool({
    client_id: "unit-unknown-field",
    signal_type: "note",
    extra: "nope",
  });
  check(unknownField.status === "rejected", "runSignalTool rejects unknown fields");

  const nestedObject = signal.runSignalTool({
    client_id: "unit-nested-object",
    signal_type: "note",
    message: { text: "nope" },
  });
  check(nestedObject.status === "rejected", "runSignalTool rejects nested objects");

  signal.resetSignalRateLimitsForTest();
  const heartbeatStart = new Date("2026-05-07T00:00:00.000Z");
  const heartbeatAfterWindow = new Date("2026-05-07T00:01:00.000Z");
  const firstHeartbeat = signal.runSignalTool(
    { client_id: "unit-heartbeat-client", signal_type: "heartbeat" },
    { now: heartbeatStart }
  );
  const immediateHeartbeat = signal.runSignalTool(
    { client_id: "unit-heartbeat-client", signal_type: "heartbeat" },
    { now: heartbeatStart }
  );
  const laterHeartbeat = signal.runSignalTool(
    { client_id: "unit-heartbeat-client", signal_type: "heartbeat" },
    { now: heartbeatAfterWindow }
  );
  check(firstHeartbeat.status === "accepted", "runSignalTool accepts first heartbeat with injected time");
  check(immediateHeartbeat.status === "rejected", "runSignalTool rejects immediate second heartbeat with injected time");
  check(laterHeartbeat.status === "accepted", "runSignalTool accepts heartbeat after simulated 60s window");

  signal.resetSignalRateLimitsForTest();
  const noteStart = new Date("2026-05-07T01:00:00.000Z");
  const noteAfterWindow = new Date("2026-05-07T01:00:10.000Z");
  const firstNote = signal.runSignalTool(
    { client_id: "unit-note-client", signal_type: "note" },
    { now: noteStart }
  );
  const immediateNote = signal.runSignalTool(
    { client_id: "unit-note-client", signal_type: "capability_check" },
    { now: noteStart }
  );
  const laterNote = signal.runSignalTool(
    { client_id: "unit-note-client", signal_type: "capability_check" },
    { now: noteAfterWindow }
  );
  check(firstNote.status === "accepted", "runSignalTool accepts first non-heartbeat with injected time");
  check(immediateNote.status === "rejected", "runSignalTool rejects immediate second non-heartbeat with injected time");
  check(laterNote.status === "accepted", "runSignalTool accepts non-heartbeat after simulated 10s window");

  removeSignalFile(signal.signalPath);
  removeSignalFile(signal.rotatedSignalPath);
  signal.resetSignalRateLimitsForTest();
}

// -----------------------------------------------------------------------
// Test 15: No MCP server/tool source file contains write operations
// -----------------------------------------------------------------------

{
  const mcpDir = path.join(__dirname, "..", "scaffoldai", "mcp");
  const forbidden = ["writeFile", "appendFile", "mkdirSync", "writeFileSync"];
  const readOnlyFiles = ["server.js", "tools.js"].map((f) => path.join(mcpDir, f));

  for (const filePath of readOnlyFiles) {
    try {
      const source = fs.readFileSync(filePath, "utf8");
      for (const pattern of forbidden) {
        check(!source.includes(pattern), `${path.basename(filePath)} does not contain "${pattern}"`);
      }
    } catch {
      fail(`Could not read ${path.basename(filePath)} for write operation check`);
    }
  }
}

// -----------------------------------------------------------------------
// Test 16: Signal source has exactly the planned local write boundary
// -----------------------------------------------------------------------

{
  const signalSourcePath = path.join(__dirname, "..", "scaffoldai", "mcp", "signal.js");

  try {
    const source = fs.readFileSync(signalSourcePath, "utf8");

    check(source.includes('".scaffoldai/runtime/mcp/signals.jsonl"'), "signal.js writes the planned signal path");
    check(source.includes("fs.appendFileSync(signalPath"), "signal.js appends only to the signal output variable");
    check(source.includes("fs.mkdirSync(signalDir"), "signal.js creates only the signal tmp directory variable");
    check(!source.includes("child_process"), "signal.js does not import child_process");
    check(!source.includes(".scaffoldai/state"), "signal.js does not reference .scaffoldai/state");
    check(!source.includes(".scaffoldai/streams"), "signal.js does not reference .scaffoldai/streams");
    check(!source.includes("http://"), "signal.js does not include an HTTP URL");
    check(!source.includes("https://"), "signal.js does not include a remote URL");
    check(!source.includes("ngrok.com"), "signal.js does not include ngrok usage");
  } catch {
    fail("Could not read signal.js for signal boundary check");
  }
}

// -----------------------------------------------------------------------
// Test 17: Snapshot runtime has exactly the planned local write boundary
// -----------------------------------------------------------------------

{
  const snapshotPath = path.join(__dirname, "..", "scaffoldai", "mcp", "snapshot.js");

  try {
    const source = fs.readFileSync(snapshotPath, "utf8");

    check(source.includes("StdioClientTransport"), "snapshot.js uses local stdio MCP transport");
    check(source.includes("client.callTool"), "snapshot.js calls MCP tools through the client");
    check(!source.includes('require("./tools")'), "snapshot.js does not import MCP tool functions directly");
    check(!source.includes("require(\"./tools\")"), "snapshot.js does not import MCP tool functions directly");
    check(source.includes('".scaffoldai/tmp/mcp-runtime-snapshot.json"'), "snapshot.js writes the planned snapshot path");
    check(source.includes("fs.writeFileSync(outputPath, json)"), "snapshot.js write is limited to the snapshot output variable");
    check(!source.includes("appendFile"), "snapshot.js does not append files");
    check(!source.includes("mkdirSync"), "snapshot.js does not create directories");
    check(!source.includes("http://"), "snapshot.js does not include an HTTP URL");
    check(!source.includes("https://"), "snapshot.js does not include a remote URL");
    check(!source.includes("ngrok.com"), "snapshot.js does not include ngrok usage");
  } catch {
    fail("Could not read snapshot.js for snapshot boundary check");
  }
}

// -----------------------------------------------------------------------
// Test 18: server.js is not imported by src/cli/index.js or src/index.js
// -----------------------------------------------------------------------

{
  const filesToCheck = [
    path.join(__dirname, "..", "cli", "index.js"),
    path.join(__dirname, "..", "index.js"),
  ];

  for (const filePath of filesToCheck) {
    try {
      const source = fs.readFileSync(filePath, "utf8");
      check(
        !source.includes("mcp/server") && !source.includes("mcp\\server"),
        `${path.basename(filePath)} does not import src/scaffoldai/mcp/server.js`
      );
    } catch {
      fail(`Could not read ${path.basename(filePath)}`);
    }
  }
}

// -----------------------------------------------------------------------
// Test 19: No MCP source file contains /tmp path usage
// -----------------------------------------------------------------------

{
  const mcpDir = path.join(__dirname, "..", "scaffoldai", "mcp");

  try {
    const mcpFiles = fs
      .readdirSync(mcpDir)
      .filter((f) => f.endsWith(".js"))
      .map((f) => path.join(mcpDir, f));

    if (mcpFiles.length === 0) {
      fail("No .js files found in src/scaffoldai/mcp/ — cannot check for /tmp usage");
    } else {
      for (const filePath of mcpFiles) {
        const source = fs.readFileSync(filePath, "utf8");
        check(!source.includes('"/tmp'), `${path.basename(filePath)} does not use /tmp path`);
      }
    }
  } catch {
    fail("Could not read src/scaffoldai/mcp/ for /tmp check");
  }
}

if (process.exitCode !== 1) {
  console.log(`[${TEST_NAME}] PASS`);
}
