const { IPC_CHANNELS } = require("../main/ipc");

function createDesktopBridge(invoke) {
  return {
    createBookmark(note) {
      return invoke(IPC_CHANNELS.createBookmark, note);
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
  };
}

module.exports = {
  createDesktopBridge,
};