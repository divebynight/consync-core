const fs = require("fs");
const path = require("path");

// ScaffoldAI State Read/Write Authority
//
// This module is the SINGLE APPROVED READ/WRITE BOUNDARY for ScaffoldAI operational state.
//
// All reads from and writes to .scaffoldai/state/* and .scaffoldai/streams/*/stream.md
// must go through the functions in this module.
//
// Architecture:
//   CLI / MCP → ScaffoldAI authority functions → scaffoldaiState → .scaffoldai/state/*
//
// This module does NOT perform validation or business logic. It only provides the
// physical read/write operations with explicit path control.

const STATE_ROOT = path.join(".scaffoldai", "state");
const STREAMS_ROOT = path.join(".scaffoldai", "streams");
const CONTRACTS_ROOT = path.join(".scaffoldai", "contracts");

// ---------------------------------------------------------------------------
// Core file read primitive
// ---------------------------------------------------------------------------

/**
 * Read a file, returning null if it doesn't exist or can't be read.
 *
 * @param {string} rootPath - Repository root path
 * @param {string} relativePath - Path relative to rootPath
 * @returns {string|null} File content or null
 */
function readFile(rootPath, relativePath) {
  const absolutePath = path.join(rootPath, relativePath);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  try {
    return fs.readFileSync(absolutePath, "utf8");
  } catch (_err) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core file write primitive
// ---------------------------------------------------------------------------

/**
 * Write a file with explicit directory creation.
 * This is the single physical write operation used by all state write functions.
 *
 * @param {string} rootPath - Repository root path
 * @param {string} relativePath - Path relative to rootPath
 * @param {string} content - File content to write
 */
function writeFile(rootPath, relativePath, content) {
  const absolutePath = path.join(rootPath, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
}

// ---------------------------------------------------------------------------
// State file read operations
// ---------------------------------------------------------------------------

/**
 * Read .scaffoldai/state/next-action.md
 */
function readNextAction(rootPath) {
  return readFile(rootPath, path.join(STATE_ROOT, "next-action.md"));
}

/**
 * Read .scaffoldai/state/handoff.md
 */
function readHandoff(rootPath) {
  return readFile(rootPath, path.join(STATE_ROOT, "handoff.md"));
}

/**
 * Read .scaffoldai/state/snapshot.md
 */
function readSnapshot(rootPath) {
  return readFile(rootPath, path.join(STATE_ROOT, "snapshot.md"));
}

/**
 * Read .scaffoldai/state/active-stream.md
 */
function readActiveStream(rootPath) {
  return readFile(rootPath, path.join(STATE_ROOT, "active-stream.md"));
}

function parseJsonOrNull(content) {
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch (_err) {
    return null;
  }
}

/**
 * Read .scaffoldai/contracts/active-policy.json
 */
function readActivePolicy(rootPath) {
  const content = readFile(rootPath, path.join(CONTRACTS_ROOT, "active-policy.json"));
  return parseJsonOrNull(content);
}

/**
 * Read .scaffoldai/state/active-runtime.json
 */
function readActiveRuntime(rootPath) {
  const runtimeContent = readFile(rootPath, path.join(STATE_ROOT, "active-runtime.json"));
  const runtime = parseJsonOrNull(runtimeContent);

  if (runtime && typeof runtime === "object") {
    return {
      in_flight_packet: runtime.in_flight_packet || null,
      claimed_by: runtime.claimed_by || null,
      claim_status: runtime.claim_status || null,
      claimed_at: runtime.claimed_at || null,
      claim_message: runtime.claim_message || null,
      claim_expires_at: runtime.claim_expires_at || null,
    };
  }

  // Legacy fallback: derive runtime packet pointer from active-contract.json if present.
  const legacyContent = readFile(rootPath, path.join(STATE_ROOT, "active-contract.json"));
  const legacy = parseJsonOrNull(legacyContent);

  if (legacy && typeof legacy === "object") {
    return {
      in_flight_packet: legacy.in_flight_packet || null,
      claimed_by: null,
      claim_status: null,
      claimed_at: null,
      claim_message: null,
      claim_expires_at: null,
    };
  }

  return {
    in_flight_packet: null,
    claimed_by: null,
    claim_status: null,
    claimed_at: null,
    claim_message: null,
    claim_expires_at: null,
  };
}

/**
 * Read composed active contract from durable policy + runtime state.
 */
function readActiveContract(rootPath) {
  const policy = readActivePolicy(rootPath);
  const runtime = readActiveRuntime(rootPath);

  if (policy && typeof policy === "object") {
    return {
      ...policy,
      in_flight_packet: runtime ? runtime.in_flight_packet || null : null,
    };
  }

  // Legacy fallback while migrating older repositories.
  const legacyContent = readFile(rootPath, path.join(STATE_ROOT, "active-contract.json"));
  return parseJsonOrNull(legacyContent);
}

/**
 * Write .scaffoldai/contracts/active-policy.json
 */
function writeActivePolicy(rootPath, policy) {
  const content = typeof policy === "string"
    ? policy
    : JSON.stringify(policy, null, 2) + "\n";

  writeFile(rootPath, path.join(CONTRACTS_ROOT, "active-policy.json"), content);
}

/**
 * Write .scaffoldai/state/active-runtime.json
 *
 * Writes only the in_flight_packet field.
 * This intentionally clears any existing claim state because activating or
 * deactivating a packet invalidates any prior claim.
 */
function writeActiveRuntime(rootPath, runtime) {
  const normalized = runtime && typeof runtime === "object"
    ? { in_flight_packet: runtime.in_flight_packet || null }
    : { in_flight_packet: null };

  writeFile(rootPath, path.join(STATE_ROOT, "active-runtime.json"), JSON.stringify(normalized, null, 2) + "\n");
}

/**
 * Write claim fields to .scaffoldai/state/active-runtime.json.
 *
 * Reads the current runtime file, merges claim fields, and writes back.
 * Does NOT touch in_flight_packet.
 *
 * @param {string} rootPath - Repository root path
 * @param {object} claimFields - Claim fields to write
 */
function writeActiveRuntimeClaim(rootPath, claimFields) {
  const runtimeContent = readFile(rootPath, path.join(STATE_ROOT, "active-runtime.json"));
  const existing = parseJsonOrNull(runtimeContent) || {};

  const updated = {
    in_flight_packet: existing.in_flight_packet || null,
    claimed_by: claimFields.claimed_by || null,
    claim_status: claimFields.claim_status || null,
    claimed_at: claimFields.claimed_at || null,
    claim_message: claimFields.claim_message || null,
  };

  if (claimFields.claim_expires_at) {
    updated.claim_expires_at = claimFields.claim_expires_at;
  }

  writeFile(rootPath, path.join(STATE_ROOT, "active-runtime.json"), JSON.stringify(updated, null, 2) + "\n");
}

/**
 * Clear claim fields from .scaffoldai/state/active-runtime.json.
 *
 * Reads the current runtime file, removes all claim fields, and writes back.
 * Does NOT touch in_flight_packet.
 *
 * @param {string} rootPath - Repository root path
 */
function clearActiveRuntimeClaim(rootPath) {
  const runtimeContent = readFile(rootPath, path.join(STATE_ROOT, "active-runtime.json"));
  const existing = parseJsonOrNull(runtimeContent) || {};

  const updated = {
    in_flight_packet: existing.in_flight_packet || null,
  };

  writeFile(rootPath, path.join(STATE_ROOT, "active-runtime.json"), JSON.stringify(updated, null, 2) + "\n");
}

/**
 * Write composed active contract to policy + runtime files.
 * Keeps legacy active-contract.json in sync for compatibility during migration.
 */
function writeActiveContract(rootPath, contract) {
  const parsed = typeof contract === "string" ? parseJsonOrNull(contract) : contract;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("writeActiveContract requires a valid object or JSON string");
  }

  const policy = {
    mode: parsed.mode,
    allowed_packet_types: parsed.allowed_packet_types || [],
    blocked_packet_types: parsed.blocked_packet_types || [],
    require_clean_git: Boolean(parsed.require_clean_git),
    require_dry_run: Boolean(parsed.require_dry_run),
  };

  writeActivePolicy(rootPath, policy);
  writeActiveRuntime(rootPath, { in_flight_packet: parsed.in_flight_packet || null });

  const legacy = {
    ...policy,
    in_flight_packet: parsed.in_flight_packet || null,
  };
  writeFile(rootPath, path.join(STATE_ROOT, "active-contract.json"), JSON.stringify(legacy, null, 2) + "\n");
}

/**
 * Read .scaffoldai/streams/{streamName}/stream.md
 */
function readStreamDoc(rootPath, streamName) {
  return readFile(rootPath, path.join(STREAMS_ROOT, streamName, "stream.md"));
}

// ---------------------------------------------------------------------------
// State file write operations
// ---------------------------------------------------------------------------

/**
 * Write .scaffoldai/state/next-action.md
 */
function writeNextAction(rootPath, content) {
  writeFile(rootPath, path.join(STATE_ROOT, "next-action.md"), content);
}

/**
 * Write .scaffoldai/state/handoff.md
 */
function writeHandoff(rootPath, content) {
  writeFile(rootPath, path.join(STATE_ROOT, "handoff.md"), content);
}

/**
 * Write .scaffoldai/state/snapshot.md
 */
function writeSnapshot(rootPath, content) {
  writeFile(rootPath, path.join(STATE_ROOT, "snapshot.md"), content);
}

/**
 * Write .scaffoldai/state/active-stream.md
 */
function writeActiveStream(rootPath, content) {
  writeFile(rootPath, path.join(STATE_ROOT, "active-stream.md"), content);
}

/**
 * Write .scaffoldai/streams/{streamName}/stream.md
 */
function writeStreamDoc(rootPath, streamName, content) {
  writeFile(rootPath, path.join(STREAMS_ROOT, streamName, "stream.md"), content);
}

// ---------------------------------------------------------------------------
// History append operation
// ---------------------------------------------------------------------------

/**
 * Append a state transition record to .scaffoldai/state/history.jsonl
 *
 * This is append-only observational history. It does NOT become source of truth.
 * It does NOT validate transitions. It only records what happened.
 *
 * @param {string} rootPath - Repository root path
 * @param {object} record - History record with minimal required fields
 * @param {string} record.operation - "mount" | "close" | "switch"
 * @param {string} record.surface - "cli" | "mcp-local" | "mcp-https" | "unknown"
 * @param {string} record.summary - One-line human-readable summary
 * @param {string} [record.stream] - Stream name (optional but recommended)
 * @param {string} [record.package] - Package name (optional)
 * @param {string} [record.status] - "PASS" | "FAIL" | null (for close only)
 */
function appendHistory(rootPath, record) {
  const historyPath = path.join(rootPath, STATE_ROOT, "history.jsonl");

  const entry = {
    timestamp: new Date().toISOString(),
    operation: record.operation,
    surface: record.surface || "unknown",
    summary: record.summary,
  };

  // Add optional fields only if present
  if (record.stream) entry.stream = record.stream;
  if (record.package) entry.package = record.package;
  if (record.status !== undefined && record.status !== null) entry.status = record.status;

  try {
    // Create directory if needed, append record
    fs.mkdirSync(path.dirname(historyPath), { recursive: true });
    fs.appendFileSync(historyPath, JSON.stringify(entry) + "\n", "utf8");
  } catch (err) {
    // History append failure does not block the transition
    // Warn but continue
    console.warn(`warning: could not append to history.jsonl — ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Task acceptance record and activation rollback
// ---------------------------------------------------------------------------

const ACCEPTED_TASK_RELATIVE = path.join(STATE_ROOT, "accepted-task.json");

// State files packet activation may snapshot and restore on failure.
const RESTORABLE_STATE_FILES = new Set(["next-action.md", "active-runtime.json", "snapshot.md"]);

function restorableStatePath(fileName) {
  if (!RESTORABLE_STATE_FILES.has(fileName)) {
    throw new Error(`state file is not restorable: ${fileName}`);
  }
  return path.join(STATE_ROOT, fileName);
}

/**
 * Read .scaffoldai/state/accepted-task.json raw text, or null.
 */
function readAcceptedTaskRaw(rootPath) {
  return readFile(rootPath, ACCEPTED_TASK_RELATIVE);
}

/**
 * Atomically write .scaffoldai/state/accepted-task.json (temp file + rename),
 * so a torn write never leaves a parseable partial record.
 */
function writeAcceptedTaskRaw(rootPath, content) {
  writeRecordAtomic(rootPath, ACCEPTED_TASK_RELATIVE, content);
}

/**
 * Remove .scaffoldai/state/accepted-task.json. Returns true if it existed.
 */
function removeAcceptedTask(rootPath) {
  return removeRecord(rootPath, ACCEPTED_TASK_RELATIVE);
}

function writeRecordAtomic(rootPath, relativePath, content) {
  const absolutePath = path.join(rootPath, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  const tempPath = `${absolutePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, content, "utf8");
  fs.renameSync(tempPath, absolutePath);
}

function removeRecord(rootPath, relativePath) {
  const absolutePath = path.join(rootPath, relativePath);
  const existed = fs.existsSync(absolutePath);
  fs.rmSync(absolutePath, { force: true });
  return existed;
}

// ---------------------------------------------------------------------------
// Work authorization record (Proposal B)
// ---------------------------------------------------------------------------

const WORK_AUTHORIZATION_RELATIVE = path.join(STATE_ROOT, "work-authorization.json");

/**
 * Read .scaffoldai/state/work-authorization.json raw text, or null.
 */
function readWorkAuthorizationRaw(rootPath) {
  return readFile(rootPath, WORK_AUTHORIZATION_RELATIVE);
}

/**
 * Atomically write .scaffoldai/state/work-authorization.json (temp file + rename).
 */
function writeWorkAuthorizationRaw(rootPath, content) {
  writeRecordAtomic(rootPath, WORK_AUTHORIZATION_RELATIVE, content);
}

/**
 * Remove .scaffoldai/state/work-authorization.json. Returns true if it existed.
 */
function removeWorkAuthorization(rootPath) {
  return removeRecord(rootPath, WORK_AUTHORIZATION_RELATIVE);
}

/**
 * Read a restorable state file's raw text, or null when absent.
 */
function readStateFileRaw(rootPath, fileName) {
  return readFile(rootPath, restorableStatePath(fileName));
}

/**
 * Restore a restorable state file to saved content; null removes it.
 */
function restoreStateFileRaw(rootPath, fileName, content) {
  const relativePath = restorableStatePath(fileName);
  if (content === null) {
    fs.rmSync(path.join(rootPath, relativePath), { force: true });
    return;
  }
  writeFile(rootPath, relativePath, content);
}

// ---------------------------------------------------------------------------
// History log removal (housekeeping runtime-log reset)
// ---------------------------------------------------------------------------

/**
 * Remove .scaffoldai/state/history.jsonl.
 *
 * The state directory's real path must be exactly <real .scaffoldai>/state, so
 * a symlinked state root is refused even if it points inside .scaffoldai. A
 * symlinked history file is never followed or deleted. Returns "removed" |
 * "missing" | "refused_symlink" | "refused_not_file"; throws if the state
 * directory resolves anywhere else.
 */
function removeHistoryLog(rootPath) {
  let realScaffoldai;
  let realState;
  try {
    realScaffoldai = fs.realpathSync(path.resolve(rootPath, ".scaffoldai"));
    realState = fs.realpathSync(path.resolve(rootPath, STATE_ROOT));
  } catch (error) {
    if (error.code === "ENOENT") return "missing";
    throw error;
  }
  if (realState !== path.join(realScaffoldai, "state")) {
    throw new Error("state directory resolves outside .scaffoldai/state");
  }

  const historyPath = path.join(realState, "history.jsonl");
  let stat;
  try {
    stat = fs.lstatSync(historyPath);
  } catch (error) {
    if (error.code === "ENOENT") return "missing";
    throw error;
  }
  if (stat.isSymbolicLink()) return "refused_symlink";
  if (!stat.isFile()) return "refused_not_file";

  fs.unlinkSync(historyPath);
  return "removed";
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  // Read operations
  readNextAction,
  readHandoff,
  readSnapshot,
  readActiveStream,
  readActivePolicy,
  readActiveRuntime,
  readActiveContract,
  readStreamDoc,
  // Write operations
  writeNextAction,
  writeHandoff,
  writeSnapshot,
  writeActiveStream,
  writeActivePolicy,
  writeActiveRuntime,
  writeActiveRuntimeClaim,
  clearActiveRuntimeClaim,
  writeActiveContract,
  writeStreamDoc,
  // Task acceptance and activation rollback
  ACCEPTED_TASK_RELATIVE,
  readAcceptedTaskRaw,
  writeAcceptedTaskRaw,
  removeAcceptedTask,
  // Work authorization
  WORK_AUTHORIZATION_RELATIVE,
  readWorkAuthorizationRaw,
  writeWorkAuthorizationRaw,
  removeWorkAuthorization,
  readStateFileRaw,
  restoreStateFileRaw,
  // History operations
  appendHistory,
  removeHistoryLog,
};
