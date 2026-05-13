const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { appendHistory } = require("../lib/scaffoldaiState.state.scaffoldai");

const TEST_NAME = "unit-scaffoldai-history";

function fail(message) {
  console.error(`[${TEST_NAME}] FAIL: ${message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Test: appendHistory creates file if missing
// ---------------------------------------------------------------------------

function testAppendCreatesFile() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "history-test-"));
  const historyPath = path.join(tempDir, ".scaffoldai", "state", "history.jsonl");

  assert.ok(!fs.existsSync(historyPath), "history.jsonl should not exist yet");

  appendHistory(tempDir, {
    operation: "mount",
    surface: "cli",
    stream: "process",
    package: "test-package",
    summary: "mounted: test-package",
  });

  assert.ok(fs.existsSync(historyPath), "history.jsonl should exist after append");

  const content = fs.readFileSync(historyPath, "utf8");
  const lines = content.trim().split("\n");

  assert.strictEqual(lines.length, 1, "should have exactly one line");

  const record = JSON.parse(lines[0]);

  assert.strictEqual(record.operation, "mount");
  assert.strictEqual(record.surface, "cli");
  assert.strictEqual(record.stream, "process");
  assert.strictEqual(record.package, "test-package");
  assert.strictEqual(record.summary, "mounted: test-package");
  assert.ok(record.timestamp, "timestamp should be present");

  fs.rmSync(tempDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Test: appendHistory appends, does not overwrite
// ---------------------------------------------------------------------------

function testAppendDoesNotOverwrite() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "history-test-"));
  const historyPath = path.join(tempDir, ".scaffoldai", "state", "history.jsonl");

  // Write first record
  appendHistory(tempDir, {
    operation: "mount",
    surface: "cli",
    stream: "process",
    package: "first-package",
    summary: "mounted: first-package",
  });

  // Write second record
  appendHistory(tempDir, {
    operation: "close",
    surface: "cli",
    stream: "process",
    package: "first-package",
    status: "PASS",
    summary: "closed: first-package (PASS)",
  });

  const content = fs.readFileSync(historyPath, "utf8");
  const lines = content.trim().split("\n");

  assert.strictEqual(lines.length, 2, "should have exactly two lines");

  const firstRecord = JSON.parse(lines[0]);
  const secondRecord = JSON.parse(lines[1]);

  assert.strictEqual(firstRecord.operation, "mount");
  assert.strictEqual(firstRecord.package, "first-package");

  assert.strictEqual(secondRecord.operation, "close");
  assert.strictEqual(secondRecord.status, "PASS");

  fs.rmSync(tempDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Test: appendHistory preserves existing history
// ---------------------------------------------------------------------------

function testAppendPreservesExistingHistory() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "history-test-"));
  const historyPath = path.join(tempDir, ".scaffoldai", "state", "history.jsonl");

  // Manually create existing history
  fs.mkdirSync(path.dirname(historyPath), { recursive: true });
  fs.writeFileSync(
    historyPath,
    JSON.stringify({ timestamp: "2026-01-01T00:00:00Z", operation: "mount", surface: "cli", summary: "old record" }) + "\n",
    "utf8"
  );

  // Append new record
  appendHistory(tempDir, {
    operation: "switch",
    surface: "cli",
    stream: "electron_ui",
    summary: "switched from process to electron_ui",
  });

  const content = fs.readFileSync(historyPath, "utf8");
  const lines = content.trim().split("\n");

  assert.strictEqual(lines.length, 2, "should have two lines (old + new)");

  const oldRecord = JSON.parse(lines[0]);
  const newRecord = JSON.parse(lines[1]);

  assert.strictEqual(oldRecord.summary, "old record");
  assert.strictEqual(newRecord.operation, "switch");

  fs.rmSync(tempDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Test: appendHistory handles optional fields correctly
// ---------------------------------------------------------------------------

function testAppendOptionalFields() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "history-test-"));
  const historyPath = path.join(tempDir, ".scaffoldai", "state", "history.jsonl");

  // Record with minimal fields
  appendHistory(tempDir, {
    operation: "mount",
    surface: "cli",
    summary: "minimal record",
  });

  // Record with all fields
  appendHistory(tempDir, {
    operation: "close",
    surface: "mcp-local",
    stream: "process",
    package: "test-package",
    status: "FAIL",
    summary: "full record",
  });

  const content = fs.readFileSync(historyPath, "utf8");
  const lines = content.trim().split("\n");

  const minimalRecord = JSON.parse(lines[0]);
  const fullRecord = JSON.parse(lines[1]);

  // Minimal record should only have required fields
  assert.strictEqual(minimalRecord.operation, "mount");
  assert.strictEqual(minimalRecord.surface, "cli");
  assert.strictEqual(minimalRecord.summary, "minimal record");
  assert.ok(!minimalRecord.stream, "stream should not be present");
  assert.ok(!minimalRecord.package, "package should not be present");
  assert.ok(!minimalRecord.status, "status should not be present");

  // Full record should have all fields
  assert.strictEqual(fullRecord.operation, "close");
  assert.strictEqual(fullRecord.surface, "mcp-local");
  assert.strictEqual(fullRecord.stream, "process");
  assert.strictEqual(fullRecord.package, "test-package");
  assert.strictEqual(fullRecord.status, "FAIL");
  assert.strictEqual(fullRecord.summary, "full record");

  fs.rmSync(tempDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Test: appendHistory defaults surface to "unknown" if not provided
// ---------------------------------------------------------------------------

function testAppendDefaultSurface() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "history-test-"));
  const historyPath = path.join(tempDir, ".scaffoldai", "state", "history.jsonl");

  appendHistory(tempDir, {
    operation: "mount",
    summary: "no surface specified",
  });

  const content = fs.readFileSync(historyPath, "utf8");
  const record = JSON.parse(content.trim());

  assert.strictEqual(record.surface, "unknown", "surface should default to 'unknown'");

  fs.rmSync(tempDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Test: appendHistory handles write errors gracefully
// ---------------------------------------------------------------------------

function testAppendHandlesErrors() {
  // Use a path that will fail (read-only parent if possible, or non-existent deep path)
  const invalidDir = "/this/path/should/not/exist/for/testing";

  // This should not throw — it should warn and continue
  try {
    appendHistory(invalidDir, {
      operation: "mount",
      surface: "cli",
      summary: "should fail gracefully",
    });
    // If we get here, the function handled the error gracefully (expected)
    assert.ok(true, "appendHistory handled write error gracefully");
  } catch (err) {
    fail("appendHistory should not throw on write errors");
  }
}

// ---------------------------------------------------------------------------
// Test: history records have ISO 8601 timestamps
// ---------------------------------------------------------------------------

function testTimestampFormat() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "history-test-"));
  const historyPath = path.join(tempDir, ".scaffoldai", "state", "history.jsonl");

  appendHistory(tempDir, {
    operation: "mount",
    surface: "cli",
    summary: "timestamp test",
  });

  const content = fs.readFileSync(historyPath, "utf8");
  const record = JSON.parse(content.trim());

  // ISO 8601 format: YYYY-MM-DDTHH:MM:SS.sssZ
  const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

  assert.ok(iso8601Pattern.test(record.timestamp), `timestamp should be ISO 8601 format, got: ${record.timestamp}`);

  // Verify it's a valid date
  const date = new Date(record.timestamp);
  assert.ok(!isNaN(date.getTime()), "timestamp should be a valid date");

  fs.rmSync(tempDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------

console.log(`[${TEST_NAME}] Running ScaffoldAI history append tests...`);

testAppendCreatesFile();
console.log(`  PASS: appendHistory creates file if missing`);

testAppendDoesNotOverwrite();
console.log(`  PASS: appendHistory appends, does not overwrite`);

testAppendPreservesExistingHistory();
console.log(`  PASS: appendHistory preserves existing history`);

testAppendOptionalFields();
console.log(`  PASS: appendHistory handles optional fields correctly`);

testAppendDefaultSurface();
console.log(`  PASS: appendHistory defaults surface to 'unknown'`);

testAppendHandlesErrors();
console.log(`  PASS: appendHistory handles write errors gracefully`);

testTimestampFormat();
console.log(`  PASS: history records have ISO 8601 timestamps`);

console.log(`[${TEST_NAME}] PASS (7 tests)`);
