const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  createBookmark,
  getSessionArtifactCount,
  getLatestSessionArtifactPath,
  getLatestSessionFileName,
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
    run();
  } finally {
    if (originalSessionDir === undefined) {
      delete process.env.CONSYNC_SESSION_DIR;
    } else {
      process.env.CONSYNC_SESSION_DIR = originalSessionDir;
    }

    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  }
}

function main() {
  withTemporarySessionDir(() => {
    resetSessionState();

    assert.deepStrictEqual(getSessionState(), {
      artifactCount: getSessionArtifactCount(),
      currentFile: getLatestSessionFileName(),
      currentPositionSeconds: 84,
      bookmarks: [],
    });

    const firstState = createBookmark("First note");
    const secondState = createBookmark({
      createdAt: "2026-04-23T17:30:00.000Z",
      filePath: "/tmp/sample.mp3",
      note: "File note",
      timeLabel: null,
      timeSeconds: null,
    });
    const thirdState = createBookmark({
      createdAt: "2026-04-23T18:00:00.000Z",
      filePath: "/tmp/sample.mp3",
      note: "Second note",
      timeLabel: "00:42",
      timeSeconds: 42,
    });
    const fourthState = createBookmark({
      createdAt: "2026-04-24T12:00:00.000Z",
      filePath: "/tmp/sample.mp3",
      note: "",
      timeLabel: "00:48",
      timeSeconds: 48,
    });
    const persistedArtifact = JSON.parse(fs.readFileSync(getLatestSessionArtifactPath(), "utf8"));

    assert.strictEqual(firstState.artifactCount, getSessionArtifactCount());
    assert.strictEqual(secondState.artifactCount, getSessionArtifactCount());
    assert.strictEqual(thirdState.artifactCount, getSessionArtifactCount());
    assert.strictEqual(fourthState.artifactCount, getSessionArtifactCount());

    assert.deepStrictEqual(firstState.bookmarks, [
      {
        id: "bookmark-1",
        note: "First note",
        timeSeconds: 84,
      },
    ]);

    assert.deepStrictEqual(secondState.bookmarks, [
      {
        id: "bookmark-1",
        note: "First note",
        timeSeconds: 84,
      },
      {
        id: "bookmark-2",
        createdAt: "2026-04-23T17:30:00.000Z",
        filePath: "/tmp/sample.mp3",
        note: "File note",
        timeLabel: null,
        timeSeconds: null,
      },
    ]);

    assert.deepStrictEqual(thirdState.bookmarks, [
      {
        id: "bookmark-1",
        note: "First note",
        timeSeconds: 84,
      },
      {
        id: "bookmark-2",
        createdAt: "2026-04-23T17:30:00.000Z",
        filePath: "/tmp/sample.mp3",
        note: "File note",
        timeLabel: null,
        timeSeconds: null,
      },
      {
        id: "bookmark-3",
        createdAt: "2026-04-23T18:00:00.000Z",
        filePath: "/tmp/sample.mp3",
        note: "Second note",
        timeLabel: "00:42",
        timeSeconds: 42,
      },
    ]);

    assert.deepStrictEqual(fourthState.bookmarks, [
      {
        id: "bookmark-1",
        note: "First note",
        timeSeconds: 84,
      },
      {
        id: "bookmark-2",
        createdAt: "2026-04-23T17:30:00.000Z",
        filePath: "/tmp/sample.mp3",
        note: "File note",
        timeLabel: null,
        timeSeconds: null,
      },
      {
        id: "bookmark-3",
        createdAt: "2026-04-23T18:00:00.000Z",
        filePath: "/tmp/sample.mp3",
        note: "Second note",
        timeLabel: "00:42",
        timeSeconds: 42,
      },
      {
        id: "bookmark-4",
        createdAt: "2026-04-24T12:00:00.000Z",
        filePath: "/tmp/sample.mp3",
        note: "",
        timeLabel: "00:48",
        timeSeconds: 48,
      },
    ]);

    assert.deepStrictEqual(persistedArtifact.bookmarks, [
      {
        id: "bookmark-1",
        note: "First note",
        timeSeconds: 84,
      },
      {
        id: "bookmark-2",
        createdAt: "2026-04-23T17:30:00.000Z",
        filePath: "/tmp/sample.mp3",
        note: "File note",
        timeLabel: null,
        timeSeconds: null,
      },
      {
        id: "bookmark-3",
        createdAt: "2026-04-23T18:00:00.000Z",
        filePath: "/tmp/sample.mp3",
        note: "Second note",
        timeLabel: "00:42",
        timeSeconds: 42,
      },
      {
        id: "bookmark-4",
        createdAt: "2026-04-24T12:00:00.000Z",
        filePath: "/tmp/sample.mp3",
        note: "",
        timeLabel: "00:48",
        timeSeconds: 48,
      },
    ]);
  });

  console.log("PASS");
}

main();
