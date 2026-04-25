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

test("clicking seek to marker positions the audio player at the marker timestamp", async () => {
  const { electronApp, temporarySessionDir } = await launchElectronApp();

  try {
    const window = await electronApp.firstWindow();

    await loadFixtureAudio(window);

    const playbackClock = window.getByRole("status").locator(".audio-player-readout-value");

    // Position audio at 50% of the fixture's actual duration (falls back to
    // 0.05s if duration is not available). This produces a non-zero timestamp
    // regardless of how short the fixture is.
    await window.locator("audio.audio-player").evaluate(el => {
      const target = el.duration > 0 && Number.isFinite(el.duration)
        ? el.duration * 0.5
        : 0.05;

      el.currentTime = target;
    });

    // Wait for the React clock to update to a non-zero value.
    await expect(playbackClock).not.toHaveText("00:00.000");

    // Create a marker at this position.
    await createMarker(window, "seek target");

    // Read the time label that the marker row shows — this is the expected
    // clock value after seeking back to it.
    const timelineMarkersSection = window.getByRole("heading", { name: "Timeline Markers" }).locator("..");
    const markerTimeLabel = await timelineMarkersSection.locator("li.bookmark-item .bookmark-time").textContent();

    // Move audio back to the start so the clock clearly differs from the marker.
    await window.locator("audio.audio-player").evaluate(el => {
      el.currentTime = 0;
    });
    await expect(playbackClock).toHaveText("00:00.000");

    // Click the seek button for the marker.
    await window.getByRole("button", { name: "Seek to marker seek target" }).click();

    // The playback clock should now match the marker's recorded timestamp.
    await expect(playbackClock).toHaveText(markerTimeLabel);
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
