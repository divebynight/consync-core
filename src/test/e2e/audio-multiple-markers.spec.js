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

  if (noteText) {
    await noteInput.fill(noteText);
  }

  await noteInput.press("Enter");
  await expect(noteInput).not.toBeFocused();
}

test("creates multiple markers and renders them in stable insertion order", async () => {
  const { electronApp, temporarySessionDir } = await launchElectronApp();

  try {
    const window = await electronApp.firstWindow();

    await loadFixtureAudio(window);

    await createMarker(window, "alpha");
    await createMarker(window, "beta");
    await createMarker(window, "gamma");

    const timelineMarkersSection = window.getByRole("heading", { name: "Timeline Markers" }).locator("..");
    const markerRows = timelineMarkersSection.locator("li.bookmark-item");

    await expect(markerRows).toHaveCount(3);

    await expect(markerRows.nth(0)).toContainText("alpha");
    await expect(markerRows.nth(1)).toContainText("beta");
    await expect(markerRows.nth(2)).toContainText("gamma");
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
