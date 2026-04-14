const {
  createDesktopPingResponse,
  getDesktopShellInfo,
} = require("../../core/desktop-shell");
const {
  createBookmark,
  getSessionState,
} = require("../../core/session");

const IPC_CHANNELS = {
  createBookmark: "desktop:create-bookmark",
  getShellInfo: "desktop:get-shell-info",
  getSessionState: "desktop:get-session-state",
  ping: "desktop:ping",
};

function registerDesktopIpcHandlers(ipcMainLike) {
  ipcMainLike.handle(IPC_CHANNELS.getShellInfo, () => getDesktopShellInfo());
  ipcMainLike.handle(IPC_CHANNELS.getSessionState, () => getSessionState());
  ipcMainLike.handle(IPC_CHANNELS.createBookmark, (_event, note) => createBookmark(note));
  ipcMainLike.handle(IPC_CHANNELS.ping, (_event, message) => createDesktopPingResponse(message));
}

module.exports = {
  IPC_CHANNELS,
  registerDesktopIpcHandlers,
};