const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const TEST_NAME = "integration-handoff-bundle-cli";

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack);
  process.exit(1);
}

function writeFile(rootPath, relativePath, content) {
  const absolutePath = path.join(rootPath, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
}

function runSuccessScenario() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-handoff-bundle-"));
  const repoRoot = path.resolve(__dirname, "..", "..");
  const cliPath = path.join(repoRoot, "src", "index.js");

  const files = [
    {
      relativePath: path.join(".consync", "state", "handoff.md"),
      content: "TYPE: FEATURE\nPACKAGE: sample\n\nSTATUS\n\nPASS\n",
    },
    {
      relativePath: path.join(".consync", "state", "snapshot.md"),
      content: "# Consync Snapshot\n\n## Current Package\n\n- none\n",
    },
    {
      relativePath: path.join(".consync", "docs", "runbook.md"),
      content: "# Consync Runbook\n\nRead state first.\n",
    },
  ];

  try {
    for (const file of files) {
      writeFile(tempDir, file.relativePath, file.content);
    }

    const result = spawnSync(process.execPath, [cliPath, "handoff-bundle"], {
      cwd: tempDir,
      encoding: "utf8",
    });

    assert.strictEqual(result.status, 0, result.stderr || "CLI exited with non-zero status");
    assert.strictEqual(result.stderr, "");
    assert.match(result.stdout, /^CONSYNC HANDOFF BUNDLE/m);
    assert.match(result.stdout, /^SOURCE OF TRUTH$/m);
    assert.match(result.stdout, /^RUNBOOK POINTER$/m);
    assert.match(result.stdout, /For operating rules, read \.consync\/docs\/runbook\.md in the repo\./);

    for (const file of files.slice(0, 2)) {
      assert.match(result.stdout, new RegExp(`===== BEGIN ${escapeRegExp(file.relativePath)} =====`));
      assert.match(result.stdout, new RegExp(`===== END ${escapeRegExp(file.relativePath)} =====`));
      assert.match(result.stdout, new RegExp(escapeRegExp(file.content)));
    }

    assert.doesNotMatch(
      result.stdout,
      new RegExp(`===== BEGIN ${escapeRegExp(files[2].relativePath)} =====`)
    );
    assert.doesNotMatch(result.stdout, new RegExp(escapeRegExp(files[2].content)));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function runFullScenario() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-handoff-bundle-full-"));
  const repoRoot = path.resolve(__dirname, "..", "..");
  const cliPath = path.join(repoRoot, "src", "index.js");

  const files = [
    {
      relativePath: path.join(".consync", "state", "handoff.md"),
      content: "TYPE: FEATURE\nPACKAGE: sample\n\nSTATUS\n\nPASS\n",
    },
    {
      relativePath: path.join(".consync", "state", "snapshot.md"),
      content: "# Consync Snapshot\n\n## Current Package\n\n- none\n",
    },
    {
      relativePath: path.join(".consync", "docs", "runbook.md"),
      content: "# Consync Runbook\n\nRead state first.\n",
    },
  ];

  try {
    for (const file of files) {
      writeFile(tempDir, file.relativePath, file.content);
    }

    const result = spawnSync(process.execPath, [cliPath, "handoff-bundle", "--full"], {
      cwd: tempDir,
      encoding: "utf8",
    });

    assert.strictEqual(result.status, 0, result.stderr || "CLI exited with non-zero status");
    assert.strictEqual(result.stderr, "");
    assert.match(result.stdout, /^CONSYNC HANDOFF BUNDLE/m);

    for (const file of files) {
      assert.match(result.stdout, new RegExp(`===== BEGIN ${escapeRegExp(file.relativePath)} =====`));
      assert.match(result.stdout, new RegExp(`===== END ${escapeRegExp(file.relativePath)} =====`));
      assert.match(result.stdout, new RegExp(escapeRegExp(file.content)));
    }

    assert.doesNotMatch(result.stdout, /^RUNBOOK POINTER$/m);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function runMissingLeanFileScenario() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-handoff-bundle-missing-"));
  const repoRoot = path.resolve(__dirname, "..", "..");
  const cliPath = path.join(repoRoot, "src", "index.js");

  try {
    writeFile(tempDir, path.join(".consync", "state", "handoff.md"), "TYPE: FEATURE\n");

    const result = spawnSync(process.execPath, [cliPath, "handoff-bundle"], {
      cwd: tempDir,
      encoding: "utf8",
    });

    assert.notStrictEqual(result.status, 0, "Expected non-zero exit status when a required file is missing");
    assert.match(result.stderr, /Missing required file: \.consync\/state\/snapshot\.md/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function runMissingFullRunbookScenario() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-handoff-bundle-missing-full-"));
  const repoRoot = path.resolve(__dirname, "..", "..");
  const cliPath = path.join(repoRoot, "src", "index.js");

  try {
    writeFile(tempDir, path.join(".consync", "state", "handoff.md"), "TYPE: FEATURE\n");
    writeFile(tempDir, path.join(".consync", "state", "snapshot.md"), "# Consync Snapshot\n");

    const result = spawnSync(process.execPath, [cliPath, "handoff-bundle", "--full"], {
      cwd: tempDir,
      encoding: "utf8",
    });

    assert.notStrictEqual(result.status, 0, "Expected non-zero exit status when full mode runbook is missing");
    assert.match(result.stderr, /Missing required file: \.consync\/docs\/runbook\.md/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function main() {
  console.log(`[${TEST_NAME}] Running lean scenario`);
  runSuccessScenario();

  console.log(`[${TEST_NAME}] Running full scenario`);
  runFullScenario();

  console.log(`[${TEST_NAME}] Running missing lean file scenario`);
  runMissingLeanFileScenario();

  console.log(`[${TEST_NAME}] Running missing full runbook scenario`);
  runMissingFullRunbookScenario();

  console.log(`[${TEST_NAME}] PASS`);
}

try {
  main();
} catch (error) {
  fail(error);
}
