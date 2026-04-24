const fs = require("node:fs");
const path = require("node:path");
const { buildSandboxDesktopSearchResult } = require("../lib/sandbox-anchors");

function getDesktopShellInfo() {
  return {
    appName: "Consync Desktop",
    layer: "desktop-scaffold",
    renderer: "react",
    bridge: "preload-ipc",
    sharedCorePath: "src/core",
    pausedWork: [
      "audio waveform",
      "timeline sync",
      "renderer filesystem access",
    ],
  };
}

function createDesktopPingResponse(message = "renderer-ready") {
  return {
    ok: true,
    message: `pong:${message}`,
  };
}

function getDesktopBackendSummary() {
  return {
    cwd: process.cwd(),
    platform: process.platform,
  };
}

function getDesktopConsyncSummary() {
  const sessionDir = path.join(process.cwd(), "sandbox", "current");
  const sessionDirectoryExists = fs.existsSync(sessionDir);
  const sessionCount = sessionDirectoryExists
    ? fs.readdirSync(sessionDir).filter(entry => entry.endsWith(".json")).length
    : 0;

  return {
    sessionCount,
    sessionDirectoryExists,
  };
}

function runDesktopMockSearch(rootPath, query) {
  return buildSandboxDesktopSearchResult(rootPath, query);
}

function normalizeRelativePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function revealDesktopPath(targetPath, options = {}) {
  const fsModule = options.fsModule || fs;
  const pathModule = options.pathModule || path;
  const shellLike = options.shellLike;

  if (!targetPath || typeof targetPath !== "string") {
    return {
      ok: false,
      output: "Target path is required",
    };
  }

  if (!shellLike || typeof shellLike.showItemInFolder !== "function") {
    return {
      ok: false,
      output: "Desktop reveal is unavailable",
    };
  }

  const absoluteTargetPath = pathModule.resolve(process.cwd(), targetPath);
  const parentPath = pathModule.dirname(absoluteTargetPath);
  const preferredRevealPath = fsModule.existsSync(absoluteTargetPath) ? absoluteTargetPath : parentPath;

  try {
    shellLike.showItemInFolder(preferredRevealPath);

    return {
      ok: true,
      requestedPath: normalizeRelativePath(targetPath),
      revealedPath: normalizeRelativePath(pathModule.relative(process.cwd(), preferredRevealPath)),
    };
  } catch (error) {
    if (preferredRevealPath === parentPath) {
      return {
        ok: false,
        output: error.message,
      };
    }

    try {
      shellLike.showItemInFolder(parentPath);

      return {
        ok: true,
        requestedPath: normalizeRelativePath(targetPath),
        revealedPath: normalizeRelativePath(pathModule.relative(process.cwd(), parentPath)),
      };
    } catch (fallbackError) {
      return {
        ok: false,
        output: fallbackError.message,
      };
    }
  }
}

module.exports = {
  createDesktopPingResponse,
  getDesktopBackendSummary,
  getDesktopConsyncSummary,
  getDesktopShellInfo,
  revealDesktopPath,
  runDesktopMockSearch,
};
