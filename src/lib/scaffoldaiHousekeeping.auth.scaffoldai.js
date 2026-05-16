"use strict";

const fs = require("fs");
const path = require("path");

const scaffoldaiState = require("./scaffoldaiState.state.scaffoldai");
const { parseHandoff } = require("./stateIntegrityCheck.check.scaffoldai");
const {
  readLatestIntakeResult,
  LATEST_INTAKE_RESULT_RELATIVE,
} = require("./scaffoldaiPacketIntake.auth.scaffoldai");
const { getGitStatus } = require("./gitStatus.util.shared");
const { getClaimStatus } = require("./packetClaim.auth.scaffoldai");

const STATE_ROOT = path.join(".scaffoldai", "state");

const RUNTIME_STATE_FILES = [
  {
    relativePath: path.join(".scaffoldai", "state", "active-runtime.json"),
    category: "active execution state",
    safeToReset: true,
    reason: "Tracks in-flight packet context and should be neutralized to in_flight_packet: null between packets.",
  },
  {
    relativePath: path.join(".scaffoldai", "contracts", "active-policy.json"),
    category: "durable process policy",
    safeToReset: false,
    reason: "Tracked policy source for mode and packet constraints; should not be reset by runtime housekeeping.",
  },
  {
    relativePath: path.join(".scaffoldai", "state", "next-action.md"),
    category: "next-action surfaces",
    safeToReset: true,
    reason: "Represents mounted packet context and can be reset to PACKAGE: NONE after runtime operations.",
  },
  {
    relativePath: path.join(".scaffoldai", "state", "snapshot.md"),
    category: "snapshots",
    safeToReset: true,
    reason: "Carries fast re-entry package pointer and can be neutralized to package NONE.",
  },
  {
    relativePath: path.join(".scaffoldai", "state", "history.jsonl"),
    category: "append-only runtime logs",
    safeToReset: false,
    reason: "Append-only operational audit log; preserved by default unless runtime log reset is explicitly requested.",
  },
  {
    relativePath: path.join(".scaffoldai", "runtime", "mcp", "signals.jsonl"),
    category: "transient coordination/runtime context",
    safeToReset: false,
    reason: "Append-only MCP runtime signals; preserved by default unless runtime log reset is explicitly requested.",
  },
  {
    relativePath: path.join(".scaffoldai", "runtime", "mcp", "shared-memory.jsonl"),
    category: "transient coordination/runtime context",
    safeToReset: false,
    reason: "Append-only MCP shared-memory diagnostics; preserved by default unless runtime log reset is explicitly requested.",
  },
];

const DURABLE_POLICY_FILES = new Set(
  RUNTIME_STATE_FILES
    .filter((entry) => entry.category === "durable process policy")
    .map((entry) => normalizePath(entry.relativePath))
);

const RUNTIME_LOG_FILES = new Set(
  RUNTIME_STATE_FILES
    .filter((entry) => !entry.safeToReset && entry.category !== "durable process policy")
    .map((entry) => normalizePath(entry.relativePath))
);

const INBOX_RELATIVE = path.join(".scaffoldai", "inbox");

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

function parseGitStatusPath(line) {
  if (!line || typeof line !== "string") return null;

  const trimmed = line.trim();
  const match = trimmed.match(/^[A-Z?]{1,2}\s+(.*)$/);
  if (!match) return null;

  const rawPath = match[1].trim();
  if (!rawPath) return null;

  if (rawPath.includes(" -> ")) {
    const parts = rawPath.split(" -> ");
    return normalizePath(parts[parts.length - 1]);
  }

  return normalizePath(rawPath);
}

function classifyRuntimeStateChanges(gitStatus) {
  const indexByPath = new Map(
    RUNTIME_STATE_FILES.map((entry) => [normalizePath(entry.relativePath), entry])
  );

  const runtimeChanges = [];
  const durablePolicyChanges = [];
  const implementationChanges = [];
  const unknownLines = [];

  for (const line of gitStatus.files || []) {
    const parsedPath = parseGitStatusPath(line);

    if (!parsedPath) {
      unknownLines.push(line);
      continue;
    }

    const classification = indexByPath.get(parsedPath);

    if (!classification) {
      implementationChanges.push({ line, path: parsedPath });
      continue;
    }

    if (DURABLE_POLICY_FILES.has(parsedPath)) {
      const entry = {
        line,
        path: parsedPath,
        category: classification.category,
        reason: classification.reason,
      };
      durablePolicyChanges.push(entry);
      implementationChanges.push({
        line,
        path: parsedPath,
        category: classification.category,
      });
      continue;
    }

    runtimeChanges.push({
      line,
      path: parsedPath,
      category: classification.category,
      safe_to_reset: classification.safeToReset,
      reason: classification.reason,
      log_reset_required: RUNTIME_LOG_FILES.has(parsedPath),
    });
  }

  return {
    runtimeChanges,
    durablePolicyChanges,
    implementationChanges,
    unknownLines,
  };
}

