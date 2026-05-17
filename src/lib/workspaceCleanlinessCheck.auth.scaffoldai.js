"use strict";

const { getGitStatus } = require("./gitStatus.util.shared");

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
    return {
      clean: false,
      count: gitStatus.count,
      files: gitStatus.files,
      status: "BLOCKED",
      reason: "workspace_not_clean",
      message: `Workspace contains ${gitStatus.count} modified or untracked file(s). Lifecycle transitions require a clean working directory.`,
      next_safe_action: `Review changes with 'git status'. Stage/commit or discard changes, then retry the lifecycle operation.`,
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
