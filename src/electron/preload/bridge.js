const { IPC_CHANNELS } = require("../shared/ipc-channels");

function createDesktopBridge(invoke) {
  return {
    createBookmark(bookmark) {
      return invoke(IPC_CHANNELS.createBookmark, bookmark);
    },
    deleteBookmark(bookmarkDelete) {
      return invoke(IPC_CHANNELS.deleteBookmark, bookmarkDelete);
    },
    updateBookmark(bookmarkUpdate) {
      return invoke(IPC_CHANNELS.updateBookmark, bookmarkUpdate);
    },
    getConsyncSummary() {
      return invoke(IPC_CHANNELS.getConsyncSummary);
    },
    getBackendSummary() {
      return invoke(IPC_CHANNELS.getBackendSummary);
    },
    getShellInfo() {
      return invoke(IPC_CHANNELS.getShellInfo);
    },
    getSessionState() {
      return invoke(IPC_CHANNELS.getSessionState);
    },
    selectAudioFile() {
      return invoke(IPC_CHANNELS.selectAudioFile);
    },
    revealSearchResult(targetPath) {
      return invoke(IPC_CHANNELS.revealSearchResult, targetPath);
    },
    runMockSearch(rootPath, query) {
      return invoke(IPC_CHANNELS.runMockSearch, rootPath, query);
    },
    ping(message) {
      return invoke(IPC_CHANNELS.ping, message);
    },
    getBridgeStatus() {
      return Promise.resolve({
        status: "ready",
        surface: "preload",
        version: "bridge-v1",
      });
    },
  };
}

module.exports = {
  createDesktopBridge,
};
