const assert = require("node:assert");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadMockSearchPanelModule() {
  const modulePath = path.join(__dirname, "..", "electron", "renderer", "mock-search-panel.mjs");
  return import(pathToFileURL(modulePath).href);
}

async function main() {
  const { getMockSearchSummaryRows } = await loadMockSearchPanelModule();

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

  console.log("PASS");
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});