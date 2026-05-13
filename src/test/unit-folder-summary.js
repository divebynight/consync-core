const assert = require("assert");
const path = require("path");
const { summarizeFolder } = require("../lib/folder-summary.util.consync");

const TEST_NAME = "unit-folder-summary";

const repoRoot = path.resolve(__dirname, "..", "..");

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack);
  process.exit(1);
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  try {
    // 1. Known fixture: mixed-flat-small (4 files, 0 folders, 4 extensions)
    const fixturePath = path.join(repoRoot, "sandbox", "fixtures", "mixed-flat-small");
    const summary = summarizeFolder(fixturePath);

    assert.strictEqual(summary.ok, true, "summary.ok should be true");
    assert.strictEqual(summary.fileCount, 4, "expected 4 files");
    assert.strictEqual(summary.folderCount, 0, "expected 0 subdirectories");
    assert.strictEqual(summary.extensions[".jpg"], 1, "expected 1 .jpg");
    assert.strictEqual(summary.extensions[".png"], 1, "expected 1 .png");
    assert.strictEqual(summary.extensions[".txt"], 1, "expected 1 .txt");
    assert.strictEqual(summary.extensions[".wav"], 1, "expected 1 .wav");
    assert.strictEqual(typeof summary.totalBytes, "number", "totalBytes should be a number");
    assert.ok(summary.totalBytes > 0, "totalBytes should be > 0");

    console.log("  PASS: mixed-flat-small counts, extensions, and bytes");

    // 2. Missing path returns ok: false
    const missingSummary = summarizeFolder(path.join(repoRoot, "sandbox", "fixtures", "__nonexistent__"));

    assert.strictEqual(missingSummary.ok, false, "missing path should return ok: false");
    assert.ok(typeof missingSummary.error === "string", "missing path should include error message");

    console.log("  PASS: missing path returns ok: false with error");

    // 3. File path (not a directory) returns ok: false
    const fileSummary = summarizeFolder(path.join(fixturePath, "notes.txt"));

    assert.strictEqual(fileSummary.ok, false, "file path should return ok: false");
    assert.ok(typeof fileSummary.error === "string", "file path should include error message");

    console.log("  PASS: file path (not a directory) returns ok: false with error");

    // 4. Nested fixture has subdirectories counted
    const nestedPath = path.join(repoRoot, "sandbox", "fixtures", "nested-mixed");
    const nestedSummary = summarizeFolder(nestedPath);

    assert.strictEqual(nestedSummary.ok, true, "nested summary should be ok");
    assert.ok(nestedSummary.folderCount > 0, "nested fixture should have at least one subdirectory");

    console.log("  PASS: nested fixture counts subdirectories");
  } catch (error) {
    fail(error);
  }

  console.log(`[${TEST_NAME}] PASS`);
}

main();
