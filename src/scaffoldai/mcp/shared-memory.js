"use strict";

const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const { resolveScaffoldAIPath } = require("../../lib/repoRoot.util.shared");

const STORAGE_DIR = resolveScaffoldAIPath("runtime", "mcp");
const STORAGE_FILE = resolveScaffoldAIPath("runtime", "mcp", "shared-memory.jsonl");
const STORAGE_LABEL = ".scaffoldai/runtime/mcp/shared-memory.jsonl";
const STORAGE_BOUNDARY_SUFFIX = `${path.sep}.scaffoldai${path.sep}runtime${path.sep}mcp${path.sep}shared-memory.jsonl`;

const WRITE_EXECUTION_CLASS = "LOCAL_SHARED_MEMORY_APPEND_ONLY";
const READ_EXECUTION_CLASS = "READ_ONLY";

const WRITE_ALLOWED_FIELDS = new Set(["from", "to", "topic", "message"]);
const READ_ALLOWED_FIELDS = new Set(["audience", "limit", "includeAll"]);

const ERROR_CATEGORY = {
  SCHEMA_INPUT_MISMATCH: "schema_input_mismatch",
  GUARD_FAILURE: "guard_failure",
  FILESYSTEM_WRITE_ERROR: "filesystem_write_error",
};

const MAX_FROM_TO_TOPIC_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_LIMIT = 25;
const DEFAULT_LIMIT = 10;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function ensureStorageFile() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_FILE)) {
    fs.writeFileSync(STORAGE_FILE, "", "utf8");
  }
}

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function baseWriteResponse() {
  return {
    tool: "scaffoldai_memory_write",
    execution_class: WRITE_EXECUTION_CLASS,
    storage: STORAGE_LABEL,
    non_authoritative: true,
  };
}

function rejectWrite(reason, options = {}) {
  return {
    ...baseWriteResponse(),
    status: "rejected",
    reason,
    error_category: options.error_category || ERROR_CATEGORY.SCHEMA_INPUT_MISMATCH,
    guard_errors: Array.isArray(options.guard_errors) ? options.guard_errors : [],
    validation_errors: Array.isArray(options.validation_errors) ? options.validation_errors : [],
    next_safe_action: options.next_safe_action || "Fix input and retry append-only memory write.",
  };
}

