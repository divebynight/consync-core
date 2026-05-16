"use strict";

const fs = require("fs");
const path = require("path");
const { getRepoRoot } = require("../../lib/repoRoot.util.shared");
const { validateStrictSdcPacket } = require("../../lib/scaffoldaiPacketIntake.auth.scaffoldai");

const INBOX_DIR_RELATIVE = path.join(".scaffoldai", "inbox");
const EXECUTION_CLASS = "LOCAL_CANDIDATE_INBOX_WRITE_ONLY";
const MAX_CONTENT_BYTES = 32 * 1024;
const MAX_SUBMITTED_BY_LENGTH = 64;
const MAX_FILE_STEM_LENGTH = 96;
const TOOL_NAME = "scaffoldai_submit_sdc_candidate";

const ERROR_CATEGORY = {
  SCHEMA_INPUT_MISMATCH: "schema_input_mismatch",
  VALIDATION_FAILURE: "validation_failure",
  SIZE_LIMIT: "size_limit",
  DUPLICATE_OR_PENDING_CANDIDATE: "duplicate_or_pending_candidate_guard",
  MISSING_INBOX: "missing_inbox",
  FILESYSTEM_WRITE_ERROR: "filesystem_write_error",
  GUARD_FAILURE: "guard_failure",
};

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

function listInboxCandidateFiles(inboxRoot) {
  if (!fs.existsSync(inboxRoot)) return [];
  return fs
    .readdirSync(inboxRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.toLowerCase().endsWith(".sdc.md"));
}

function findPendingCandidateCollision(inboxRoot, targetFileName, packetId) {
  const files = listInboxCandidateFiles(inboxRoot);
  for (const fileName of files) {
    if (fileName === targetFileName) {
      return {
        collided: true,
        reason: `candidate file already exists: ${fileName}`,
        existing_file: fileName,
      };
    }

    const candidatePath = path.join(inboxRoot, fileName);
    let content;
    try {
      content = fs.readFileSync(candidatePath, "utf8");
    } catch {
      continue;
    }

    const validation = validateStrictSdcPacket(content);
    if (!validation.valid || !validation.packet_id) {
      continue;
    }

    if (validation.packet_id === packetId) {
      return {
        collided: true,
        reason: `pending candidate already exists for packet id: ${packetId}`,
        existing_file: fileName,
      };
    }
  }

  return {
    collided: false,
    reason: null,
    existing_file: null,
  };
}

function baseResponse() {
  return {
    tool: TOOL_NAME,
    execution_class: EXECUTION_CLASS,
    candidate_submitted: false,
    candidate_path: null,
    accepted: false,
    activated: false,
    claimed: false,
    active_runtime_mutated: false,
    next_action_mutated: false,
    validation_errors: [],
    guard_errors: [],
  };
}

function reject(payload) {
  return {
    ...baseResponse(),
    status: "rejected",
    ...payload,
  };
}

