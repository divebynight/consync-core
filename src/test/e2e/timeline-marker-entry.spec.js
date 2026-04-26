const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, expect, _electron: electron } = require("@playwright/test");

const FIXTURE_BOOKMARK_NOTE = "timeline-marker-entry-test";
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
          id: "c1d2e3f4-a5b6-7890-cdef-012345678901",
          note: FIXTURE_BOOKMARK_NOTE,
          timeLabel: "00:60.000",
          timeSeconds: 60,
        },
      ],
      created_at: "2026-04-05T15:40:39.301Z",
      guid: "44bfa0e1-e2be-426c-9bf2-1966718a58b2",
      note: "e2e session fixture",
    }, null, 2) + "\n"
  );

  return temporarySessionDir;
}

test("Timeline View Bookmarks lane shows a seeded bookmark entry", async () => {
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

    // Navigate to the Timeline View
    await expect(window.getByRole("button", { name: "Open Timeline" })).toBeVisible();
    await window.getByRole("button", { name: "Open Timeline" }).click();

    // Bookmarks lane is rendered with its role=list
    const bookmarksLane = window.getByRole("list", { name: "Bookmarks markers" });
    await expect(bookmarksLane).toBeVisible();

    // The seeded bookmark note appears as a marker label in the Bookmarks lane
    await expect(bookmarksLane.getByText(FIXTURE_BOOKMARK_NOTE)).toBeVisible();

    // The default empty-state placeholder is NOT shown when real bookmarks exist
    await expect(bookmarksLane.getByText("First bookmark pending")).not.toBeVisible();
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
