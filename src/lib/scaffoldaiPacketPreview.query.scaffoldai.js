"use strict";

const fs = require("fs");
const path = require("path");

const { validateStrictSdcPacket, reviewHash } = require("./scaffoldaiPacketIntake.auth.scaffoldai");
const { readTaskState } = require("./scaffoldaiTaskState.query.scaffoldai");

// Read-only packet preview (Proposal A). Shows the exact text a human is about
// to review, with hidden characters made visible, and the review hash that
// intake and activation require. It never writes.

const PACKETS_DIR_RELATIVE = path.join(".scaffoldai", "packets");
// C0 controls other than tab/LF/CR, DEL, zero-width and bidi formatting, BOM.
const HIDDEN_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩﻿]/g;

function escapeHiddenCharacters(content) {
  let count = 0;
  const escaped = content.replace(HIDDEN_CHARACTERS, (character) => {
    count += 1;
    return `\\u{${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}}`;
  });
  return { escaped, count };
}

function resolvePreviewPath(repoRoot, inputPath) {
  const raw = typeof inputPath === "string" ? inputPath.trim() : "";
  if (!raw) throw new Error("preview path is required");
  const absolute = path.isAbsolute(raw) ? raw : path.resolve(repoRoot, raw);
  if (!absolute.toLowerCase().endsWith(".md")) throw new Error("preview source must be a markdown file (.md)");
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) throw new Error(`preview source not found: ${absolute}`);
  return absolute;
}

function previewPacket(repoRoot, inputPath) {
  const sourcePath = resolvePreviewPath(repoRoot, inputPath);
  const content = fs.readFileSync(sourcePath, "utf8");
  const validation = validateStrictSdcPacket(content);
  const { escaped, count } = escapeHiddenCharacters(content);
  const task = readTaskState(repoRoot);

  const conflicts = [];
  if (validation.file_name) {
    const durable = path.join(repoRoot, PACKETS_DIR_RELATIVE, validation.file_name);
    if (fs.existsSync(durable) && path.resolve(durable) !== path.resolve(sourcePath)) {
      const same = reviewHash(fs.readFileSync(durable, "utf8")) === reviewHash(content);
      conflicts.push(same
        ? `durable packet ${validation.file_name} already exists with identical content (intake will reuse it)`
        : `durable packet ${validation.file_name} already exists with different content (intake will reject; use a new title)`);
    }
  }
  if (task.status === "open" && task.task_id && task.task_id !== validation.packet_id) {
    conflicts.push(`task ${task.task_id} is open; activation of another packet is blocked until it is cleared or closed`);
  }
  if (task.status === "closed" && task.task_id && task.task_id === validation.packet_id) {
    conflicts.push(`task ${task.task_id} is closed; a closed task cannot be re-accepted`);
  }

  return {
    action: "preview",
    source_path: sourcePath,
    review_sha256: reviewHash(content),
    valid: validation.valid,
    errors: validation.errors,
    packet_id: validation.packet_id,
    packet_title: validation.packet_title,
    mode: validation.mode,
    approval: validation.approval,
    task: { status: task.status, task_id: task.task_id || null },
    conflicts,
    hidden_character_count: count,
    escaped_content: escaped,
  };
}

module.exports = { previewPacket, escapeHiddenCharacters };
