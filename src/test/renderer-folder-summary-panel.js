const assert = require("node:assert");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadFolderSummaryPanelModule() {
  const modulePath = path.join(__dirname, "..", "electron", "renderer", "folder-summary-panel.mjs");
  return import(pathToFileURL(modulePath).href);
}

async function main() {
  const { getFolderSummaryRows, getFolderSummaryExtensionRows } = await loadFolderSummaryPanelModule();

  // 1. Loading state (null input)
  assert.deepStrictEqual(getFolderSummaryRows(null), [
    { label: "Path", value: "loading" },
    { label: "Files", value: "loading" },
    { label: "Folders", value: "loading" },
    { label: "Size", value: "loading" },
  ]);

  // 2. Error state
  assert.deepStrictEqual(getFolderSummaryRows({ ok: false, error: "Path not found: /tmp/missing" }), [
    { label: "Error", value: "Path not found: /tmp/missing" },
  ]);

  // 3. Success state
  assert.deepStrictEqual(
    getFolderSummaryRows({
      ok: true,
      absolutePath: "/tmp/test",
      fileCount: 4,
      folderCount: 1,
      extensions: { ".jpg": 1, ".png": 1, ".txt": 1, ".wav": 1 },
      totalBytes: 2048,
    }),
    [
      { label: "Path", value: "/tmp/test" },
      { label: "Files", value: 4 },
      { label: "Folders", value: 1 },
      { label: "Size", value: "2048 bytes" },
    ]
  );

  // 4. Extension rows — null returns empty
  assert.deepStrictEqual(getFolderSummaryExtensionRows(null), []);

  // 5. Extension rows — error returns empty
  assert.deepStrictEqual(getFolderSummaryExtensionRows({ ok: false, error: "nope" }), []);

  // 6. Extension rows — success returns sorted label/value rows
  assert.deepStrictEqual(
    getFolderSummaryExtensionRows({
      ok: true,
      absolutePath: "/tmp/test",
      fileCount: 4,
      folderCount: 0,
      extensions: { ".wav": 1, ".jpg": 1, ".png": 1, ".txt": 1 },
      totalBytes: 100,
    }),
    [
      { label: ".jpg", value: 1 },
      { label: ".png", value: 1 },
      { label: ".txt", value: 1 },
      { label: ".wav", value: 1 },
    ]
  );

  console.log("PASS");
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
