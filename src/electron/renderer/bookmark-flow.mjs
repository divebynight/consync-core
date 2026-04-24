export async function createBookmarkAndReadSessionState(desktopBridge, bookmark) {
  await desktopBridge.createBookmark(bookmark);
  return desktopBridge.getSessionState();
}
