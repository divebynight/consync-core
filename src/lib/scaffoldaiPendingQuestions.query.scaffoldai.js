"use strict";

const fs = require("fs");
const path = require("path");

const SIGNAL_PATH_RELATIVE = ".scaffoldai/runtime/mcp/signals.jsonl";
const MAX_LIMIT = 25;
const DEFAULT_LIMIT = 10;

const QUESTION_SIGNAL_TYPES = new Set(["question", "decision_required", "blocker"]);
const RESOLUTION_SIGNAL_TYPES = new Set(["question_resolved", "unblocked"]);

function clampLimit(value) {
  if (!Number.isFinite(value)) return DEFAULT_LIMIT;
  const integer = Math.trunc(value);
  if (integer < 1) return 1;
  if (integer > MAX_LIMIT) return MAX_LIMIT;
  return integer;
}

function toCleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseSignalLines(raw) {
  const records = [];
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        records.push(parsed);
      }
    } catch {
      // Ignore malformed diagnostic lines.
    }
  }

  return records;
}

function isResolutionSignal(record) {
  return RESOLUTION_SIGNAL_TYPES.has(toCleanString(record.signal_type).toLowerCase());
}

function isQuestionLikeSignal(record) {
  const signalType = toCleanString(record.signal_type).toLowerCase();
  const severity = toCleanString(record.severity).toLowerCase();
  return QUESTION_SIGNAL_TYPES.has(signalType) || severity.length > 0;
}

function buildResolutionKey(record) {
  const clientId = toCleanString(record.client_id).toLowerCase();
  const packet = toCleanString(record.packet).toLowerCase();
  const message = toCleanString(record.message).toLowerCase();
  if (!clientId || !message) return null;
  return `${clientId}|${packet}|${message}`;
}

function createQuestionRecord(record) {
  return {
    timestamp: typeof record.timestamp === "string" ? record.timestamp : null,
    client_id: toCleanString(record.client_id) || null,
    packet: toCleanString(record.packet) || null,
    severity: toCleanString(record.severity) || "info",
    question: toCleanString(record.message) || null,
    options: Array.isArray(record.options)
      ? record.options.filter((value) => typeof value === "string" && value.trim().length > 0)
      : [],
    signal_type: toCleanString(record.signal_type) || null,
  };
}

function gatherPendingQuestions(repoRoot, options = {}) {
  const limit = clampLimit(options.limit);
  const unresolvedOnly = options.unresolvedOnly !== false;
  const signalPath = path.join(repoRoot, SIGNAL_PATH_RELATIVE);

  let records = [];
  if (fs.existsSync(signalPath)) {
    const raw = fs.readFileSync(signalPath, "utf8");
    records = parseSignalLines(raw);
  }

  const resolvedKeys = new Set();
  for (const record of records) {
    if (!isResolutionSignal(record)) continue;
    const key = buildResolutionKey(record);
    if (key) resolvedKeys.add(key);
  }

  const pending = [];
  let totalQuestionSignals = 0;

  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index];
    if (!isQuestionLikeSignal(record)) continue;
    if (isResolutionSignal(record)) continue;

    totalQuestionSignals += 1;

    const key = buildResolutionKey(record);
    const resolved = key ? resolvedKeys.has(key) : false;
    const resolutionStatus = resolved ? "resolved" : "unresolved";
    if (unresolvedOnly && resolved) continue;

    pending.push({
      ...createQuestionRecord(record),
      resolution_status: resolutionStatus,
      source: SIGNAL_PATH_RELATIVE,
    });

    if (pending.length >= limit) break;
  }

  return {
    tool: "scaffoldai_pending_questions",
    execution_class: "READ_ONLY",
    status: "OBSERVE",
    data: {
      source: SIGNAL_PATH_RELATIVE,
      limit,
      unresolved_only: unresolvedOnly,
      total_question_signals: totalQuestionSignals,
      returned_count: pending.length,
      pending_questions: pending,
    },
    next_safe_action:
      pending.length === 0
        ? "No pending question/blocker signals in current scope."
        : "Treat pending questions as advisory runtime coordination only; use human decisions for authority.",
  };
}

module.exports = {
  gatherPendingQuestions,
};