"use strict";

const {
  activatePacket,
  getPacketStatus,
  clearActivePacket,
} = require("../../lib/scaffoldaiPacketActivation.auth.scaffoldai");
const { intakePacket } = require("../../lib/scaffoldaiPacketIntake.auth.scaffoldai");
const { previewPacket } = require("../../lib/scaffoldaiPacketPreview.query.scaffoldai");
const {
  claimPacket,
  releasePacket,
  forceReleasePacket,
  getClaimStatus,
} = require("../../lib/packetClaim.auth.scaffoldai");
const { getRepoRoot } = require("../../lib/repoRoot.util.shared");

const repoRoot = getRepoRoot(__dirname);

function printUsage() {
  console.log("Usage: scaffoldai packet <preview|activate|status|clear|intake|claim|release|claim-status|force-release> [options]");
  console.log("");
  console.log("  preview <path>                             Show a packet for review and its review hash (read-only)");
  console.log("  activate <packet> --sha256 <hash>          Accept a reviewed packet by path or filename");
  console.log("  status                                     Show current active packet status");
  console.log("  clear                                      Clear the active packet pointer");
  console.log("  intake <path> --sha256 <hash> [--activate] Validate and intake a reviewed strict SDC packet");
  console.log("  claim --client <id>        Claim the active packet for a client");
  console.log("  release --client <id>      Release a claim (owning client only)");
  console.log("  claim-status               Show current claim state");
  console.log("  force-release              Force-release any claim (human/CLI authority)");
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

  if (result.status === "BLOCKED") {
    console.log(`REQUESTED PACKET: ${result.packet_id}`);
    console.log(`PACKET FILE:      ${result.packet_file}`);
    console.log(`ACTIVE PACKET:    ${result.active_packet || "(none)"}`);
    console.log(`CLAIMED BY:       ${result.claimed_by || "(none)"}`);
    console.log(`CLAIM STATUS:     ${result.claim_status || "(none)"}`);
    console.log(`REASON:           ${result.reason}`);
    console.log(`MESSAGE:          ${result.message}`);
    console.log(`NEXT SAFE ACTION: ${result.next_safe_action}`);
    console.log("");
    console.log("STATUS: FAIL");
    return;
  }

  console.log(`ACTIVE PACKET:    ${result.packet_id}`);
  console.log(`PACKET FILE:      ${result.packet_file}`);
  console.log(`PACKET TITLE:     ${result.title || "(none)"}`);
  console.log(`PACKET CATEGORY:  ${result.category || "(none)"}`);
  if (result.idempotent) console.log("NOTE:             Idempotent - packet already active");
  if (result.approval_compatibility) {
    console.log("NOTE:             Legacy packet without APPROVAL block; treated as PENDING (no approval granted)");
  }
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

function printClaimResult(result, action) {
  const header = action === "force-release" ? "force-release" : action;
  console.log(`[scaffoldai packet ${header}]`);
  console.log("");

  if (result.success) {
    if (action === "claim") {
      console.log(`CLAIMED BY:       ${result.claimed_by}`);
      console.log(`CLAIM STATUS:     ${result.claim_status}`);
      console.log(`CLAIMED AT:       ${result.claimed_at}`);
      if (result.claim_message) console.log(`CLAIM MESSAGE:    ${result.claim_message}`);
      console.log(`ACTIVE PACKET:    ${result.active_packet}`);
      if (result.idempotent) console.log("NOTE:             Idempotent — already owner");
    } else if (action === "release" || action === "force-release") {
      console.log(`PREVIOUS OWNER:   ${result.previous_owner || "(none)"}`);
      console.log(`MESSAGE:          ${result.message}`);
    }
    console.log("");
    console.log("STATUS: PASS");
  } else {
    console.log(`REASON:           ${result.reason}`);
    console.log(`MESSAGE:          ${result.message}`);
    if (result.claimed_by) console.log(`CLAIMED BY:       ${result.claimed_by}`);
    if (result.claimed_at) console.log(`CLAIMED AT:       ${result.claimed_at}`);
    if (result.active_packet) console.log(`ACTIVE PACKET:    ${result.active_packet}`);
    console.log("");
    console.log("STATUS: FAIL");
  }
}

function printClaimStatus(result) {
  console.log("[scaffoldai packet claim-status]");
  console.log("");
  console.log(`ACTIVE PACKET:    ${result.active_packet || "(none)"}`);
  console.log(`HAS CLAIM:        ${result.has_claim ? "yes" : "no"}`);
  console.log(`CLAIMED BY:       ${result.claimed_by || "(none)"}`);
  console.log(`CLAIM STATUS:     ${result.claim_status || "(none)"}`);
  console.log(`CLAIMED AT:       ${result.claimed_at || "(none)"}`);
  if (result.claim_message) console.log(`CLAIM MESSAGE:    ${result.claim_message}`);
  if (result.claim_expires_at) console.log(`EXPIRES AT:       ${result.claim_expires_at}`);
  console.log(`BUSY:             ${result.busy ? "yes" : "no"}`);
  console.log(`NEXT SAFE ACTION: ${result.next_safe_action}`);
  console.log("");
  console.log(`STATUS: ${result.has_claim ? "CLAIMED" : "IDLE"}`);
}

function printPreview(result) {
  console.log("[scaffoldai packet preview]");
  console.log("");
  console.log(`SOURCE PATH:      ${result.source_path}`);
  console.log(`PACKET ID:        ${result.packet_id || "(none)"}`);
  console.log(`PACKET TITLE:     ${result.packet_title || "(none)"}`);
  console.log(`MODE:             ${result.mode || "(none)"}`);
  console.log(`APPROVAL:         ${result.approval ? JSON.stringify(result.approval) : "(none)"}`);
  console.log(`VALID:            ${result.valid ? "yes" : "no"}`);
  for (const error of result.errors) console.log(`  - ${error}`);
  console.log(`TASK STATE:       ${result.task.status}${result.task.task_id ? ` (${result.task.task_id})` : ""}`);
  if (result.conflicts.length > 0) {
    console.log("CONFLICTS:");
    for (const conflict of result.conflicts) console.log(`  - ${conflict}`);
  }
  console.log(`HIDDEN CHARACTERS: ${result.hidden_character_count}${result.hidden_character_count ? " (shown escaped below)" : ""}`);
  console.log("");
  console.log("----- BEGIN PACKET (review this text) -----");
  console.log(result.escaped_content.replace(/\n$/, ""));
  console.log("----- END PACKET -----");
  console.log("");
  console.log(`REVIEW SHA256:    ${result.review_sha256}`);
  console.log("NEXT SAFE ACTION: If this is the text you accept, rerun intake/activate with --sha256 <review hash>. Preview grants nothing.");
}

function printIntakeResult(result) {
  console.log("[scaffoldai packet intake]");
  console.log("");
  console.log(`SOURCE PATH:      ${result.source_path}`);
  console.log(`PACKET ID:        ${result.packet_id || "(none)"}`);
  console.log(`PACKET FILE:      ${result.file_name || "(none)"}`);
  console.log(`PACKET TITLE:     ${result.packet_title || "(none)"}`);
  console.log(`MODE:             ${result.mode || "(none)"}`);

  if (result.accepted) {
    console.log(`PACKET PATH:      ${result.packet_path}`);
    console.log(`NORMALIZED:       ${result.normalized ? "yes" : "no"}`);
  } else {
    console.log(`VALIDATION ERRORS:${result.validation_errors.length === 0 ? " (none)" : ""}`);
    for (const error of result.validation_errors) {
      console.log(`  - ${error}`);
    }
    if (result.missing_sections && result.missing_sections.length > 0) {
      console.log(`MISSING SECTIONS: ${result.missing_sections.join(", ")}`);
    }
    if (result.blocked_policy_reasons && result.blocked_policy_reasons.length > 0) {
      console.log(`BLOCKED POLICY:   ${result.blocked_policy_reasons.join("; ")}`);
    }
  }

  if (result.warnings && result.warnings.length > 0) {
    console.log("WARNINGS:");
    for (const warning of result.warnings) {
      console.log(`  - ${warning}`);
    }
  }

  console.log(`NEXT SAFE ACTION: ${result.next_safe_action}`);
  console.log("");
  console.log(`STATUS: ${result.accepted ? "PASS" : "FAIL"}`);
}

// Parse --flag value from an argv slice. Returns the value or null.
function parseFlag(argv, flag) {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === flag && argv[i + 1] !== undefined) {
      return argv[i + 1];
    }
  }
  return null;
}

