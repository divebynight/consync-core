const fs = require("node:fs");
const os = require("node:os");
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
  getLatestSessionFileName,
  getSessionState,
  updateBookmark,
} = require("../../core/session");
const { IPC_CHANNELS } = require("../shared/ipc-channels");

const E2E_AUDIO_FIXTURE_BASE64 = "UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";

function getE2eSelectedAudioFile() {
  if (process.env.CONSYNC_E2E_AUDIO_FIXTURE !== "1") {
    return null;
  }

  const fixturePath = path.join(os.tmpdir(), "consync-playwright-fixture.mp3");

  return {
    audioSrc: `data:audio/wav;base64,${E2E_AUDIO_FIXTURE_BASE64}`,
    canceled: false,
    fileName: "playwright-fixture.mp3",
    filePath: fixturePath,
    fileUrl: pathToFileURL(fixturePath).href,
    ok: true,
  };
}

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
  const diagnostics = options.diagnostics || null;

  let lastAudioFileResult = null;

  ipcMainLike.handle(IPC_CHANNELS.getAppInfo, () => diagnostics ? diagnostics.getAppInfo() : {
    appName: "Consync Desktop",
    appVersion: "test",
    buildVersion: "test",
    diagnosticsRoot: null,
    isPackaged: false,
    platform: process.platform,
    startedAt: new Date(0).toISOString(),
  });
  ipcMainLike.handle(IPC_CHANNELS.getBackendSummary, () => getDesktopBackendSummary());
  ipcMainLike.handle(IPC_CHANNELS.getConsyncSummary, () => getDesktopConsyncSummary());
  ipcMainLike.handle(IPC_CHANNELS.getShellInfo, () => getDesktopShellInfo());
  ipcMainLike.handle(IPC_CHANNELS.getSessionState, () => {
    const sessionState = getSessionState();

    if (diagnostics) {
      diagnostics.logEvent("session-opened", {
        currentFile: sessionState.currentFile,
        artifactCount: sessionState.artifactCount,
      });
    }

    return sessionState;
  });
  ipcMainLike.handle(IPC_CHANNELS.getLastAudioFile, () => lastAudioFileResult);
  ipcMainLike.handle(IPC_CHANNELS.selectAudioFile, async () => {
    const e2eSelectedAudioFile = getE2eSelectedAudioFile();

    if (e2eSelectedAudioFile) {
      lastAudioFileResult = e2eSelectedAudioFile;
      if (diagnostics) {
        diagnostics.logEvent("audio-file-selected", {
          fileName: e2eSelectedAudioFile.fileName,
          filePath: e2eSelectedAudioFile.filePath,
          source: "e2e-fixture",
        });
      }
      return e2eSelectedAudioFile;
    }

    const selection = await dialogLike.showOpenDialog({
      filters: [
        { name: "MP3 Audio", extensions: ["mp3"] },
      ],
      properties: ["openFile"],
      title: "Select Audio Note Source",
    });

    const result = resolveSelectedAudioFile(selection, options);

    if (result.ok) {
      lastAudioFileResult = result;
      if (diagnostics) {
        diagnostics.logEvent("audio-file-selected", {
          fileName: result.fileName,
          filePath: result.filePath,
          source: "dialog",
        });
      }
    }

    return result;
  });
  ipcMainLike.handle(IPC_CHANNELS.revealSearchResult, (_event, targetPath) => {
    if (diagnostics) {
      diagnostics.logEvent("search-result-revealed", { targetPath });
    }

    return revealDesktopPath(targetPath, { shellLike });
  });
  ipcMainLike.handle(IPC_CHANNELS.runMockSearch, (_event, rootPath, query) => {
    if (diagnostics) {
      diagnostics.logEvent("folder-search-run", { query, rootPath });
    }

    return runDesktopMockSearch(rootPath, query);
  });
  ipcMainLike.handle(IPC_CHANNELS.createBookmark, (_event, bookmark) => {
    const nextSessionState = createBookmark(bookmark);

    if (diagnostics) {
      diagnostics.logEvent("bookmark-created", {
        currentFile: getLatestSessionFileName(),
        filePath: bookmark && bookmark.filePath,
        hasTime: bookmark && bookmark.timeSeconds !== null && bookmark.timeSeconds !== undefined,
      });
    }

    return nextSessionState;
  });
  ipcMainLike.handle(IPC_CHANNELS.deleteBookmark, (_event, bookmarkDelete) => {
    const nextSessionState = deleteBookmark(bookmarkDelete);

    if (diagnostics) {
      diagnostics.logEvent("bookmark-deleted", {
        bookmarkId: bookmarkDelete && bookmarkDelete.id,
        currentFile: getLatestSessionFileName(),
      });
    }

    return nextSessionState;
  });
  ipcMainLike.handle(IPC_CHANNELS.updateBookmark, (_event, bookmarkUpdate) => {
    const nextSessionState = updateBookmark(bookmarkUpdate);

    if (diagnostics) {
      diagnostics.logEvent("bookmark-updated", {
        bookmarkId: bookmarkUpdate && bookmarkUpdate.id,
        currentFile: getLatestSessionFileName(),
      });
    }

    return nextSessionState;
  });
  ipcMainLike.handle(IPC_CHANNELS.logRendererEvent, (_event, type, details) => {
    if (!diagnostics) {
      return { ok: true };
    }

    if (type === "renderer-error" || type === "renderer-unhandled-rejection") {
      diagnostics.logError(type, details && details.error ? details.error : details, details);
      return { ok: true };
    }

    diagnostics.logEvent(type, details);
    return { ok: true };
  });
  ipcMainLike.handle(IPC_CHANNELS.exportSupportBundle, () => {
    if (!diagnostics) {
      return {
        bundlePath: null,
        includedFiles: [],
        ok: false,
        output: "Diagnostics are unavailable.",
      };
    }

    return diagnostics.exportSupportBundle();
  });
  ipcMainLike.handle(IPC_CHANNELS.ping, (_event, message) => createDesktopPingResponse(message));
}

module.exports = {
  IPC_CHANNELS,
  registerDesktopIpcHandlers,
  resolveSelectedAudioFile,
};
