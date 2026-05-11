"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const signalDir = path.join(repoRoot, ".scaffoldai", "tmp");
const signalPath = path.join(signalDir, "mcp-signals.jsonl");
const rotatedSignalPath = `${signalPath}.1`;
const signalPathRelative = ".scaffoldai/tmp/mcp-signals.jsonl";

const EXECUTION_CLASS = "LOCAL_SIGNAL_APPEND_ONLY";
const MAX_CLIENT_ID_LENGTH = 64;
const MAX_MESSAGE_LENGTH = 250;
const MAX_CAPABILITIES = 10;
const MAX_CAPABILITY_LENGTH = 64;
const MAX_RECORD_BYTES = 1024;
const MAX_LOG_BYTES = 64 * 1024;
const HEARTBEAT_INTERVAL_MS = 60 * 1000;
const NON_HEARTBEAT_INTERVAL_MS = 10 * 1000;

const ALLOWED_FIELDS = new Set(["client_id", "signal_type", "message", "capabilities"]);
const ALLOWED_SIGNAL_TYPES = new Set([
  "connected",
  "heartbeat",
  "capability_check",
  "tool_visibility",
  "disconnected",
  "note",
]);

const lastHeartbeatByClient = new Map();
const lastNonHeartbeatByClient = new Map();

function baseResponse(input) {
  return {
    tool: "scaffoldai_signal",
    execution_class: EXECUTION_CLASS,
    path: signalPathRelative,
    client_id: typeof input.client_id === "string" ? input.client_id : null,
    signal_type: typeof input.signal_type === "string" ? input.signal_type : null,
    non_authoritative: true,
  };
}

function rejectSignal(input, reason) {
  return {
    ...baseResponse(input || {}),
    status: "rejected",
    reason,
  };
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function hasControlCharacters(value) {
  return /[\u0000-\u001f\u007f]/.test(value);
}

function validateSignal(input) {
  if (!isPlainObject(input)) {
    return { ok: false, reason: "input must be an object" };
  }

  for (const key of Object.keys(input)) {
    if (!ALLOWED_FIELDS.has(key)) {
      return { ok: false, reason: `unknown field: ${key}` };
    }
  }

  for (const [key, value] of Object.entries(input)) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return { ok: false, reason: `nested object not allowed: ${key}` };
    }
  }

  const clientId = input.client_id;
  if (typeof clientId !== "string" || clientId.length === 0) {
    return { ok: false, reason: "client_id is required" };
  }
  if (clientId.length > MAX_CLIENT_ID_LENGTH) {
    return { ok: false, reason: "client_id exceeds 64 characters" };
  }
  if (!/^[A-Za-z0-9_.-]+$/.test(clientId)) {
    return { ok: false, reason: "client_id contains invalid characters" };
  }

  const signalType = input.signal_type;
  if (typeof signalType !== "string" || signalType.length === 0) {
    return { ok: false, reason: "signal_type is required" };
  }
  if (!ALLOWED_SIGNAL_TYPES.has(signalType)) {
    return { ok: false, reason: "signal_type is not allowed" };
  }

  let message;
  if (Object.prototype.hasOwnProperty.call(input, "message")) {
    if (typeof input.message !== "string") {
      return { ok: false, reason: "message must be a string" };
    }
    if (input.message.length > MAX_MESSAGE_LENGTH) {
      return { ok: false, reason: "message exceeds 250 characters" };
    }
    if (hasControlCharacters(input.message)) {
      return { ok: false, reason: "message contains control characters" };
    }
    message = input.message;
  }

  let capabilities;
  if (Object.prototype.hasOwnProperty.call(input, "capabilities")) {
    if (!Array.isArray(input.capabilities)) {
      return { ok: false, reason: "capabilities must be an array of strings" };
    }
    if (input.capabilities.length > MAX_CAPABILITIES) {
      return { ok: false, reason: "capabilities exceeds 10 entries" };
    }
    capabilities = [];
    for (const capability of input.capabilities) {
      if (typeof capability !== "string" || capability.length === 0) {
        return { ok: false, reason: "capabilities entries must be non-empty strings" };
      }
      if (capability.length > MAX_CAPABILITY_LENGTH) {
        return { ok: false, reason: "capability exceeds 64 characters" };
      }
      if (hasControlCharacters(capability)) {
        return { ok: false, reason: "capability contains control characters" };
      }
      capabilities.push(capability);
    }
  }

  return {
    ok: true,
    signal: {
      client_id: clientId,
      signal_type: signalType,
      ...(message !== undefined ? { message } : {}),
      ...(capabilities !== undefined ? { capabilities } : {}),
    },
  };
}

