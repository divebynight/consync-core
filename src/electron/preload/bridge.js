const { IPC_CHANNELS } = require("../main/ipc");

function createDesktopBridge(invoke) {
  return {
    getShellInfo() {
      return invoke(IPC_CHANNELS.getShellInfo);
    },
    ping(message) {
      return invoke(IPC_CHANNELS.ping, message);
    },
  };
}

module.exports = {
  createDesktopBridge,
};