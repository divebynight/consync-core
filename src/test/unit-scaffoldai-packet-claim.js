"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  claimPacket,
  releasePacket,
  forceReleasePacket,
  getClaimStatus,
} = require("../lib/packetClaim.auth.scaffoldai");
const scaffoldaiState = require("../lib/scaffoldaiState.state.scaffoldai");
const { getRepoRoot } = require("../lib/repoRoot.util.shared");

const TEST_NAME = "unit-scaffoldai-packet-claim";
const repoRoot = getRepoRoot(__dirname);
const tmpBase = path.join(repoRoot, ".scaffoldai", "tmp");

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeFixture(label, opts = {}) {
  const dir = path.join(tmpBase, `${TEST_NAME}-${label}`);
  fs.mkdirSync(path.join(dir, ".scaffoldai", "state"), { recursive: true });
  fs.mkdirSync(path.join(dir, ".scaffoldai", "contracts"), { recursive: true });

  const runtime = {
    in_flight_packet: opts.inFlightPacket !== undefined ? opts.inFlightPacket : null,
  };
  if (opts.claimedBy) {
    runtime.claimed_by = opts.claimedBy;
    runtime.claim_status = opts.claimStatus || "claimed";
    runtime.claimed_at = opts.claimedAt || "2026-05-15T00:00:00.000Z";
    if (opts.claimMessage) runtime.claim_message = opts.claimMessage;
  }
  fs.writeFileSync(
    path.join(dir, ".scaffoldai", "state", "active-runtime.json"),
    JSON.stringify(runtime, null, 2) + "\n",
    "utf8"
  );

  // Write a minimal next-action.md so getInFlightPacket works
  const pointer = opts.inFlightPacket
    ? `PACKET_ID: ${opts.inFlightPacket}`
    : `PACKET_ID: NONE`;
  fs.writeFileSync(
    path.join(dir, ".scaffoldai", "state", "next-action.md"),
    `TYPE: REFACTOR\n${pointer}\n`,
    "utf8"
  );

  // Write active-policy.json (required by writeActiveRuntime)
  fs.writeFileSync(
    path.join(dir, ".scaffoldai", "contracts", "active-policy.json"),
    JSON.stringify({
      mode: "CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN",
      allowed_packet_types: ["process"],
      blocked_packet_types: ["product"],
      require_clean_git: false,
      require_dry_run: false,
    }, null, 2) + "\n",
    "utf8"
  );

  return dir;
}

