"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

// Read-only access to explicitly shared Markdown reports. Callers supply a
// report id, never a path. Report content is untrusted; the secret patterns
// below are defense in depth, not the primary boundary (`share: chatgpt` is).

const REPORTS_SUBPATH = path.join(".scaffoldai", "runtime", "reports");
const MAX_REPORT_BYTES = 64 * 1024;
const MAX_LIST_LIMIT = 25;
const MAX_SCAN_ENTRIES = 200;
const REPORT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;
const PACKET_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;
const FRONTMATTER_KEYS = new Set(["report_id", "title", "packet", "created_at", "share"]);
const SHARE_TARGET = "chatgpt";
// Tab, LF and CR are allowed; other C0 controls, DEL and bidi overrides are not.
const FORBIDDEN_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/;
const SECRET_PATTERNS = Object.freeze([
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}/,
  /\bgithub_pat_[A-Za-z0-9_]{30,}/,
  /\bsk-[A-Za-z0-9_-]{20,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
  /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}/,
  /CF_Authorization=[^\s;]{16,}/,
  /\bSCAFFOLDAI_ACCESS_[A-Z_]+=\S+/,
]);

const ERROR_MESSAGES = Object.freeze({
  INVALID_REPORT_ID: "report_id must be a lowercase slug (a-z, 0-9, -), at most 80 characters.",
  REPORT_UNAVAILABLE: "Report is not available.",
  REPORT_INVALID: "Report is malformed and cannot be served.",
  REPORT_TOO_LARGE: `Report exceeds ${MAX_REPORT_BYTES} bytes and cannot be served.`,
  REPORT_BLOCKED: "Report contains credential-shaped content and cannot be served.",
});

class ReportError extends Error {
  constructor(code) {
    super(ERROR_MESSAGES[code]);
    this.code = code;
  }
}

function errorResult(code, reportId) {
  return {
    status: "error",
    error_code: code,
    ...(typeof reportId === "string" && REPORT_ID_PATTERN.test(reportId) ? { report_id: reportId } : {}),
    message: ERROR_MESSAGES[code],
  };
}

function isValidReportId(value) {
  return typeof value === "string" && REPORT_ID_PATTERN.test(value);
}

// Returns the reports directory only when no path component is a symlink out
// of the repository's own .scaffoldai/runtime/reports location.
function resolveReportsDir(repoRoot) {
  const expected = path.join(fs.realpathSync(repoRoot), REPORTS_SUBPATH);
  let actual;
  try {
    actual = fs.realpathSync(path.join(repoRoot, REPORTS_SUBPATH));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  if (actual !== expected || !fs.statSync(actual).isDirectory()) throw new ReportError("REPORT_UNAVAILABLE");
  return actual;
}

function readReportBytes(reportsDir, reportId) {
  const flags = fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK;
  let fd;
  try {
    fd = fs.openSync(path.join(reportsDir, `${reportId}.md`), flags);
  } catch {
    throw new ReportError("REPORT_UNAVAILABLE");
  }
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile()) throw new ReportError("REPORT_UNAVAILABLE");
    if (stat.size > MAX_REPORT_BYTES) throw new ReportError("REPORT_TOO_LARGE");
    const buffer = Buffer.alloc(MAX_REPORT_BYTES + 1);
    const length = fs.readSync(fd, buffer, 0, buffer.length, 0);
    if (length > MAX_REPORT_BYTES) throw new ReportError("REPORT_TOO_LARGE");
    return buffer.subarray(0, length);
  } finally {
    fs.closeSync(fd);
  }
}

function decodeText(bytes) {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new ReportError("REPORT_INVALID");
  }
  if (FORBIDDEN_CHARACTERS.test(text)) throw new ReportError("REPORT_INVALID");
  return text;
}

function parseFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) throw new ReportError("REPORT_INVALID");
  const end = normalized.indexOf("\n---\n", 3);
  if (end === -1) throw new ReportError("REPORT_INVALID");
  const fields = {};
  for (const line of normalized.slice(4, end).split("\n")) {
    const match = line.match(/^([a-z_]+):[ \t]*(.*)$/);
    if (!match || !FRONTMATTER_KEYS.has(match[1]) || Object.hasOwn(fields, match[1])) {
      throw new ReportError("REPORT_INVALID");
    }
    const value = match[2].trim();
    if (!value) throw new ReportError("REPORT_INVALID");
    fields[match[1]] = value;
  }
  return { fields, body: normalized.slice(end + 5) };
}

function validateFields(fields, reportId) {
  if (fields.report_id !== reportId) throw new ReportError("REPORT_INVALID");
  if (!fields.title || fields.title.length > 120) throw new ReportError("REPORT_INVALID");
  if (fields.packet !== undefined && (!PACKET_PATTERN.test(fields.packet) || fields.packet.includes(".."))) {
    throw new ReportError("REPORT_INVALID");
  }
  if (fields.created_at !== undefined &&
      (!ISO_DATE_PATTERN.test(fields.created_at) || Number.isNaN(Date.parse(fields.created_at)))) {
    throw new ReportError("REPORT_INVALID");
  }
}

function replaceHomeDir(text, homeDir) {
  if (!homeDir || homeDir === "/") return text;
  const escaped = homeDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`${escaped}(?![A-Za-z0-9_-])`, "g"), "~");
}

function loadReport(reportsDir, reportId, options) {
  const bytes = readReportBytes(reportsDir, reportId);
  const text = decodeText(bytes);
  const { fields, body } = parseFrontmatter(text);
  validateFields(fields, reportId);
  if (fields.share !== SHARE_TARGET) throw new ReportError("REPORT_UNAVAILABLE");
  if (SECRET_PATTERNS.some((pattern) => pattern.test(text))) throw new ReportError("REPORT_BLOCKED");
  return {
    report_id: reportId,
    title: replaceHomeDir(fields.title, options.homeDir),
    packet: fields.packet || null,
    created_at: fields.created_at || null,
    bytes: bytes.length,
    content: replaceHomeDir(body, options.homeDir),
  };
}

function withDefaults(options) {
  return { homeDir: os.homedir(), ...options };
}

function readReport(repoRoot, args = {}, options = {}) {
  const reportId = args.report_id;
  if (!isValidReportId(reportId)) return errorResult("INVALID_REPORT_ID");
  try {
    const reportsDir = resolveReportsDir(repoRoot);
    if (!reportsDir) return errorResult("REPORT_UNAVAILABLE", reportId);
    return { status: "ok", ...loadReport(reportsDir, reportId, withDefaults(options)) };
  } catch (error) {
    return errorResult(error instanceof ReportError ? error.code : "REPORT_UNAVAILABLE", reportId);
  }
}

function clampLimit(limit) {
  if (!Number.isInteger(limit)) return MAX_LIST_LIMIT;
  return Math.min(Math.max(limit, 1), MAX_LIST_LIMIT);
}

function listReports(repoRoot, args = {}, options = {}) {
  const limit = clampLimit(args.limit);
  const empty = { status: "ok", reports: [], skipped: 0, limit };
  let reportsDir;
  try {
    reportsDir = resolveReportsDir(repoRoot);
  } catch {
    return empty;
  }
  if (!reportsDir) return empty;

  const ids = fs.readdirSync(reportsDir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.slice(0, -3))
    .sort()
    .slice(0, MAX_SCAN_ENTRIES);
  const reports = [];
  let skipped = 0;
  for (const reportId of ids) {
    if (reports.length >= limit) break;
    if (!isValidReportId(reportId)) {
      skipped++;
      continue;
    }
    try {
      const { content, ...metadata } = loadReport(reportsDir, reportId, withDefaults(options));
      reports.push(metadata);
    } catch {
      skipped++;
    }
  }
  return { status: "ok", reports, skipped, limit };
}

module.exports = {
  REPORTS_SUBPATH,
  MAX_REPORT_BYTES,
  listReports,
  readReport,
};
