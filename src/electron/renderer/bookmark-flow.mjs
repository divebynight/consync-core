export async function createBookmarkAndReadSessionState(desktopBridge, bookmark) {
  await desktopBridge.createBookmark(bookmark);
  return desktopBridge.getSessionState();
}

export async function deleteBookmarkAndReadSessionState(desktopBridge, bookmarkDelete) {
  await desktopBridge.deleteBookmark(bookmarkDelete);
  return desktopBridge.getSessionState();
}

export async function updateBookmarkAndReadSessionState(desktopBridge, bookmarkUpdate) {
  await desktopBridge.updateBookmark(bookmarkUpdate);
  return desktopBridge.getSessionState();
}
