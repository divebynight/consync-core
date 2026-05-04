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

test("Folder Summary view is reachable and shows heading and input", async () => {
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

    // Folder Summary nav button is visible in the sidebar
    await expect(window.getByRole("button", { name: "Folder Summary" })).toBeVisible();

    // Click it to open the Folder Summary view
    await window.getByRole("button", { name: "Folder Summary" }).click();

    // Heading is visible
    await expect(window.getByRole("heading", { name: "Folder Summary" }).first()).toBeVisible();

    // Path input is visible with default pre-filled value
    const pathInput = window.getByLabel("Folder path");
    await expect(pathInput).toBeVisible();
    await expect(pathInput).toHaveValue("sandbox/fixtures/mixed-flat-small");

    // Run Summary button is visible and enabled (path is pre-filled)
    await expect(window.getByRole("button", { name: "Run Summary" })).toBeVisible();
    await expect(window.getByRole("button", { name: "Run Summary" })).toBeEnabled();
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});

test("Folder Summary valid path returns deterministic counts and extensions", async () => {
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

    // Navigate to Folder Summary view
    await window.getByRole("button", { name: "Folder Summary" }).click();
    await expect(window.getByRole("heading", { name: "Folder Summary" }).first()).toBeVisible();

    // Clear and enter the known fixture path
    const pathInput = window.getByLabel("Folder path");
    await pathInput.fill("sandbox/fixtures/mixed-flat-small");

    // Submit
    await window.getByRole("button", { name: "Run Summary" }).click();

    // File and folder counts are displayed
    await expect(window.getByText("4").first()).toBeVisible();
    await expect(window.getByText("0").first()).toBeVisible();

    // Extension rows are displayed
    await expect(window.getByText(".jpg")).toBeVisible();
    await expect(window.getByText(".png")).toBeVisible();
    await expect(window.getByText(".txt")).toBeVisible();
    await expect(window.getByText(".wav")).toBeVisible();

    // No error message visible
    await expect(window.getByRole("heading", { name: "Error" })).not.toBeVisible();
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});

test("Folder Summary invalid path shows error state", async () => {
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

    // Navigate to Folder Summary view
    await window.getByRole("button", { name: "Folder Summary" }).click();
    await expect(window.getByRole("heading", { name: "Folder Summary" }).first()).toBeVisible();
    const pathInput = window.getByLabel("Folder path");
    await pathInput.fill("sandbox/fixtures/__nonexistent_e2e_path__");

    // Submit
    await window.getByRole("button", { name: "Run Summary" }).click();

    // Error heading is visible
    await expect(window.getByRole("heading", { name: "Error" })).toBeVisible();

    // Error message includes the path
    await expect(window.getByText("__nonexistent_e2e_path__")).toBeVisible();
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
