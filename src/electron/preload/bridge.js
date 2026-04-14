const { IPC_CHANNELS } = require("../main/ipc");

function createDesktopBridge(invoke) {
  return {
    createBookmark(note) {
      return invoke(IPC_CHANNELS.createBookmark, note);
    },
    getBackendSummary() {
      return Promise.resolve({
        cwd: process.cwd(),
        platform: process.platform,
      });
    },
    getShellInfo() {
      return invoke(IPC_CHANNELS.getShellInfo);
    },
    getSessionState() {
      return invoke(IPC_CHANNELS.getSessionState);
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