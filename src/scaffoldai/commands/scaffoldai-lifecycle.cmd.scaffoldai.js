"use strict";

const { getRepoRoot } = require("../../lib/repoRoot.util.shared");
const {
  intakePacket,
} = require("../../lib/scaffoldaiPacketIntake.auth.scaffoldai");
const {
  activatePacket,
} = require("../../lib/scaffoldaiPacketActivation.auth.scaffoldai");
const {
  getClaimStatus,
} = require("../../lib/packetClaim.auth.scaffoldai");
const {
  gatherCloseoutReadiness,
} = require("../../lib/scaffoldaiCloseout.auth.scaffoldai");
const { runGatekeeperClose } = require("../../lib/gatekeeperClose.auth.scaffoldai");
const {
  cleanWorkspace,
} = require("../../lib/scaffoldaiHousekeeping.auth.scaffoldai");
const scaffoldaiState = require("../../lib/scaffoldaiState.state.scaffoldai");
const { parseHandoff } = require("../../lib/stateIntegrityCheck.check.scaffoldai");
const {
  gatherCompletionStatus,
} = require("../../lib/scaffoldaiCompletionStatus.query.scaffoldai");
const {
  PROCESS_DOMAIN,
  resolveLatestValidInboxCandidate,
  resolveLatestIntakeCompatibleCandidate,
  resolveActivePacketIdentity,
  enforceSingleDomainContext,
} = require("../../lib/scaffoldaiLifecycleResolution.query.scaffoldai");
const scaffoldaiVerifyEvidence = require("../../lib/scaffoldaiVerifyEvidence.state.scaffoldai");

const defaultRepoRoot = getRepoRoot(__dirname);

function printUsage() {
  console.log("Usage: scaffoldai lifecycle <intake-latest|activate-latest|start-latest|close-feature>");
}

function printRefusal(action, diagnostic) {
  const data = diagnostic && diagnostic.data ? diagnostic.data : {};
  console.log(`[scaffoldai lifecycle ${action}]`);
  console.log("");
  console.log(`STATUS:           ${diagnostic.status || "BLOCKED"}`);
  console.log(`REFUSAL REASON:   ${diagnostic.reason || "unspecified_refusal"}`);
  
  if (diagnostic.message) {
    console.log(`MESSAGE:          ${diagnostic.message}`);
  }
  
  if (data.dirty_files_count !== undefined) {
    console.log(`DIRTY FILES:      ${data.dirty_files_count}`);
    if (Array.isArray(data.dirty_files) && data.dirty_files.length > 0) {
      console.log("  Files:");
      for (const file of data.dirty_files.slice(0, 5)) {
        console.log(`    ${file}`);
      }
      if (data.dirty_files.length > 5) {
        console.log(`    ... and ${data.dirty_files.length - 5} more`);
      }
    }
  }

  console.log(`NEXT SAFE ACTION: ${diagnostic.next_safe_action || "Review lifecycle state and retry intentionally."}`);

  if (data.resolved_identity) {
    console.log(`RESOLVED IDENTITY:${data.resolved_identity}`);
  }

  if (data.active_packet) {
    console.log(`ACTIVE PACKET:    ${data.active_packet}`);
  }

  if (Array.isArray(data.ambiguous_candidates) && data.ambiguous_candidates.length > 0) {
    console.log("AMBIGUOUS CANDIDATES:");
    for (const value of data.ambiguous_candidates) {
      console.log(`  - ${value}`);
    }
  }

  if (Array.isArray(data.ambiguous_matches) && data.ambiguous_matches.length > 0) {
    console.log("AMBIGUOUS MATCHES:");
    for (const value of data.ambiguous_matches) {
      console.log(`  - ${value}`);
    }
  }

  process.exitCode = 1;
}

function printWrapperResult(action, details) {
  console.log(`[scaffoldai lifecycle ${action}]`);
  console.log("");

  if (details.active_packet !== undefined) {
    console.log(`ACTIVE PACKET:    ${details.active_packet || "(none)"}`);
  }

  if (details.resolved_candidate) {
    console.log(`RESOLVED CANDIDATE: ${details.resolved_candidate}`);
  }

  if (details.resolved_identity) {
    console.log(`RESOLVED IDENTITY: ${details.resolved_identity}`);
  }

  if (details.verification_ready !== undefined) {
    console.log(`VERIFICATION READY: ${details.verification_ready ? "yes" : "no"}`);
  }

  if (details.cleanup_ready !== undefined) {
    console.log(`CLEANUP READY:      ${details.cleanup_ready ? "yes" : "no"}`);
  }

  if (details.lifecycle_phase) {
    console.log(`LIFECYCLE PHASE:    ${details.lifecycle_phase}`);
  }

  if (details.next_safe_action) {
    console.log(`NEXT SAFE ACTION: ${details.next_safe_action}`);
  }

  console.log("");
  console.log(`STATUS: ${details.status || "PASS"}`);
}

