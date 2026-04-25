const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
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
  deleteBookmark,
  getSessionState,
  updateBookmark,
} = require("../../core/session");
const { IPC_CHANNELS } = require("../shared/ipc-channels");

function resolveSelectedAudioFile(selection, options = {}) {
  const fsModule = options.fsModule || fs;
  const pathModule = options.pathModule || path;

  if (!selection || selection.canceled) {
    return {
      canceled: true,
      ok: false,
    };
  }

  const selectedPath = Array.isArray(selection.filePaths) ? selection.filePaths[0] : null;

  if (!selectedPath) {
    return {
      canceled: true,
      ok: false,
    };
  }

  const resolvedPath = pathModule.resolve(selectedPath);
  const stats = fsModule.existsSync(resolvedPath) ? fsModule.statSync(resolvedPath) : null;

  if (!stats || !stats.isFile()) {
    return {
      ok: false,
      output: "Selected audio file is unavailable.",
    };
  }

  if (pathModule.extname(resolvedPath).toLowerCase() !== ".mp3") {
    return {
      ok: false,
      output: "Selected file must be an .mp3.",
    };
  }

  const audioBuffer = fsModule.readFileSync(resolvedPath);

  return {
    audioSrc: `data:audio/mpeg;base64,${audioBuffer.toString("base64")}`,
    canceled: false,
    fileName: pathModule.basename(resolvedPath),
    filePath: resolvedPath,
    fileUrl: pathToFileURL(resolvedPath).href,
    ok: true,
  };
}

function registerDesktopIpcHandlers(ipcMainLike, options = {}) {
  const shellLike = options.shellLike || require("electron").shell;
  const dialogLike = options.dialogLike || require("electron").dialog;

  ipcMainLike.handle(IPC_CHANNELS.getBackendSummary, () => getDesktopBackendSummary());
  ipcMainLike.handle(IPC_CHANNELS.getConsyncSummary, () => getDesktopConsyncSummary());
  ipcMainLike.handle(IPC_CHANNELS.getShellInfo, () => getDesktopShellInfo());
  ipcMainLike.handle(IPC_CHANNELS.getSessionState, () => getSessionState());
  ipcMainLike.handle(IPC_CHANNELS.selectAudioFile, async () => {
    const selection = await dialogLike.showOpenDialog({
      filters: [
        { name: "MP3 Audio", extensions: ["mp3"] },
      ],
      properties: ["openFile"],
      title: "Select Audio Note Source",
    });

    return resolveSelectedAudioFile(selection, options);
  });
  ipcMainLike.handle(IPC_CHANNELS.revealSearchResult, (_event, targetPath) => revealDesktopPath(targetPath, { shellLike }));
  ipcMainLike.handle(IPC_CHANNELS.runMockSearch, (_event, rootPath, query) => runDesktopMockSearch(rootPath, query));
  ipcMainLike.handle(IPC_CHANNELS.createBookmark, (_event, bookmark) => createBookmark(bookmark));
  ipcMainLike.handle(IPC_CHANNELS.deleteBookmark, (_event, bookmarkDelete) => deleteBookmark(bookmarkDelete));
  ipcMainLike.handle(IPC_CHANNELS.updateBookmark, (_event, bookmarkUpdate) => updateBookmark(bookmarkUpdate));
  ipcMainLike.handle(IPC_CHANNELS.ping, (_event, message) => createDesktopPingResponse(message));
}

module.exports = {
  IPC_CHANNELS,
  registerDesktopIpcHandlers,
  resolveSelectedAudioFile,
};
