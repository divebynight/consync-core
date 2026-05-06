const fs = require("fs");
const path = require("path");
const { resolveVerifyCommand, readActiveContract } = require("../lib/resolveVerifyCommand");
const { getInFlightPacket } = require("../lib/getInFlightPacket");

const repoRoot = path.resolve(__dirname, "..", "..");
const STATE_DIR = path.join(repoRoot, ".scaffoldai", "state");
const STREAMS_DIR = path.join(repoRoot, ".scaffoldai", "streams");
const PKG_PATH = path.join(repoRoot, "package.json");

// Maximum questions before we flag structural noise
const NOISE_THRESHOLD = 3;

// v1 category constants
const CATEGORIES = {
  UNKNOWN_CONDITION: "UNKNOWN_CONDITION",
  POLICY_GAP: "POLICY_GAP",
  VERIFY_GAP: "VERIFY_GAP",
  AMBIGUOUS_PACKET: "AMBIGUOUS_PACKET",
  HUMAN_DECISION_REQUIRED: "HUMAN_DECISION_REQUIRED",
  TOOL_BOUNDARY_CONCERN: "TOOL_BOUNDARY_CONCERN",
  TEMP_ARTIFACT_BOUNDARY: "TEMP_ARTIFACT_BOUNDARY",
  RUNTIME_TERMINOLOGY_DRIFT: "RUNTIME_TERMINOLOGY_DRIFT",
  EXECUTION_CLASS_BOUNDARY: "EXECUTION_CLASS_BOUNDARY",
};

// Severity levels within a question
const SEVERITY = {
  BLOCKED: "BLOCKED",
  QUESTION: "QUESTION",
  WARNING: "WARNING",
};

// -----------------------------------------------------------------------
// Check helpers — each returns null (nothing found) or a question object
// -----------------------------------------------------------------------

/**
 * @typedef {{ category: string, severity: string, condition: string, why: string, action: string }} Question
 */

function checkStateFilesPresent() {
  const required = ["active-stream.md", "active-contract.json", "next-action.md"];
  const missing = required.filter((f) => !fs.existsSync(path.join(STATE_DIR, f)));

  if (missing.length === 0) return null;

  return {
    category: CATEGORIES.TOOL_BOUNDARY_CONCERN,
    severity: SEVERITY.BLOCKED,
    condition: `Required state file(s) missing: ${missing.join(", ")}`,
    why: "ScaffoldAI runtime commands cannot operate without these files.",
    action: "Restore the missing state files before running any runtime command.",
  };
}

function checkContractCoherence(contract) {
  if (!contract) {
    return {
      category: CATEGORIES.TOOL_BOUNDARY_CONCERN,
      severity: SEVERITY.BLOCKED,
      condition: "active-contract.json is missing or malformed.",
      why: "The contract is the authority for allowed packet types and mode enforcement.",
      action: "Restore or correct active-contract.json.",
    };
  }

  const inFlight = contract.in_flight_packet;
  const blocked = contract.blocked_packet_types || [];

  if (inFlight && blocked.includes(inFlight)) {
    return {
      category: CATEGORIES.HUMAN_DECISION_REQUIRED,
      severity: SEVERITY.BLOCKED,
      condition: `in_flight_packet "${inFlight}" is listed in blocked_packet_types.`,
      why: "The active packet type is explicitly blocked by the contract. No safe next action exists.",
      action: "Update the contract or the in-flight packet to resolve the conflict.",
    };
  }

  return null;
}

function checkAllowedPacketTypes(contract) {
  if (!contract) return null;

  const allowed = contract.allowed_packet_types || [];

  if (allowed.length === 0) {
    return {
      category: CATEGORIES.POLICY_GAP,
      severity: SEVERITY.QUESTION,
      condition: "allowed_packet_types is empty in active-contract.json.",
      why: "No packet type can be safely started. The next work type is undefined.",
      action: "Add at least one allowed packet type to active-contract.json.",
    };
  }

  return null;
}

function checkVerifyCommandResolvable(contract) {
  const resolved = resolveVerifyCommand(contract, {});

  if (resolved.error) {
    return {
      category: CATEGORIES.VERIFY_GAP,
      severity: SEVERITY.QUESTION,
      condition: `VERIFY COMMAND cannot be resolved: ${resolved.reason}`,
      why: "Without a resolvable verify command, there is no clear path to verification evidence.",
      action: `Run: node src/index.js scaffoldai verify to see the recommended VERIFY COMMAND.`,
    };
  }

  return null;
}

