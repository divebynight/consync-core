const assert = require("assert");
const fs = require("fs");
const path = require("path");

const TEST_NAME = "bridge-integrity-checks";
const repoRoot = path.resolve(__dirname, "..", "..");

const requiredStateFiles = [
  ".consync/state/next-action.md",
  ".consync/state/active-contract.json",
  ".consync/state/active-stream.md",
  ".consync/state/handoff.md",
  ".consync/state/snapshot.md",
];

const requiredStreamFiles = [
  ".consync/streams/process/stream.md",
  ".consync/streams/electron_ui/stream.md",
];

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack);
  process.exit(1);
}

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function assertFileExists(relativePath) {
  assert.ok(fs.existsSync(path.join(repoRoot, relativePath)), `Expected ${relativePath} to exist`);
}

function extractActiveStream(activeStreamText) {
  const lines = activeStreamText.split(/\r?\n/);
  const activeStreamIndex = lines.findIndex((line) => line.trim() === "ACTIVE STREAM");

  assert.notStrictEqual(activeStreamIndex, -1, "Expected active-stream.md to contain ACTIVE STREAM");

  for (const line of lines.slice(activeStreamIndex + 1)) {
    const value = line.trim();

    if (!value) {
      continue;
    }

    return value;
  }

  throw new Error("Expected active-stream.md to name an active stream");
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  try {
    for (const relativePath of requiredStateFiles) {
      assertFileExists(relativePath);
    }
    console.log("  PASS: required Bridge state files exist");

    for (const relativePath of requiredStreamFiles) {
      assertFileExists(relativePath);
    }
    console.log("  PASS: required stream files exist");

    const activeContract = JSON.parse(readRepoFile(".consync/state/active-contract.json"));
    console.log("  PASS: active-contract.json is valid JSON");

    const nextAction = readRepoFile(".consync/state/next-action.md");
    if (activeContract.in_flight_packet === null) {
      assert.ok(
        /\b(?:PACKAGE|PACKET_ID):\s*NONE\b/.test(nextAction),
        "Expected next-action.md to contain PACKAGE: NONE or PACKET_ID: NONE when active-contract.json has in_flight_packet: null"
      );
    }
    console.log("  PASS: active-contract.json and next-action.md agree on no active packet state");

    const activeStream = extractActiveStream(readRepoFile(".consync/state/active-stream.md"));
    const activeStreamDir = path.join(repoRoot, ".consync", "streams", activeStream);
    assert.ok(fs.statSync(activeStreamDir).isDirectory(), `Expected active stream directory to exist: ${activeStreamDir}`);
    console.log("  PASS: active-stream.md references an existing stream directory");

    assert.ok(readRepoFile(".consync/state/handoff.md").trim().length > 0, "Expected handoff.md to be non-empty");
    console.log("  PASS: handoff.md is non-empty");

    assert.ok(readRepoFile(".consync/state/snapshot.md").trim().length > 0, "Expected snapshot.md to be non-empty");
    console.log("  PASS: snapshot.md is non-empty");

    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  }
}

main();
