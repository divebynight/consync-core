"use strict";

const assert = require("assert");
const { gatherPacketVisibility } = require("../lib/scaffoldaiPacketVisibility.query.scaffoldai");
const { getRepoRoot } = require("../lib/repoRoot.util.shared");

const TEST_NAME = "unit-scaffoldai-packet-visibility";
const repoRoot = getRepoRoot(__dirname);

function main() {
  console.log(`[${TEST_NAME}] Running`);

  const defaultResult = gatherPacketVisibility(repoRoot);
  assert.strictEqual(defaultResult.tool, "scaffoldai_packet_visibility", "tool name should match packet visibility");
  assert.strictEqual(defaultResult.execution_class, "READ_ONLY", "execution class should remain READ_ONLY");
  assert.strictEqual(defaultResult.status, "OBSERVE", "status should be OBSERVE");
  assert.strictEqual(defaultResult.data.scope, "in_flight", "default scope should be in_flight");
  assert.ok(Array.isArray(defaultResult.data.packets), "packets should be an array");

  if (defaultResult.data.in_flight_packet) {
    assert.strictEqual(defaultResult.data.packets.length, 1, "in_flight scope should return one packet record");
    const relation = defaultResult.data.packets[0].in_flight_relation;
    assert.ok(
      relation === "active" || relation === "active_missing",
      "in_flight scope relation should be active or active_missing"
    );
  }
  console.log("  PASS: default in_flight visibility shape is valid");

  const allResult = gatherPacketVisibility(repoRoot, { scope: "all", limit: 2 });
  assert.strictEqual(allResult.data.scope, "all", "all scope should be reflected in response");
  assert.ok(allResult.data.limit === 2, "limit should be clamped and reflected");
  assert.ok(Array.isArray(allResult.data.packets), "all scope should return packet array");

  for (const packet of allResult.data.packets) {
    assert.ok(typeof packet.filename === "string" && packet.filename.length > 0, "packet record should include filename");
    assert.ok(packet.filename.toLowerCase() !== "readme.md", "packet records should not include packets README");
    assert.ok(packet.hasOwnProperty("exists"), "packet record should include exists field");
    assert.ok(packet.hasOwnProperty("packet_category"), "packet record should include packet_category field");
    assert.ok(packet.hasOwnProperty("title"), "packet record should include title field");
    assert.ok(packet.hasOwnProperty("in_flight_relation"), "packet record should include in_flight_relation field");
  }
  console.log("  PASS: all-scope packet metadata fields are present");

  const noSummaryResult = gatherPacketVisibility(repoRoot, { scope: "all", limit: 1, includeSummary: false });
  for (const packet of noSummaryResult.data.packets) {
    assert.strictEqual(packet.summary, null, "includeSummary=false should disable summary extraction");
  }
  console.log("  PASS: includeSummary flag is honored");

  console.log(`[${TEST_NAME}] PASS`);
}

try {
  main();
} catch (error) {
  console.error(`[${TEST_NAME}] FAIL: ${error.message}`);
  process.exitCode = 1;
}
