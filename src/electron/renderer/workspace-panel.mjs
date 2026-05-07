/**
 * Pure data transformation for the workspace panel.
 * No React, no IPC, no side effects.
 */

/**
 * Returns status rows for the active workspace display.
 * @param {string|null} activeWorkspace - Absolute path to active workspace, or null if none selected.
 * @returns {{ label: string, value: string }[]}
 */
export function getWorkspacePanelRows(activeWorkspace) {
  if (!activeWorkspace) {
    return [{ label: "Workspace", value: "None selected" }];
  }

  return [{ label: "Workspace", value: activeWorkspace }];
}

/**
 * Returns true if a workspace has been selected.
 * @param {string|null} activeWorkspace
 * @returns {boolean}
 */
export function hasActiveWorkspace(activeWorkspace) {
  return typeof activeWorkspace === "string" && activeWorkspace.trim().length > 0;
}
