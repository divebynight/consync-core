const assert = require("node:assert");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadSessionPanelModule() {
  const modulePath = path.join(__dirname, "..", "electron", "renderer", "session-panel.mjs");
  return import(pathToFileURL(modulePath).href);
}

async function main() {
  const { getSessionPanelRows } = await loadSessionPanelModule();

  assert.deepStrictEqual(getSessionPanelRows(null), [
    { label: "Artifacts", value: "loading" },
    { label: "Current file", value: "loading" },
    { label: "Position", value: "loading" },
    { label: "Bookmarks", value: "loading" },
    { label: "Latest note", value: "loading" },
    { label: "Latest time", value: "loading" },
  ]);

  assert.deepStrictEqual(getSessionPanelRows({
    artifactCount: 4,
    bookmarks: [
      { id: "bookmark-1", note: "First note", timeSeconds: 84 },
      { id: "bookmark-2", note: "Second note", timeSeconds: 126 },
    ],
    currentFile: "20260405T154039301Z.json",
    currentPositionSeconds: 126,
  }), [
    { label: "Artifacts", value: 4 },
    { label: "Current file", value: "20260405T154039301Z.json" },
    { label: "Position", value: "126s" },
    { label: "Bookmarks", value: 2 },
    { label: "Latest note", value: "Second note" },
    { label: "Latest time", value: "126s" },
  ]);

  assert.deepStrictEqual(getSessionPanelRows({
    artifactCount: 4,
    bookmarks: [],
    currentFile: "20260405T154039301Z.json",
    currentPositionSeconds: 84,
  }), [
    { label: "Artifacts", value: 4 },
    { label: "Current file", value: "20260405T154039301Z.json" },
    { label: "Position", value: "84s" },
    { label: "Bookmarks", value: 0 },
    { label: "Latest note", value: "none" },
    { label: "Latest time", value: "none" },
  ]);

  console.log("PASS");
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});