function rejectRead(reason, options = {}) {
  return {
    tool: "scaffoldai_memory_read",
    execution_class: READ_EXECUTION_CLASS,
    storage: STORAGE_LABEL,
    status: "rejected",
    reason,
    error_category: options.error_category || ERROR_CATEGORY.SCHEMA_INPUT_MISMATCH,
    guard_errors: Array.isArray(options.guard_errors) ? options.guard_errors : [],
    validation_errors: Array.isArray(options.validation_errors) ? options.validation_errors : [],
    next_safe_action: options.next_safe_action || "Provide a valid audience and retry memory read.",
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyAllowedFields(args, allowedFields) {
  return Object.keys(args).every((key) => allowedFields.has(key));
}

function ensureStorageBoundary() {
  const resolved = STORAGE_FILE;
  if (!resolved.endsWith(STORAGE_BOUNDARY_SUFFIX)) {
    throw new Error("shared memory path boundary violation");
  }
}

// ---------------------------------------------------------------------------
// scaffoldai_memory_write
// ---------------------------------------------------------------------------

function runMemoryWriteTool(args) {
  if (!isPlainObject(args)) {
    return rejectWrite("input must be an object", {
      guard_errors: ["input payload must be a JSON object"],
    });
  }

  if (!hasOnlyAllowedFields(args, WRITE_ALLOWED_FIELDS)) {
    const disallowed = Object.keys(args).filter((key) => !WRITE_ALLOWED_FIELDS.has(key));
    return rejectWrite("unknown input fields are not allowed", {
      guard_errors: [`disallowed input keys: ${disallowed.join(", ")}`],
      error_category: ERROR_CATEGORY.GUARD_FAILURE,
      next_safe_action: "Pass only from, to, topic, and message fields.",
    });
  }

  const from = trimString(args.from);
  const to = trimString(args.to);
  const topic = trimString(args.topic || "");
  const message = trimString(args.message);

  // Validation
  if (!from) {
    return rejectWrite("'from' is required and must not be empty.");
  }
  if (!to) {
    return rejectWrite("'to' is required and must not be empty.");
  }
  if (!message) {
    return rejectWrite("'message' is required and must not be empty.");
  }
  if (from.length > MAX_FROM_TO_TOPIC_LENGTH) {
    return rejectWrite(`'from' exceeds ${MAX_FROM_TO_TOPIC_LENGTH} character limit.`);
  }
  if (to.length > MAX_FROM_TO_TOPIC_LENGTH) {
    return rejectWrite(`'to' exceeds ${MAX_FROM_TO_TOPIC_LENGTH} character limit.`);
  }
  if (topic.length > MAX_FROM_TO_TOPIC_LENGTH) {
    return rejectWrite(`'topic' exceeds ${MAX_FROM_TO_TOPIC_LENGTH} character limit.`);
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return rejectWrite(`'message' exceeds ${MAX_MESSAGE_LENGTH} character limit.`);
  }

  try {
    ensureStorageBoundary();
    ensureStorageFile();
  } catch (error) {
    return rejectWrite("shared-memory storage path boundary check failed", {
      error_category: ERROR_CATEGORY.GUARD_FAILURE,
      guard_errors: [error && error.message ? error.message : "shared-memory path boundary check failed"],
      next_safe_action: "Check ScaffoldAI runtime path configuration and retry.",
    });
  }

  const record = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    source: "scaffoldai_mcp",
    from,
    to,
    ...(topic ? { topic } : {}),
    message,
  };

  try {
    fs.appendFileSync(STORAGE_FILE, JSON.stringify(record) + "\n", "utf8");
  } catch (error) {
    return rejectWrite("failed to append shared memory record", {
      error_category: ERROR_CATEGORY.FILESYSTEM_WRITE_ERROR,
      guard_errors: [error && error.message ? error.message : "filesystem append failed"],
      next_safe_action: "Check .scaffoldai/runtime/mcp permissions and retry.",
    });
  }

  return {
    ...baseWriteResponse(),
    status: "accepted",
    error_category: null,
    guard_errors: [],
    validation_errors: [],
    record,
  };
}

// ---------------------------------------------------------------------------
// scaffoldai_memory_read
// ---------------------------------------------------------------------------

function runMemoryReadTool(args) {
  if (!isPlainObject(args)) {
    return rejectRead("input must be an object", {
      guard_errors: ["input payload must be a JSON object"],
    });
  }

  if (!hasOnlyAllowedFields(args, READ_ALLOWED_FIELDS)) {
    const disallowed = Object.keys(args).filter((key) => !READ_ALLOWED_FIELDS.has(key));
    return rejectRead("unknown input fields are not allowed", {
      guard_errors: [`disallowed input keys: ${disallowed.join(", ")}`],
      error_category: ERROR_CATEGORY.GUARD_FAILURE,
      next_safe_action: "Pass only audience, limit, and includeAll fields.",
    });
  }

  const audience = trimString(args.audience);
  if (!audience) {
    return rejectRead("'audience' is required and must not be empty.");
  }

  const includeAll = args.includeAll !== false; // default true
  const rawLimit = typeof args.limit === "number" ? args.limit : DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, Math.floor(rawLimit)), MAX_LIMIT);

  try {
    ensureStorageBoundary();
    ensureStorageFile();
  } catch (error) {
    return rejectRead("shared-memory storage path boundary check failed", {
      error_category: ERROR_CATEGORY.GUARD_FAILURE,
      guard_errors: [error && error.message ? error.message : "shared-memory path boundary check failed"],
      next_safe_action: "Check ScaffoldAI runtime path configuration and retry.",
    });
  }

  let raw;
  try {
    raw = fs.readFileSync(STORAGE_FILE, "utf8");
  } catch (error) {
    return rejectRead("failed to read shared memory storage", {
      error_category: ERROR_CATEGORY.FILESYSTEM_WRITE_ERROR,
      guard_errors: [error && error.message ? error.message : "filesystem read failed"],
      next_safe_action: "Check .scaffoldai/runtime/mcp permissions and retry.",
    });
  }
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);

  const matched = [];
  for (const line of lines) {
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      continue; // skip malformed lines
    }
    const toField = typeof rec.to === "string" ? rec.to.toLowerCase() : "";
    const audienceLower = audience.toLowerCase();
    if (toField === audienceLower || (includeAll && toField === "all")) {
      matched.push(rec);
    }
  }

  // Return newest last; take tail up to limit
  const page = matched.slice(-limit);

  return {
    tool: "scaffoldai_memory_read",
    execution_class: READ_EXECUTION_CLASS,
    storage: STORAGE_LABEL,
    status: "accepted",
    error_category: null,
    guard_errors: [],
    validation_errors: [],
    audience,
    includeAll,
    limit,
    total_matched: matched.length,
    messages: page,
    ordering: "oldest_first",
  };
}

module.exports = { runMemoryWriteTool, runMemoryReadTool };
