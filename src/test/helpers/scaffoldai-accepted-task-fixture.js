"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { activatePacket } = require("../../lib/scaffoldaiPacketActivation.auth.scaffoldai");
const { reviewHash } = require("../../lib/scaffoldaiPacketIntake.auth.scaffoldai");

// Accepts a fixture task through the real acceptance path (packet activation),
// so executor tests run against a genuine acceptance record instead of a
// hand-written next-action.md.
function acceptFixtureTask(root, { packetId = "fixture-task.sdc", goal = "Read package.json only." } = {}) {
  const policyPath = path.join(root, ".scaffoldai/contracts/active-policy.json");
  if (!fs.existsSync(policyPath)) {
    fs.mkdirSync(path.dirname(policyPath), { recursive: true });
    fs.writeFileSync(policyPath, JSON.stringify({ mode: "TEST" }) + "\n");
  }
  const packetPath = path.join(root, ".scaffoldai/packets", `${packetId}.md`);
  fs.mkdirSync(path.dirname(packetPath), { recursive: true });
  fs.writeFileSync(packetPath, [
    "# SDC — Fixture Task",
    "",
    "MODE: PLANNING",
    "EXECUTION SURFACE: Test fixture",
    "",
    "GOAL:",
    goal,
    "",
  ].join("\n"));
  const result = activatePacket(root, `${packetId}.md`,
    { expectedPacketSha256: reviewHash(fs.readFileSync(packetPath, "utf8")) });
  if (result.status !== "PASS") {
    throw new Error(`fixture task acceptance failed: ${result.reason || result.status}`);
  }
  return result;
}

module.exports = { acceptFixtureTask };
