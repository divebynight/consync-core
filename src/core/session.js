function createInitialSessionState() {
  return {
    currentFile: "placeholder-audio-file.mp3",
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
  return cloneSessionState();
}

function createBookmark(note) {
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
  getSessionState,
  resetSessionState,
};