function checkRateLimit(signal, nowMs) {
  if (signal.signal_type === "heartbeat") {
    const last = lastHeartbeatByClient.get(signal.client_id);
    if (last && nowMs - last < HEARTBEAT_INTERVAL_MS) {
      return { ok: false, reason: "heartbeat rate limit: one per 60 seconds per client_id" };
    }
    return { ok: true };
  }

  const last = lastNonHeartbeatByClient.get(signal.client_id);
  if (last && nowMs - last < NON_HEARTBEAT_INTERVAL_MS) {
    return { ok: false, reason: "non-heartbeat rate limit: one per 10 seconds per client_id" };
  }
  return { ok: true };
}

function rememberRateLimit(signal, nowMs) {
  if (signal.signal_type === "heartbeat") {
    lastHeartbeatByClient.set(signal.client_id, nowMs);
  } else {
    lastNonHeartbeatByClient.set(signal.client_id, nowMs);
  }
}

function ensureSignalPathBoundary() {
  const resolvedDir = path.resolve(signalDir);
  const resolvedPath = path.resolve(signalPath);
  if (resolvedPath !== path.join(resolvedDir, "mcp-signals.jsonl")) {
    throw new Error("signal path boundary check failed");
  }
}

function rotateIfNeeded(recordBytes) {
  let currentSize = 0;
  try {
    currentSize = fs.statSync(signalPath).size;
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  if (currentSize > 0 && currentSize + recordBytes > MAX_LOG_BYTES) {
    try {
      fs.unlinkSync(rotatedSignalPath);
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    fs.renameSync(signalPath, rotatedSignalPath);
  }
}

function appendSignalRecord(record) {
  ensureSignalPathBoundary();
  const line = `${JSON.stringify(record)}\n`;
  const recordBytes = Buffer.byteLength(line, "utf8");

  if (recordBytes > MAX_RECORD_BYTES) {
    return { ok: false, reason: "serialized record exceeds 1 KB" };
  }

  fs.mkdirSync(signalDir, { recursive: true });
  rotateIfNeeded(recordBytes);
  fs.appendFileSync(signalPath, line, "utf8");

  return { ok: true };
}

function runSignalTool(input, options = {}) {
  const validation = validateSignal(input || {});
  if (!validation.ok) {
    return rejectSignal(input, validation.reason);
  }

  const now = options.now instanceof Date ? options.now : new Date();
  const nowMs = now.getTime();
  const rateLimit = checkRateLimit(validation.signal, nowMs);
  if (!rateLimit.ok) {
    return rejectSignal(validation.signal, rateLimit.reason);
  }

  const record = {
    timestamp: now.toISOString(),
    client_id: validation.signal.client_id,
    signal_type: validation.signal.signal_type,
    ...(validation.signal.message !== undefined ? { message: validation.signal.message } : {}),
    ...(validation.signal.capabilities !== undefined ? { capabilities: validation.signal.capabilities } : {}),
  };

  const appendResult = appendSignalRecord(record);
  if (!appendResult.ok) {
    return rejectSignal(validation.signal, appendResult.reason);
  }

  rememberRateLimit(validation.signal, nowMs);

  return {
    ...baseResponse(validation.signal),
    status: "accepted",
    timestamp: record.timestamp,
    recorded: true,
  };
}

function resetSignalRateLimitsForTest() {
  lastHeartbeatByClient.clear();
  lastNonHeartbeatByClient.clear();
}

module.exports = {
  ALLOWED_SIGNAL_TYPES,
  EXECUTION_CLASS,
  MAX_LOG_BYTES,
  MAX_RECORD_BYTES,
  signalPath,
  signalPathRelative,
  rotatedSignalPath,
  runSignalTool,
  resetSignalRateLimitsForTest,
};
