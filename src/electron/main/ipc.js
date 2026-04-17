const {
  createDesktopPingResponse,
  getDesktopBackendSummary,
  getDesktopConsyncSummary,
  getDesktopShellInfo,
  revealDesktopPath,
  runDesktopMockSearch,
} = require("../../core/desktop-shell");
const {
  createBookmark,
  getSessionState,
} = require("../../core/session");
const { IPC_CHANNELS } = require("../shared/ipc-channels");

function registerDesktopIpcHandlers(ipcMainLike, options = {}) {
  const shellLike = options.shellLike || require("electron").shell;

  ipcMainLike.handle(IPC_CHANNELS.getBackendSummary, () => getDesktopBackendSummary());
  ipcMainLike.handle(IPC_CHANNELS.getConsyncSummary, () => getDesktopConsyncSummary());
  ipcMainLike.handle(IPC_CHANNELS.getShellInfo, () => getDesktopShellInfo());
  ipcMainLike.handle(IPC_CHANNELS.getSessionState, () => getSessionState());
  ipcMainLike.handle(IPC_CHANNELS.revealSearchResult, (_event, targetPath) => revealDesktopPath(targetPath, { shellLike }));
  ipcMainLike.handle(IPC_CHANNELS.runMockSearch, (_event, rootPath, query) => runDesktopMockSearch(rootPath, query));
  ipcMainLike.handle(IPC_CHANNELS.createBookmark, (_event, note) => createBookmark(note));
  ipcMainLike.handle(IPC_CHANNELS.ping, (_event, message) => createDesktopPingResponse(message));
}

module.exports = {
  IPC_CHANNELS,
  registerDesktopIpcHandlers,
};