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

test("Timeline View renders default state with all track lanes visible", async () => {
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

    // Navigate to the Timeline View via the visible "Open Timeline" button
    await expect(window.getByRole("button", { name: "Open Timeline" })).toBeVisible();
    await window.getByRole("button", { name: "Open Timeline" }).click();

    const timelinePanel = window.locator(".session-timeline-panel");

    // Timeline View heading is visible
    await expect(window.locator("p.timeline-eyebrow")).toBeVisible();
    await expect(timelinePanel.getByRole("heading", { name: "Session Timeline" })).toBeVisible();

    // All four track lane labels are rendered
    await expect(timelinePanel.locator("p.timeline-track-label", { hasText: "Session Events" })).toBeVisible();
    await expect(timelinePanel.locator("p.timeline-track-label", { hasText: "Bookmarks" })).toBeVisible();
    await expect(timelinePanel.locator("p.timeline-track-label", { hasText: "Notes" })).toBeVisible();
    await expect(timelinePanel.locator("p.timeline-track-label", { hasText: "Audio Cues" })).toBeVisible();

    // Timeline ruler is visible
    await expect(timelinePanel.getByText("0:00")).toBeVisible();
    await expect(timelinePanel.getByText("2:00")).toBeVisible();
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
