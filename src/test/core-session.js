const assert = require("node:assert");
const {
  createBookmark,
  getSessionArtifactCount,
  getLatestSessionFileName,
  getSessionState,
  resetSessionState,
} = require("../core/session");

function main() {
  resetSessionState();

  assert.deepStrictEqual(getSessionState(), {
    artifactCount: getSessionArtifactCount(),
    currentFile: getLatestSessionFileName(),
    currentPositionSeconds: 84,
    bookmarks: [],
  });

  const firstState = createBookmark("First note");
  const secondState = createBookmark("Second note");

  assert.strictEqual(firstState.artifactCount, getSessionArtifactCount());
  assert.strictEqual(secondState.artifactCount, getSessionArtifactCount());

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
      note: "Second note",
      timeSeconds: 84,
    },
  ]);

  console.log("PASS");
}

main();