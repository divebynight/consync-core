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

async function launchElectronApp(temporarySessionDir) {
  return electron.launch({
    args: [path.join(process.cwd(), "scripts", "playwright-electron-main.cjs")],
    cwd: process.cwd(),
    env: {
      ...process.env,
      CONSYNC_E2E_AUDIO_FIXTURE: "1",
      CONSYNC_SESSION_DIR: temporarySessionDir,
    },
  });
}

async function loadFixtureAudio(window) {
  await expect(window.getByRole("button", { name: "Choose MP3" })).toBeVisible();
  await window.getByRole("button", { name: "Choose MP3" }).click();
  await expect(window.getByText("Selected file")).toBeVisible();
  await expect(window.getByRole("button", { name: "playwright-fixture.mp3" })).toBeVisible();
}

async function createMarker(window, noteText) {
  await window.keyboard.press("b");
  const noteInput = window.getByLabel("Note text");
  await expect(noteInput).toBeFocused();
  await noteInput.fill(noteText);
  await noteInput.press("Enter");
  await expect(noteInput).not.toBeFocused();
}

test("marker created through the audio UI persists after reloading the Electron window", async () => {
  const temporarySessionDir = createTemporarySessionDir();
  const electronApp = await launchElectronApp(temporarySessionDir);

  try {
    const window = await electronApp.firstWindow();

    // Step 1: Load fixture audio through visible Choose MP3 flow
    await loadFixtureAudio(window);

    // Step 2: Add one marker using the hotkey/Enter flow
    await createMarker(window, "persistence check marker");

    // Step 3: Verify the marker is visible before reload
    const timelineMarkersSection = window.getByRole("heading", { name: "Timeline Markers" }).locator("..");
    await expect(timelineMarkersSection.getByText("persistence check marker")).toBeVisible();

    // Step 4: Reload the Electron window
    await window.reload();

    // After reload the renderer re-initialises. The session state (including
    // bookmarks) is fetched from the main process via IPC on mount. The audio
    // file is renderer-only state and must be re-selected.

    // Step 5a: Re-load the fixture audio (audio path is not persisted)
    await loadFixtureAudio(window);

    // Step 5b: Verify the marker persists in the timeline markers section
    const timelineMarkersSectionAfterReload = window.getByRole("heading", { name: "Timeline Markers" }).locator("..");
    await expect(timelineMarkersSectionAfterReload.getByText("persistence check marker")).toBeVisible();
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
