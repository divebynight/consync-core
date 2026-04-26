const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, expect, _electron: electron } = require("@playwright/test");

const FIXTURE_BOOKMARK_NOTE = "latest-bookmark-test-note";
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
          id: "a1b2c3d4-e5f6-7890-abcd-ef0123456789",
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

test("Inspector Panel shows Latest Bookmark state when a bookmark exists and no marker is selected", async () => {
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

    // Inspector Panel is always visible in the right column — no navigation required
    await expect(window.getByRole("heading", { name: "Details" })).toBeVisible();

    // Latest Bookmark heading is shown when a bookmark exists and nothing is explicitly selected
    await expect(inspector.getByRole("heading", { name: "Latest Bookmark" })).toBeVisible();

    // The bookmark note text is visible in the inspector
    await expect(inspector.getByText(FIXTURE_BOOKMARK_NOTE)).toBeVisible();

    // Empty state heading is NOT shown when a bookmark is present
    await expect(inspector.getByRole("heading", { name: "No Selection Yet" })).not.toBeVisible();
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
