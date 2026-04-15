const fs = require("node:fs");
const path = require("node:path");

function getLatestSessionFileName() {
  const sessionDir = path.join(process.cwd(), "sandbox", "current");

  if (!fs.existsSync(sessionDir)) {
    return "no-session-artifacts";
  }

  const sessionFiles = fs.readdirSync(sessionDir)
    .filter(entry => entry.endsWith(".json"))
    .sort();

  if (sessionFiles.length === 0) {
    return "no-session-artifacts";
  }

  return sessionFiles[sessionFiles.length - 1];
}

function syncSessionState() {
  sessionState = {
    ...sessionState,
    currentFile: getLatestSessionFileName(),
  };
}

function createInitialSessionState() {
  return {
    currentFile: getLatestSessionFileName(),
    currentPositionSeconds: 84,
    bookmarks: [],
  };
}

let sessionState = createInitialSessionState();

function cloneSessionState() {
  return {
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
  syncSessionState();

  const bookmark = {
    id: `bookmark-${sessionState.bookmarks.length + 1}`,
    timeSeconds: sessionState.currentPositionSeconds,
    note,
  };

  sessionState = {
    ...sessionState,
    bookmarks: [...sessionState.bookmarks, bookmark],
  };

  return cloneSessionState();
}

function resetSessionState() {
  sessionState = createInitialSessionState();
}

module.exports = {
  createBookmark,
  createInitialSessionState,
  getLatestSessionFileName,
  getSessionState,
  resetSessionState,
};