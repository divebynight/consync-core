function getLatestBookmark(bookmarks) {
  if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
    return null;
  }

  return bookmarks[bookmarks.length - 1];
}

function getBookmarkTimeValue(bookmark) {
  if (!bookmark) {
    return "none";
  }

  if (typeof bookmark.timeLabel === "string" && bookmark.timeLabel.trim()) {
    return bookmark.timeLabel.trim();
  }

  if (bookmark.timeSeconds === null || bookmark.timeSeconds === undefined) {
    return "file note";
  }

  return `${bookmark.timeSeconds}s`;
}

export function getSessionPanelRows(sessionState) {
  if (!sessionState) {
    return [
      { label: "Artifacts", value: "loading" },
      { label: "Current file", value: "loading" },
      { label: "Position", value: "loading" },
      { label: "Bookmarks", value: "loading" },
      { label: "Latest note", value: "loading" },
      { label: "Latest time", value: "loading" },
    ];
  }

  const latestBookmark = getLatestBookmark(sessionState.bookmarks);

  return [
    { label: "Artifacts", value: sessionState.artifactCount },
    { label: "Current file", value: sessionState.currentFile },
    { label: "Position", value: `${sessionState.currentPositionSeconds}s` },
    { label: "Bookmarks", value: sessionState.bookmarks.length },
    { label: "Latest note", value: latestBookmark ? latestBookmark.note : "none" },
    { label: "Latest time", value: getBookmarkTimeValue(latestBookmark) },
  ];
}
