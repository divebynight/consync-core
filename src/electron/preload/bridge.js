const { IPC_CHANNELS } = require("../shared/ipc-channels");

function createDesktopBridge(invoke) {
  return {
    createBookmark(note) {
      return invoke(IPC_CHANNELS.createBookmark, note);
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