function runScaffoldaiPacketCommand(argv = [], options = {}) {
  const commandRepoRoot = options.repoRoot || repoRoot;
  const action = argv[0];

  try {
    if (!action) {
      printUsage();
      process.exitCode = 1;
      return;
    }

    if (action === "preview") {
      if (!argv[1]) {
        console.error("Usage: scaffoldai packet preview <path>");
        process.exitCode = 1;
        return;
      }
      printPreview(previewPacket(commandRepoRoot, argv[1]));
      return;
    }

    if (action === "status") {
      printStatus(getPacketStatus(commandRepoRoot));
      return;
    }

    if (action === "activate") {
      const packetInput = argv[1];
      if (!packetInput) {
        printUsage();
        process.exitCode = 1;
        return;
      }
      const result = activatePacket(commandRepoRoot, packetInput,
        { expectedPacketSha256: parseFlag(argv.slice(2), "--sha256") });
      printActivate(result);
      if (result.status === "BLOCKED") process.exitCode = 1;
      return;
    }

    if (action === "clear") {
      printClear(clearActivePacket(commandRepoRoot));
      return;
    }

    if (action === "intake") {
      const packetInput = argv[1];
      if (!packetInput) {
        console.error("Usage: scaffoldai packet intake <path> --sha256 <hash> [--activate]");
        process.exitCode = 1;
        return;
      }

      const shouldActivate = argv.includes("--activate");
      // One review hash covers both steps: intake stores the normalized bytes
      // that activation then hashes.
      const reviewSha256 = parseFlag(argv.slice(2), "--sha256");
      const intakeResult = intakePacket(commandRepoRoot, packetInput, { expectedSha256: reviewSha256 });
      printIntakeResult(intakeResult);

      if (!intakeResult.accepted) {
        process.exitCode = 1;
        return;
      }

      if (shouldActivate) {
        console.log("");
        const activationResult = activatePacket(commandRepoRoot, intakeResult.file_name,
          { expectedPacketSha256: reviewSha256 });
        printActivate(activationResult);
        if (activationResult.status === "BLOCKED") process.exitCode = 1;
      }
      return;
    }

    if (action === "claim") {
      const clientId = parseFlag(argv.slice(1), "--client");
      if (!clientId) {
        console.error("Usage: scaffoldai packet claim --client <id> [--message \"...\"]");
        process.exitCode = 1;
        return;
      }
      const message = parseFlag(argv.slice(1), "--message");
      const result = claimPacket(commandRepoRoot, clientId, { message });
      printClaimResult(result, "claim");
      if (!result.success) process.exitCode = 1;
      return;
    }

    if (action === "release") {
      const clientId = parseFlag(argv.slice(1), "--client");
      if (!clientId) {
        console.error("Usage: scaffoldai packet release --client <id>");
        process.exitCode = 1;
        return;
      }
      const result = releasePacket(commandRepoRoot, clientId);
      printClaimResult(result, "release");
      if (!result.success) process.exitCode = 1;
      return;
    }

    if (action === "claim-status") {
      printClaimStatus(getClaimStatus(commandRepoRoot));
      return;
    }

    if (action === "force-release") {
      const result = forceReleasePacket(commandRepoRoot);
      printClaimResult(result, "force-release");
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
