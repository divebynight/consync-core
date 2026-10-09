"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { randomUUID } = require("crypto");

const { intakePacket } = require("./scaffoldaiPacketIntake.auth.scaffoldai");
const { activatePacket } = require("./scaffoldaiPacketActivation.auth.scaffoldai");
const { claimPacket, releasePacket } = require("./packetClaim.auth.scaffoldai");
const { gatherCloseoutReadiness } = require("./scaffoldaiCloseout.auth.scaffoldai");
const { cleanWorkspace } = require("./scaffoldaiHousekeeping.auth.scaffoldai");
const scaffoldaiVerifyEvidence = require("./scaffoldaiVerifyEvidence.state.scaffoldai");

// -----------------------------------------------------------------------
// ScaffoldAI Lifecycle Probe
// -----------------------------------------------------------------------
//
// A deterministic no-op lifecycle probe that validates the orchestration
// runtime loop without requiring real feature work.
//
// The probe:
//   - creates an isolated fixture in .scaffoldai/tmp/
//   - exercises all lifecycle phases (intake → activate → claim → verify
//     evidence → closeout readiness → release → clean-workspace)
//   - requires no product/runtime mutations
//   - avoids filesystem writes outside .scaffoldai/tmp/
//   - cleans up its fixture on completion
//
// Probe lifecycle separation guarantees:
//   ✅ Uses isolated fixture root in .scaffoldai/tmp/
//   ✅ Never writes to live .scaffoldai/state/ or .scaffoldai/runtime/
//   ✅ Cleans up fixture in finally block
//   ❌ Cannot mutate live packet state
//   ❌ Cannot activate real packets
// -----------------------------------------------------------------------

const PROBE_PACKET_TITLE = "ScaffoldAI Lifecycle Probe";
const PROBE_CLIENT_ID = "lifecycle-probe";

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function writeJson(filePath, value) {
  writeFile(filePath, JSON.stringify(value, null, 2) + "\n");
}

function buildProbeRoot(repoRoot) {
  const tempRoot = path.join(repoRoot, ".scaffoldai", "tmp");
  ensureDir(tempRoot);
  return fs.mkdtempSync(path.join(tempRoot, "lifecycle-probe-"));
}

function initializeProbeFixture(probeRoot) {
  const scaffoldaiRoot = path.join(probeRoot, ".scaffoldai");

  ensureDir(path.join(scaffoldaiRoot, "state"));
  ensureDir(path.join(scaffoldaiRoot, "contracts"));
  ensureDir(path.join(scaffoldaiRoot, "packets"));
  ensureDir(path.join(scaffoldaiRoot, "inbox"));
  ensureDir(path.join(scaffoldaiRoot, "runtime", "packet-intake"));
  ensureDir(path.join(scaffoldaiRoot, "runtime", "mcp"));

  writeJson(path.join(scaffoldaiRoot, "contracts", "active-policy.json"), {
    mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
    allowed_packet_types: ["process", "contract", "planning"],
    blocked_packet_types: ["product", "agent"],
    require_clean_git: true,
    require_dry_run: true,
  });

  writeJson(path.join(scaffoldaiRoot, "state", "active-runtime.json"), {
    in_flight_packet: null,
  });

  writeFile(
    path.join(scaffoldaiRoot, "state", "next-action.md"),
    "TYPE: REFACTOR\nPACKAGE: NONE\n\nNo active in-flight packet.\n"
  );

  writeFile(
    path.join(scaffoldaiRoot, "state", "snapshot.md"),
    "# Consync Snapshot\n\n## Current Package\n\n- type: `REFACTOR`\n- package: `NONE`\n\n"
  );

  writeFile(path.join(scaffoldaiRoot, "state", "active-stream.md"), "ACTIVE STREAM\nprocess\n");
  writeFile(path.join(scaffoldaiRoot, "state", "history.jsonl"), '{"seed":"probe-history"}\n');
  writeFile(path.join(scaffoldaiRoot, "runtime", "mcp", "signals.jsonl"), '{"seed":"probe-signals"}\n');
  writeFile(path.join(scaffoldaiRoot, "runtime", "mcp", "shared-memory.jsonl"), '{"seed":"probe-shared"}\n');

  writeFile(path.join(probeRoot, "README.md"), "# Probe Fixture\n");

  spawnSync("git", ["init"], { cwd: probeRoot, encoding: "utf8" });
  spawnSync("git", ["config", "user.email", "probe@example.com"], { cwd: probeRoot });
  spawnSync("git", ["config", "user.name", "Probe"], { cwd: probeRoot });
  spawnSync("git", ["add", "-A"], { cwd: probeRoot, encoding: "utf8" });
  spawnSync("git", ["commit", "-m", "probe: initial state"], { cwd: probeRoot, encoding: "utf8" });
}

