const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, expect, _electron: electron } = require("@playwright/test");

const FIXTURE_MARKER_NOTE = "inspector-test-marker";
const FIXTURE_FILE_PATH = path.join(os.tmpdir(), "consync-playwright-fixture.mp3");

function createTemporarySessionDir() {
  const temporarySessionDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-e2e-session-"));
  const artifactPath = path.join(temporarySessionDir, "20260405T154039301Z.json");

  fs.writeFileSync(
    artifactPath,
    JSON.stringify({
      bookmarks: [
        {
          createdAt: "2026-04-25T10:00:00.000Z",
          filePath: FIXTURE_FILE_PATH,
          id: "b1c2d3e4-f5a6-7890-bcde-f01234567890",
          note: FIXTURE_MARKER_NOTE,
          timeLabel: "00:30.000",
          timeSeconds: 30,
        },
      ],
      created_at: "2026-04-05T15:40:39.301Z",
      guid: "44bfa0e1-e2be-426c-9bf2-1966718a58b2",
      note: "e2e session fixture",
    }, null, 2) + "\n"
  );

  return temporarySessionDir;
}

test("Clicking a timeline marker updates the Inspector Panel to show Selected Marker details", async () => {
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

    // Load fixture audio — CONSYNC_E2E_AUDIO_FIXTURE=1 intercepts the native dialog
    await expect(window.getByRole("button", { name: "Choose MP3" })).toBeVisible();
    await window.getByRole("button", { name: "Choose MP3" }).click();
    await expect(window.getByText("playwright-fixture.mp3", { exact: true }).first()).toBeVisible();

    // The seeded bookmark renders as a timeline marker in the audio section
    const seekButton = window.getByRole("button", { name: `Seek to marker ${FIXTURE_MARKER_NOTE}` });
    await expect(seekButton).toBeVisible();

    // Before clicking the seek button, Inspector shows Latest Bookmark (seeded bookmark is in session)
    await expect(window.getByRole("heading", { name: "Latest Bookmark" })).toBeVisible();

    // Click the timeline marker row
    await seekButton.click();

    // Inspector updates to show Selected Marker with the marker note
    const inspector = window.locator(".workspace-inspector");
    await expect(inspector.getByRole("heading", { name: "Selected Marker" })).toBeVisible();
    await expect(inspector.getByText(FIXTURE_MARKER_NOTE)).toBeVisible();
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
