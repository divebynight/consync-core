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

test("persists typed note text for the hotkey marker Enter flow in Electron", async () => {
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

  try {
    const window = await electronApp.firstWindow();
    await expect(window.getByRole("button", { name: "Choose MP3" })).toBeVisible();

    await window.getByRole("button", { name: "Choose MP3" }).click();
    await expect(window.getByText("Selected file")).toBeVisible();
    await expect(window.getByRole("button", { name: "playwright-fixture.mp3" })).toBeVisible();
    await expect(window.getByText("playwright-fixture.mp3", { exact: true }).first()).toBeVisible();

    await window.keyboard.press("b");

    const noteInput = window.getByLabel("Note text");
    await expect(noteInput).toBeFocused();
    await noteInput.fill("test note");
    await noteInput.press("Enter");

    await expect(window.getByRole("button", { name: "Seek to marker test note" })).toBeVisible();
    await expect(window.getByText("Untitled marker")).toHaveCount(0);
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
