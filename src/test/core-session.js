const assert = require("node:assert");
const {
  createBookmark,
  getSessionState,
  resetSessionState,
} = require("../core/session");

function main() {
  resetSessionState();

  assert.deepStrictEqual(getSessionState(), {
    currentFile: "placeholder-audio-file.mp3",
    currentPositionSeconds: 84,
    bookmarks: [],
  });

  const firstState = createBookmark("First note");
  const secondState = createBookmark("Second note");

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