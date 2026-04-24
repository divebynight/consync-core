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
  const bookmark = {
    createdAt: "2026-04-23T18:00:00.000Z",
    filePath: "/tmp/sample.mp3",
    note: "renderer bookmark",
    timeLabel: "00:42",
    timeSeconds: 42,
  };

  const sessionState = await createBookmarkAndReadSessionState(
    {
      async createBookmark(payload) {
        calls.push({ method: "createBookmark", payload });
        return {
          bookmarks: [
            {
              id: "bookmark-1",
              ...payload,
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
              ...bookmark,
            },
          ],
          currentFile: "20260405T154039301Z.json",
          currentPositionSeconds: 84,
        };
      },
    },
    bookmark
  );

  assert.deepStrictEqual(calls, [
    { method: "createBookmark", payload: bookmark },
    { method: "getSessionState" },
  ]);
  assert.deepStrictEqual(sessionState, {
    artifactCount: 4,
    bookmarks: [
      {
        id: "bookmark-1",
        ...bookmark,
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
