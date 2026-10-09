"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PACKETS_DIR_RELATIVE = path.join(".scaffoldai", "packets");
const INBOX_DIR_RELATIVE = path.join(".scaffoldai", "inbox");
const INTAKE_RUNTIME_DIR_RELATIVE = path.join(".scaffoldai", "runtime", "packet-intake");
const LATEST_INTAKE_RESULT_RELATIVE = path.join(INTAKE_RUNTIME_DIR_RELATIVE, "latest-intake.json");

const REQUIRED_SECTION_KEYS = [
  "MODE",
  "EXECUTION SURFACE",
  "APPROVAL",
  "GOAL",
  "TASKS",
  "VERIFY",
  "OUTPUT",
  "CONSTRAINTS",
];

const REQUIRED_APPROVAL_KEYS = ["execute", "commit"];
const ALLOWED_APPROVAL_VALUES = new Set(["PENDING", "APPROVED", "DENIED"]);
// Proposal text never grants approval: new proposals must arrive PENDING.
// Execution and commit authority come from local human commands, not packets.
const INGRESS_APPROVAL_VALUE = "PENDING";
const REVIEW_HASH_PATTERN = /^[0-9a-f]{64}$/;
// The only accepted APPROVAL form is one exact "APPROVAL:" header line followed
// by indented execute/commit entries. Any other line that looks like an
// approval header (inline, lowercase, indented) is malformed approval text.
const APPROVAL_HEADER_PATTERN = /^APPROVAL:\s*$/;
const APPROVAL_LIKE_LINE_PATTERN = /^\s*approval\s*:/i;
const REVIEW_HASH_GUIDANCE =
  "Run scaffoldai packet preview <path>, review the content, then rerun with --sha256 <review hash> " +
  "(npm: -- --sha256 <hash>; make: SHA256=<hash>).";
const ALLOWED_MODES = new Set([
  "PROCESS_REFACTOR",
  "PROCESS_VALIDATION",
  "PROCESS_DOCUMENTATION",
  "CONTRACT_REFACTOR",
  "PLANNING",
]);

const TITLE_PATTERN = /^# SDC — (.+)$/;
const CANONICAL_SECTION_ORDER = [...REQUIRED_SECTION_KEYS];

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function ensureTrailingNewline(content) {
  return content.endsWith("\n") ? content : `${content}\n`;
}

// Review hash: sha256 of the normalized packet text (trailing newline ensured).
// scaffoldai packet preview prints it; intake and activation require it, so the
// bytes that are accepted are the bytes the human reviewed.
function reviewHash(content) {
  return crypto.createHash("sha256").update(ensureTrailingNewline(content), "utf8").digest("hex");
}

// Returns null when expected matches content; otherwise the refusal code.
function checkReviewHash(content, expected) {
  if (typeof expected !== "string" || !expected.trim()) return "review_hash_required";
  const normalized = expected.trim().toLowerCase();
  if (!REVIEW_HASH_PATTERN.test(normalized) || normalized !== reviewHash(content)) return "review_hash_mismatch";
  return null;
}

function normalizeSlug(value) {
  return cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

function resolveSourcePath(repoRoot, inputPath) {
  if (!cleanString(inputPath)) {
    throw new Error("intake path is required");
  }

  const raw = String(inputPath).trim();
  const absolutePath = path.isAbsolute(raw) ? raw : path.resolve(repoRoot, raw);

  if (!absolutePath.toLowerCase().endsWith(".md")) {
    throw new Error("intake source must be a markdown file (.md)");
  }

  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    throw new Error(`intake source not found: ${absolutePath}`);
  }

  return absolutePath;
}

function readSourceMarkdown(repoRoot, inputPath) {
  const sourcePath = resolveSourcePath(repoRoot, inputPath);
  return {
    source_path: sourcePath,
    content: fs.readFileSync(sourcePath, "utf8"),
  };
}

