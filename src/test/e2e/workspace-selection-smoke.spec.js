const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, expect, _electron: electron } = require("@playwright/test");

function createTemporarySessionDir() {
  const temporarySessionDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-e2e-session-"));
  const artifactPath = path.join(temporarySessionDir, "20260405T154039301Z.json");

  fs.writeFileSync(
    artifactPath,
    JSON.stringify({
      bookmarks: [],
      created_at: "2026-04-05T15:40:39.301Z",
      guid: "44bfa0e1-e2be-426c-9bf2-1966718a58b2",
      note: "e2e session fixture",
    }, null, 2) + "\n"
  );

  return temporarySessionDir;
}

test("Active Workspace panel is visible with no-selection initial state", async () => {
  const temporarySessionDir = createTemporarySessionDir();
  const electronApp = await electron.launch({
    args: [path.join(process.cwd(), "scripts", "playwright-electron-main.cjs")],
    cwd: process.cwd(),
    env: {
      ...process.env,
      CONSYNC_SESSION_DIR: temporarySessionDir,
    },
  });

  try {
    const window = await electronApp.firstWindow();

    // Active Workspace heading is visible in the sidebar
    await expect(window.getByRole("heading", { name: "Active Workspace" })).toBeVisible();

    // Initial state shows "None selected"
    await expect(window.getByText("None selected")).toBeVisible();

    // Choose Workspace button is visible and enabled
    const chooseButton = window.getByRole("button", { name: "Choose Workspace" });
    await expect(chooseButton).toBeVisible();
    await expect(chooseButton).toBeEnabled();
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});

test("Workspace path appears after selection and Folder Summary input updates", async () => {
  const temporarySessionDir = createTemporarySessionDir();
  const fixtureWorkspacePath = path.join(process.cwd(), "sandbox", "fixtures", "mixed-flat-small");
  const electronApp = await electron.launch({
    args: [path.join(process.cwd(), "scripts", "playwright-electron-main.cjs")],
    cwd: process.cwd(),
    env: {
      ...process.env,
      CONSYNC_SESSION_DIR: temporarySessionDir,
      CONSYNC_E2E_WORKSPACE_FIXTURE: fixtureWorkspacePath,
    },
  });

  try {
    const window = await electronApp.firstWindow();

    // Click Choose Workspace — fixture env var bypasses native dialog
    await window.getByRole("button", { name: "Choose Workspace" }).click();

    // Workspace path is now shown in the sidebar
    await expect(window.getByText(fixtureWorkspacePath)).toBeVisible();

    // Button label updates to "Change Workspace"
    await expect(window.getByRole("button", { name: "Change Workspace" })).toBeVisible();

    // Folder Summary input has been pre-filled with the workspace path
    await window.getByRole("button", { name: "Folder Summary" }).click();
    const pathInput = window.getByLabel("Folder path");
    await expect(pathInput).toHaveValue(fixtureWorkspacePath);
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