function runIntakeLatest(commandRepoRoot) {
  const domain = enforceSingleDomainContext(commandRepoRoot, PROCESS_DOMAIN);
  if (!domain.ok) {
    printRefusal("intake-latest", domain.diagnostic);
    return;
  }

  const active = resolveActivePacketIdentity(commandRepoRoot);
  if (active.ok) {
    printRefusal("intake-latest", {
      status: "BLOCKED",
      reason: "active_packet_exists",
      next_safe_action: "Complete close-feature for the active packet before intaking a new candidate.",
      data: {
        active_packet: active.value.packet_id,
        resolved_identity: active.value.packet_id,
      },
    });
    return;
  }

  const resolution = resolveLatestIntakeCompatibleCandidate(commandRepoRoot);
  if (!resolution.ok) {
    printRefusal("intake-latest", resolution.diagnostic);
    return;
  }

  const intake = intakePacket(commandRepoRoot, resolution.value.source_path);
  if (!intake.accepted) {
    printRefusal("intake-latest", {
      status: "BLOCKED",
      reason: "intake_rejected",
      next_safe_action: intake.next_safe_action,
      data: {
        resolved_identity: intake.packet_id || null,
        validation_errors: intake.validation_errors || [],
      },
    });
    return;
  }

  printWrapperResult("intake-latest", {
    active_packet: "(none)",
    resolved_candidate: resolution.value.source_relative_path,
    resolved_identity: intake.packet_id,
    lifecycle_phase: "intake_complete",
    next_safe_action: "Activate intentionally with scaffoldai lifecycle activate-latest or scaffoldai packet activate <packet>.",
    status: "PASS",
  });
}

function runActivateLatest(commandRepoRoot) {
  const domain = enforceSingleDomainContext(commandRepoRoot, PROCESS_DOMAIN);
  if (!domain.ok) {
    printRefusal("activate-latest", domain.diagnostic);
    return;
  }

  const active = resolveActivePacketIdentity(commandRepoRoot);
  if (active.ok) {
    printRefusal("activate-latest", {
      status: "BLOCKED",
      reason: "active_packet_exists",
      next_safe_action: "Close or clear the active packet before activating another packet.",
      data: {
        active_packet: active.value.packet_id,
        resolved_identity: active.value.packet_id,
      },
    });
    return;
  }

  const resolution = resolveLatestIntakeCompatibleCandidate(commandRepoRoot);
  if (!resolution.ok) {
    printRefusal("activate-latest", resolution.diagnostic);
    return;
  }

  const intake = intakePacket(commandRepoRoot, resolution.value.source_path);
  if (!intake.accepted) {
    printRefusal("activate-latest", {
      status: "BLOCKED",
      reason: "intake_rejected",
      next_safe_action: intake.next_safe_action,
      data: {
        resolved_identity: intake.packet_id || null,
        validation_errors: intake.validation_errors || [],
      },
    });
    return;
  }

  const activated = activatePacket(commandRepoRoot, intake.file_name);
  if (activated.status === "BLOCKED") {
    printRefusal("activate-latest", {
      status: "BLOCKED",
      reason: activated.reason || "activation_blocked",
      message: activated.message,
      next_safe_action: activated.next_safe_action,
      data: {
        active_packet: activated.active_packet || null,
        resolved_identity: activated.packet_id || null,
        dirty_files_count: activated.dirty_files_count,
        dirty_files: activated.dirty_files,
      },
    });
    return;
  }

  printWrapperResult("activate-latest", {
    active_packet: activated.packet_id,
    resolved_candidate: resolution.value.source_relative_path,
    resolved_identity: activated.packet_id,
    lifecycle_phase: "active_packet_mounted",
    next_safe_action: "Claim and execute manually; wrappers do not run verification or autonomous execution.",
    status: "PASS",
  });
}

function runStartLatest(commandRepoRoot) {
  const domain = enforceSingleDomainContext(commandRepoRoot, PROCESS_DOMAIN);
  if (!domain.ok) {
    printRefusal("start-latest", domain.diagnostic);
    return;
  }

  const valid = resolveLatestValidInboxCandidate(commandRepoRoot);
  if (!valid.ok) {
    printRefusal("start-latest", valid.diagnostic);
    return;
  }

  const active = resolveActivePacketIdentity(commandRepoRoot);
  if (active.ok) {
    printRefusal("start-latest", {
      status: "BLOCKED",
      reason: "active_packet_exists",
      next_safe_action: "Complete close-feature for the active packet before starting another packet.",
      data: {
        active_packet: active.value.packet_id,
        resolved_identity: active.value.packet_id,
      },
    });
    return;
  }

  runActivateLatest(commandRepoRoot);
}

