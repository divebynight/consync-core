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

test("Search panel is reachable and primary controls are visible", async () => {
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

    // Resume panel is visible on initial load
    await expect(window.getByRole("button", { name: "Search" })).toBeVisible();

    // Navigate to the Search panel via the resume panel action
    await window.getByRole("button", { name: "Search" }).click();

    // Search panel heading is visible
    await expect(window.getByRole("heading", { name: "Search Related Work" })).toBeVisible();

    // Root input is visible
    await expect(window.getByLabel("Root to search")).toBeVisible();

    // Query input is visible
    await expect(window.getByLabel("Theme query")).toBeVisible();

    // Run Mock Search button is visible
    await expect(window.getByRole("button", { name: "Run Mock Search" })).toBeVisible();
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