function gatherHousekeepingStatus(repoRoot, options = {}) {
  const git = options.gitStatus || getGitStatus(repoRoot);
  const classification = classifyRuntimeStateChanges(git);

  const safeToReset = classification.runtimeChanges.filter((entry) => entry.safe_to_reset);
  const runtimeLogsDetected = classification.runtimeChanges.filter((entry) => entry.log_reset_required);

  let status = "CLEAN";

  if (classification.runtimeChanges.length > 0 && classification.implementationChanges.length > 0) {
    status = "MIXED";
  } else if (classification.runtimeChanges.length > 0) {
    status = "RUNTIME_ONLY";
  } else if (classification.implementationChanges.length > 0) {
    status = "IMPLEMENTATION_ONLY";
  }

  return {
    tool: "scaffoldai_housekeeping_status",
    execution_class: "READ_ONLY",
    status,
    data: {
      runtime_state_catalog: RUNTIME_STATE_FILES.map((entry) => ({
        path: normalizePath(entry.relativePath),
        category: entry.category,
        safe_to_reset: entry.safeToReset,
        reason: entry.reason,
      })),
      git,
      runtime_changes: classification.runtimeChanges,
      durable_policy_changes: classification.durablePolicyChanges,
      implementation_changes: classification.implementationChanges,
      unknown_git_lines: classification.unknownLines,
      safe_to_reset: safeToReset,
      runtime_logs_detected: runtimeLogsDetected,
    },
    next_safe_action:
      safeToReset.length > 0
        ? "Run scaffoldai housekeeping reset-runtime-state to neutralize active runtime state files."
        : "No resettable runtime-state changes detected.",
  };
}

function neutralNextActionContent() {
  return [
    "TYPE: REFACTOR",
    "PACKAGE: NONE",
    "",
    "No active in-flight packet.",
    "Mount the next packet intentionally before execution.",
    "",
  ].join("\n");
}

function neutralizeSnapshotContent(snapshotContent) {
  if (!snapshotContent) return null;

  let updated = snapshotContent;

  if (/^(- type:\s*)`[^`]*`$/m.test(updated)) {
    updated = updated.replace(/^(- type:\s*)`[^`]*`$/m, "$1`REFACTOR`");
  }

  if (/^(- package:\s*)`[^`]*`$/m.test(updated)) {
    updated = updated.replace(/^(- package:\s*)`[^`]*`$/m, "$1`NONE`");
  }

  return updated;
}

function assertScaffoldaiBoundary(repoRoot, relativePath) {
  const absolute = path.resolve(repoRoot, relativePath);
  const scaffoldaiRoot = path.resolve(repoRoot, ".scaffoldai");

  if (!(absolute === scaffoldaiRoot || absolute.startsWith(`${scaffoldaiRoot}${path.sep}`))) {
    throw new Error(`path is outside .scaffoldai boundary: ${relativePath}`);
  }

  return absolute;
}

