export async function createBookmarkAndReadSessionState(desktopBridge, note) {
  await desktopBridge.createBookmark(note);
  return desktopBridge.getSessionState();
}