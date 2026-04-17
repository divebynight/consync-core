const assert = require("node:assert");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadMockSearchPanelModule() {
  const modulePath = path.join(__dirname, "..", "electron", "renderer", "mock-search-panel.mjs");
  return import(pathToFileURL(modulePath).href);
}

async function main() {
  const {
    getMockSearchDetailRows,
    getMockSearchSelectionKey,
    getMockSearchSummaryRows,
    getSelectedMockSearchDetail,
  } = await loadMockSearchPanelModule();

  const sampleResult = {
    rootPath: "sandbox/fixtures/nested-anchor-trial",
    query: "moss",
    sessionCount: 2,
    matchCount: 2,
    groups: [
      {
        anchorPath: "2026/april/balcony-zine",
        sessionTitle: "Balcony Zine Session",
        matches: [
          {
            artifactPath: "exports/cover-notes.md",
            note: "Moss motif for cover transition",
            tags: ["cover", "moss", "print"],
          },
        ],
      },
      {
        anchorPath: "2026/april/greenhouse-poster",
        sessionTitle: "Greenhouse Poster Session",
        matches: [
          {
            artifactPath: "captures/moss-study.jpg",
            note: "Moss texture reference for poster lighting",
            tags: ["moss", "poster", "texture"],
          },
        ],
      },
    ],
  };

  const selectedMatchKey = getMockSearchSelectionKey(sampleResult.groups[1], sampleResult.groups[1].matches[0]);

  assert.deepStrictEqual(getMockSearchSummaryRows(null), [
    { label: "Root", value: "loading" },
    { label: "Query", value: "loading" },
    { label: "Sessions", value: "loading" },
    { label: "Matches", value: "loading" },
  ]);

  assert.deepStrictEqual(getMockSearchSummaryRows({
    rootPath: "sandbox/fixtures/nested-anchor-trial",
    query: "moss",
    sessionCount: 2,
    matchCount: 2,
  }), [
    { label: "Root", value: "sandbox/fixtures/nested-anchor-trial" },
    { label: "Query", value: "moss" },
    { label: "Sessions", value: 2 },
    { label: "Matches", value: 2 },
  ]);

  assert.deepStrictEqual(getMockSearchDetailRows(null, null), [
    { label: "Selection", value: "none" },
    { label: "Path", value: "Choose a result row" },
    { label: "Session", value: "none" },
    { label: "Anchor", value: "none" },
    { label: "Tags", value: "none" },
  ]);

  assert.deepStrictEqual(getSelectedMockSearchDetail(sampleResult, selectedMatchKey), {
    anchorPath: "2026/april/greenhouse-poster",
    artifactPath: "captures/moss-study.jpg",
    fullPath: "sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg",
    note: "Moss texture reference for poster lighting",
    query: "moss",
    rootPath: "sandbox/fixtures/nested-anchor-trial",
    sessionTitle: "Greenhouse Poster Session",
    tags: ["moss", "poster", "texture"],
  });

  assert.deepStrictEqual(getMockSearchDetailRows(sampleResult, selectedMatchKey), [
    { label: "Selection", value: "captures/moss-study.jpg" },
    { label: "Path", value: "sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg" },
    { label: "Session", value: "Greenhouse Poster Session" },
    { label: "Anchor", value: "2026/april/greenhouse-poster" },
    { label: "Tags", value: "moss, poster, texture" },
  ]);

  assert.strictEqual(getSelectedMockSearchDetail(sampleResult, "missing::entry"), null);

  console.log("PASS");
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});