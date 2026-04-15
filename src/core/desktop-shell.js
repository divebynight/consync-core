const fs = require("node:fs");
const path = require("node:path");

function getDesktopShellInfo() {
  return {
    appName: "Consync Desktop",
    layer: "desktop-scaffold",
    renderer: "react",
    bridge: "preload-ipc",
    sharedCorePath: "src/core",
    pausedWork: [
      "audio playback",
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

module.exports = {
  createDesktopPingResponse,
  getDesktopBackendSummary,
  getDesktopConsyncSummary,
  getDesktopShellInfo,
};