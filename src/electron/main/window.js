const path = require("node:path");
const { BrowserWindow } = require("electron");

function createMainWindowOptions(baseDir = __dirname) {
  return {
    width: 1200,
    height: 820,
    minWidth: 960,
    minHeight: 680,
    backgroundColor: "#f2efe8",
    webPreferences: {
      preload: path.join(baseDir, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  };
}

function createMainWindow() {
  const mainWindow = new BrowserWindow(createMainWindowOptions());

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  return mainWindow;
}

module.exports = {
  createMainWindowOptions,
  createMainWindow,
};