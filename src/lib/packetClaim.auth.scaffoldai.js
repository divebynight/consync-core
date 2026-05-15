"use strict";

const scaffoldaiState = require("./scaffoldaiState.state.scaffoldai");
const { getInFlightPacket } = require("./getInFlightPacket.query.scaffoldai");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CLIENT_ID_LENGTH = 64;
const MAX_MESSAGE_LENGTH = 256;

// ---------------------------------------------------------------------------
// Input sanitization
// ---------------------------------------------------------------------------

function sanitizeClientId(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_CLIENT_ID_LENGTH) return null;
  // Allow alphanumeric, hyphens, underscores, dots
  if (!/^[a-zA-Z0-9_\-.]+$/.test(trimmed)) return null;
  return trimmed;
}

function sanitizeMessage(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim().replace(/[\r\n]/g, " ").slice(0, MAX_MESSAGE_LENGTH);
  return trimmed || null;
}

// ---------------------------------------------------------------------------
// Claim
// ---------------------------------------------------------------------------

/**
 * Claim the active packet for a given client.
 *
 * Collision model:
 *   - No active packet          → claim fails (reason: no_active_packet)
 *   - Active packet, no claim   → claim succeeds
 *   - Same client owns claim    → idempotent (returns current state)
 *   - Different client owns     → fails (reason: busy)
 *
 * @param {string} repoRoot
 * @param {string} clientId
 * @param {object} [options]
 * @param {string} [options.message]
 * @param {string} [options.expiresAt]
 * @returns {object} Result object
 */
function claimPacket(repoRoot, clientId, options = {}) {
  const sanitizedClientId = sanitizeClientId(clientId);
  if (!sanitizedClientId) {
    return {
      success: false,
      reason: "invalid_client_id",
      message: "client_id is required and must be alphanumeric/hyphen/underscore/dot, max 64 chars",
    };
  }

  const inFlightPacket = getInFlightPacket(repoRoot);
  if (!inFlightPacket) {
    return {
      success: false,
      reason: "no_active_packet",
      message: "No active packet. Activate a packet before claiming.",
    };
  }

  const runtime = scaffoldaiState.readActiveRuntime(repoRoot);
  const existingOwner = runtime ? runtime.claimed_by : null;

  if (existingOwner) {
    if (existingOwner === sanitizedClientId) {
      // Idempotent: same client already owns
      return {
        success: true,
        idempotent: true,
        reason: "already_owner",
        claimed_by: runtime.claimed_by,
        claim_status: runtime.claim_status,
        claimed_at: runtime.claimed_at,
        claim_message: runtime.claim_message || null,
        active_packet: inFlightPacket,
      };
    }

    // Different client owns — busy
    return {
      success: false,
      reason: "busy",
      message: `Packet is claimed by "${existingOwner}". Wait for release or use force-release if authorized.`,
      claimed_by: runtime.claimed_by,
      claim_status: runtime.claim_status,
      claimed_at: runtime.claimed_at,
      active_packet: inFlightPacket,
    };
  }

  // No existing claim — proceed
  const now = new Date().toISOString();
  const claimFields = {
    claimed_by: sanitizedClientId,
    claim_status: "claimed",
    claimed_at: now,
    claim_message: sanitizeMessage(options.message),
  };

  if (options.expiresAt) {
    claimFields.claim_expires_at = String(options.expiresAt);
  }

  scaffoldaiState.writeActiveRuntimeClaim(repoRoot, claimFields);

  return {
    success: true,
    idempotent: false,
    claimed_by: sanitizedClientId,
    claim_status: "claimed",
    claimed_at: now,
    claim_message: claimFields.claim_message,
    active_packet: inFlightPacket,
  };
}

// ---------------------------------------------------------------------------
// Release
// ---------------------------------------------------------------------------

/**
 * Release a claim. Only the owning client can release.
 *
 * @param {string} repoRoot
 * @param {string} clientId
 * @returns {object} Result object
 */
function releasePacket(repoRoot, clientId) {
  const sanitizedClientId = sanitizeClientId(clientId);
  if (!sanitizedClientId) {
    return {
      success: false,
      reason: "invalid_client_id",
      message: "client_id is required",
    };
  }

  const runtime = scaffoldaiState.readActiveRuntime(repoRoot);
  const existingOwner = runtime ? runtime.claimed_by : null;

  if (!existingOwner) {
    return {
      success: true,
      reason: "no_claim",
      message: "No active claim to release.",
    };
  }

  if (existingOwner !== sanitizedClientId) {
    return {
      success: false,
      reason: "not_owner",
      message: `You do not own this claim. Owner is "${existingOwner}".`,
      claimed_by: existingOwner,
    };
  }

  scaffoldaiState.clearActiveRuntimeClaim(repoRoot);

  return {
    success: true,
    reason: "released",
    message: "Claim released.",
    previous_owner: sanitizedClientId,
  };
}

// ---------------------------------------------------------------------------
// Force release (CLI / human authority only)
// ---------------------------------------------------------------------------

/**
 * Force-release a claim regardless of ownership.
 * This is CLI/human authority only — not exposed through MCP write surfaces.
 *
 * @param {string} repoRoot
 * @returns {object} Result object
 */
function forceReleasePacket(repoRoot) {
  const runtime = scaffoldaiState.readActiveRuntime(repoRoot);
  const existingOwner = runtime ? runtime.claimed_by : null;

  scaffoldaiState.clearActiveRuntimeClaim(repoRoot);

  return {
    success: true,
    reason: "force_released",
    message: "Claim force-released.",
    previous_owner: existingOwner || null,
  };
}

// ---------------------------------------------------------------------------
// Status query
// ---------------------------------------------------------------------------

/**
 * Get the current claim status.
 *
 * @param {string} repoRoot
 * @returns {object} Claim status object
 */
function getClaimStatus(repoRoot) {
  const inFlightPacket = getInFlightPacket(repoRoot);
  const runtime = scaffoldaiState.readActiveRuntime(repoRoot);
  const hasClaim = Boolean(runtime && runtime.claimed_by);

  let nextSafeAction;
  if (hasClaim) {
    nextSafeAction = `Packet is claimed by "${runtime.claimed_by}". Observe and wait, or use force-release if authorized.`;
  } else if (inFlightPacket) {
    nextSafeAction = "Packet is active and unclaimed. You may claim it.";
  } else {
    nextSafeAction = "No active packet. Activate a packet before claiming.";
  }

  return {
    active_packet: inFlightPacket || null,
    has_claim: hasClaim,
    claimed_by: (runtime && runtime.claimed_by) || null,
    claim_status: (runtime && runtime.claim_status) || null,
    claimed_at: (runtime && runtime.claimed_at) || null,
    claim_message: (runtime && runtime.claim_message) || null,
    claim_expires_at: (runtime && runtime.claim_expires_at) || null,
    busy: hasClaim,
    next_safe_action: nextSafeAction,
  };
}

module.exports = {
  claimPacket,
  releasePacket,
  forceReleasePacket,
  getClaimStatus,
};