function cleanAll() {
  if (!fs.existsSync(tmpBase)) {
    return;
  }

  const patterns = fs
    .readdirSync(tmpBase)
    .filter((n) => n.startsWith(TEST_NAME));
  for (const name of patterns) {
    fs.rmSync(path.join(tmpBase, name), { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

function main() {
  console.log(`[${TEST_NAME}] Running`);

  cleanAll();

  // 1. Claim fails when no active packet
  {
    const dir = makeFixture("no-packet", { inFlightPacket: null });
    const result = claimPacket(dir, "copilot");
    assert.strictEqual(result.success, false, "claim should fail with no active packet");
    assert.strictEqual(result.reason, "no_active_packet");
    console.log("  PASS: claim fails when no active packet");
  }

  // 2. Claim succeeds when active packet exists and no prior claim
  {
    const dir = makeFixture("unclaimed", { inFlightPacket: "my-packet.sdc" });
    const result = claimPacket(dir, "copilot", { message: "starting work" });
    assert.strictEqual(result.success, true, "claim should succeed");
    assert.strictEqual(result.idempotent, false);
    assert.strictEqual(result.claimed_by, "copilot");
    assert.strictEqual(result.claim_status, "claimed");
    assert.ok(result.claimed_at, "claimed_at should be set");
    assert.strictEqual(result.claim_message, "starting work");
    assert.strictEqual(result.active_packet, "my-packet.sdc");

    // Verify it was written to runtime
    const runtime = scaffoldaiState.readActiveRuntime(dir);
    assert.strictEqual(runtime.claimed_by, "copilot");
    assert.strictEqual(runtime.claim_status, "claimed");
    assert.strictEqual(runtime.in_flight_packet, "my-packet.sdc");
    console.log("  PASS: claim succeeds with active packet and no prior claim");
  }

  // 3. Same client claim is idempotent
  {
    const dir = makeFixture("same-client", {
      inFlightPacket: "my-packet.sdc",
      claimedBy: "copilot",
      claimStatus: "claimed",
    });
    const result = claimPacket(dir, "copilot");
    assert.strictEqual(result.success, true, "idempotent claim should succeed");
    assert.strictEqual(result.idempotent, true);
    assert.strictEqual(result.reason, "already_owner");
    assert.strictEqual(result.claimed_by, "copilot");
    console.log("  PASS: same client claim is idempotent");
  }

  // 4. Different client claim is rejected with busy response
  {
    const dir = makeFixture("different-client", {
      inFlightPacket: "my-packet.sdc",
      claimedBy: "copilot",
      claimStatus: "in_progress",
      claimedAt: "2026-05-15T01:00:00.000Z",
    });
    const result = claimPacket(dir, "codex");
    assert.strictEqual(result.success, false, "different client should be rejected");
    assert.strictEqual(result.reason, "busy");
    assert.strictEqual(result.claimed_by, "copilot");
    assert.ok(result.message.includes("copilot"), "busy message should name the owner");
    console.log("  PASS: different client claim is rejected with busy response");
  }

  // 5. Release by non-owner fails
  {
    const dir = makeFixture("non-owner-release", {
      inFlightPacket: "my-packet.sdc",
      claimedBy: "copilot",
      claimStatus: "in_progress",
    });
    const result = releasePacket(dir, "codex");
    assert.strictEqual(result.success, false, "non-owner release should fail");
    assert.strictEqual(result.reason, "not_owner");
    assert.strictEqual(result.claimed_by, "copilot");
    console.log("  PASS: release by non-owner fails");
  }

  // 6. Release by owner succeeds
  {
    const dir = makeFixture("owner-release", {
      inFlightPacket: "my-packet.sdc",
      claimedBy: "copilot",
      claimStatus: "claimed",
    });
    const result = releasePacket(dir, "copilot");
    assert.strictEqual(result.success, true, "owner release should succeed");
    assert.strictEqual(result.reason, "released");
    assert.strictEqual(result.previous_owner, "copilot");

    // Verify claim cleared in runtime
    const runtime = scaffoldaiState.readActiveRuntime(dir);
    assert.strictEqual(runtime.claimed_by, null, "claimed_by should be null after release");
    assert.strictEqual(runtime.claim_status, null, "claim_status should be null after release");
    console.log("  PASS: release by owner succeeds and clears claim");
  }

  // 7. Force-release works via CLI authority
  {
    const dir = makeFixture("force-release", {
      inFlightPacket: "my-packet.sdc",
      claimedBy: "some-other-tool",
      claimStatus: "in_progress",
    });
    const result = forceReleasePacket(dir);
    assert.strictEqual(result.success, true, "force-release should always succeed");
    assert.strictEqual(result.reason, "force_released");
    assert.strictEqual(result.previous_owner, "some-other-tool");

    const runtime = scaffoldaiState.readActiveRuntime(dir);
    assert.strictEqual(runtime.claimed_by, null, "claimed_by should be null after force-release");
    console.log("  PASS: force-release works regardless of owner");
  }

  // 8. Force-release with no existing claim succeeds cleanly
  {
    const dir = makeFixture("force-release-empty", { inFlightPacket: "my-packet.sdc" });
    const result = forceReleasePacket(dir);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.previous_owner, null);
    console.log("  PASS: force-release with no claim succeeds cleanly");
  }

  // 9. getClaimStatus reflects busy state
  {
    const dir = makeFixture("status-busy", {
      inFlightPacket: "my-packet.sdc",
      claimedBy: "copilot",
      claimStatus: "in_progress",
      claimedAt: "2026-05-15T01:00:00.000Z",
    });
    const status = getClaimStatus(dir);
    assert.strictEqual(status.has_claim, true);
    assert.strictEqual(status.busy, true);
    assert.strictEqual(status.claimed_by, "copilot");
    assert.strictEqual(status.claim_status, "in_progress");
    assert.strictEqual(status.claimed_at, "2026-05-15T01:00:00.000Z");
    assert.ok(status.next_safe_action.includes("copilot"), "next_safe_action should mention owner");
    console.log("  PASS: getClaimStatus reflects busy state");
  }

  // 10. getClaimStatus reflects idle state (active packet, no claim)
  {
    const dir = makeFixture("status-idle", { inFlightPacket: "my-packet.sdc" });
    const status = getClaimStatus(dir);
    assert.strictEqual(status.has_claim, false);
    assert.strictEqual(status.busy, false);
    assert.strictEqual(status.claimed_by, null);
    assert.ok(status.next_safe_action.includes("unclaimed"), "next_safe_action should say unclaimed");
    console.log("  PASS: getClaimStatus reflects idle state with active packet");
  }

  // 11. Invalid client_id is rejected
  {
    const dir = makeFixture("invalid-client", { inFlightPacket: "my-packet.sdc" });
    const result = claimPacket(dir, "");
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, "invalid_client_id");
    console.log("  PASS: invalid client_id is rejected");
  }

  // 12. Packet activation clears claim (writeActiveRuntime strips claim fields)
  {
    const dir = makeFixture("activation-clears-claim", {
      inFlightPacket: "my-packet.sdc",
      claimedBy: "copilot",
      claimStatus: "in_progress",
    });
    // Simulate what packet activation does: write new in_flight_packet via writeActiveRuntime
    scaffoldaiState.writeActiveRuntime(dir, { in_flight_packet: null });
    const runtime = scaffoldaiState.readActiveRuntime(dir);
    assert.strictEqual(runtime.claimed_by, null, "writeActiveRuntime should strip claim fields");
    console.log("  PASS: writeActiveRuntime (packet activation) clears claim fields");
  }

  // 13. Release with no claim returns success (nothing to release)
  {
    const dir = makeFixture("release-no-claim", { inFlightPacket: "my-packet.sdc" });
    const result = releasePacket(dir, "copilot");
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.reason, "no_claim");
    console.log("  PASS: release with no existing claim returns success");
  }

  cleanAll();
  console.log(`[${TEST_NAME}] PASS`);
}

main();
