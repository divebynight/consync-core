"use strict";

const {
  activatePacket,
  getPacketStatus,
  clearActivePacket,
} = require("../../lib/scaffoldaiPacketActivation.auth.scaffoldai");
const { getRepoRoot } = require("../../lib/repoRoot.util.shared");

const repoRoot = getRepoRoot(__dirname);

function printUsage() {
  console.log("Usage: scaffoldai packet <activate|status|clear> [packet-path-or-filename]");
}

function printStatus(result) {
  console.log("[scaffoldai packet status]");
  console.log("");
  console.log(`ACTIVE PACKET:    ${result.active_packet || "(none)"}`);
  console.log(`PACKET FILE:      ${result.packet_file || "(none)"}`);
  console.log(`PACKET EXISTS:    ${result.exists ? "yes" : "no"}`);
  console.log(`PACKET TITLE:     ${result.title || "(none)"}`);
  console.log(`PACKET CATEGORY:  ${result.category || "(none)"}`);
  console.log(`NEXT SAFE ACTION: ${result.next_safe_action}`);
  console.log("");
  console.log(`STATUS: ${result.active_packet ? "ON_TRACK" : "IDLE"}`);
}

function printActivate(result) {
  console.log("[scaffoldai packet activate]");
  console.log("");
  console.log(`ACTIVE PACKET:    ${result.packet_id}`);
  console.log(`PACKET FILE:      ${result.packet_file}`);
  console.log(`PACKET TITLE:     ${result.title || "(none)"}`);
  console.log(`PACKET CATEGORY:  ${result.category || "(none)"}`);
  console.log(`NEXT SAFE ACTION: ${result.next_safe_action}`);
  console.log("");
  console.log("STATUS: PASS");
}

function printClear(result) {
  console.log("[scaffoldai packet clear]");
  console.log("");
  console.log(`PREVIOUS PACKET:  ${result.previous_packet || "(none)"}`);
  console.log("ACTIVE PACKET:    (none)");
  console.log(`NEXT SAFE ACTION: ${result.next_safe_action}`);
  console.log("");
  console.log("STATUS: PASS");
}

function runScaffoldaiPacketCommand(argv = []) {
  const action = argv[0];

  try {
    if (!action) {
      printUsage();
      process.exitCode = 1;
      return;
    }

    if (action === "status") {
      printStatus(getPacketStatus(repoRoot));
      return;
    }

    if (action === "activate") {
      const packetInput = argv[1];
      if (!packetInput) {
        printUsage();
        process.exitCode = 1;
        return;
      }
      printActivate(activatePacket(repoRoot, packetInput));
      return;
    }

    if (action === "clear") {
      printClear(clearActivePacket(repoRoot));
      return;
    }

    console.error(`Unknown packet action: ${action}`);
    printUsage();
    process.exitCode = 1;
  } catch (error) {
    console.error(`STATUS: FAIL`);
    console.error(`REASON: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  runScaffoldaiPacketCommand,
};
