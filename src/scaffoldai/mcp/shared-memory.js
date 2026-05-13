"use strict";

const fs = require("fs");
const crypto = require("crypto");
const { resolveScaffoldAIPath } = require("../../lib/repoRoot.util.shared");

const STORAGE_DIR = resolveScaffoldAIPath("streams");
const STORAGE_FILE = resolveScaffoldAIPath("streams", "shared-memory.jsonl");
const STORAGE_LABEL = ".scaffoldai/streams/shared-memory.jsonl";

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

// ---------------------------------------------------------------------------
// scaffoldai_memory_write
// ---------------------------------------------------------------------------

function runMemoryWriteTool(args) {
  const from = trimString(args.from);
  const to = trimString(args.to);
  const topic = trimString(args.topic || "");
  const message = trimString(args.message);

  // Validation
  if (!from) {
    return { status: "rejected", reason: "'from' is required and must not be empty." };
  }
  if (!to) {
    return { status: "rejected", reason: "'to' is required and must not be empty." };
  }
  if (!message) {
    return { status: "rejected", reason: "'message' is required and must not be empty." };
  }
  if (from.length > MAX_FROM_TO_TOPIC_LENGTH) {
    return { status: "rejected", reason: `'from' exceeds ${MAX_FROM_TO_TOPIC_LENGTH} character limit.` };
  }
  if (to.length > MAX_FROM_TO_TOPIC_LENGTH) {
    return { status: "rejected", reason: `'to' exceeds ${MAX_FROM_TO_TOPIC_LENGTH} character limit.` };
  }
  if (topic.length > MAX_FROM_TO_TOPIC_LENGTH) {
    return { status: "rejected", reason: `'topic' exceeds ${MAX_FROM_TO_TOPIC_LENGTH} character limit.` };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { status: "rejected", reason: `'message' exceeds ${MAX_MESSAGE_LENGTH} character limit.` };
  }

  ensureStorageFile();

  const record = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    source: "scaffoldai_mcp",
    from,
    to,
    ...(topic ? { topic } : {}),
    message,
  };

  fs.appendFileSync(STORAGE_FILE, JSON.stringify(record) + "\n", "utf8");

  return {
    tool: "scaffoldai_memory_write",
    status: "accepted",
    storage: STORAGE_LABEL,
    record,
  };
}

// ---------------------------------------------------------------------------
// scaffoldai_memory_read
// ---------------------------------------------------------------------------

function runMemoryReadTool(args) {
  const audience = trimString(args.audience);
  if (!audience) {
    return { status: "rejected", reason: "'audience' is required and must not be empty." };
  }

  const includeAll = args.includeAll !== false; // default true
  const rawLimit = typeof args.limit === "number" ? args.limit : DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, Math.floor(rawLimit)), MAX_LIMIT);

  ensureStorageFile();

  const raw = fs.readFileSync(STORAGE_FILE, "utf8");
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
    storage: STORAGE_LABEL,
    audience,
    includeAll,
    limit,
    total_matched: matched.length,
    messages: page,
    ordering: "oldest_first",
  };
}

module.exports = { runMemoryWriteTool, runMemoryReadTool };
