"use strict";

const fs = require("fs");
const path = require("path");
const { getInFlightPacket } = require("./getInFlightPacket.query.scaffoldai");
const { gatherPendingQuestions } = require("./scaffoldaiPendingQuestions.query.scaffoldai");

const SIGNAL_PATH_RELATIVE = ".scaffoldai/runtime/mcp/signals.jsonl";
const MAX_LIMIT = 25;
const DEFAULT_LIMIT = 10;
const VALID_VERIFY_STATUSES = new Set(["passed", "failed", "not_run"]);

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePacket(value) {
  return cleanString(value).toLowerCase();
}

function clampLimit(value) {
  if (!Number.isFinite(value)) return DEFAULT_LIMIT;
  const integer = Math.trunc(value);
  if (integer < 1) return 1;
  if (integer > MAX_LIMIT) return MAX_LIMIT;
  return integer;
}

function parseLines(raw) {
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
      // Ignore malformed lines in append-only diagnostic history.
    }
  }
  return records;
}

function normalizeVerifyStatus(value) {
  const normalized = cleanString(value).toLowerCase();
  return VALID_VERIFY_STATUSES.has(normalized) ? normalized : "not_run";
}

function normalizeChangedFiles(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => typeof entry === "string" && entry.trim().length > 0).slice(0, MAX_LIMIT);
}

function mapCompletionRecord(record) {
  return {
    packet: cleanString(record.packet) || null,
    client_id: cleanString(record.client_id) || null,
    message: cleanString(record.message) || null,
    verify_command: cleanString(record.verify_command) || null,
    verify_status: normalizeVerifyStatus(record.verify_status),
    changed_files: normalizeChangedFiles(record.changed_files),
    summary: cleanString(record.summary) || null,
    commit_suggestion: cleanString(record.commit_suggestion) || null,
    needs_human_closeout:
      typeof record.needs_human_closeout === "boolean" ? record.needs_human_closeout : null,
    timestamp: cleanString(record.timestamp) || null,
    source: SIGNAL_PATH_RELATIVE,
  };
}

function recommendationFor(completion, hasPendingQuestions) {
  if (completion.verify_status === "passed" && !hasPendingQuestions) {
    return "Recommend human closeout via CLI; completion signal is advisory only.";
  }
  return "Resolve blockers first (verification and/or pending questions) before human closeout.";
}

function buildPendingQuestionMap(repoRoot) {
  const pending = gatherPendingQuestions(repoRoot, { unresolvedOnly: true, limit: MAX_LIMIT });
  const map = new Map();
  const rows = (pending && pending.data && Array.isArray(pending.data.pending_questions))
    ? pending.data.pending_questions
    : [];

  for (const row of rows) {
    const packet = normalizePacket(row.packet);
    if (!packet) continue;
    map.set(packet, (map.get(packet) || 0) + 1);
  }

  return map;
}

function gatherCompletionStatus(repoRoot, options = {}) {
  const limit = clampLimit(options.limit);
  const latestOnly = options.latestOnly === true;
  const specificPacket = cleanString(options.packet);
  const activePacketOnly = options.activePacketOnly === true;
  const activePacket = getInFlightPacket(repoRoot);
  const packetFilter = specificPacket || (activePacketOnly ? (activePacket || "") : "");

  const signalPath = path.join(repoRoot, SIGNAL_PATH_RELATIVE);
  let records = [];
  if (fs.existsSync(signalPath)) {
    records = parseLines(fs.readFileSync(signalPath, "utf8"));
  }

  const pendingByPacket = buildPendingQuestionMap(repoRoot);

  const completions = [];
  for (const record of records) {
    if (cleanString(record.signal_type).toLowerCase() !== "packet_completed") continue;

    const completion = mapCompletionRecord(record);
    if (packetFilter) {
      const target = normalizePacket(packetFilter);
      if (!completion.packet || normalizePacket(completion.packet) !== target) continue;
    }

    const unresolvedCount = completion.packet
      ? (pendingByPacket.get(normalizePacket(completion.packet)) || 0)
      : 0;
    const hasPendingQuestions = unresolvedCount > 0;

    completions.push({
      ...completion,
      unresolved_pending_questions: hasPendingQuestions,
      unresolved_pending_question_count: unresolvedCount,
      closeout_recommendation: recommendationFor(completion, hasPendingQuestions),
    });
  }

  const newestFirst = completions.reverse();
  const limited = latestOnly ? newestFirst.slice(0, 1) : newestFirst.slice(0, limit);

  const first = limited[0] || null;
  const nextSafeAction = first
    ? first.closeout_recommendation
    : "No completion signals found for current scope.";

  return {
    tool: "scaffoldai_completion_status",
    execution_class: "READ_ONLY",
    status: "OBSERVE",
    data: {
      source: SIGNAL_PATH_RELATIVE,
      active_packet: activePacket || null,
      filter: {
        packet: specificPacket || null,
        active_packet_only: activePacketOnly,
        latest_only: latestOnly,
        limit,
      },
      returned_count: limited.length,
      completions: limited,
    },
    next_safe_action: nextSafeAction,
  };
}

module.exports = { gatherCompletionStatus };
