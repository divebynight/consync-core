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

// Replicates the app's formatTimeLabel(totalSeconds) function so the test can
// compute the expected label from the actual audio position without relying on
// the rendered clock value alone.
function formatTimeLabel(totalSeconds) {
  const normalizedMilliseconds = Math.max(0, Math.round((Number(totalSeconds) || 0) * 1000));
  const minutes = Math.floor(normalizedMilliseconds / 60000);
  const seconds = Math.floor((normalizedMilliseconds % 60000) / 1000);
  const milliseconds = normalizedMilliseconds % 1000;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

test("marker timestamp label matches the expected MM:SS.mmm format for the captured position", async () => {
  const { electronApp, temporarySessionDir } = await launchElectronApp();

  try {
    const window = await electronApp.firstWindow();

    await loadFixtureAudio(window);

    const playbackClock = window.getByRole("status").locator(".audio-player-readout-value");

    // Position audio at 50% of the fixture's actual duration. Falls back to
    // 0.05s if duration is unavailable, which keeps the timestamp non-zero.
    const capturedTime = await window.locator("audio.audio-player").evaluate(el => {
      const target = el.duration > 0 && Number.isFinite(el.duration)
        ? el.duration * 0.5
        : 0.05;

      el.currentTime = target;
      // Return the time the browser actually accepted (may differ slightly from target).
      return el.currentTime;
    });

    // Derive the expected label from the captured time using the same formula
    // as formatTimeLabel in the app. This validates both the format and the value.
    const expectedLabel = formatTimeLabel(capturedTime);

    // Wait for the React clock to reflect the new position before pressing B.
    await expect(playbackClock).toHaveText(expectedLabel);

    // Create a marker at this position.
    await window.keyboard.press("b");
    const noteInput = window.getByLabel("Note text");
    await expect(noteInput).toBeFocused();
    await noteInput.fill("timestamp check");
    await noteInput.press("Enter");
    await expect(noteInput).not.toBeFocused();

    // Assert the rendered marker row shows the expected timestamp label.
    const timelineMarkersSection = window
      .getByRole("heading", { name: "Timeline Markers" })
      .locator("..");
    const markerTimeLabel = timelineMarkersSection.locator("li.bookmark-item .bookmark-time").first();

    await expect(markerTimeLabel).toHaveText(expectedLabel);
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
