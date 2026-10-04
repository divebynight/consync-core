"use strict";

const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const PLANS_SUBPATH = path.join(".scaffoldai", "runtime", "executor-plans");
const JOB_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const MAX_RETAINED_JOBS = 100;
const MAX_ARTIFACT_BYTES = 128 * 1024;
const LOCK_NAME = ".executor.lock";
const ARTIFACT_NAMES = new Set([
  "request.json", "status.json", "result.json", "stdout.md", "stderr.log",
  "stdout.partial.log", "stderr.partial.log",
]);

function boundaryError(code, message) {
  return Object.assign(new Error(message), { code });
}

function validJobId(id) {
  return typeof id === "string" && JOB_ID_PATTERN.test(id);
}

function statIfPresent(target) {
  try {
    return fs.lstatSync(target);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function artifactRoot(repoRoot, create = false) {
  const base = fs.realpathSync(repoRoot);
  let current = base;
  for (const part of PLANS_SUBPATH.split(path.sep)) {
    current = path.join(current, part);
    let stat = statIfPresent(current);
    if (!stat && create) {
      try { fs.mkdirSync(current, { mode: 0o700 }); } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
      stat = fs.lstatSync(current);
    }
    if (stat && (!stat.isDirectory() || stat.isSymbolicLink())) {
      throw boundaryError("UNSAFE_ARTIFACT_PATH", "Artifact directories must not be symlinks.");
    }
    if (stat && !fs.realpathSync(current).startsWith(base + path.sep)) {
      throw boundaryError("UNSAFE_ARTIFACT_PATH", "Artifact path escapes the repository.");
    }
  }
  return current;
}

function jobPath(repoRoot, id, name) {
  if (!validJobId(id)) throw boundaryError("INVALID_JOB_ID", "A canonical UUIDv4 job_id is required.");
  const root = artifactRoot(repoRoot);
  const dir = path.resolve(root, id);
  if (path.dirname(dir) !== root) throw boundaryError("UNSAFE_ARTIFACT_PATH", "Invalid artifact path.");
  const stat = statIfPresent(dir);
  if (stat && (!stat.isDirectory() || stat.isSymbolicLink() || fs.realpathSync(dir) !== dir)) {
    throw boundaryError("UNSAFE_ARTIFACT_PATH", "Job directories must not be symlinks.");
  }
  if (name === undefined) return dir;
  if (!ARTIFACT_NAMES.has(name)) throw boundaryError("UNSAFE_ARTIFACT_PATH", "Unknown artifact name.");
  const target = path.join(dir, name);
  const file = statIfPresent(target);
  if (file && (!file.isFile() || file.isSymbolicLink() || file.nlink !== 1)) {
    throw boundaryError("UNSAFE_ARTIFACT_PATH", "Artifacts must be ordinary, unlinked files.");
  }
  return target;
}

function readArtifact(repoRoot, id, name) {
  const target = jobPath(repoRoot, id, name);
  let fd;
  try {
    fd = fs.openSync(target, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1 || stat.size > MAX_ARTIFACT_BYTES) {
      throw boundaryError("UNSAFE_ARTIFACT_PATH", "Artifact is not a bounded ordinary file.");
    }
    return JSON.parse(fs.readFileSync(fd, "utf8"));
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

function writeArtifact(repoRoot, id, name, content) {
  const target = jobPath(repoRoot, id, name);
  if (Buffer.byteLength(content) > MAX_ARTIFACT_BYTES) {
    throw boundaryError("ARTIFACT_LIMIT", "Artifact exceeds the size limit.");
  }
  const tmp = path.join(path.dirname(target), `.${name}.${randomUUID()}.tmp`);
  const fd = fs.openSync(tmp, "wx", 0o600);
  try {
    fs.writeFileSync(fd, content, "utf8");
    jobPath(repoRoot, id, name);
    fs.renameSync(tmp, target);
  } finally {
    fs.closeSync(fd);
    if (statIfPresent(tmp)) fs.unlinkSync(tmp);
  }
}

function acquireArtifactLock(repoRoot) {
  const root = artifactRoot(repoRoot, true);
  const target = path.join(root, LOCK_NAME);
  let fd;
  try {
    fd = fs.openSync(target, "wx", 0o600);
  } catch (error) {
    if (error.code === "EEXIST") {
      throw boundaryError("EXECUTOR_BUSY", "Executor admission is locked; inspect local executor state.");
    }
    throw error;
  }
  const owned = fs.fstatSync(fd);
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    fs.closeSync(fd);
    artifactRoot(repoRoot);
    const current = statIfPresent(target);
    if (!current || current.dev !== owned.dev || current.ino !== owned.ino) {
      throw boundaryError("EXECUTOR_LOCK_CHANGED", "Executor admission lock changed unexpectedly.");
    }
    fs.unlinkSync(target);
  };
  try {
    fs.writeFileSync(fd, JSON.stringify({ owner_pid: process.pid, started_at: new Date().toISOString() }) + "\n");
  } catch (error) {
    release();
    throw error;
  }
  return { root, release };
}

function acquirePlanSlot(repoRoot) {
  const lock = acquireArtifactLock(repoRoot);
  try {
    const entries = fs.readdirSync(lock.root).filter((entry) => entry !== LOCK_NAME);
    if (entries.length >= MAX_RETAINED_JOBS) {
      throw boundaryError("ARTIFACT_CAPACITY", "Executor artifact capacity reached; review evidence locally.");
    }
    for (const id of entries.filter(validJobId)) {
      let status;
      try { status = readArtifact(repoRoot, id, "status.json"); } catch (error) {
        throw boundaryError("EXECUTOR_STATE_UNCERTAIN", "Existing executor evidence needs local inspection.");
      }
      if (!status || status.job_id !== id ||
          !["completed", "failed", "timed_out"].includes(status.status)) {
        throw boundaryError("EXECUTOR_STATE_UNCERTAIN", "An existing executor may still be running.");
      }
    }
    return lock;
  } catch (error) {
    lock.release();
    throw error;
  }
}

module.exports = {
  PLANS_SUBPATH, JOB_ID_PATTERN, MAX_RETAINED_JOBS, ARTIFACT_NAMES,
  validJobId, artifactRoot, jobPath, readArtifact, writeArtifact,
  acquireArtifactLock, acquirePlanSlot,
};
