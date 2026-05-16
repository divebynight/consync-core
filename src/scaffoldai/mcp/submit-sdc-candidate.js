"use strict";

const fs = require("fs");
const path = require("path");
const { getRepoRoot } = require("../../lib/repoRoot.util.shared");
const { validateStrictSdcPacket } = require("../../lib/scaffoldaiPacketIntake.auth.scaffoldai");

const INBOX_DIR_RELATIVE = path.join(".scaffoldai", "inbox");
const EXECUTION_CLASS = "LOCAL_CANDIDATE_INBOX_WRITE_ONLY";
const MAX_CONTENT_BYTES = 64 * 1024;
const MAX_SUBMITTED_BY_LENGTH = 64;
const MAX_FILE_STEM_LENGTH = 96;

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStem(value) {
  return cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, MAX_FILE_STEM_LENGTH);
}

function sanitizeSubmittedBy(value) {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  if (cleaned.length > MAX_SUBMITTED_BY_LENGTH) return null;
  if (!/^[A-Za-z0-9_.-]+$/.test(cleaned)) return null;
  return cleaned;
}

function resolveCandidateFileName(validation, suggestedFileName) {
  const rawSuggestion = cleanString(suggestedFileName);
  if (!rawSuggestion) {
    return {
      ok: true,
      fileName: validation.file_name,
      source: "canonical",
    };
  }

  if (
    path.isAbsolute(rawSuggestion) ||
    rawSuggestion.includes("/") ||
    rawSuggestion.includes("\\") ||
    rawSuggestion.includes("..")
  ) {
    return {
      ok: false,
      reason: "suggestedFileName must be a plain filename without path traversal",
    };
  }

  const withoutExt = rawSuggestion.replace(/\.md$/i, "").replace(/\.sdc$/i, "");
  const stem = normalizeStem(withoutExt);

  if (!stem) {
    return {
      ok: false,
      reason: "suggestedFileName does not produce a safe candidate filename",
    };
  }

  return {
    ok: true,
    fileName: `${stem}.sdc.md`,
    source: "suggested",
  };
}

function isWithinDirectory(candidatePath, parentDirectory) {
  const relative = path.relative(parentDirectory, candidatePath);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

function reject(payload) {
  return {
    tool: "scaffoldai_submit_sdc_candidate",
    execution_class: EXECUTION_CLASS,
    status: "rejected",
    candidate_submitted: false,
    accepted: false,
    activated: false,
    claimed: false,
    active_runtime_mutated: false,
    next_action_mutated: false,
    ...payload,
  };
}

function runSubmitSdcCandidateTool(input = {}, options = {}) {
  const repoRoot = options.repoRoot || getRepoRoot(__dirname);
  const content = typeof input.content === "string" ? input.content : "";
  const submittedBy = sanitizeSubmittedBy(input.submittedBy);

  if (cleanString(content).length === 0) {
    return reject({
      reason: "content is required",
      next_safe_action: "Provide canonical SDC markdown content and retry submission.",
    });
  }

  if (Buffer.byteLength(content, "utf8") > MAX_CONTENT_BYTES) {
    return reject({
      reason: `content exceeds ${MAX_CONTENT_BYTES} bytes`,
      next_safe_action: "Reduce candidate content size and retry submission.",
    });
  }

  if (Object.prototype.hasOwnProperty.call(input, "submittedBy") && !submittedBy) {
    return reject({
      reason: "submittedBy must be alphanumeric with . _ - and at most 64 characters",
      next_safe_action: "Use a valid submittedBy value or omit it.",
    });
  }

  const validation = validateStrictSdcPacket(content);
  if (!validation.valid) {
    return reject({
      reason: "candidate failed intake-compatible validation",
      validation: {
        valid: false,
        packet_title: validation.packet_title,
        packet_id: validation.packet_id,
        canonical_file_name: validation.file_name,
        normalized_slug: validation.normalized_slug,
        mode: validation.mode,
        errors: validation.errors,
      },
      next_safe_action: "Fix packet format to canonical SDC structure, then retry candidate submission.",
    });
  }

  const nameResolution = resolveCandidateFileName(validation, input.suggestedFileName);
  if (!nameResolution.ok) {
    return reject({
      reason: nameResolution.reason,
      validation: {
        valid: true,
        packet_title: validation.packet_title,
        packet_id: validation.packet_id,
        canonical_file_name: validation.file_name,
        normalized_slug: validation.normalized_slug,
      },
      next_safe_action: "Use a plain suggestedFileName with letters, numbers, and separators only.",
    });
  }

  const inboxRoot = path.join(repoRoot, INBOX_DIR_RELATIVE);
  const candidatePath = path.join(inboxRoot, nameResolution.fileName);

  if (!isWithinDirectory(candidatePath, inboxRoot)) {
    return reject({
      reason: "resolved candidate path escapes inbox boundary",
      next_safe_action: "Retry with a safe suggestedFileName.",
    });
  }

  if (fs.existsSync(candidatePath)) {
    return reject({
      reason: `candidate file already exists: ${nameResolution.fileName}`,
      validation: {
        valid: true,
        packet_title: validation.packet_title,
        packet_id: validation.packet_id,
        canonical_file_name: validation.file_name,
        normalized_slug: validation.normalized_slug,
      },
      next_safe_action: "Choose a different suggestedFileName or remove the existing candidate manually before retrying.",
    });
  }

  fs.mkdirSync(inboxRoot, { recursive: true });
  fs.writeFileSync(candidatePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");

  const relativePath = path.join(INBOX_DIR_RELATIVE, nameResolution.fileName).split(path.sep).join("/");
  const warnings = [];
  if (nameResolution.fileName !== validation.file_name) {
    warnings.push(
      `candidate filename differs from canonical intake filename (${validation.file_name}); intake identity remains title-derived`
    );
  }

  return {
    tool: "scaffoldai_submit_sdc_candidate",
    execution_class: EXECUTION_CLASS,
    status: "accepted",
    candidate_submitted: true,
    accepted: false,
    activated: false,
    claimed: false,
    active_runtime_mutated: false,
    next_action_mutated: false,
    candidate: {
      path: relativePath,
      file_name: nameResolution.fileName,
      source: nameResolution.source,
      submitted_by: submittedBy,
      submitted_at: new Date().toISOString(),
    },
    identity: {
      packet_title: validation.packet_title,
      packet_id: validation.packet_id,
      canonical_file_name: validation.file_name,
      normalized_slug: validation.normalized_slug,
      candidate_file_name: nameResolution.fileName,
    },
    validation: {
      valid: true,
      mode: validation.mode,
      approval: validation.approval,
      intake_compatible: true,
    },
    warnings,
    next_safe_action: `Run scaffoldai packet intake ${relativePath} to evaluate acceptance, then activate explicitly if approved.`,
  };
}

module.exports = {
  runSubmitSdcCandidateTool,
  EXECUTION_CLASS,
  INBOX_DIR_RELATIVE,
};
