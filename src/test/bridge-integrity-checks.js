const assert = require("assert");
const fs = require("fs");
const path = require("path");

const TEST_NAME = "bridge-integrity-checks";
const repoRoot = path.resolve(__dirname, "..", "..");

const requiredStateFiles = [
  ".scaffoldai/state/handoff.md",
];

const optionalRuntimeStateFiles = [
  ".scaffoldai/state/next-action.md",
  ".scaffoldai/state/active-runtime.json",
  ".scaffoldai/state/active-stream.md",
  ".scaffoldai/state/snapshot.md",
];

const requiredContractFiles = [
  ".scaffoldai/contracts/active-policy.json",
];

const requiredStreamFiles = [
  ".scaffoldai/streams/process/stream.md",
  ".scaffoldai/streams/electron_ui/stream.md",
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

function fileExists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
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
    console.log("  PASS: required tracked Bridge state files exist");

    for (const relativePath of optionalRuntimeStateFiles) {
      if (fileExists(relativePath)) {
        console.log(`  INFO: optional runtime state file detected: ${relativePath}`);
      }
    }

    for (const relativePath of requiredContractFiles) {
      assertFileExists(relativePath);
    }
    console.log("  PASS: required Bridge policy files exist");

    for (const relativePath of requiredStreamFiles) {
      assertFileExists(relativePath);
    }
    console.log("  PASS: required stream files exist");

    const activePolicy = JSON.parse(readRepoFile(".scaffoldai/contracts/active-policy.json"));
    console.log("  PASS: active-policy.json is valid JSON");

    const hasActiveRuntime = fileExists(".scaffoldai/state/active-runtime.json");
    const hasNextAction = fileExists(".scaffoldai/state/next-action.md");

    if (hasActiveRuntime) {
      const activeRuntime = JSON.parse(readRepoFile(".scaffoldai/state/active-runtime.json"));
      console.log("  PASS: active-runtime.json is valid JSON");

      if (hasNextAction) {
        const nextAction = readRepoFile(".scaffoldai/state/next-action.md");
        if (activeRuntime.in_flight_packet === null) {
          assert.ok(
            /\b(?:PACKAGE|PACKET_ID):\s*NONE\b/.test(nextAction),
            "Expected next-action.md to contain PACKAGE: NONE or PACKET_ID: NONE when active-runtime.json has in_flight_packet: null"
          );
        }
        console.log("  PASS: active-runtime.json and next-action.md agree on no active packet state");
      } else {
        console.log("  INFO: next-action.md not present; skipping runtime coherence check");
      }
    } else {
      console.log("  INFO: active-runtime.json not present; skipping runtime coherence checks");
    }

    assert.ok(Array.isArray(activePolicy.allowed_packet_types), "Expected active-policy allowed_packet_types to be an array");
    assert.ok(Array.isArray(activePolicy.blocked_packet_types), "Expected active-policy blocked_packet_types to be an array");
    console.log("  PASS: active-policy packet type lists are valid arrays");

    if (fileExists(".scaffoldai/state/active-stream.md")) {
      const activeStream = extractActiveStream(readRepoFile(".scaffoldai/state/active-stream.md"));
      const activeStreamDir = path.join(repoRoot, ".scaffoldai", "streams", activeStream);
      assert.ok(fs.statSync(activeStreamDir).isDirectory(), `Expected active stream directory to exist: ${activeStreamDir}`);
      console.log("  PASS: active-stream.md references an existing stream directory");
    } else {
      console.log("  INFO: active-stream.md not present; skipping active stream directory check");
    }

    assert.ok(readRepoFile(".scaffoldai/state/handoff.md").trim().length > 0, "Expected handoff.md to be non-empty");
    console.log("  PASS: handoff.md is non-empty");

    if (fileExists(".scaffoldai/state/snapshot.md")) {
      assert.ok(readRepoFile(".scaffoldai/state/snapshot.md").trim().length > 0, "Expected snapshot.md to be non-empty");
      console.log("  PASS: snapshot.md is non-empty");
    } else {
      console.log("  INFO: snapshot.md not present; skipping snapshot content check");
    }

    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  }
}

main();