function writeProbePacket(probeRoot, probeId) {
  const inboxPath = path.join(
    probeRoot,
    ".scaffoldai",
    "inbox",
    `lifecycle-probe-${probeId}.sdc.md`
  );
  writeFile(
    inboxPath,
    [
      `# SDC — ${PROBE_PACKET_TITLE}`,
      "",
      "MODE: PROCESS_REFACTOR",
      "EXECUTION SURFACE: ScaffoldAI lifecycle probe",
      "",
      "APPROVAL:",
      "  execute: APPROVED",
      "  commit: PENDING",
      "",
      "GOAL:",
      "Validate ScaffoldAI lifecycle probe flow end-to-end.",
      "",
      "TASKS:",
      "1. Execute deterministic lifecycle probe.",
      "",
      "VERIFY:",
      "Run:",
      "- npm run verify:scaffoldai",
      "",
      "OUTPUT:",
      "Return lifecycle probe report.",
      "",
      "CONSTRAINTS:",
      "- no product/runtime mutations",
      "- bounded execution only",
      "",
    ].join("\n")
  );
  return inboxPath;
}

function stageAll(probeRoot) {
  spawnSync("git", ["add", "-A"], { cwd: probeRoot, encoding: "utf8" });
  spawnSync(
    "git",
    ["commit", "-m", "probe: stage changes", "--allow-empty"],
    { cwd: probeRoot, encoding: "utf8" }
  );
}

/**
 * Run a deterministic lifecycle probe in an isolated fixture.
 *
 * @param {string} repoRoot - repository root path
 * @param {object} [options]
 * @param {string} [options.probeId] - override generated probe id
 * @returns {object} probe report
 */
