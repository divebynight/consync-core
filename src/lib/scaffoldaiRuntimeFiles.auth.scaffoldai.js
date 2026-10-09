"use strict";

const fs = require("fs");
const path = require("path");

// Bounded deletion of ScaffoldAI runtime and inbox files (MAR-6).
//
// Only regular files strictly inside .scaffoldai/runtime/ or .scaffoldai/inbox/
// may be deleted. Containment is checked both lexically and on real paths, so
// traversal and symlinked directories cannot escape the boundary. The runtime
// and inbox roots must resolve exactly to those directories under the real
// .scaffoldai, so a symlinked root cannot redirect into state/ or packets/. A final-file
// symlink is never followed or deleted (refused_symlink), whether it points
// inside or outside, so an outside target can never be removed through it.
// State files are out of scope; use scaffoldaiState for those.
//
// Returns "removed" | "missing" | "refused_symlink" | "refused_not_file".
// Throws when the path is outside the boundary.

const SCAFFOLDAI_DIR = ".scaffoldai";
const ALLOWED_DIRS = ["runtime", "inbox"];

function isStrictlyWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function boundaryError(relativePath) {
  return new Error(`path is outside the runtime/inbox boundary: ${relativePath}`);
}

function realpathOrNull(target) {
  try {
    return fs.realpathSync(target);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
    throw error;
  }
}

function removeRuntimeFile(repoRoot, relativePath) {
  if (typeof relativePath !== "string" || !relativePath.trim()) {
    throw new Error("runtime file path is required");
  }

  const scaffoldaiRoot = path.resolve(repoRoot, SCAFFOLDAI_DIR);
  const absolute = path.resolve(repoRoot, relativePath);
  const allowedRoot = ALLOWED_DIRS
    .map((dir) => path.join(scaffoldaiRoot, dir))
    .find((root) => isStrictlyWithin(root, absolute));
  if (!allowedRoot) throw boundaryError(relativePath);

  // The runtime/inbox root must be the real directory of that name under the
  // real .scaffoldai; a symlinked root is refused even if it points inside
  // .scaffoldai (for example runtime -> state or inbox -> packets).
  const realScaffoldai = realpathOrNull(scaffoldaiRoot);
  const realAllowed = realpathOrNull(allowedRoot);
  if (!realScaffoldai || !realAllowed) return "missing";
  if (realAllowed !== path.join(realScaffoldai, path.basename(allowedRoot))) throw boundaryError(relativePath);

  const realParent = realpathOrNull(path.dirname(absolute));
  if (!realParent) return "missing";
  if (realParent !== realAllowed && !isStrictlyWithin(realAllowed, realParent)) {
    throw boundaryError(relativePath);
  }

  const finalPath = path.join(realParent, path.basename(absolute));
  let stat;
  try {
    stat = fs.lstatSync(finalPath);
  } catch (error) {
    if (error.code === "ENOENT") return "missing";
    throw error;
  }
  if (stat.isSymbolicLink()) return "refused_symlink";
  if (!stat.isFile()) return "refused_not_file";

  fs.unlinkSync(finalPath);
  return "removed";
}

module.exports = { removeRuntimeFile };