function resetRuntimeState(repoRoot, options = {}) {
  const includeRuntimeLogs = options.includeRuntimeLogs === true;
  const touched = [];
  const skipped = [];
  const warnings = [];

  const policy = scaffoldaiState.readActivePolicy(repoRoot);
  if (!policy || typeof policy !== "object") {
    return {
      tool: "scaffoldai_housekeeping_reset_runtime_state",
      execution_class: "LOCAL_WRITE_BOUNDED",
      status: "BLOCKED",
      blockers: ["active-policy.json missing or malformed"],
      data: {
        include_runtime_logs: includeRuntimeLogs,
        touched,
        skipped,
      },
      next_safe_action: "Repair .scaffoldai/contracts/active-policy.json before running housekeeping reset.",
    };
  }

  scaffoldaiState.writeActiveRuntime(repoRoot, { in_flight_packet: null });
  touched.push(".scaffoldai/state/active-runtime.json");

  scaffoldaiState.writeNextAction(repoRoot, neutralNextActionContent());
  touched.push(".scaffoldai/state/next-action.md");

  const currentSnapshot = scaffoldaiState.readSnapshot(repoRoot);
  const neutralSnapshot = neutralizeSnapshotContent(currentSnapshot);
  if (neutralSnapshot !== null) {
    scaffoldaiState.writeSnapshot(repoRoot, neutralSnapshot);
    touched.push(".scaffoldai/state/snapshot.md");
  } else {
    warnings.push("snapshot.md missing or unreadable; skipped snapshot neutralization");
  }

  for (const logPath of RUNTIME_LOG_FILES) {
    if (!includeRuntimeLogs) {
      skipped.push({
        path: logPath,
        reason: "preserved by default (append-only runtime logs)",
      });
      continue;
    }

    const absolutePath = assertScaffoldaiBoundary(repoRoot, logPath);
    if (!fs.existsSync(absolutePath)) {
      skipped.push({
        path: logPath,
        reason: "not present",
      });
      continue;
    }

    fs.unlinkSync(absolutePath);
    touched.push(logPath);
  }

  const packetsRoot = assertScaffoldaiBoundary(repoRoot, path.join(".scaffoldai", "packets"));
  const packetFileCount = fs.existsSync(packetsRoot)
    ? fs.readdirSync(packetsRoot, { withFileTypes: true }).filter((entry) => entry.isFile()).length
    : 0;

  return {
    tool: "scaffoldai_housekeeping_reset_runtime_state",
    execution_class: "LOCAL_WRITE_BOUNDED",
    status: "PASS",
    blockers: [],
    warnings,
    data: {
      include_runtime_logs: includeRuntimeLogs,
      touched,
      skipped,
      packet_files_preserved: true,
      packet_file_count: packetFileCount,
      categories: [
        "active execution state",
        "snapshots",
        "next-action surfaces",
        "transient coordination/runtime context",
        "append-only runtime logs",
      ],
    },
    next_safe_action: "Review git status; commit implementation changes separately from runtime-state resets.",
  };
}

function normalizeRelativePath(value) {
  return value.split(path.sep).join("/");
}

function resolveWithinScaffoldAi(repoRoot, relativePath) {
  const resolved = path.resolve(repoRoot, relativePath);
  const scaffoldaiRoot = path.resolve(repoRoot, ".scaffoldai");
  if (!(resolved === scaffoldaiRoot || resolved.startsWith(`${scaffoldaiRoot}${path.sep}`))) {
    throw new Error(`path is outside .scaffoldai boundary: ${relativePath}`);
  }
  return resolved;
}

function isWithinDirectory(parent, candidate) {
  return candidate === parent || candidate.startsWith(`${parent}${path.sep}`);
}

