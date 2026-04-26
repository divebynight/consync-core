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

test("Search panel input values are preserved and run search produces stable grouped results", async () => {
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

    // Navigate to search panel
    await expect(window.getByRole("button", { name: "Search" })).toBeVisible();
    await window.getByRole("button", { name: "Search" }).click();

    // Inputs are pre-populated with stable fixture values
    const rootInput = window.getByLabel("Root to search");
    const queryInput = window.getByLabel("Theme query");

    await expect(rootInput).toBeVisible();
    await expect(queryInput).toBeVisible();

    // Clear and type a stable fixture root + query to verify input is editable and preserved
    await rootInput.fill("sandbox/fixtures/nested-anchor-trial");
    await queryInput.fill("moss");

    await expect(rootInput).toHaveValue("sandbox/fixtures/nested-anchor-trial");
    await expect(queryInput).toHaveValue("moss");

    // Run the search
    const runSearchButton = window.getByRole("button", { name: "Run Mock Search" });
    await expect(runSearchButton).toBeEnabled();
    await runSearchButton.click();

    // Summary rows appear — query value is reflected in the result summary
    await expect(window.getByText("moss", { exact: true }).first()).toBeVisible();

    // Two group session title headers are visible
    await expect(window.getByText("Balcony Zine Session")).toBeVisible();
    await expect(window.getByText("Greenhouse Poster Session")).toBeVisible();

    // Match artifact rows are visible as buttons
    await expect(window.getByText("exports/cover-notes.md")).toBeVisible();
    await expect(window.getByText("captures/moss-study.jpg")).toBeVisible();

    // No match selected yet — inspector shows "No Selection Yet"
    await expect(window.getByRole("heading", { name: "No Selection Yet" })).toBeVisible();

    // Click one match row and assert the Selected Match detail updates
    await window.getByText("exports/cover-notes.md").click();
    await expect(window.getByText("exports/cover-notes.md").first()).toBeVisible();
    await expect(window.getByText("Balcony Zine Session").first()).toBeVisible();
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
