"use strict";

const fs = require("fs");
const path = require("path");

const scaffoldaiState = require("./scaffoldaiState.state.scaffoldai");

const VERIFY_EVIDENCE_RELATIVE = path.join(".scaffoldai", "state", "verify-evidence.json");
const EVIDENCE_MAX_AGE_MS = 3600000; // 1 hour

function buildVerifyEvidence(options = {}) {
  const now = new Date();
  const activePacketId = options.active_packet_id || options.packet_id || null;
  return {
    timestamp: now.toISOString(),
    timestamp_ms: now.getTime(),
    packet_id: options.packet_id || null,
    active_packet_id: activePacketId,
    verify_command: options.verify_command || "npm run verify:scaffoldai",
    verify_target: options.verify_target || "scaffoldai",
    verify_status: options.verify_status || "not_run",
    exit_code: typeof options.exit_code === "number" ? options.exit_code : null,
    surface: options.surface || "scaffoldai",
  };
}

function writeVerifyEvidence(repoRoot, evidence) {
  const absolutePath = path.join(repoRoot, VERIFY_EVIDENCE_RELATIVE);
  const dir = path.dirname(absolutePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(absolutePath, JSON.stringify(evidence, null, 2) + "\n", "utf8");

  scaffoldaiState.appendHistory(repoRoot, {
    operation: "verify_evidence_write",
    surface: "cli",
    package: evidence.packet_id,
    verify_status: evidence.verify_status,
    summary: `verify evidence recorded: packet=${evidence.packet_id}, status=${evidence.verify_status}`,
  });
}

function readVerifyEvidence(repoRoot) {
  const absolutePath = path.join(repoRoot, VERIFY_EVIDENCE_RELATIVE);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(absolutePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function formatVerifyEvidence(evidence) {
  if (!evidence) {
    return "none";
  }

  const activePacketId = evidence.active_packet_id || evidence.packet_id || null;
  const fields = [
    `packet=${activePacketId || "(none)"}`,
    `target=${evidence.verify_target || "(unknown)"}`,
    `status=${evidence.verify_status || "(unknown)"}`,
    `command=${evidence.verify_command || "(unknown)"}`,
    `timestamp=${evidence.timestamp || "(unknown)"}`,
  ];

  return fields.join(", ");
}

function isEvidenceExpired(evidence) {
  if (!evidence || !evidence.timestamp_ms || typeof evidence.timestamp_ms !== "number") {
    return true;
  }

  const now = Date.now();
  const age = now - evidence.timestamp_ms;
  return age > EVIDENCE_MAX_AGE_MS;
}

function isEvidenceForPacket(evidence, packetId) {
  if (!evidence) {
    return false;
  }

  const evidencePacketId = evidence.active_packet_id || evidence.packet_id || null;
  return evidencePacketId === packetId;
}

function validateVerifyEvidence(repoRoot, packetId, options = {}) {
  const evidence = readVerifyEvidence(repoRoot);

  if (!evidence) {
    return {
      valid: false,
      reason: "no_verify_evidence",
      diagnostic: {
        status: "BLOCKED",
        reason: "no_verify_evidence",
        next_safe_action:
          "Run npm run verify:scaffoldai to generate verification evidence, then retry close-feature.",
        data: {
          active_packet: packetId,
          verify_evidence_file: VERIFY_EVIDENCE_RELATIVE,
        },
      },
    };
  }

  if (isEvidenceExpired(evidence)) {
    return {
      valid: false,
      reason: "verify_evidence_expired",
      diagnostic: {
        status: "WARNING",
        reason: "verify_evidence_expired",
        next_safe_action:
          "Consider re-running npm run verify:scaffoldai to refresh verification evidence. Operator may proceed if confident work is correct.",
        data: {
          active_packet: packetId,
          evidence_age_ms: Date.now() - evidence.timestamp_ms,
          max_age_ms: EVIDENCE_MAX_AGE_MS,
          verify_command: evidence.verify_command,
          verify_target: evidence.verify_target,
        },
      },
    };
  }

  if (!isEvidenceForPacket(evidence, packetId)) {
    return {
      valid: false,
      reason: "verify_evidence_packet_mismatch",
      diagnostic: {
        status: "WARNING",
        reason: "verify_evidence_packet_mismatch",
        next_safe_action:
          "Consider running npm run verify:scaffoldai for the current packet. Operator may proceed if confident verification is still valid.",
        data: {
          active_packet: packetId,
          evidence_packet: evidence.active_packet_id || evidence.packet_id,
        },
      },
    };
  }

  if (evidence.verify_status !== "passed") {
    return {
      valid: false,
      reason: "verify_evidence_failed",
      diagnostic: {
        status: "BLOCKED",
        reason: "verify_evidence_failed",
        next_safe_action:
          "Resolve verification failures, re-run npm run verify:scaffoldai, then retry close-feature.",
        data: {
          active_packet: packetId,
          verify_status: evidence.verify_status,
          verify_command: evidence.verify_command,
          verify_target: evidence.verify_target,
        },
      },
    };
  }

  return {
    valid: true,
    evidence,
  };
}

module.exports = {
  VERIFY_EVIDENCE_RELATIVE,
  EVIDENCE_MAX_AGE_MS,
  buildVerifyEvidence,
  writeVerifyEvidence,
  readVerifyEvidence,
  formatVerifyEvidence,
  isEvidenceExpired,
  isEvidenceForPacket,
  validateVerifyEvidence,
};
