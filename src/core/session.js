const fs = require("node:fs");
const path = require("node:path");

function getSessionDirectory() {
  return process.env.CONSYNC_SESSION_DIR || path.join(process.cwd(), "sandbox", "current");
}

function getSessionArtifactFiles() {
  const sessionDir = getSessionDirectory();

  if (!fs.existsSync(sessionDir)) {
    return [];
  }

  return fs.readdirSync(sessionDir)
    .filter(entry => entry.endsWith(".json"))
    .sort();
}

function getLatestSessionFileName() {
  const sessionFiles = getSessionArtifactFiles();

  if (sessionFiles.length === 0) {
    return "no-session-artifacts";
  }

  return sessionFiles[sessionFiles.length - 1];
}

function getSessionArtifactCount() {
  return getSessionArtifactFiles().length;
}

function getLatestSessionArtifactPath() {
  const latestSessionFileName = getLatestSessionFileName();

  if (latestSessionFileName === "no-session-artifacts") {
    return null;
  }

  return path.join(getSessionDirectory(), latestSessionFileName);
}

function readLatestSessionArtifact() {
  const latestSessionArtifactPath = getLatestSessionArtifactPath();

  if (!latestSessionArtifactPath) {
    return null;
  }

  return JSON.parse(fs.readFileSync(latestSessionArtifactPath, "utf8"));
}

function getArtifactBookmarks(artifact) {
  if (!artifact || !Array.isArray(artifact.bookmarks)) {
    return [];
  }

  return artifact.bookmarks.map(bookmark => ({ ...bookmark }));
}

function syncSessionState() {
  const latestSessionArtifact = readLatestSessionArtifact();

  sessionState = {
    ...sessionState,
    artifactCount: getSessionArtifactCount(),
    bookmarks: getArtifactBookmarks(latestSessionArtifact),
    currentFile: getLatestSessionFileName(),
  };
}

function createInitialSessionState() {
  const latestSessionArtifact = readLatestSessionArtifact();

  return {
    artifactCount: getSessionArtifactCount(),
    bookmarks: getArtifactBookmarks(latestSessionArtifact),
    currentFile: getLatestSessionFileName(),
    currentPositionSeconds: 84,
  };
}

let sessionState = createInitialSessionState();

function cloneSessionState() {
  return {
    artifactCount: sessionState.artifactCount,
    currentFile: sessionState.currentFile,
    currentPositionSeconds: sessionState.currentPositionSeconds,
    bookmarks: sessionState.bookmarks.map(bookmark => ({ ...bookmark })),
  };
}

function getSessionState() {
  syncSessionState();
  return cloneSessionState();
}

function createBookmark(note) {
  const latestSessionArtifactPath = getLatestSessionArtifactPath();

  if (!latestSessionArtifactPath) {
    throw new Error("No current session artifact is available for bookmark writes.");
  }

  const latestSessionArtifact = readLatestSessionArtifact();
  const existingBookmarks = getArtifactBookmarks(latestSessionArtifact);

  const bookmark = {
    id: `bookmark-${existingBookmarks.length + 1}`,
    timeSeconds: sessionState.currentPositionSeconds,
    note,
  };

  fs.writeFileSync(
    latestSessionArtifactPath,
    JSON.stringify({
      ...latestSessionArtifact,
      bookmarks: [...existingBookmarks, bookmark],
    }, null, 2) + "\n"
  );

  syncSessionState();
  return cloneSessionState();
}

function resetSessionState() {
  sessionState = createInitialSessionState();
}

module.exports = {
  createBookmark,
  createInitialSessionState,
  getSessionArtifactCount,
  getLatestSessionArtifactPath,
  getLatestSessionFileName,
  getSessionState,
  resetSessionState,
};