"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const SIGNAL_PATH_RELATIVE = ".scaffoldai/runtime/mcp/signals.jsonl";
const MAX_LIMIT = 25;
const DEFAULT_LIMIT = 10;

const QUESTION_SIGNAL_TYPES = new Set(["question", "decision_required", "blocker"]);
const RESOLUTION_SIGNAL_TYPES = new Set(["question_resolved", "unblocked"]);
const CORRELATION_WINDOW_MS = 15 * 60 * 1000;

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

function normalizeLower(value) {
  return toCleanString(value).toLowerCase();
}

function toTimestampMs(value) {
  if (typeof value !== "string") return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function hashQuestionIdentity(clientId, packet, questionText) {
  return crypto
    .createHash("sha256")
    .update(`${normalizeLower(clientId)}|${normalizeLower(packet)}|${normalizeLower(questionText)}`)
    .digest("hex")
    .slice(0, 16);
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
  const signalType = normalizeLower(record.signal_type);
  return QUESTION_SIGNAL_TYPES.has(signalType);
}

function buildQuestionEvent(record) {
  const timestamp = typeof record.timestamp === "string" ? record.timestamp : null;
  const clientId = toCleanString(record.client_id) || null;
  const packet = toCleanString(record.packet) || null;
  const question = toCleanString(record.message) || null;
  const explicitQuestionId = toCleanString(record.question_id) || null;
  const explicitQuestionHash = normalizeLower(record.question_hash) || null;
  const generatedQuestionHash = hashQuestionIdentity(clientId || "", packet || "", question || "");
  const generatedQuestionId = explicitQuestionId || `q_${generatedQuestionHash}`;

  return {
    timestamp,
    timestamp_ms: toTimestampMs(timestamp),
    client_id: clientId,
    packet,
    severity: toCleanString(record.severity) || "info",
    question,
    question_id: generatedQuestionId,
    question_hash: explicitQuestionHash || generatedQuestionHash,
    explicit_question_id: explicitQuestionId,
    explicit_question_hash: explicitQuestionHash,
    options: Array.isArray(record.options)
      ? record.options.filter((value) => typeof value === "string" && value.trim().length > 0)
      : [],
    signal_type: toCleanString(record.signal_type) || null,
  };
}

function buildResolutionEvent(record) {
  const timestamp = typeof record.timestamp === "string" ? record.timestamp : null;
  return {
    timestamp,
    timestamp_ms: toTimestampMs(timestamp),
    packet: toCleanString(record.packet) || null,
    question_id: toCleanString(record.question_id) || null,
    question_hash: normalizeLower(record.question_hash) || null,
    question_text: toCleanString(record.question_text || record.message) || null,
    resolved_by: toCleanString(record.resolved_by || record.client_id) || null,
    resolution_note: toCleanString(record.resolution_note || record.message) || null,
    signal_type: toCleanString(record.signal_type) || null,
  };
}

function absoluteTimeDeltaMs(leftMs, rightMs) {
  if (!Number.isFinite(leftMs) || !Number.isFinite(rightMs)) return Number.POSITIVE_INFINITY;
  return Math.abs(leftMs - rightMs);
}

function findResolutionForQuestion(questionEvent, resolutionEvents) {
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const resolutionEvent of resolutionEvents) {
    let matched = false;
    let score = Number.POSITIVE_INFINITY;

    if (resolutionEvent.question_id && resolutionEvent.question_id === questionEvent.question_id) {
      matched = true;
      score = 0;
    } else if (resolutionEvent.question_hash && resolutionEvent.question_hash === questionEvent.question_hash) {
      matched = true;
      score = 1;
    } else {
      const packetMatches = !resolutionEvent.packet || resolutionEvent.packet === questionEvent.packet;
      const textMatches =
        !!resolutionEvent.question_text &&
        normalizeLower(resolutionEvent.question_text) === normalizeLower(questionEvent.question);

      if (packetMatches && textMatches) {
        matched = true;
        score = 2;
      } else if (packetMatches) {
        const delta = absoluteTimeDeltaMs(resolutionEvent.timestamp_ms, questionEvent.timestamp_ms);
        if (delta <= CORRELATION_WINDOW_MS) {
          matched = true;
          score = 100 + delta;
        }
      }
    }

    if (!matched) continue;
    if (score < bestScore) {
      best = resolutionEvent;
      bestScore = score;
    }
  }

  return best;
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

  const questionEvents = [];
  const resolutionEvents = [];

  for (const record of records) {
    if (isResolutionSignal(record)) {
      resolutionEvents.push(buildResolutionEvent(record));
      continue;
    }

    if (isQuestionLikeSignal(record)) {
      questionEvents.push(buildQuestionEvent(record));
    }
  }

  const pending = [];
  const totalQuestionSignals = questionEvents.length;

  for (let index = questionEvents.length - 1; index >= 0; index -= 1) {
    const questionEvent = questionEvents[index];
    const matchedResolution = findResolutionForQuestion(questionEvent, resolutionEvents);
    const resolutionStatus = matchedResolution ? "resolved" : "unresolved";
    if (unresolvedOnly && resolutionStatus === "resolved") continue;

    pending.push({
      timestamp: questionEvent.timestamp,
      client_id: questionEvent.client_id,
      packet: questionEvent.packet,
      severity: questionEvent.severity,
      question: questionEvent.question,
      question_id: questionEvent.question_id,
      question_hash: questionEvent.question_hash,
      options: questionEvent.options,
      signal_type: questionEvent.signal_type,
      resolution_status: resolutionStatus,
      resolved_at: matchedResolution ? matchedResolution.timestamp : null,
      resolved_by: matchedResolution ? matchedResolution.resolved_by : null,
      resolution_signal_type: matchedResolution ? matchedResolution.signal_type : null,
      resolution_note: matchedResolution ? matchedResolution.resolution_note : null,
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