const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, expect, _electron: electron } = require("@playwright/test");

const FIXTURE_BOOKMARK_NOTE = "timeline-inspector-sync-test";
const FIXTURE_BOOKMARK_ID = "d1e2f3a4-b5c6-7890-def0-123456789012";
const FIXTURE_FILE_PATH = path.join(os.tmpdir(), "consync-playwright-fixture.mp3");

function createTemporarySessionDir() {
  const temporarySessionDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-e2e-session-"));
  const artifactPath = path.join(temporarySessionDir, "20260405T154039301Z.json");

  fs.writeFileSync(
    artifactPath,
    JSON.stringify({
      bookmarks: [
        {
          createdAt: "2026-04-26T10:00:00.000Z",
          filePath: FIXTURE_FILE_PATH,
          id: FIXTURE_BOOKMARK_ID,
          note: FIXTURE_BOOKMARK_NOTE,
          timeLabel: "00:45.000",
          timeSeconds: 45,
        },
      ],
      created_at: "2026-04-05T15:40:39.301Z",
      guid: "44bfa0e1-e2be-426c-9bf2-1966718a58b2",
      note: "e2e session fixture",
    }, null, 2) + "\n"
  );

  return temporarySessionDir;
}

test("Clicking a bookmark marker in Timeline View updates the Inspector Panel to show Selected Marker", async () => {
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
    const inspector = window.locator(".workspace-inspector");

    // Before navigating to Timeline, Inspector shows Latest Bookmark (bookmark is seeded)
    await expect(inspector.getByRole("heading", { name: "Latest Bookmark" })).toBeVisible();

    // Navigate to Timeline View
    await expect(window.getByRole("button", { name: "Open Timeline" })).toBeVisible();
    await window.getByRole("button", { name: "Open Timeline" }).click();

    // The bookmark marker is visible in the Timeline View as a selectable button
    const markerButton = window.getByRole("button", { name: `Select marker ${FIXTURE_BOOKMARK_NOTE}` });
    await expect(markerButton).toBeVisible();

    // Click the bookmark marker
    await markerButton.click();

    // Inspector Panel updates to show Selected Marker state with the note text
    await expect(inspector.getByRole("heading", { name: "Selected Marker" })).toBeVisible();
    await expect(inspector.getByText(FIXTURE_BOOKMARK_NOTE)).toBeVisible();

    // Latest Bookmark heading is no longer shown when a specific marker is selected
    await expect(inspector.getByRole("heading", { name: "Latest Bookmark" })).not.toBeVisible();
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