function isSourceInsideInbox(repoRoot, sourcePath) {
  const inboxRoot = path.resolve(repoRoot, INBOX_DIR_RELATIVE);
  const absoluteSource = path.resolve(sourcePath);
  return absoluteSource === inboxRoot || absoluteSource.startsWith(`${inboxRoot}${path.sep}`);
}

function getFirstNonEmptyLine(content) {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function parseTitle(content) {
  const firstLine = getFirstNonEmptyLine(content);
  if (!firstLine) {
    return { valid: false, title: null, error: "missing title line" };
  }

  const match = firstLine.match(TITLE_PATTERN);
  if (!match || !cleanString(match[1])) {
    return {
      valid: false,
      title: null,
      error: 'title must match "# SDC — <title>" exactly',
    };
  }

  return {
    valid: true,
    title: cleanString(match[1]),
    error: null,
  };
}

function hasSection(content, sectionKey) {
  const escaped = sectionKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escaped}:\\s*(?:$|\\S)`, "m");
  return pattern.test(content);
}

function collectMissingSections(content) {
  const missing = [];
  for (const sectionKey of REQUIRED_SECTION_KEYS) {
    if (!hasSection(content, sectionKey)) {
      missing.push(sectionKey);
    }
  }
  return missing;
}

function collectSectionOrderIssues(content) {
  const positions = [];

  for (const sectionKey of CANONICAL_SECTION_ORDER) {
    const escaped = sectionKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`^${escaped}:\\s*(?:$|\\S)`, "m");
    const match = pattern.exec(content);
    if (!match) continue;

    positions.push({
      section: sectionKey,
      index: match.index,
      expectedOrder: CANONICAL_SECTION_ORDER.indexOf(sectionKey),
    });
  }

  const issues = [];
  const sourceOrdered = positions.sort((left, right) => left.index - right.index);
  for (let index = 1; index < sourceOrdered.length; index += 1) {
    const previous = sourceOrdered[index - 1];
    const current = sourceOrdered[index];
    if (previous.expectedOrder > current.expectedOrder) {
      issues.push(
        `section out of canonical order: ${current.section} appears before ${previous.section}`
      );
    }
  }

  return issues;
}

function parseMode(content) {
  const match = content.match(/^MODE:\s*([A-Z_]+)\s*$/m);
  if (!match) {
    return { value: null, error: "missing MODE section" };
  }

  const mode = cleanString(match[1]);
  if (!ALLOWED_MODES.has(mode)) {
    return { value: mode, error: `blocked or unknown MODE: ${mode}` };
  }

  return { value: mode, error: null };
}

// True when any line looks like an approval header, in any form.
function hasApprovalLikeLine(content) {
  return content.split(/\r?\n/).some((line) => APPROVAL_LIKE_LINE_PATTERN.test(line));
}

function parseApprovalBlock(content) {
  const lines = content.split(/\r?\n/);
  const headerIndexes = [];
  const headerErrors = [];
  lines.forEach((line, index) => {
    if (!APPROVAL_LIKE_LINE_PATTERN.test(line)) return;
    if (APPROVAL_HEADER_PATTERN.test(line.trimEnd())) {
      headerIndexes.push(index);
    } else {
      headerErrors.push(`malformed APPROVAL header: ${line.trim()}`);
    }
  });

  if (headerIndexes.length === 0) {
    return {
      values: null,
      errors: ["missing APPROVAL block", ...headerErrors],
    };
  }

  if (headerIndexes.length > 1) {
    headerErrors.push("duplicate APPROVAL block: exactly one APPROVAL block is allowed");
  }
  const startIndex = headerIndexes[0];

  const parsed = {};
  const malformed = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line.trim()) {
      continue;
    }

    if (/^[A-Z][A-Z _-]+:\s*/.test(line)) {
      break;
    }

    const match = line.match(/^\s{2,}([a-z_]+):\s*([A-Z]+)\s*$/);
    if (!match) {
      malformed.push(`malformed APPROVAL entry: ${line.trim()}`);
      continue;
    }

    const key = match[1];
    if (!REQUIRED_APPROVAL_KEYS.includes(key)) {
      malformed.push(`unknown APPROVAL key: ${key} (only execute and commit are supported)`);
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(parsed, key)) {
      malformed.push(`duplicate APPROVAL.${key}`);
      continue;
    }

    parsed[key] = match[2];
  }

  const errors = [...headerErrors, ...malformed];
  for (const key of REQUIRED_APPROVAL_KEYS) {
    if (!parsed[key]) {
      errors.push(`missing APPROVAL.${key}`);
      continue;
    }

    if (!ALLOWED_APPROVAL_VALUES.has(parsed[key])) {
      errors.push(`invalid APPROVAL.${key}: ${parsed[key]}`);
      continue;
    }

    if (parsed[key] !== INGRESS_APPROVAL_VALUE) {
      errors.push(
        `APPROVAL.${key} must be PENDING at proposal ingress; approval is granted locally, not by packet text (found ${parsed[key]})`
      );
    }
  }

  return {
    values: parsed,
    errors,
  };
}

function isNegatedPolicyLine(line) {
  return /\b(no|not|without|never|forbid|forbidden|disallow|disallowed|reject|rejected|deny|denied)\b/i.test(line);
}

function collectBlockedPolicyReasons(content) {
  const blocked = [];
  const lines = content.split(/\r?\n/);

  const policyChecks = [
    {
      pattern: /autonomous execution|automatic execution|auto[- ]execute/i,
      reason: "requests autonomous execution",
    },
    {
      pattern: /http mcp write authority|mcp write authority|http write authority/i,
      reason: "requests HTTP MCP write authority",
    },
    {
      pattern: /automatic commits|automatic commit|auto[- ]commit|commit automatically/i,
      reason: "requests automatic commits",
    },
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || isNegatedPolicyLine(trimmed)) {
      continue;
    }

    for (const check of policyChecks) {
      if (check.pattern.test(trimmed)) {
        blocked.push(check.reason);
      }
    }
  }

  return Array.from(new Set(blocked));
}

function buildPacketIdentity(title) {
  const slug = normalizeSlug(title);
  if (!slug) {
    return {
      packet_id: null,
      file_name: null,
      normalized_slug: null,
      error: "title does not produce a valid packet filename",
    };
  }

  return {
    packet_id: `${slug}.sdc`,
    file_name: `${slug}.sdc.md`,
    normalized_slug: slug,
    error: null,
  };
}

function buildRecoveryHints(validation) {
  const hints = [];

  if (!validation.title_valid) {
    hints.push('Use the exact title form: "# SDC — <Title>" as the first non-empty line.');
  }

  if (validation.missing_sections.length > 0 || validation.section_order_issues.length > 0) {
    hints.push(
      `Include sections in canonical order: ${CANONICAL_SECTION_ORDER.join(" -> ")}.`
    );
  }

  if (validation.approval_errors.length > 0) {
    hints.push('Format APPROVAL exactly as:\nAPPROVAL:\n  execute: PENDING\n  commit: PENDING');
  }

  if (validation.mode_error) {
    hints.push(`Use one of the allowed MODE values: ${Array.from(ALLOWED_MODES).join(", ")}.`);
  }

  if (validation.blocked_policy_reasons.length > 0) {
    hints.push("Remove authority-escalation requests such as MCP write authority, autonomous execution, or automatic commits.");
  }

  hints.push("Use .scaffoldai/templates/canonical-sdc-packet-template.sdc.md and .scaffoldai/examples/canonical-sdc-packet-example.sdc.md as the canonical baseline, then rerun scaffoldai packet intake <path>.");

  return Array.from(new Set(hints));
}

function validateStrictSdcPacket(content) {
  const title = parseTitle(content);
  const missingSections = collectMissingSections(content);
  const sectionOrderIssues = collectSectionOrderIssues(content);
  const mode = parseMode(content);
  const approval = parseApprovalBlock(content);
  const blockedPolicyReasons = collectBlockedPolicyReasons(content);

  const errors = [];
  if (!title.valid) errors.push(title.error);
  if (missingSections.length > 0) {
    errors.push(`missing required sections: ${missingSections.join(", ")}`);
  }
  errors.push(...sectionOrderIssues);
  if (mode.error) errors.push(mode.error);
  errors.push(...approval.errors);
  errors.push(...blockedPolicyReasons);

  const identity = title.valid
    ? buildPacketIdentity(title.title)
    : {
      packet_id: null,
      file_name: null,
      normalized_slug: null,
      error: null,
    };
  if (identity.error) errors.push(identity.error);

  return {
    valid: errors.length === 0,
    errors,
    title_valid: title.valid,
    missing_sections: missingSections,
    section_order_issues: sectionOrderIssues,
    approval_errors: approval.errors,
    mode_error: mode.error,
    blocked_policy_reasons: blockedPolicyReasons,
    packet_title: title.title,
    mode: mode.value,
    approval: approval.values,
    packet_id: identity.packet_id,
    file_name: identity.file_name,
    normalized_slug: identity.normalized_slug,
    normalized_content: ensureTrailingNewline(content),
    recovery_hints: [],
  };
}

function writeLatestIntakeResult(repoRoot, result) {
  const absolutePath = path.join(repoRoot, LATEST_INTAKE_RESULT_RELATIVE);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, JSON.stringify(result, null, 2) + "\n", "utf8");
}

function readLatestIntakeResult(repoRoot) {
  const absolutePath = path.join(repoRoot, LATEST_INTAKE_RESULT_RELATIVE);
  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (_error) {
    return null;
  }
}

function intakePacket(repoRoot, inputPath, options = {}) {
  const source = readSourceMarkdown(repoRoot, inputPath);
  const sourceFileName = path.basename(source.source_path);

  // Refuse before any write unless the content is exactly what was reviewed.
  const hashError = checkReviewHash(source.content, options.expectedSha256);
  if (hashError) {
    const message = hashError === "review_hash_required"
      ? "a review hash is required to intake a packet"
      : "packet content does not match the reviewed hash";
    return {
      status: "REJECTED",
      accepted: false,
      source_path: source.source_path,
      packet_id: null,
      file_name: null,
      packet_title: null,
      mode: null,
      review_hash_error: hashError,
      validation_errors: [message],
      missing_sections: [],
      blocked_policy_reasons: [],
      warnings: [],
      next_safe_action: REVIEW_HASH_GUIDANCE,
      recorded_at: new Date().toISOString(),
    };
  }
  const sourceInInbox = isSourceInsideInbox(repoRoot, source.source_path);
  const warnings = sourceInInbox
    ? []
    : [
      "intake source is outside .scaffoldai/inbox; preferred path is .scaffoldai/inbox/*.sdc.md",
    ];
  const validation = validateStrictSdcPacket(source.content);
  validation.recovery_hints = buildRecoveryHints(validation);

  if (!validation.valid) {
    const rejected = {
      status: "REJECTED",
      accepted: false,
      source_path: source.source_path,
      packet_id: validation.packet_id,
      file_name: validation.file_name,
      normalized_slug: validation.normalized_slug,
      packet_title: validation.packet_title,
      mode: validation.mode,
      identity: {
        packet_id: validation.packet_id,
        durable_packet_file: validation.file_name,
        normalized_slug: validation.normalized_slug,
        packet_title: validation.packet_title,
        source_filename: sourceFileName,
      },
      validation_errors: validation.errors,
      missing_sections: validation.missing_sections,
      section_order_issues: validation.section_order_issues,
      blocked_policy_reasons: validation.blocked_policy_reasons,
      recovery_hints: validation.recovery_hints,
      source_in_inbox: sourceInInbox,
      warnings,
      next_safe_action: "Repair the packet using the canonical SDC template/example, then rerun scaffoldai packet intake <path>.",
      recorded_at: new Date().toISOString(),
    };

    writeLatestIntakeResult(repoRoot, rejected);
    return rejected;
  }

  const packetsDir = path.join(repoRoot, PACKETS_DIR_RELATIVE);
  const targetPath = path.join(packetsDir, validation.file_name);
  fs.mkdirSync(packetsDir, { recursive: true });
  let reusedExistingPacket = false;
  const acceptedWarnings = [...warnings];

  if (fs.existsSync(targetPath)) {
    const existing = fs.readFileSync(targetPath, "utf8");
    if (existing !== validation.normalized_content) {
      const conflict = {
        status: "REJECTED",
        accepted: false,
        source_path: source.source_path,
        packet_id: validation.packet_id,
        file_name: validation.file_name,
        normalized_slug: validation.normalized_slug,
        packet_title: validation.packet_title,
        mode: validation.mode,
        identity: {
          packet_id: validation.packet_id,
          durable_packet_file: validation.file_name,
          normalized_slug: validation.normalized_slug,
          packet_title: validation.packet_title,
          source_filename: sourceFileName,
        },
        validation_errors: [`normalized packet filename already exists: ${validation.file_name}`],
        missing_sections: [],
        blocked_policy_reasons: [],
        source_in_inbox: sourceInInbox,
        warnings,
        next_safe_action: "Rename the packet title or remove the conflicting packet, then rerun intake.",
        recorded_at: new Date().toISOString(),
      };

      writeLatestIntakeResult(repoRoot, conflict);
      return conflict;
    }

    reusedExistingPacket = true;
    acceptedWarnings.push("normalized packet filename already existed with identical content; reusing durable packet identity");
  } else {
    fs.writeFileSync(targetPath, validation.normalized_content, "utf8");
  }

  const accepted = {
    status: "ACCEPTED",
    accepted: true,
    source_path: source.source_path,
    packet_id: validation.packet_id,
    file_name: validation.file_name,
    normalized_slug: validation.normalized_slug,
    packet_title: validation.packet_title,
    mode: validation.mode,
    packet_path: path.join(PACKETS_DIR_RELATIVE, validation.file_name).split(path.sep).join("/"),
    approval: validation.approval,
    normalized: true,
    reused_existing_packet: reusedExistingPacket,
    identity: {
      packet_id: validation.packet_id,
      durable_packet_file: validation.file_name,
      normalized_slug: validation.normalized_slug,
      packet_title: validation.packet_title,
      source_filename: sourceFileName,
    },
    source_in_inbox: sourceInInbox,
    warnings: acceptedWarnings,
    next_safe_action: "Packet accepted. Activate it explicitly with --activate or scaffoldai packet activate <packet> when ready.",
    recorded_at: new Date().toISOString(),
  };

  writeLatestIntakeResult(repoRoot, accepted);
  return accepted;
}

module.exports = {
  ALLOWED_APPROVAL_VALUES,
  ALLOWED_MODES,
  INGRESS_APPROVAL_VALUE,
  REVIEW_HASH_GUIDANCE,
  checkReviewHash,
  hasApprovalLikeLine,
  reviewHash,
  REQUIRED_APPROVAL_KEYS,
  REQUIRED_SECTION_KEYS,
  LATEST_INTAKE_RESULT_RELATIVE,
  buildPacketIdentity,
  intakePacket,
  parseTitle,
  parseApprovalBlock,
  parseMode,
  readLatestIntakeResult,
  validateStrictSdcPacket,
  CANONICAL_SECTION_ORDER,
  writeLatestIntakeResult,
};