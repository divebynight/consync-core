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

async function launchElectronApp() {
  const temporarySessionDir = createTemporarySessionDir();
  const electronApp = await electron.launch({
    args: [path.join(process.cwd(), "scripts", "playwright-electron-main.cjs")],
    cwd: process.cwd(),
    env: {
      ...process.env,
      CONSYNC_E2E_AUDIO_FIXTURE: "1",
      CONSYNC_SESSION_DIR: temporarySessionDir,
    },
  });

  return {
    electronApp,
    temporarySessionDir,
  };
}

test("fixture file appears in Recent Audio list after loading via Choose MP3", async () => {
  const { electronApp, temporarySessionDir } = await launchElectronApp();

  try {
    const window = await electronApp.firstWindow();

    const recentAudioSection = window.getByRole("heading", { name: "Recent Audio" }).locator("..");

    // Before loading any file the empty-state message should be visible.
    await expect(
      recentAudioSection.getByText("Open an mp3 to start a quick recent-files list.")
    ).toBeVisible();

    // Load the deterministic fixture through the visible Choose MP3 button.
    await expect(window.getByRole("button", { name: "Choose MP3" })).toBeVisible();
    await window.getByRole("button", { name: "Choose MP3" }).click();
    await expect(window.getByText("Selected file")).toBeVisible();

    // The fixture file name should now appear in the Recent Audio list.
    const recentButton = recentAudioSection.getByRole("button", { name: "playwright-fixture.mp3" });
    await expect(recentButton).toBeVisible();

    // The button should carry the active state class because it is the
    // currently selected file.
    await expect(recentButton).toHaveClass(/workspace-nav-button-active/);

    // The empty-state message should no longer be visible.
    await expect(
      recentAudioSection.getByText("Open an mp3 to start a quick recent-files list.")
    ).not.toBeVisible();
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
