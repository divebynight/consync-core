"use strict";

const fs = require("fs");
const path = require("path");

const { getInFlightPacket } = require("./getInFlightPacket.query.scaffoldai");
const { getPacketStatus } = require("./scaffoldaiPacketActivation.auth.scaffoldai");
const {
  parseTitle,
  validateStrictSdcPacket,
  buildPacketIdentity,
} = require("./scaffoldaiPacketIntake.auth.scaffoldai");

const INBOX_DIR_RELATIVE = path.join(".scaffoldai", "inbox");
const PROCESS_DOMAIN = "scaffoldai_process";
const PRODUCT_DOMAIN = "consync_product";

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

function toDiagnostic(status, reason, nextSafeAction, data = {}) {
  return {
    status,
    reason,
    next_safe_action: nextSafeAction,
    data,
  };
}

function readInboxCandidates(repoRoot) {
  const inboxRoot = path.join(repoRoot, INBOX_DIR_RELATIVE);

  if (!fs.existsSync(inboxRoot)) {
    return [];
  }

  const entries = fs
    .readdirSync(inboxRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter((entry) => entry.name.toLowerCase().endsWith(".sdc.md"))
    .map((entry) => {
      const fullPath = path.join(inboxRoot, entry.name);
      const stats = fs.statSync(fullPath);
      return {
        full_path: fullPath,
        relative_path: normalizePath(path.relative(repoRoot, fullPath)),
        file_name: entry.name,
        mtime_ms: stats.mtimeMs,
      };
    })
    .sort((left, right) => right.mtime_ms - left.mtime_ms || left.file_name.localeCompare(right.file_name));

  return entries;
}

function resolveLatestCandidate(entries) {
  if (entries.length === 0) {
    return {
      ok: false,
      diagnostic: toDiagnostic(
        "BLOCKED",
        "no_inbox_candidates",
        "Submit a candidate packet first, then rerun this command.",
        {
          inbox_candidate_count: 0,
          resolved_identity: null,
        }
      ),
    };
  }

  const latestMtime = entries[0].mtime_ms;
  const latest = entries.filter((entry) => entry.mtime_ms === latestMtime);

  if (latest.length > 1) {
    return {
      ok: false,
      diagnostic: toDiagnostic(
        "BLOCKED",
        "ambiguous_latest_candidate",
        "Disambiguate candidate ordering by removing or renaming tied latest candidates, then retry.",
        {
          inbox_candidate_count: entries.length,
          ambiguous_candidates: latest.map((entry) => entry.relative_path),
          resolved_identity: null,
        }
      ),
    };
  }

  return {
    ok: true,
    value: latest[0],
  };
}

function resolveLatestValidInboxCandidate(repoRoot) {
  const entries = readInboxCandidates(repoRoot);
  const latest = resolveLatestCandidate(entries);

  if (!latest.ok) {
    return latest;
  }

  const content = fs.readFileSync(latest.value.full_path, "utf8");
  const titleResult = parseTitle(content);

  if (!titleResult.valid) {
    return {
      ok: false,
      diagnostic: toDiagnostic(
        "BLOCKED",
        "latest_candidate_invalid_title",
        "Fix the latest inbox candidate title to '# SDC - <Title>' format, then retry.",
        {
          latest_candidate: latest.value.relative_path,
          validation_error: titleResult.error,
          resolved_identity: null,
        }
      ),
    };
  }

  const identity = buildPacketIdentity(titleResult.title);
  if (identity.error) {
    return {
      ok: false,
      diagnostic: toDiagnostic(
        "BLOCKED",
        "latest_candidate_identity_invalid",
        "Fix the latest inbox candidate title so it normalizes to a valid packet identity.",
        {
          latest_candidate: latest.value.relative_path,
          validation_error: identity.error,
          resolved_identity: null,
        }
      ),
    };
  }

  return {
    ok: true,
    value: {
      source_path: latest.value.full_path,
      source_relative_path: latest.value.relative_path,
      file_name: latest.value.file_name,
      packet_title: titleResult.title,
      packet_id: identity.packet_id,
      durable_packet_file: identity.file_name,
      normalized_slug: identity.normalized_slug,
    },
  };
}

function resolveLatestIntakeCompatibleCandidate(repoRoot) {
  const entries = readInboxCandidates(repoRoot);
  const compat = [];

  for (const entry of entries) {
    const content = fs.readFileSync(entry.full_path, "utf8");
    const validation = validateStrictSdcPacket(content);

    if (!validation.valid) {
      continue;
    }

    compat.push({
      ...entry,
      packet_id: validation.packet_id,
      durable_packet_file: validation.file_name,
      packet_title: validation.packet_title,
      normalized_slug: validation.normalized_slug,
    });
  }

  if (compat.length === 0) {
    return {
      ok: false,
      diagnostic: toDiagnostic(
        "BLOCKED",
        "no_intake_compatible_candidates",
        "Repair candidate structure in .scaffoldai/inbox and rerun intake-latest.",
        {
          inbox_candidate_count: entries.length,
          compatible_candidate_count: 0,
          resolved_identity: null,
        }
      ),
    };
  }

  const latest = resolveLatestCandidate(compat);
  if (!latest.ok) {
    return latest;
  }

  return {
    ok: true,
    value: {
      source_path: latest.value.full_path,
      source_relative_path: latest.value.relative_path,
      file_name: latest.value.file_name,
      packet_id: latest.value.packet_id,
      durable_packet_file: latest.value.durable_packet_file,
      packet_title: latest.value.packet_title,
      normalized_slug: latest.value.normalized_slug,
    },
  };
}

function resolveActivePacketIdentity(repoRoot) {
  const inFlight = getInFlightPacket(repoRoot);
  if (!inFlight) {
    return {
      ok: false,
      diagnostic: toDiagnostic(
        "BLOCKED",
        "no_active_packet",
        "Activate a packet before running this lifecycle action.",
        {
          active_packet: null,
          resolved_identity: null,
        }
      ),
    };
  }

  const status = getPacketStatus(repoRoot);
  if (status.ambiguous_identity) {
    return {
      ok: false,
      diagnostic: toDiagnostic(
        "BLOCKED",
        "ambiguous_active_packet_identity",
        "Resolve duplicate packet identity files in .scaffoldai/packets before continuing.",
        {
          active_packet: inFlight,
          ambiguous_matches: status.ambiguous_matches || [],
          resolved_identity: null,
        }
      ),
    };
  }

  if (!status.exists) {
    return {
      ok: false,
      diagnostic: toDiagnostic(
        "BLOCKED",
        "active_packet_missing",
        "Repair or clear the active packet pointer before continuing lifecycle actions.",
        {
          active_packet: inFlight,
          packet_file: status.packet_file || null,
          resolved_identity: null,
        }
      ),
    };
  }

  return {
    ok: true,
    value: {
      packet_id: status.active_packet,
      packet_file: status.packet_file,
      packet_title: status.title,
      packet_category: status.category,
      resolved_identity: status.active_packet,
    },
  };
}

function classifyCurrentDomainContext(repoRoot) {
  const active = resolveActivePacketIdentity(repoRoot);
  if (!active.ok) {
    return {
      domain: null,
      active_packet: null,
      packet_category: null,
      packet_file: null,
      packet_title: null,
    };
  }

  const category = String(active.value.packet_category || "").toLowerCase();
  const processLike = new Set(["process", "contract", "planning", "sdc"]);
  const productLike = new Set(["product", "agent"]);

  return {
    domain: processLike.has(category)
      ? PROCESS_DOMAIN
      : productLike.has(category)
      ? PRODUCT_DOMAIN
      : PROCESS_DOMAIN,
    active_packet: active.value.packet_id,
    packet_category: active.value.packet_category,
    packet_file: active.value.packet_file,
    packet_title: active.value.packet_title,
  };
}

function enforceSingleDomainContext(repoRoot, expectedDomain) {
  const context = classifyCurrentDomainContext(repoRoot);

  if (!context.active_packet) {
    return {
      ok: true,
      value: context,
    };
  }

  if (!expectedDomain || expectedDomain === context.domain) {
    return {
      ok: true,
      value: context,
    };
  }

  return {
    ok: false,
    diagnostic: toDiagnostic(
      "BLOCKED",
      "domain_context_conflict",
      `Close the active ${context.domain} packet before starting ${expectedDomain} lifecycle work.`,
      {
        active_packet: context.active_packet,
        active_domain: context.domain,
        expected_domain: expectedDomain,
        packet_category: context.packet_category,
        resolved_identity: context.active_packet,
      }
    ),
  };
}

module.exports = {
  PROCESS_DOMAIN,
  PRODUCT_DOMAIN,
  readInboxCandidates,
  resolveLatestValidInboxCandidate,
  resolveLatestIntakeCompatibleCandidate,
  resolveActivePacketIdentity,
  classifyCurrentDomainContext,
  enforceSingleDomainContext,
};
