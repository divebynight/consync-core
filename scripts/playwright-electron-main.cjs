const path = require("node:path");
const { app, BrowserWindow, ipcMain } = require("electron");
const { registerDesktopIpcHandlers } = require("../src/electron/main/ipc");
const { createMainWindowOptions } = require("../src/electron/main/window");

async function bootstrap() {
  const rendererUrl = "http://127.0.0.1:5173";
  const preloadBuildDir = path.join(process.cwd(), ".vite", "build");

  await app.whenReady();

  registerDesktopIpcHandlers(ipcMain);

  const mainWindow = new BrowserWindow(
    createMainWindowOptions(preloadBuildDir)
  );

  await mainWindow.loadURL(rendererUrl);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const nextWindow = new BrowserWindow(
        createMainWindowOptions(preloadBuildDir)
      );
      nextWindow.loadURL(rendererUrl);
    }
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

bootstrap().catch(error => {
  console.error(error);
  app.exit(1);
});
