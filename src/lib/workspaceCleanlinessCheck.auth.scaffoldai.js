"use strict";

const { getGitStatus } = require("./gitStatus.util.shared");

const LIFECYCLE_OWNED_PREFIXES = [
  ".scaffoldai/packets/",
  ".scaffoldai/runtime/packet-intake/",
  ".scaffoldai/state/active-runtime.json",
  ".scaffoldai/state/next-action.md",
  ".scaffoldai/state/snapshot.md",
  ".scaffoldai/state/handoff.md",
  ".scaffoldai/state/verify-evidence.json",
];

function parseGitStatusPath(line) {
  if (!line || typeof line !== "string") return null;

  const match = line.trim().match(/^[A-Z?]{1,2}\s+(.*)$/);
  if (!match || !match[1]) return null;

  const rawPath = match[1].trim();
  if (!rawPath) return null;

  if (rawPath.includes(" -> ")) {
    const renamedParts = rawPath.split(" -> ");
    return renamedParts[renamedParts.length - 1].trim();
  }

  return rawPath;
}

function isLifecycleOwnedPath(filePath) {
  return LIFECYCLE_OWNED_PREFIXES.some((prefix) => {
    if (prefix.endsWith("/")) {
      return filePath.startsWith(prefix);
    }

    return filePath === prefix;
  });
}

function classifyDirtyFiles(files) {
  const lifecycleOwned = [];
  const operatorOwned = [];

  for (const line of files || []) {
    const parsedPath = parseGitStatusPath(line);
    if (!parsedPath) continue;

    if (isLifecycleOwnedPath(parsedPath)) {
      lifecycleOwned.push(parsedPath);
      continue;
    }

    operatorOwned.push(parsedPath);
  }

  return {
    lifecycle_owned_files: lifecycleOwned,
    operator_owned_files: operatorOwned,
  };
}

/**
 * Evaluate workspace cleanliness before lifecycle transitions.
 *
 * Returns { clean, count, files, status, reason, message, next_safe_action }
 * If clean=false, provides diagnostics that are operator-actionable.
 *
 * Only enforces git checks in directories with a working git repository.
 * Non-git directories (test fixtures, isolated environments) pass as clean.
 *
 * @param {string} repoRoot - repo root path
 * @returns {{ clean: boolean, count: number, files: string[], status: string, reason?: string, message?: string, next_safe_action?: string }}
 */
function checkWorkspaceCleanliness(repoRoot) {
  const gitStatus = getGitStatus(repoRoot);

  // If git command failed, we're not in a git repo; allow operation (test fixtures, non-git contexts).
  if (gitStatus.error) {
    return {
      clean: true,
      count: 0,
      files: [],
      status: "PASS",
    };
  }

  if (!gitStatus.clean) {
    const ownership = classifyDirtyFiles(gitStatus.files);
    const lifecycleOwnedCount = ownership.lifecycle_owned_files.length;
    const operatorOwnedCount = ownership.operator_owned_files.length;

    let message = `Workspace contains ${gitStatus.count} modified or untracked file(s). Lifecycle transitions require a clean working directory.`;
    let nextSafeAction = `Review changes with 'git status'. Stage/commit or discard changes, then retry the lifecycle operation.`;

    if (lifecycleOwnedCount > 0 && operatorOwnedCount === 0) {
      message = `Workspace contains ${lifecycleOwnedCount} lifecycle-owned artifact change(s). Activation is blocked until these transition artifacts are explicitly reviewed and committed.`;
      nextSafeAction = "Review lifecycle-owned artifacts, commit intentional lifecycle transition files, then retry activation.";
    } else if (lifecycleOwnedCount > 0 && operatorOwnedCount > 0) {
      message = `Workspace contains mixed changes: ${lifecycleOwnedCount} lifecycle-owned artifact(s) and ${operatorOwnedCount} operator-owned file(s).`;
      nextSafeAction = "Commit intended operator and lifecycle artifacts explicitly, then retry lifecycle operations.";
    }

    return {
      clean: false,
      count: gitStatus.count,
      files: gitStatus.files,
      status: "BLOCKED",
      reason: "workspace_not_clean",
      message,
      next_safe_action: nextSafeAction,
      lifecycle_owned_files_count: lifecycleOwnedCount,
      operator_owned_files_count: operatorOwnedCount,
      lifecycle_owned_files: ownership.lifecycle_owned_files,
      operator_owned_files: ownership.operator_owned_files,
    };
  }

  return {
    clean: true,
    count: 0,
    files: [],
    status: "PASS",
  };
}

module.exports = {
  checkWorkspaceCleanliness,
};
