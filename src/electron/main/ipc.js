const {
  createDesktopPingResponse,
  getDesktopShellInfo,
} = require("../../core/desktop-shell");

const IPC_CHANNELS = {
  getShellInfo: "desktop:get-shell-info",
  ping: "desktop:ping",
};

function registerDesktopIpcHandlers(ipcMainLike) {
  ipcMainLike.handle(IPC_CHANNELS.getShellInfo, () => getDesktopShellInfo());
  ipcMainLike.handle(IPC_CHANNELS.ping, (_event, message) => createDesktopPingResponse(message));
}

module.exports = {
  IPC_CHANNELS,
  registerDesktopIpcHandlers,
};