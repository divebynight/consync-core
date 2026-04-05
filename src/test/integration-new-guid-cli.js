const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { SANDBOX_CURRENT_DIR } = require("../lib/fs");

const TEST_NAME = "integration-new-guid-cli";

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack);
  process.exit(1);
}

function runScenario(args, note, expectsPrompt) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-integration-"));
  const repoRoot = path.resolve(__dirname, "..", "..");
  const cliPath = path.join(repoRoot, "src", "index.js");

  try {
    const result = spawnSync(process.execPath, [cliPath, "new-guid", ...args], {
      cwd: tempDir,
      env: {
        ...process.env,
        CONSYNC_DISABLE_CLIPBOARD: "1",
      },
      input: expectsPrompt ? `${note}\n` : undefined,
      encoding: "utf8",
    });

    assert.strictEqual(result.status, 0, result.stderr || "CLI exited with non-zero status");
    assert.strictEqual(result.stderr, "");

    if (expectsPrompt) {
      assert.match(result.stdout, /note: /);
    } else {
      assert.doesNotMatch(result.stdout, /note: /);
    }

    const sandboxDir = path.join(tempDir, SANDBOX_CURRENT_DIR);
    assert.ok(fs.existsSync(sandboxDir), "Expected sandbox/current directory to be created");
    assert.deepStrictEqual(
      fs.readdirSync(tempDir).filter(entry => entry.endsWith(".json")),
      [],
      "Expected temp directory root to remain free of JSON artifacts"
    );

    const createdFiles = fs
      .readdirSync(sandboxDir)
      .filter(entry => entry.endsWith(".json"));

    assert.strictEqual(createdFiles.length, 1, "Expected one JSON artifact in sandbox/current");

    const artifactPath = path.join(sandboxDir, createdFiles[0]);
    const payload = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    assert.strictEqual(payload.note, note);
    assert.match(payload.guid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    const expectedFilePath = `./sandbox/current/${createdFiles[0]}`;
    const logPath = path.join(tempDir, "state", "events.log");
    assert.ok(fs.existsSync(logPath), "Expected event log to be created");

    const logContent = fs.readFileSync(logPath, "utf8");
    assert.strictEqual(logContent, `${payload.created_at} new-guid ${payload.guid} ${expectedFilePath}\n`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function main() {
  console.log(`[${TEST_NAME}] Running interactive mode`);
  runScenario([], "interactive integration note", true);

  console.log(`[${TEST_NAME}] Running --note mode`);
  runScenario(["--note", "non-interactive integration note"], "non-interactive integration note", false);

  console.log(`[${TEST_NAME}] PASS`);
}

try {
  main();
} catch (error) {
  fail(error);
}