function runSubmitSdcCandidateTool(input = {}, options = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return reject({
      error_category: ERROR_CATEGORY.SCHEMA_INPUT_MISMATCH,
      reason: "input must be an object",
      guard_errors: ["input payload must be a JSON object"],
      next_safe_action: "Call scaffoldai_submit_sdc_candidate with object arguments containing markdown content.",
    });
  }

  const repoRoot = options.repoRoot || getRepoRoot(__dirname);
  const content = input.content;
  const submittedBy = sanitizeSubmittedBy(input.submittedBy);
  const disallowedInputKeys = ["path", "filePath", "sourcePath", "source", "candidatePath"].filter(
    (key) => Object.prototype.hasOwnProperty.call(input, key)
  );

  if (disallowedInputKeys.length > 0) {
    return reject({
      error_category: ERROR_CATEGORY.SCHEMA_INPUT_MISMATCH,
      reason: "path-based submission is not allowed; provide markdown content only",
      guard_errors: [`disallowed input keys: ${disallowedInputKeys.join(", ")}`],
      next_safe_action: "Pass candidate markdown via the content field and omit path-oriented fields.",
    });
  }

  if (typeof content !== "string") {
    return reject({
      error_category: ERROR_CATEGORY.SCHEMA_INPUT_MISMATCH,
      reason: "content must be a markdown string",
      guard_errors: ["content type mismatch"],
      next_safe_action: "Provide content as a UTF-8 markdown string.",
    });
  }

  if (cleanString(content).length === 0) {
    return reject({
      error_category: ERROR_CATEGORY.SCHEMA_INPUT_MISMATCH,
      reason: "content is required",
      guard_errors: ["content must not be empty"],
      next_safe_action: "Provide canonical SDC markdown content and retry submission.",
    });
  }

  if (Buffer.byteLength(content, "utf8") > MAX_CONTENT_BYTES) {
    return reject({
      error_category: ERROR_CATEGORY.SIZE_LIMIT,
      reason: `content exceeds ${MAX_CONTENT_BYTES} bytes`,
      guard_errors: [`content exceeds size limit (${MAX_CONTENT_BYTES} bytes)`],
      next_safe_action: "Reduce candidate content size and retry submission.",
    });
  }

  if (Object.prototype.hasOwnProperty.call(input, "submittedBy") && !submittedBy) {
    return reject({
      error_category: ERROR_CATEGORY.SCHEMA_INPUT_MISMATCH,
      reason: "submittedBy must be alphanumeric with . _ - and at most 64 characters",
      guard_errors: ["submittedBy failed format validation"],
      next_safe_action: "Use a valid submittedBy value or omit it.",
    });
  }

  const validation = validateStrictSdcPacket(content);
  if (!validation.valid) {
    return reject({
      error_category: ERROR_CATEGORY.VALIDATION_FAILURE,
      reason: "candidate failed intake-compatible validation",
      validation_errors: validation.errors,
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
      error_category: ERROR_CATEGORY.GUARD_FAILURE,
      reason: nameResolution.reason,
      guard_errors: [nameResolution.reason],
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

  if (!fs.existsSync(inboxRoot) || !fs.statSync(inboxRoot).isDirectory()) {
    return reject({
      error_category: ERROR_CATEGORY.MISSING_INBOX,
      reason: `missing inbox directory: ${INBOX_DIR_RELATIVE}`,
      guard_errors: ["inbox directory does not exist"],
      next_safe_action: "Create .scaffoldai/inbox/ and retry candidate submission.",
    });
  }

  if (!isWithinDirectory(candidatePath, inboxRoot)) {
    return reject({
      error_category: ERROR_CATEGORY.GUARD_FAILURE,
      reason: "resolved candidate path escapes inbox boundary",
      guard_errors: ["resolved path escapes .scaffoldai/inbox/ boundary"],
      next_safe_action: "Retry with a safe suggestedFileName.",
    });
  }

  const collision = findPendingCandidateCollision(
    inboxRoot,
    nameResolution.fileName,
    validation.packet_id
  );
  if (collision.collided) {
    return reject({
      error_category: ERROR_CATEGORY.DUPLICATE_OR_PENDING_CANDIDATE,
      reason: collision.reason,
      guard_errors: [collision.reason],
      candidate_path: path.join(INBOX_DIR_RELATIVE, collision.existing_file).split(path.sep).join("/"),
      validation: {
        valid: true,
        packet_title: validation.packet_title,
        packet_id: validation.packet_id,
        canonical_file_name: validation.file_name,
        normalized_slug: validation.normalized_slug,
      },
      next_safe_action: "Resolve or remove the pending duplicate candidate before retrying submission.",
    });
  }

  const relativePath = path.join(INBOX_DIR_RELATIVE, nameResolution.fileName).split(path.sep).join("/");
  try {
    fs.writeFileSync(candidatePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
  } catch (error) {
    return reject({
      error_category: ERROR_CATEGORY.FILESYSTEM_WRITE_ERROR,
      reason: `failed to write candidate file: ${error.message}`,
      guard_errors: ["filesystem write failed"],
      next_safe_action: "Check inbox permissions and available disk, then retry submission.",
    });
  }

  const warnings = [];
  if (nameResolution.fileName !== validation.file_name) {
    warnings.push(
      `candidate filename differs from canonical intake filename (${validation.file_name}); intake identity remains title-derived`
    );
  }

  return {
    ...baseResponse(),
    status: "accepted",
    error_category: null,
    candidate_submitted: true,
    candidate_path: relativePath,
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
