const assert = require("node:assert");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadWorkspacePanelModule() {
  const modulePath = path.join(__dirname, "..", "electron", "renderer", "workspace-panel.mjs");
  return import(pathToFileURL(modulePath).href);
}

async function main() {
  const { getWorkspacePanelRows, hasActiveWorkspace } = await loadWorkspacePanelModule();

  // 1. null workspace → no-selection row
  assert.deepStrictEqual(getWorkspacePanelRows(null), [
    { label: "Workspace", value: "None selected" },
  ]);

  // 2. empty string workspace → no-selection row
  assert.deepStrictEqual(getWorkspacePanelRows(""), [
    { label: "Workspace", value: "None selected" },
  ]);

  // 3. selected workspace → shows path
  assert.deepStrictEqual(getWorkspacePanelRows("/Users/mark/Projects/my-project"), [
    { label: "Workspace", value: "/Users/mark/Projects/my-project" },
  ]);

  // 4. hasActiveWorkspace — null returns false
  assert.strictEqual(hasActiveWorkspace(null), false);

  // 5. hasActiveWorkspace — empty string returns false
  assert.strictEqual(hasActiveWorkspace(""), false);

  // 6. hasActiveWorkspace — valid path returns true
  assert.strictEqual(hasActiveWorkspace("/tmp/my-workspace"), true);

  console.log("[renderer-workspace-panel] PASS");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