function checkActiveStreamExists() {
  const streamFilePath = path.join(STATE_DIR, "active-stream.md");

  let content;
  try {
    content = fs.readFileSync(streamFilePath, "utf8");
  } catch {
    return null; // already caught by checkStateFilesPresent
  }

  // Extract the stream name from the first non-blank line after "ACTIVE STREAM"
  const lines = content.split("\n").map((l) => l.trim());
  const headerIdx = lines.findIndex((l) => l === "ACTIVE STREAM");

  if (headerIdx === -1) {
    return {
      category: CATEGORIES.UNKNOWN_CONDITION,
      severity: SEVERITY.QUESTION,
      condition: "active-stream.md does not contain an ACTIVE STREAM header.",
      why: "The active stream cannot be determined from the file.",
      action: "Restore or correct active-stream.md.",
    };
  }

  // Find the first non-empty line after the header
  let streamName = null;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (lines[i].length > 0) {
      streamName = lines[i];
      break;
    }
  }

  if (!streamName) {
    return {
      category: CATEGORIES.UNKNOWN_CONDITION,
      severity: SEVERITY.QUESTION,
      condition: "ACTIVE STREAM in active-stream.md is blank.",
      why: "No active stream is set. The work context is undefined.",
      action: "Set an active stream in active-stream.md.",
    };
  }

  const streamDir = path.join(STREAMS_DIR, streamName);
  if (!fs.existsSync(streamDir)) {
    return {
      category: CATEGORIES.UNKNOWN_CONDITION,
      severity: SEVERITY.QUESTION,
      condition: `Active stream "${streamName}" does not have a corresponding directory under .scaffoldai/streams/.`,
      why: "The stream directory is the source of truth for stream state.",
      action: `Create .scaffoldai/streams/${streamName}/ or correct the stream name in active-stream.md.`,
    };
  }

  return null;
}

function checkNextActionAmbiguity() {
  const nextActionPath = path.join(STATE_DIR, "next-action.md");

  let content;
  try {
    content = fs.readFileSync(nextActionPath, "utf8");
  } catch {
    return null; // already caught by checkStateFilesPresent
  }

  const lines = content.split("\n").map((l) => l.trim());
  const typeLine = lines.find((l) => l.startsWith("TYPE:"));

  if (!typeLine) {
    return {
      category: CATEGORIES.AMBIGUOUS_PACKET,
      severity: SEVERITY.QUESTION,
      condition: "next-action.md does not contain a TYPE: line.",
      why: "The packet type cannot be determined. Intake and preflight may produce unreliable results.",
      action: "Add a TYPE: line to next-action.md.",
    };
  }

  const typeValue = typeLine.replace(/^TYPE:\s*/, "").trim().toLowerCase();
  const KNOWN_TYPES = ["product", "process", "planning", "contract", "refactor", "docs", "agent", "mixed", "none"];

  if (!KNOWN_TYPES.includes(typeValue)) {
    return {
      category: CATEGORIES.AMBIGUOUS_PACKET,
      severity: SEVERITY.QUESTION,
      condition: `TYPE: "${typeValue}" in next-action.md is not a recognized packet type.`,
      why: "An unrecognized type cannot be validated against the contract's allowed_packet_types.",
      action: `Use one of: ${KNOWN_TYPES.join(", ")}.`,
    };
  }

  if (typeValue === "mixed") {
    return {
      category: CATEGORIES.AMBIGUOUS_PACKET,
      severity: SEVERITY.WARNING,
      condition: `TYPE: mixed in next-action.md — packet classification is ambiguous.`,
      why: "Mixed type packets are not cleanly gateable by the contract model.",
      action: "Clarify the packet type or split into separate work packets.",
    };
  }

  return null;
}

function checkRequiredScripts() {
  const required = [
    "verify",
    "verify:consync",
    "verify:scaffoldai",
    "scaffoldai:status",
    "scaffoldai:preflight",
    "scaffoldai:verify",
    "scaffoldai:closeout",
    "scaffoldai:question",
  ];

  let scripts = {};
  try {
    const raw = fs.readFileSync(PKG_PATH, "utf8");
    scripts = JSON.parse(raw).scripts || {};
  } catch {
    return {
      category: CATEGORIES.TOOL_BOUNDARY_CONCERN,
      severity: SEVERITY.BLOCKED,
      condition: "package.json is missing or malformed.",
      why: "Runtime commands and verify scripts cannot be confirmed.",
      action: "Restore or correct package.json.",
    };
  }

  const missing = required.filter((s) => !Object.prototype.hasOwnProperty.call(scripts, s));

  if (missing.length > 0) {
    return {
      category: CATEGORIES.TOOL_BOUNDARY_CONCERN,
      severity: SEVERITY.QUESTION,
      condition: `Runtime loop script(s) missing from package.json: ${missing.join(", ")}`,
      why: "The ScaffoldAI runtime loop depends on these scripts being present and runnable.",
      action: "Add the missing scripts to package.json.",
    };
  }

  return null;
}

