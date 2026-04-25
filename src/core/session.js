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

function normalizeBookmarkPayload(input, sessionStateSnapshot) {
  if (typeof input === "string") {
    return {
      note: input,
      timeSeconds: sessionStateSnapshot.currentPositionSeconds,
    };
  }

  if (!input || typeof input !== "object") {
    throw new Error("Bookmark input must be a note string or structured bookmark payload.");
  }

  if (typeof input.filePath !== "string" || !input.filePath.trim()) {
    throw new Error("Bookmark filePath is required.");
  }

  if (typeof input.createdAt !== "string" || !input.createdAt.trim()) {
    throw new Error("Bookmark createdAt is required.");
  }

  const hasNullTime = input.timeSeconds === null || input.timeSeconds === undefined;

  if (!hasNullTime && (typeof input.timeSeconds !== "number" || Number.isNaN(input.timeSeconds) || input.timeSeconds < 0)) {
    throw new Error("Bookmark timeSeconds must be null or a non-negative number.");
  }

  if (hasNullTime) {
    if (typeof input.note !== "string" || !input.note.trim()) {
      throw new Error("Bookmark note text is required when timeSeconds is null.");
    }

    if (input.timeLabel !== null && input.timeLabel !== undefined) {
      throw new Error("Bookmark timeLabel must be null when timeSeconds is null.");
    }
  } else {
    if (typeof input.note !== "string") {
      throw new Error("Bookmark note text must be a string.");
    }

    if (typeof input.timeLabel !== "string" || !input.timeLabel.trim()) {
      throw new Error("Bookmark timeLabel is required when timeSeconds is present.");
    }
  }

  return {
    createdAt: input.createdAt.trim(),
    filePath: input.filePath.trim(),
    note: input.note.trim(),
    timeLabel: hasNullTime ? null : input.timeLabel.trim(),
    timeSeconds: hasNullTime ? null : input.timeSeconds,
  };
}

function normalizeBookmarkUpdatePayload(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Bookmark update input must be a structured bookmark update payload.");
  }

  if (typeof input.id !== "string" || !input.id.trim()) {
    throw new Error("Bookmark update id is required.");
  }

  if (typeof input.note !== "string") {
    throw new Error("Bookmark update note must be a string.");
  }

  return {
    id: input.id.trim(),
    note: input.note.trim(),
  };
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

function createBookmark(input) {
  const latestSessionArtifactPath = getLatestSessionArtifactPath();

  if (!latestSessionArtifactPath) {
    throw new Error("No current session artifact is available for bookmark writes.");
  }

  const latestSessionArtifact = readLatestSessionArtifact();
  const existingBookmarks = getArtifactBookmarks(latestSessionArtifact);

  const bookmarkPayload = normalizeBookmarkPayload(input, sessionState);
  const bookmark = {
    id: `bookmark-${existingBookmarks.length + 1}`,
    ...bookmarkPayload,
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

function updateBookmark(input) {
  const latestSessionArtifactPath = getLatestSessionArtifactPath();

  if (!latestSessionArtifactPath) {
    throw new Error("No current session artifact is available for bookmark writes.");
  }

  const latestSessionArtifact = readLatestSessionArtifact();
  const existingBookmarks = getArtifactBookmarks(latestSessionArtifact);
  const bookmarkUpdate = normalizeBookmarkUpdatePayload(input);
  const bookmarkIndex = existingBookmarks.findIndex(bookmark => bookmark.id === bookmarkUpdate.id);

  if (bookmarkIndex === -1) {
    throw new Error(`Bookmark ${bookmarkUpdate.id} was not found.`);
  }

  const updatedBookmarks = existingBookmarks.map((bookmark, index) => (
    index === bookmarkIndex
      ? {
        ...bookmark,
        note: bookmarkUpdate.note,
      }
      : bookmark
  ));

  fs.writeFileSync(
    latestSessionArtifactPath,
    JSON.stringify({
      ...latestSessionArtifact,
      bookmarks: updatedBookmarks,
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
  updateBookmark,
};
