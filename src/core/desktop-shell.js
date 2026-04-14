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

module.exports = {
  createDesktopPingResponse,
  getDesktopShellInfo,
};