function cleanIntakeArtifacts(repoRoot) {
  const touched = [];
  const skipped = [];
  const warnings = [];
  const removedPaths = [];
  const skippedPaths = [];
  const validationErrors = [];
  const guardErrors = [];

  const latestIntakePath = resolveWithinScaffoldAi(repoRoot, LATEST_INTAKE_RESULT_RELATIVE);
  const latestIntake = readLatestIntakeResult(repoRoot);
  const handoffText = scaffoldaiState.readHandoff(repoRoot);
  const handoff = handoffText ? parseHandoff(handoffText) : null;
  const terminalHandoff =
    handoff &&
    typeof handoff === "object" &&
    handoff.packageName &&
    (handoff.status === "PASS" || handoff.status === "FAIL")
      ? handoff
      : null;
  const packetClosed = Boolean(terminalHandoff);
  let cleanupPerformed = false;
  let inboxCandidateRemoved = false;
  let errorCategory = null;

  const inboxRoot = resolveWithinScaffoldAi(repoRoot, INBOX_RELATIVE);
  const packetsRoot = resolveWithinScaffoldAi(repoRoot, path.join(".scaffoldai", "packets"));

  if (!latestIntake || typeof latestIntake.source_path !== "string" || !latestIntake.source_path.trim()) {
    warnings.push("latest intake metadata missing or malformed; no consumed inbox candidate determined");
    validationErrors.push("latest intake metadata missing or malformed");
    errorCategory = "validation_failure";
  } else {
    const sourcePath = path.resolve(latestIntake.source_path.trim());
    const sourceRelativePath = normalizeRelativePath(path.relative(repoRoot, sourcePath));

    if (!isWithinDirectory(inboxRoot, sourcePath)) {
      skipped.push({
        path: latestIntake.source_path,
        reason: "outside inbox; cleanup is bounded to .scaffoldai/inbox",
      });
      skippedPaths.push(latestIntake.source_path);
    } else if (!latestIntake.packet_id || !latestIntake.file_name) {
      validationErrors.push("latest intake result is missing packet identity");
      errorCategory = errorCategory || "validation_failure";
      skipped.push({
        path: sourceRelativePath,
        reason: "latest intake result is missing packet identity",
      });
      skippedPaths.push(sourceRelativePath);
    } else if (!packetClosed) {
      skipped.push({
        path: sourceRelativePath,
        reason: "closeout not complete; completed inbox candidate not removed",
      });
      skippedPaths.push(sourceRelativePath);
    } else if (terminalHandoff.packageName !== latestIntake.packet_id) {
      guardErrors.push(
        `completed packet identity ${terminalHandoff.packageName} does not match inbox candidate ${latestIntake.packet_id}`
      );
      errorCategory = errorCategory || "guard_failure";
      skipped.push({
        path: sourceRelativePath,
        reason: `completed packet identity ${terminalHandoff.packageName} does not match inbox candidate ${latestIntake.packet_id}`,
      });
      skippedPaths.push(sourceRelativePath);
    } else if (!sourcePath.toLowerCase().endsWith(".sdc.md")) {
      guardErrors.push("latest intake source is not an inbox .sdc.md candidate");
      errorCategory = errorCategory || "guard_failure";
      skipped.push({
        path: sourceRelativePath,
        reason: "not an inbox .sdc.md candidate",
      });
      skippedPaths.push(sourceRelativePath);
    } else if (isWithinDirectory(packetsRoot, sourcePath)) {
      guardErrors.push("latest intake source points at a durable packet surface");
      errorCategory = errorCategory || "guard_failure";
      skipped.push({
        path: sourceRelativePath,
        reason: "accepted packet surface is durable and never cleaned here",
      });
      skippedPaths.push(sourceRelativePath);
    } else if (!fs.existsSync(sourcePath)) {
      skipped.push({
        path: sourceRelativePath,
        reason: "originating inbox candidate missing",
      });
      skippedPaths.push(sourceRelativePath);
      warnings.push("originating inbox candidate is missing; cleanup is idempotent and preserved this state");
    } else {
      fs.unlinkSync(sourcePath);
      touched.push(sourceRelativePath);
      removedPaths.push(sourceRelativePath);
      cleanupPerformed = true;
      inboxCandidateRemoved = true;

      if (fs.existsSync(latestIntakePath)) {
        fs.unlinkSync(latestIntakePath);
        removedPaths.push(normalizeRelativePath(LATEST_INTAKE_RESULT_RELATIVE));
      }
    }
  }

  const packetFileCount = fs.existsSync(packetsRoot)
    ? fs.readdirSync(packetsRoot, { withFileTypes: true }).filter((entry) => entry.isFile()).length
    : 0;

  return {
    tool: "scaffoldai_housekeeping_clean_intake_artifacts",
    execution_class: "LOCAL_WRITE_BOUNDED",
    status: "PASS",
    blockers: [],
    warnings,
    data: {
      packet_closed: packetClosed,
      cleanup_performed: cleanupPerformed,
      inbox_candidate_removed: inboxCandidateRemoved,
      removed_paths: removedPaths,
      skipped_paths: skippedPaths,
      validation_errors: validationErrors,
      guard_errors: guardErrors,
      error_category: errorCategory,
      touched,
      skipped,
      latest_intake_cleared: removedPaths.includes(normalizeRelativePath(LATEST_INTAKE_RESULT_RELATIVE)),
      packet_files_preserved: true,
      packet_file_count: packetFileCount,
    },
    next_safe_action: packetClosed
      ? "Review git status and proceed with explicit packet activation when ready."
      : "Complete closeout before rerunning cleanup so the matching inbox candidate can be removed.",
  };
}

function mergeUniqueStrings(primary = [], secondary = []) {
  return Array.from(new Set([...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])]));
}

