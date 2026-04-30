const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { getInFlightPacket } = require("../lib/getInFlightPacket");

const TEST_NAME = "unit-get-in-flight-packet";

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack);
  process.exit(1);
}

function withTempDir(fn) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-inflight-"));
  try {
    fn(tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function writeNextAction(tempDir, content) {
  const stateDir = path.join(tempDir, ".consync", "state");
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, "next-action.md"), content, "utf8");
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  try {
    // 1. Missing file returns null
    withTempDir((tempDir) => {
      const result = getInFlightPacket(tempDir);
      assert.strictEqual(result, null, "Expected null when next-action.md is missing");
      console.log("  PASS: missing file returns null");
    });

    // 2. Empty file returns null
    withTempDir((tempDir) => {
      writeNextAction(tempDir, "");
      const result = getInFlightPacket(tempDir);
      assert.strictEqual(result, null, "Expected null for empty file");
      console.log("  PASS: empty file returns null");
    });

    // 3. File with no matching key returns null
    withTempDir((tempDir) => {
      writeNextAction(tempDir, "TYPE: FEATURE\nGOAL:\n\nSome goal text.\n");
      const result = getInFlightPacket(tempDir);
      assert.strictEqual(result, null, "Expected null when no PACKET_ID or PACKAGE key present");
      console.log("  PASS: file with no matching key returns null");
    });

    // 4. PACKET_ID: is parsed
    withTempDir((tempDir) => {
      writeNextAction(tempDir, "TYPE: FEATURE\nPACKET_ID: packet-state-tracking-v1\n\nGOAL:\n\nSome goal.\n");
      const result = getInFlightPacket(tempDir);
      assert.strictEqual(result, "packet-state-tracking-v1", "Expected PACKET_ID value to be returned");
      console.log("  PASS: PACKET_ID: is parsed");
    });

    // 5. PACKAGE: is parsed
    withTempDir((tempDir) => {
      writeNextAction(tempDir, "TYPE: FEATURE\nPACKAGE: ideas_foundation_from_notes_first_workflow\n\nGOAL:\n\nSome goal.\n");
      const result = getInFlightPacket(tempDir);
      assert.strictEqual(result, "ideas_foundation_from_notes_first_workflow", "Expected PACKAGE value to be returned");
      console.log("  PASS: PACKAGE: is parsed");
    });

    // 6. PACKET_ID: takes priority over PACKAGE: if both present
    withTempDir((tempDir) => {
      writeNextAction(tempDir, "TYPE: FEATURE\nPACKAGE: old-package-id\nPACKET_ID: new-packet-id\n");
      const result = getInFlightPacket(tempDir);
      assert.strictEqual(result, "old-package-id", "Expected first matching line to win (PACKAGE appears before PACKET_ID)");
      console.log("  PASS: first matching line wins");
    });

    // 7. Extra whitespace around value is trimmed
    withTempDir((tempDir) => {
      writeNextAction(tempDir, "PACKET_ID:   spaced-packet-id   \n");
      const result = getInFlightPacket(tempDir);
      assert.strictEqual(result, "spaced-packet-id", "Expected value to be trimmed");
      console.log("  PASS: whitespace around value is trimmed");
    });

    // 8. PACKAGE: NONE returns null (explicit closed-state marker)
    withTempDir((tempDir) => {
      writeNextAction(tempDir, "TYPE: RECOVERY\nPACKAGE: NONE\n\nNo active in-flight packet.\n");
      const result = getInFlightPacket(tempDir);
      assert.strictEqual(result, null, "Expected null for PACKAGE: NONE closed-state marker");
      console.log("  PASS: PACKAGE: NONE returns null");
    });

    // 9. PACKET_ID: NONE returns null (explicit closed-state marker)
    withTempDir((tempDir) => {
      writeNextAction(tempDir, "TYPE: RECOVERY\nPACKET_ID: NONE\n");
      const result = getInFlightPacket(tempDir);
      assert.strictEqual(result, null, "Expected null for PACKET_ID: NONE closed-state marker");
      console.log("  PASS: PACKET_ID: NONE returns null");
    });

    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  }
}

main();