function checkExecutionClassBoundary() {
  const planningDir = path.join(repoRoot, ".scaffoldai", "planning");
  const classificationDoc = path.join(planningDir, "scaffoldai-execution-classification-v1.md");

  if (!fs.existsSync(classificationDoc)) {
    return {
      category: CATEGORIES.EXECUTION_CLASS_BOUNDARY,
      severity: SEVERITY.QUESTION,
      condition: "Execution classification planning doc not found (.scaffoldai/planning/scaffoldai-execution-classification-v1.md).",
      why: "The execution classification model defines authority, verification requirements, and human approval tiers for all runtime actions. Without it, action boundaries are undefined.",
      action: "Create and complete scaffoldai-execution-classification-v1.md in .scaffoldai/planning/.",
    };
  }

  let content;
  try {
    content = fs.readFileSync(classificationDoc, "utf8");
  } catch {
    return {
      category: CATEGORIES.EXECUTION_CLASS_BOUNDARY,
      severity: SEVERITY.QUESTION,
      condition: "Execution classification planning doc exists but could not be read.",
      why: "The execution classification model cannot be verified without reading the planning doc.",
      action: "Check file permissions or content of .scaffoldai/planning/scaffoldai-execution-classification-v1.md.",
    };
  }

  // Check that status is DECIDED
  const isDecided = content.split("\n").some((line) => /^Status:\s*DECIDED/i.test(line.trim()));

  if (!isDecided) {
    return {
      category: CATEGORIES.EXECUTION_CLASS_BOUNDARY,
      severity: SEVERITY.QUESTION,
      condition: "Execution classification planning doc exists but has not reached DECIDED status.",
      why: "Without a decided execution classification model, action boundaries and authority tiers are not finalized.",
      action: "Complete the DECIDE phase for scaffoldai-execution-classification-v1.md.",
    };
  }

  return null;
}

function checkTmpBoundary() {
  // Check if .scaffoldai/tmp/ directory exists (it should, after tmp boundary SDC)
  const tmpDir = path.join(repoRoot, ".scaffoldai", "tmp");

  if (!fs.existsSync(tmpDir)) {
    return {
      category: CATEGORIES.TEMP_ARTIFACT_BOUNDARY,
      severity: SEVERITY.WARNING,
      condition: ".scaffoldai/tmp/ directory does not exist.",
      why: "Runtime temp/log output should be written to .scaffoldai/tmp/, not /tmp/ or ~/.",
      action: "Create .scaffoldai/tmp/.gitkeep and add .scaffoldai/tmp/* to .gitignore.",
    };
  }

  return null;
}

// -----------------------------------------------------------------------
// Main command
// -----------------------------------------------------------------------