function parseCloseFeatureArgs(argv) {
  let legacyVerifyFlag = false;

  for (const arg of argv) {
    if (arg === "--verify-passed") {
      // Backward-compatible no-op flag. Verification is now auto-detected from evidence.
      legacyVerifyFlag = true;
      continue;
    }

    return {
      error: `Unknown flag: ${arg}`,
      legacyVerifyFlag: false,
    };
  }

  return {
    legacyVerifyFlag,
    error: null,
  };
}

function readTerminalHandoffForPacket(commandRepoRoot, packetId) {
  const handoffText = scaffoldaiState.readHandoff(commandRepoRoot);
  const handoff = handoffText ? parseHandoff(handoffText) : null;

  if (
    handoff &&
    handoff.packageName === packetId &&
    (handoff.status === "PASS" || handoff.status === "FAIL")
  ) {
    return handoff;
  }

  return null;
}

async function runCloseFeature(commandRepoRoot, argv) {
  const parsed = parseCloseFeatureArgs(argv);
  if (parsed.error) {
    printRefusal("close-feature", {
      status: "BLOCKED",
      reason: "invalid_arguments",
      next_safe_action: `Use: scaffoldai lifecycle close-feature. ${parsed.error}`,
      data: {
        resolved_identity: null,
      },
    });
    return;
  }

  const domain = enforceSingleDomainContext(commandRepoRoot, PROCESS_DOMAIN);
  if (!domain.ok) {
    printRefusal("close-feature", domain.diagnostic);
    return;
  }

  const active = resolveActivePacketIdentity(commandRepoRoot);
  if (!active.ok) {
    if (active.diagnostic && active.diagnostic.reason === "no_active_packet") {
      const handoffText = scaffoldaiState.readHandoff(commandRepoRoot);
      const handoff = handoffText ? parseHandoff(handoffText) : null;
      const alreadyClosed =
        Boolean(handoff) && (handoff.status === "PASS" || handoff.status === "FAIL");

      if (alreadyClosed) {
        printWrapperResult("close-feature", {
          active_packet: "(none)",
          resolved_identity: handoff.packageName || null,
          verification_ready: true,
          cleanup_ready: true,
          lifecycle_phase: "already_closed",
          next_safe_action:
            "No active packet to close. Review git status, commit intentional artifacts, then activate the next packet.",
          status: "CLEAN",
        });
        return;
      }

      printRefusal("close-feature", {
        status: "BLOCKED",
        reason: "no_active_packet",
        next_safe_action:
          "No active packet to close. Activate a packet first, or run scaffoldai status to inspect state.",
        data: {
          active_packet: null,
          resolved_identity: null,
        },
      });
      return;
    }

    printRefusal("close-feature", active.diagnostic);
    return;
  }

  const claim = getClaimStatus(commandRepoRoot);
  if (claim.has_claim) {
    printRefusal("close-feature", {
      status: "BLOCKED",
      reason: "active_claim_exists",
      next_safe_action: `Release claim owned by ${claim.claimed_by} before close-feature cleanup.`,
      data: {
        active_packet: active.value.packet_id,
        resolved_identity: active.value.packet_id,
      },
    });
    return;
  }

  // Enforce clean workspace before closing packet (final state must be clean).
  const { checkWorkspaceCleanliness } = require("../../lib/workspaceCleanlinessCheck.auth.scaffoldai");
  const cleanliness = checkWorkspaceCleanliness(commandRepoRoot);
  if (!cleanliness.clean) {
    printRefusal("close-feature", {
      status: "BLOCKED",
      reason: "workspace_not_clean",
      message: cleanliness.message,
      next_safe_action: cleanliness.next_safe_action,
      data: {
        active_packet: active.value.packet_id,
        resolved_identity: active.value.packet_id,
        dirty_files_count: cleanliness.count,
        dirty_files: cleanliness.files,
      },
    });
    return;
  }

  const verifyEvidence = scaffoldaiVerifyEvidence.validateVerifyEvidence(
    commandRepoRoot,
    active.value.packet_id
  );

  const verificationReady = verifyEvidence.valid;

  const closeout = gatherCloseoutReadiness(commandRepoRoot, {
    verifyPassed: true,
  });

  if (closeout.status === "BLOCKED" && closeout.data.verificationEvidenceState === "invalid") {
    printRefusal("close-feature", {
      status: "BLOCKED",
      reason: closeout.data.verificationEvidenceReason || "verification_evidence_invalid",
      next_safe_action:
        closeout.data.verificationEvidenceReason === "verify_evidence_failed"
          ? "Resolve verification failures, re-run npm run verify:scaffoldai, then retry close-feature."
          : "Refresh verification evidence for the active packet, then retry close-feature.",
      data: {
        active_packet: active.value.packet_id,
        resolved_identity: active.value.packet_id,
        verification_ready: false,
      },
    });
    return;
  }

  if (closeout.status === "BLOCKED") {
    printRefusal("close-feature", {
      status: "BLOCKED",
      reason: "closeout_blocked",
      next_safe_action: "Resolve closeout blockers before cleanup.",
      data: {
        active_packet: active.value.packet_id,
        resolved_identity: active.value.packet_id,
      },
    });
    return;
  }

  if (!verificationReady) {
    printRefusal("close-feature", verifyEvidence.diagnostic);
    return;
  }

  if (closeout.status === "NEEDS_VERIFICATION") {
    printRefusal("close-feature", {
      status: "BLOCKED",
      reason: "closeout_requires_verification",
      next_safe_action: "Run verify and rerun close-feature.",
      data: {
        active_packet: active.value.packet_id,
        resolved_identity: active.value.packet_id,
      },
    });
    return;
  }

  let terminalHandoff = readTerminalHandoffForPacket(commandRepoRoot, active.value.packet_id);

  if (!terminalHandoff) {
    const closeoutSummary = `Lifecycle close-feature closeout after verify evidence for ${active.value.packet_id}.`;
    const closeResult = await runGatekeeperClose(commandRepoRoot, {
      nonInteractive: true,
      status: "PASS",
      summary: closeoutSummary,
      confirm: true,
    });

    if (!closeResult || closeResult.packet_closed !== true) {
      printRefusal("close-feature", {
        status: "BLOCKED",
        reason: "closeout_failed",
        next_safe_action: "Resolve closeout blockers and rerun close-feature.",
        data: {
          active_packet: active.value.packet_id,
          resolved_identity: active.value.packet_id,
          closeout_status: closeResult && closeResult.status ? closeResult.status : null,
          closeout_reason:
            closeResult && Array.isArray(closeResult.guard_errors) && closeResult.guard_errors.length > 0
              ? closeResult.guard_errors[0]
              : null,
        },
      });
      return;
    }

    terminalHandoff = readTerminalHandoffForPacket(commandRepoRoot, active.value.packet_id);
  }

  if (!terminalHandoff) {
    printRefusal("close-feature", {
      status: "BLOCKED",
      reason: "closeout_evidence_missing",
      next_safe_action:
        "Write terminal handoff for the active packet (PASS or FAIL) before running close-feature cleanup.",
      data: {
        active_packet: active.value.packet_id,
        resolved_identity: active.value.packet_id,
      },
    });
    return;
  }

  const cleanup = cleanWorkspace(commandRepoRoot, { includeRuntimeLogs: false });
  if (cleanup.status !== "PASS") {
    printRefusal("close-feature", {
      status: "BLOCKED",
      reason: "cleanup_preconditions_unmet",
      next_safe_action: cleanup.next_safe_action,
      data: {
        active_packet: active.value.packet_id,
        resolved_identity: active.value.packet_id,
      },
    });
    return;
  }

  printWrapperResult("close-feature", {
    active_packet: "(none)",
    resolved_identity: active.value.packet_id,
    verification_ready: true,
    cleanup_ready: true,
    lifecycle_phase: "packet_closed_and_workspace_cleaned",
    next_safe_action: "Review git status and run explicit packet activation for the next packet.",
    status: "PASS",
  });
}

async function runScaffoldaiLifecycleCommand(argv = [], options = {}) {
  const commandRepoRoot = options.repoRoot || defaultRepoRoot;
  const action = argv[0];

  if (!action) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (action === "intake-latest") {
    runIntakeLatest(commandRepoRoot);
    return;
  }

  if (action === "activate-latest") {
    runActivateLatest(commandRepoRoot);
    return;
  }

  if (action === "start-latest") {
    runStartLatest(commandRepoRoot);
    return;
  }

  if (action === "close-feature") {
    await runCloseFeature(commandRepoRoot, argv.slice(1));
    return;
  }

  printUsage();
  process.exitCode = 1;
}

module.exports = {
  runScaffoldaiLifecycleCommand,
  parseCloseFeatureArgs,
};
