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

test("removes only the targeted middle marker with the row delete button", async () => {
  const { electronApp, temporarySessionDir } = await launchElectronApp();

  try {
    const window = await electronApp.firstWindow();

    await loadFixtureAudio(window);
    await createMarker(window, "first marker");
    await createMarker(window, "middle marker");
    await createMarker(window, "last marker");

    const timelineMarkersSection = window.getByRole("heading", { name: "Timeline Markers" }).locator("..");
    const markerRows = timelineMarkersSection.locator("li.bookmark-item");

    await expect(markerRows).toHaveCount(3);
    await expect(timelineMarkersSection.getByText("first marker")).toBeVisible();
    await expect(timelineMarkersSection.getByText("middle marker")).toBeVisible();
    await expect(timelineMarkersSection.getByText("last marker")).toBeVisible();

    const middleRow = markerRows.nth(1);
    await middleRow.getByRole("button", { name: "Delete marker middle marker" }).click();

    await expect(markerRows).toHaveCount(2);
    await expect(timelineMarkersSection.getByText("middle marker")).toHaveCount(0);
    await expect(timelineMarkersSection.getByText("first marker")).toBeVisible();
    await expect(timelineMarkersSection.getByText("last marker")).toBeVisible();
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
