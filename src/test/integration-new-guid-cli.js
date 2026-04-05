const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const TEST_NAME = "integration-new-guid-cli";

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack);
  process.exit(1);
}

function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-integration-"));
  const repoRoot = path.resolve(__dirname, "..", "..");
  const cliPath = path.join(repoRoot, "src", "index.js");
  const note = "integration test note";

  console.log(`[${TEST_NAME}] Running`);

  try {
    const result = spawnSync(process.execPath, [cliPath, "new-guid"], {
      cwd: tempDir,
      env: {
        ...process.env,
        CONSYNC_DISABLE_CLIPBOARD: "1",
      },
      input: `${note}\n`,
      encoding: "utf8",
    });

    assert.strictEqual(result.status, 0, result.stderr || "CLI exited with non-zero status");

    const createdFiles = fs
      .readdirSync(tempDir)
      .filter(entry => entry.endsWith(".json"));

    assert.strictEqual(createdFiles.length, 1, "Expected one JSON artifact in temp directory");

    const artifactPath = path.join(tempDir, createdFiles[0]);
    const payload = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    assert.strictEqual(payload.note, note);
    assert.match(payload.guid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    const expectedFilePath = `./${createdFiles[0]}`;
    const logPath = path.join(tempDir, "state", "events.log");
    assert.ok(fs.existsSync(logPath), "Expected event log to be created");

    const logContent = fs.readFileSync(logPath, "utf8");
    assert.strictEqual(logContent, `${payload.created_at} new-guid ${payload.guid} ${expectedFilePath}\n`);

    console.log(`[${TEST_NAME}] PASS`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  fail(error);
}