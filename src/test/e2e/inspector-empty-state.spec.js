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

test("Inspector Panel renders empty state on initial load with no bookmarks", async () => {
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

    // Inspector Panel is always visible in the right column — no navigation required
    await expect(window.getByRole("heading", { name: "Details" })).toBeVisible();

    // Empty state heading is visible when no bookmarks and no search result selected
    await expect(window.getByRole("heading", { name: "No Selection Yet" })).toBeVisible();

    // Empty state copy is visible
    await expect(
      window.getByText("Pick a search result or save a bookmark to populate this inspector with something concrete.")
    ).toBeVisible();

    // Hint panel is always present alongside the empty state
    await expect(window.getByRole("heading", { name: "Hint" })).toBeVisible();
  } finally {
    await electronApp.close();
  }
});
