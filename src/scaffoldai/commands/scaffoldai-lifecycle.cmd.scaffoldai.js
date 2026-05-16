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

const defaultRepoRoot = getRepoRoot(__dirname);

function printUsage() {
  console.log("Usage: scaffoldai lifecycle <intake-latest|activate-latest|start-latest|close-feature> [--verify-passed]");
}

function printRefusal(action, diagnostic) {
  const data = diagnostic && diagnostic.data ? diagnostic.data : {};
  console.log(`[scaffoldai lifecycle ${action}]`);
  console.log("");
  console.log(`STATUS:           ${diagnostic.status || "BLOCKED"}`);
  console.log(`REFUSAL REASON:   ${diagnostic.reason || "unspecified_refusal"}`);
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
      next_safe_action: activated.next_safe_action,
      data: {
        active_packet: activated.active_packet || null,
        resolved_identity: activated.packet_id || null,
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
  let verifyPassed = false;

  for (const arg of argv) {
    if (arg === "--verify-passed") {
      verifyPassed = true;
      continue;
    }

    return {
      error: `Unknown flag: ${arg}`,
      verifyPassed: false,
    };
  }

  return {
    verifyPassed,
    error: null,
  };
}

function runCloseFeature(commandRepoRoot, argv) {
  const parsed = parseCloseFeatureArgs(argv);
  if (parsed.error) {
    printRefusal("close-feature", {
      status: "BLOCKED",
      reason: "invalid_arguments",
      next_safe_action: `Use: scaffoldai lifecycle close-feature [--verify-passed]. ${parsed.error}`,
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

  const completion = gatherCompletionStatus(commandRepoRoot, {
    packet: active.value.packet_id,
    latestOnly: true,
    limit: 1,
  });

  const completionRecord = completion.data.completions[0] || null;
  const completionVerified = Boolean(completionRecord && completionRecord.verify_status === "passed");

  const closeout = gatherCloseoutReadiness(commandRepoRoot, {
    verifyPassed: parsed.verifyPassed,
  });

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

  if (!parsed.verifyPassed || !completionVerified) {
    printRefusal("close-feature", {
      status: "BLOCKED",
      reason: "verification_evidence_missing",
      next_safe_action:
        "Run verification, emit/confirm packet_completed verify_status=passed evidence, then rerun close-feature --verify-passed.",
      data: {
        active_packet: active.value.packet_id,
        resolved_identity: active.value.packet_id,
        verification_ready: parsed.verifyPassed && completionVerified,
      },
    });
    return;
  }

  if (closeout.status === "NEEDS_VERIFICATION") {
    printRefusal("close-feature", {
      status: "BLOCKED",
      reason: "closeout_requires_verification",
      next_safe_action: "Run verify and rerun close-feature with --verify-passed.",
      data: {
        active_packet: active.value.packet_id,
        resolved_identity: active.value.packet_id,
      },
    });
    return;
  }

  const handoffText = scaffoldaiState.readHandoff(commandRepoRoot);
  const handoff = handoffText ? parseHandoff(handoffText) : null;
  const hasTerminalHandoff = Boolean(
    handoff &&
      handoff.packageName === active.value.packet_id &&
      (handoff.status === "PASS" || handoff.status === "FAIL")
  );

  if (!hasTerminalHandoff) {
    printRefusal("close-feature", {
      status: "BLOCKED",
      reason: "cleanup_preconditions_unmet",
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

function runScaffoldaiLifecycleCommand(argv = [], options = {}) {
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
    runCloseFeature(commandRepoRoot, argv.slice(1));
    return;
  }

  printUsage();
  process.exitCode = 1;
}

module.exports = {
  runScaffoldaiLifecycleCommand,
  parseCloseFeatureArgs,
};
