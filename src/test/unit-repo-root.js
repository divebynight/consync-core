const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  getRepoRoot,
  resolveFromRepoRoot,
  resolveScaffoldAIPath,
} = require("../lib/repoRoot.util.shared");

const repoRoot = path.resolve(__dirname, "..", "..");

assert.strictEqual(getRepoRoot(repoRoot), repoRoot);
assert.strictEqual(getRepoRoot(path.join(repoRoot, "src", "scaffoldai", "mcp")), repoRoot);
assert.strictEqual(
  getRepoRoot(path.join(repoRoot, "src", "scaffoldai", "mcp", "tools.js")),
  repoRoot
);

assert.strictEqual(
  resolveScaffoldAIPath("tmp"),
  path.join(repoRoot, ".scaffoldai", "tmp")
);

assert.strictEqual(
  resolveFromRepoRoot("src", "scaffoldai", "mcp", "server.js"),
  path.join(repoRoot, "src", "scaffoldai", "mcp", "server.js")
);

assert.notStrictEqual(
  resolveScaffoldAIPath("tmp"),
  path.join(repoRoot, "src", ".scaffoldai", "tmp")
);
assert.strictEqual(fs.existsSync(path.join(repoRoot, "src", ".scaffoldai")), false);

console.log("unit-repo-root: PASS");
