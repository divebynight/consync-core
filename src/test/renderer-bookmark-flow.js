const assert = require("node:assert");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadBookmarkFlowModule() {
  const modulePath = path.join(__dirname, "..", "electron", "renderer", "bookmark-flow.mjs");
  return import(pathToFileURL(modulePath).href);
}

async function main() {
  const { createBookmarkAndReadSessionState } = await loadBookmarkFlowModule();
  const calls = [];

  const sessionState = await createBookmarkAndReadSessionState(
    {
      async createBookmark(note) {
        calls.push({ method: "createBookmark", note });
        return {
          bookmarks: [
            {
              id: "bookmark-1",
              note,
              timeSeconds: 84,
            },
          ],
        };
      },
      async getSessionState() {
        calls.push({ method: "getSessionState" });
        return {
          artifactCount: 4,
          bookmarks: [
            {
              id: "bookmark-1",
              note: "renderer bookmark",
              timeSeconds: 84,
            },
          ],
          currentFile: "20260405T154039301Z.json",
          currentPositionSeconds: 84,
        };
      },
    },
    "renderer bookmark"
  );

  assert.deepStrictEqual(calls, [
    { method: "createBookmark", note: "renderer bookmark" },
    { method: "getSessionState" },
  ]);
  assert.deepStrictEqual(sessionState, {
    artifactCount: 4,
    bookmarks: [
      {
        id: "bookmark-1",
        note: "renderer bookmark",
        timeSeconds: 84,
      },
    ],
    currentFile: "20260405T154039301Z.json",
    currentPositionSeconds: 84,
  });

  console.log("PASS");
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});