function runLifecycleProbe(repoRoot, options = {}) {
  const probeId = (options.probeId || randomUUID()).slice(0, 8);
  let probeRoot;

  const report = {
    probe_id: probeId,
    phases_reached: [],
    blocked_transitions: [],
    mcp_tools_exercised: [],
    async_job_ids: [],
    runtime_artifact_paths: [],
    terminal_states_observed: [],
    errors: [],
    cleanup: null,
    ok: false,
  };

  try {
    probeRoot = buildProbeRoot(repoRoot);
    initializeProbeFixture(probeRoot);
    report.phases_reached.push("probe_fixture_init");

    // 1. Packet submission — write probe packet to inbox
    const inboxPath = writeProbePacket(probeRoot, probeId);
    report.phases_reached.push("packet_submission");
    report.runtime_artifact_paths.push(path.relative(probeRoot, inboxPath));

    // 2. Intake
    const intake = intakePacket(probeRoot, inboxPath);
    if (!intake.accepted) {
      report.errors.push({ phase: "intake", reason: intake.reason || "intake_rejected" });
      report.terminal_states_observed.push("intake_rejected");
      return report;
    }
    report.phases_reached.push("packet_intake");
    report.mcp_tools_exercised.push("intakePacket");
    report.runtime_artifact_paths.push(".scaffoldai/runtime/packet-intake/latest-intake.json");

    stageAll(probeRoot);

    // 3. Activation
    const activated = activatePacket(probeRoot, intake.file_name);
    if (activated.status !== "PASS") {
      report.errors.push({ phase: "activation", reason: activated.reason || "activation_failed" });
      report.blocked_transitions.push({ transition: "activation", reason: activated.reason });
      report.terminal_states_observed.push("activation_blocked");
      return report;
    }
    report.phases_reached.push("packet_activation");
    report.mcp_tools_exercised.push("activatePacket");
    report.runtime_artifact_paths.push(".scaffoldai/state/active-runtime.json");

    stageAll(probeRoot);

    // 4. Claim
    const claim = claimPacket(probeRoot, PROBE_CLIENT_ID, { message: "lifecycle probe claim" });
    if (!claim.success) {
      report.errors.push({ phase: "claim", reason: claim.reason });
      report.blocked_transitions.push({ transition: "claim", reason: claim.reason });
      report.terminal_states_observed.push("claim_blocked");
      return report;
    }
    report.phases_reached.push("packet_claim");
    report.mcp_tools_exercised.push("claimPacket");

    // 5. Verify evidence (simulated — no actual verify run)
    const evidence = scaffoldaiVerifyEvidence.buildVerifyEvidence({
      active_packet_id: intake.packet_id,
      packet_id: intake.packet_id,
      verify_command: "npm run verify:scaffoldai",
      verify_target: "scaffoldai",
      verify_status: "passed",
      exit_code: 0,
      surface: "scaffoldai",
    });
    scaffoldaiVerifyEvidence.writeVerifyEvidence(probeRoot, evidence);
    report.phases_reached.push("verify_evidence_written");
    report.mcp_tools_exercised.push("buildVerifyEvidence", "writeVerifyEvidence");
    report.runtime_artifact_paths.push(".scaffoldai/state/verify-evidence.json");

    // 6. Closeout readiness
    const closeout = gatherCloseoutReadiness(probeRoot, { verifyPassed: true });
    if (closeout.status === "BLOCKED") {
      report.blocked_transitions.push({ transition: "closeout_readiness", reason: closeout.reason });
    } else {
      report.phases_reached.push("closeout_readiness");
    }
    report.mcp_tools_exercised.push("gatherCloseoutReadiness");

    // 7. Release claim
    const release = releasePacket(probeRoot, PROBE_CLIENT_ID);
    if (release.success) {
      report.phases_reached.push("claim_release");
      report.mcp_tools_exercised.push("releasePacket");
    } else {
      report.blocked_transitions.push({ transition: "claim_release", reason: release.reason });
    }

    // 8. Clean workspace
    const cleanResult = cleanWorkspace(probeRoot);
    report.cleanup = {
      status: cleanResult.status,
      touched: cleanResult.data ? cleanResult.data.touched : undefined,
      skipped: cleanResult.data ? cleanResult.data.skipped : undefined,
    };
    if (cleanResult.status === "PASS") {
      report.phases_reached.push("clean_workspace");
      report.mcp_tools_exercised.push("cleanWorkspace");
    } else {
      report.blocked_transitions.push({ transition: "clean_workspace", reason: cleanResult.reason });
    }

    report.terminal_states_observed.push("probe_complete");
    report.ok = true;
  } catch (error) {
    report.errors.push({ phase: "unhandled", message: error.message });
    report.terminal_states_observed.push("probe_error");
  } finally {
    if (probeRoot) {
      try {
        fs.rmSync(probeRoot, { recursive: true, force: true });
      } catch (_) {
        // ignore fixture cleanup errors
      }
    }
  }

  return report;
}

/**
 * Validate that a probe report contains all expected lifecycle phases.
 *
 * @param {object} report - probe report from runLifecycleProbe
 * @returns {{ valid: boolean, missing_phases: string[], errors: string[] }}
 */
function validateProbeReport(report) {
  const EXPECTED_PHASES = [
    "probe_fixture_init",
    "packet_submission",
    "packet_intake",
    "packet_activation",
    "packet_claim",
    "verify_evidence_written",
    "closeout_readiness",
    "claim_release",
    "clean_workspace",
  ];

  const missing = EXPECTED_PHASES.filter((phase) => !report.phases_reached.includes(phase));
  const errors = [];

  if (!report.ok) {
    errors.push("probe did not reach ok=true terminal state");
  }

  if (report.errors.length > 0) {
    errors.push(...report.errors.map((e) => `${e.phase}: ${e.reason || e.message || "unknown"}`));
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing_phases: missing,
    errors,
  };
}

module.exports = {
  PROBE_PACKET_TITLE,
  PROBE_CLIENT_ID,
  runLifecycleProbe,
  validateProbeReport,
};
