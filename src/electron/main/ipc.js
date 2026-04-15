const {
  createDesktopPingResponse,
  getDesktopBackendSummary,
  getDesktopConsyncSummary,
  getDesktopShellInfo,
} = require("../../core/desktop-shell");
const {
  createBookmark,
  getSessionState,
} = require("../../core/session");
const { IPC_CHANNELS } = require("../shared/ipc-channels");

function registerDesktopIpcHandlers(ipcMainLike) {
  ipcMainLike.handle(IPC_CHANNELS.getBackendSummary, () => getDesktopBackendSummary());
  ipcMainLike.handle(IPC_CHANNELS.getConsyncSummary, () => getDesktopConsyncSummary());
  ipcMainLike.handle(IPC_CHANNELS.getShellInfo, () => getDesktopShellInfo());
  ipcMainLike.handle(IPC_CHANNELS.getSessionState, () => getSessionState());
  ipcMainLike.handle(IPC_CHANNELS.createBookmark, (_event, note) => createBookmark(note));
  ipcMainLike.handle(IPC_CHANNELS.ping, (_event, message) => createDesktopPingResponse(message));
}

module.exports = {
  IPC_CHANNELS,
  registerDesktopIpcHandlers,
};