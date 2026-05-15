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

/**
 * Read .scaffoldai/state/active-contract.json
 */
function readActiveContract(rootPath) {
  const content = readFile(rootPath, path.join(STATE_ROOT, "active-contract.json"));
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch (_err) {
    return null;
  }
}

/**
 * Write .scaffoldai/state/active-contract.json
 */
function writeActiveContract(rootPath, contract) {
  const content = typeof contract === "string"
    ? contract
    : JSON.stringify(contract, null, 2) + "\n";

  writeFile(rootPath, path.join(STATE_ROOT, "active-contract.json"), content);
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
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  // Read operations
  readNextAction,
  readHandoff,
  readSnapshot,
  readActiveStream,
  readActiveContract,
  readStreamDoc,
  // Write operations
  writeNextAction,
  writeHandoff,
  writeSnapshot,
  writeActiveStream,
  writeActiveContract,
  writeStreamDoc,
  // History operation
  appendHistory,
};