function runScaffoldaiQuestionCommand(argv) {
  // No flags accepted in v1; reject unknown flags
  const args = argv || [];
  for (const arg of args) {
    if (arg.startsWith("-")) {
      console.error(`Unknown flag: ${arg}`);
      console.error("Usage: node src/index.js scaffoldai question");
      process.exitCode = 1;
      return;
    }
  }

  const questions = [];

  // Read state
  const contract = readActiveContract(repoRoot);
  const inFlightPacket = getInFlightPacket(repoRoot);

  // Read active stream name for display
  let streamName = "(unknown)";
  try {
    const content = fs.readFileSync(path.join(STATE_DIR, "active-stream.md"), "utf8");
    const lines = content.split("\n").map((l) => l.trim());
    const headerIdx = lines.findIndex((l) => l === "ACTIVE STREAM");
    if (headerIdx !== -1) {
      for (let i = headerIdx + 1; i < lines.length; i++) {
        if (lines[i].length > 0) { streamName = lines[i]; break; }
      }
    }
  } catch {
    // handled by check below
  }

  // Run all structural checks
  const checks = [
    checkStateFilesPresent(),
    checkContractCoherence(contract),
    checkAllowedPacketTypes(contract),
    checkVerifyCommandResolvable(contract),
    checkActiveStreamExists(),
    checkNextActionAmbiguity(),
    checkRequiredScripts(),
    checkTmpBoundary(),
    checkExecutionClassBoundary(),
  ];

  for (const finding of checks) {
    if (finding !== null) {
      questions.push(finding);
    }
  }

  // Structural noise check
  const noiseWarning = questions.length > NOISE_THRESHOLD
    ? `WARNING: ${questions.length} questions detected — exceeds expected threshold of ${NOISE_THRESHOLD}. Structural noise risk.`
    : null;

  // Determine STATUS
  const hasBlocked = questions.some((q) => q.severity === SEVERITY.BLOCKED);
  const hasQuestion = questions.some((q) => q.severity === SEVERITY.QUESTION);
  const hasWarning = questions.some((q) => q.severity === SEVERITY.WARNING);

  let status;
  if (hasBlocked) {
    status = "BLOCKED";
  } else if (hasQuestion) {
    status = "QUESTION";
  } else if (hasWarning) {
    status = "WARNING";
  } else {
    status = "CLEAR";
  }

  // Resolve verify command for output
  const resolved = resolveVerifyCommand(contract, {});
  const verifyCommand = resolved.error ? "(unavailable)" : resolved.command;

  // NEXT SAFE ACTION
  let nextSafeAction;
  if (status === "BLOCKED") {
    nextSafeAction = "Resolve the BLOCKED condition(s) above before continuing.";
  } else if (status === "QUESTION" || status === "WARNING") {
    nextSafeAction = "Review the question(s) above. No automatic action is taken.";
  } else {
    nextSafeAction = "No open structural questions. Proceed with scaffoldai closeout.";
  }

  // --- Print output ---
  console.log("[scaffoldai question]");
  console.log("");
  console.log(`ACTIVE PACKET:       ${inFlightPacket || "(none)"}`);
  console.log(`STREAM:              ${streamName}`);
  console.log(`VERIFY COMMAND:      ${verifyCommand}`);
  console.log("");
  console.log(`QUESTIONS DETECTED:  ${questions.length}`);

  if (questions.length > 0) {
    console.log("");
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      console.log(`  [${i + 1}] CATEGORY:  ${q.category}`);
      console.log(`      SEVERITY:  ${q.severity}`);
      console.log(`      CONDITION: ${q.condition}`);
      console.log(`      WHY:       ${q.why}`);
      console.log(`      ACTION:    ${q.action}`);
      if (i < questions.length - 1) console.log("");
    }
  }

  if (noiseWarning) {
    console.log("");
    console.log(`  ${noiseWarning}`);
  }

  console.log("");
  console.log(`NEXT SAFE ACTION:    ${nextSafeAction}`);
  console.log("");
  console.log(`STATUS: ${status}`);

  if (status === "BLOCKED") {
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------
// Exported data gatherer — reusable by MCP and other non-CLI surfaces
// -----------------------------------------------------------------------

/**
 * Run all structural checks and return the raw result object.
 * Does not print anything, does not set process.exitCode.
 *
 * @returns {{ questions: Question[], contract: object|null, inFlightPacket: string|null, streamName: string, status: string, resolvedVerify: object }}
 */
function gatherQuestions() {
  const contract = readActiveContract(repoRoot);
  const inFlightPacket = getInFlightPacket(repoRoot);

  let streamName = "(unknown)";
  try {
    const content = fs.readFileSync(path.join(STATE_DIR, "active-stream.md"), "utf8");
    const lines = content.split("\n").map((l) => l.trim());
    const headerIdx = lines.findIndex((l) => l === "ACTIVE STREAM");
    if (headerIdx !== -1) {
      for (let i = headerIdx + 1; i < lines.length; i++) {
        if (lines[i].length > 0) { streamName = lines[i]; break; }
      }
    }
  } catch {
    // handled by checkActiveStreamExists
  }

  const questions = [];
  const checks = [
    checkStateFilesPresent(),
    checkContractCoherence(contract),
    checkAllowedPacketTypes(contract),
    checkVerifyCommandResolvable(contract),
    checkActiveStreamExists(),
    checkNextActionAmbiguity(),
    checkRequiredScripts(),
    checkTmpBoundary(),
    checkExecutionClassBoundary(),
  ];

  for (const finding of checks) {
    if (finding !== null) questions.push(finding);
  }

  const hasBlocked = questions.some((q) => q.severity === SEVERITY.BLOCKED);
  const hasQuestion = questions.some((q) => q.severity === SEVERITY.QUESTION);
  const hasWarning = questions.some((q) => q.severity === SEVERITY.WARNING);

  let status;
  if (hasBlocked) status = "BLOCKED";
  else if (hasQuestion) status = "QUESTION";
  else if (hasWarning) status = "WARNING";
  else status = "CLEAR";

  const resolvedVerify = resolveVerifyCommand(contract, {});

  return { questions, contract, inFlightPacket, streamName, status, resolvedVerify };
}

module.exports = { runScaffoldaiQuestionCommand, gatherQuestions };
