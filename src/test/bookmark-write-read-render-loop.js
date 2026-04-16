const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const {
  createBookmark,
  getLatestSessionArtifactPath,
  getSessionState,
  resetSessionState,
} = require("../core/session");

function withTemporarySessionDir(run) {
  const temporarySessionDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-session-"));
  const originalSessionDir = process.env.CONSYNC_SESSION_DIR;

  fs.writeFileSync(
    path.join(temporarySessionDir, "20260405T154039301Z.json"),
    JSON.stringify({
      created_at: "2026-04-05T15:40:39.301Z",
      guid: "44bfa0e1-e2be-426c-9bf2-1966718a58b2",
      note: "sanity check",
    }, null, 2) + "\n"
  );

  process.env.CONSYNC_SESSION_DIR = temporarySessionDir;

  try {
    return run();
  } finally {
    if (originalSessionDir === undefined) {
      delete process.env.CONSYNC_SESSION_DIR;
    } else {
      process.env.CONSYNC_SESSION_DIR = originalSessionDir;
    }

    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
}

async function loadSessionPanelModule() {
  const modulePath = path.join(__dirname, "..", "electron", "renderer", "session-panel.mjs");
  return import(pathToFileURL(modulePath).href);
}

async function main() {
  const { getSessionPanelRows } = await loadSessionPanelModule();

  await withTemporarySessionDir(async () => {
    resetSessionState();

    createBookmark("Loop note");

    const persistedArtifact = JSON.parse(fs.readFileSync(getLatestSessionArtifactPath(), "utf8"));
    const derivedSessionState = getSessionState();
    const derivedSessionRows = getSessionPanelRows(derivedSessionState);

    assert.deepStrictEqual(persistedArtifact.bookmarks, [
      {
        id: "bookmark-1",
        note: "Loop note",
        timeSeconds: 84,
      },
    ]);

    assert.deepStrictEqual(derivedSessionState, {
      artifactCount: 1,
      bookmarks: [
        {
          id: "bookmark-1",
          note: "Loop note",
          timeSeconds: 84,
        },
      ],
      currentFile: "20260405T154039301Z.json",
      currentPositionSeconds: 84,
    });

    assert.deepStrictEqual(derivedSessionRows, [
      { label: "Artifacts", value: 1 },
      { label: "Current file", value: "20260405T154039301Z.json" },
      { label: "Position", value: "84s" },
      { label: "Bookmarks", value: 1 },
      { label: "Latest note", value: "Loop note" },
      { label: "Latest time", value: "84s" },
    ]);

    resetSessionState();

    const reloadedSessionState = getSessionState();
    const reloadedSessionRows = getSessionPanelRows(reloadedSessionState);

    assert.deepStrictEqual(reloadedSessionState, derivedSessionState);
    assert.deepStrictEqual(reloadedSessionRows, derivedSessionRows);
  });

  console.log("PASS");
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});