function mergeSkippedEntries(primary = [], secondary = []) {
  const combined = [...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])];
  const seen = new Set();
  const unique = [];

  for (const entry of combined) {
    if (!entry || typeof entry !== "object") continue;
    const pathValue = typeof entry.path === "string" ? entry.path : "";
    const reasonValue = typeof entry.reason === "string" ? entry.reason : "";
    const key = `${pathValue}::${reasonValue}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ path: pathValue, reason: reasonValue });
  }

  return unique;
}

function cleanWorkspace(repoRoot, options = {}) {
  // F08: Cleanup safety precondition - reject if active claim exists
  const claimStatus = getClaimStatus(repoRoot);
  if (claimStatus.has_claim) {
    return {
      tool: "scaffoldai_housekeeping_clean_workspace",
      execution_class: "LOCAL_WRITE_BOUNDED",
      status: "BLOCKED",
      reason: "active_claim_exists",
      blockers: [`Cleanup blocked: active claim exists (claimed by "${claimStatus.claimed_by}"). Release claim before cleanup.`],
      warnings: [],
      data: {
        include_runtime_logs: options.includeRuntimeLogs === true,
        intake_artifacts_cleaned: false,
        runtime_state_reset: false,
        packet_closed: false,
        cleanup_performed: false,
        inbox_candidate_removed: false,
        removed_paths: [],
        skipped_paths: [],
        validation_errors: [],
        guard_errors: [],
        error_category: "guard_failure",
        touched: [],
        skipped: [],
        packet_files_preserved: true,
        packet_file_count: 0,
        logs_preserved: true,
        durable_surfaces_preserved: [
          ".scaffoldai/packets/",
          ".scaffoldai/state/history.jsonl",
          ".scaffoldai/runtime/mcp/signals.jsonl",
          ".scaffoldai/runtime/mcp/shared-memory.jsonl",
          ".scaffoldai/contracts/",
          "src/",
        ],
        cleaned_transient_surfaces: [],
      },
      next_safe_action: `Release active claim (claimed by "${claimStatus.claimed_by}") before cleanup. Use 'scaffoldai packet release --client <id>' or contact claim holder.`,
    };
  }

  const intake = cleanIntakeArtifacts(repoRoot);
  const runtime = resetRuntimeState(repoRoot, {
    includeRuntimeLogs: options.includeRuntimeLogs === true,
  });

  const status = runtime.status === "BLOCKED" || intake.status === "BLOCKED" ? "BLOCKED" : "PASS";
  const touched = mergeUniqueStrings(intake.data?.touched, runtime.data?.touched);
  const skipped = mergeSkippedEntries(intake.data?.skipped, runtime.data?.skipped);
  const warnings = mergeUniqueStrings(intake.warnings, runtime.warnings);
  const packetFileCount = Math.max(intake.data?.packet_file_count || 0, runtime.data?.packet_file_count || 0);

  return {
    tool: "scaffoldai_housekeeping_clean_workspace",
    execution_class: "LOCAL_WRITE_BOUNDED",
    status,
    blockers: [
      ...(Array.isArray(intake.blockers) ? intake.blockers : []),
      ...(Array.isArray(runtime.blockers) ? runtime.blockers : []),
    ],
    warnings,
    data: {
      include_runtime_logs: options.includeRuntimeLogs === true,
      intake_artifacts_cleaned: intake.data?.cleanup_performed === true,
      runtime_state_reset: runtime.status === "PASS",
      packet_closed: intake.data?.packet_closed === true,
      cleanup_performed: intake.data?.cleanup_performed === true,
      inbox_candidate_removed: intake.data?.inbox_candidate_removed === true,
      removed_paths: Array.isArray(intake.data?.removed_paths) ? intake.data.removed_paths : [],
      skipped_paths: Array.isArray(intake.data?.skipped_paths) ? intake.data.skipped_paths : [],
      validation_errors: Array.isArray(intake.data?.validation_errors) ? intake.data.validation_errors : [],
      guard_errors: Array.isArray(intake.data?.guard_errors) ? intake.data.guard_errors : [],
      error_category: intake.data?.error_category || null,
      touched,
      skipped,
      packet_files_preserved: intake.data?.packet_files_preserved === true && runtime.data?.packet_files_preserved === true,
      packet_file_count: packetFileCount,
      logs_preserved: options.includeRuntimeLogs !== true,
      durable_surfaces_preserved: [
        ".scaffoldai/packets/",
        ".scaffoldai/state/history.jsonl",
        ".scaffoldai/runtime/mcp/signals.jsonl",
        ".scaffoldai/runtime/mcp/shared-memory.jsonl",
        ".scaffoldai/contracts/",
        "src/",
      ],
      cleaned_transient_surfaces: [
        ".scaffoldai/runtime/packet-intake/latest-intake.json",
        ".scaffoldai/inbox/*.sdc.md (consumed latest-intake source only)",
        ".scaffoldai/state/active-runtime.json",
        ".scaffoldai/state/next-action.md",
        ".scaffoldai/state/snapshot.md",
      ],
    },
    next_safe_action:
      status === "PASS"
        ? "Workspace transient state cleaned. Review git status and proceed with explicit packet activation when ready."
        : "Review blockers and preserve-durable constraints before retrying workspace cleanup.",
  };
}

module.exports = {
  RUNTIME_STATE_FILES,
  gatherHousekeepingStatus,
  classifyRuntimeStateChanges,
  parseGitStatusPath,
  resetRuntimeState,
  cleanIntakeArtifacts,
  cleanWorkspace,
  neutralizeSnapshotContent,
};
