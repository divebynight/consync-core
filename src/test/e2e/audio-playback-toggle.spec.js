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
  await expect(window.getByText("playwright-fixture.mp3", { exact: true }).first()).toBeVisible();
  await expect(window.locator("audio.audio-player")).toBeVisible();
  await expect(window.getByRole("status").getByText("Playback clock")).toBeVisible();
  await expect(window.getByRole("heading", { name: "Timeline Markers" })).toBeVisible();
}

async function clickNativePlayToggle(window) {
  const audioPlayer = window.locator("audio.audio-player");
  const box = await audioPlayer.boundingBox();

  if (!box) {
    throw new Error("Audio player bounding box was unavailable.");
  }

  await window.mouse.click(box.x + 10, box.y + (box.height / 2));
}

test("toggles playback on and off through the visible native audio control", async () => {
  const { electronApp, temporarySessionDir } = await launchElectronApp();

  try {
    const window = await electronApp.firstWindow();

    await loadFixtureAudio(window);

    const audioPlayer = window.locator("audio.audio-player");

    await expect.poll(() => audioPlayer.evaluate(node => node.paused)).toBe(true);

    await clickNativePlayToggle(window);
    await expect.poll(() => audioPlayer.evaluate(node => node.paused)).toBe(false);

    await clickNativePlayToggle(window);
    await expect.poll(() => audioPlayer.evaluate(node => node.paused)).toBe(true);
  } finally {
    await electronApp.close();
    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
});
