"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { intakePacket, reviewHash } = require("../../lib/scaffoldaiPacketIntake.auth.scaffoldai");
const { activatePacket, resolvePacketPath } = require("../../lib/scaffoldaiPacketActivation.auth.scaffoldai");
const { resolveLatestIntakeCompatibleCandidate } = require("../../lib/scaffoldaiLifecycleResolution.query.scaffoldai");
const { authorizeWork } = require("../../lib/scaffoldaiWorkAuthorization.auth.scaffoldai");

// Lifecycle tests that are not about review binding act as a reviewer who
// previewed the exact file: these helpers pass the file's own review hash.
// Review-hash enforcement itself is tested in unit-scaffoldai-review-binding.js.

function fileReviewHash(filePath) {
  try {
    return reviewHash(fs.readFileSync(filePath, "utf8"));
  } catch {
    return undefined;
  }
}

function reviewedIntake(root, inputPath, options = {}) {
  const absolute = path.isAbsolute(String(inputPath)) ? inputPath : path.resolve(root, String(inputPath));
  return intakePacket(root, inputPath, { expectedSha256: fileReviewHash(absolute), ...options });
}

function reviewedActivate(root, packetInput, options = {}) {
  let expectedPacketSha256;
  try {
    expectedPacketSha256 = fileReviewHash(resolvePacketPath(root, packetInput).absolutePath);
  } catch {
    expectedPacketSha256 = undefined; // activatePacket reports the path error itself
  }
  return activatePacket(root, packetInput, { expectedPacketSha256, ...options });
}

// Authorizes work for an accepted packet with that packet file's review hash.
function reviewedAuthorizeWork(root, packetInput, options = {}) {
  let expectedPacketSha256;
  try {
    expectedPacketSha256 = fileReviewHash(resolvePacketPath(root, packetInput).absolutePath);
  } catch {
    expectedPacketSha256 = undefined;
  }
  return authorizeWork(root, packetInput, { expectedPacketSha256, ...options });
}

// Review hash of the candidate the -latest lifecycle wrappers would pick, or a
// placeholder when none resolves (those calls refuse before hashing).
function latestCandidateReviewHash(root) {
  const resolution = resolveLatestIntakeCompatibleCandidate(root);
  return (resolution.ok && fileReviewHash(resolution.value.source_path)) || "0".repeat(64);
}

module.exports = { fileReviewHash, reviewedIntake, reviewedActivate, reviewedAuthorizeWork, latestCandidateReviewHash };
