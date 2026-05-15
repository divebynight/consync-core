"use strict";

const fs = require("fs");
const path = require("path");

const scaffoldaiState = require("./scaffoldaiState.state.scaffoldai");
const { getGitStatus } = require("./gitStatus.util.shared");

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

module.exports = {
  RUNTIME_STATE_FILES,
  gatherHousekeepingStatus,
  classifyRuntimeStateChanges,
  parseGitStatusPath,
  resetRuntimeState,
  neutralizeSnapshotContent,
};