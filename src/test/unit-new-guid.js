const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { newGuidTool } = require("../lib/newGuidTool");
const { CONSYNC_STATE_HISTORY_DIR, SANDBOX_CURRENT_DIR } = require("../lib/fs");

const TEST_NAME = "unit-new-guid";

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack);
  process.exit(1);
}

async function main() {
  const originalCwd = process.cwd();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-unit-"));

  process.env.CONSYNC_DISABLE_CLIPBOARD = "1";

  console.log(`[${TEST_NAME}] Running`);

  try {
    process.chdir(tempDir);

    const result = await newGuidTool({ note: "unit test note" });

    assert.match(result.guid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.match(result.created_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    assert.match(result.filePath, /^\.\/sandbox\/current\/\d{8}T\d{9}Z\.json$/);
    assert.strictEqual(typeof result.json, "string");

    const artifactPath = path.join(tempDir, result.filePath.slice(2));
    assert.ok(fs.existsSync(artifactPath), "Expected JSON artifact to be created");
    assert.ok(fs.existsSync(path.join(tempDir, SANDBOX_CURRENT_DIR)), "Expected sandbox/current directory to be created");
    assert.deepStrictEqual(
      fs.readdirSync(tempDir).filter(entry => entry.endsWith(".json")),
      [],
      "Expected temp directory root to remain free of JSON artifacts"
    );

    const fileContent = fs.readFileSync(artifactPath, "utf8");
    assert.strictEqual(fileContent, `${result.json}\n`);

    const payload = JSON.parse(result.json);
    assert.deepStrictEqual(payload, {
      guid: result.guid,
      created_at: result.created_at,
      note: "unit test note",
    });

    const logPath = path.join(tempDir, CONSYNC_STATE_HISTORY_DIR, "events.log");
    assert.ok(fs.existsSync(logPath), "Expected event log to be created");

    const logContent = fs.readFileSync(logPath, "utf8");
    assert.strictEqual(logContent, `${result.created_at} new-guid ${result.guid} ${result.filePath}\n`);

    console.log(`[${TEST_NAME}] PASS`);
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch(error => {
  fail(error);
});