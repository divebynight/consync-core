const fs = require("fs");
const path = require("path");

// ScaffoldAI State Write Authority
//
// This module is the SINGLE APPROVED WRITE BOUNDARY for ScaffoldAI operational state.
//
// All writes to .scaffoldai/state/* and .scaffoldai/streams/*/stream.md must go through
// the functions in this module.
//
// Architecture:
//   CLI / MCP → ScaffoldAI authority functions → scaffoldaiState → .scaffoldai/state/*
//
// This module does NOT perform validation or business logic. It only provides the
// physical write operations with explicit path control.

const STATE_ROOT = path.join(".scaffoldai", "state");
const STREAMS_ROOT = path.join(".scaffoldai", "streams");

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
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  writeNextAction,
  writeHandoff,
  writeSnapshot,
  writeActiveStream,
  writeStreamDoc,
};
