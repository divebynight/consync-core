const { app, ipcMain } = require("electron");
const { createAppDiagnostics } = require("./diagnostics");
const { registerDesktopIpcHandlers } = require("./ipc");
const { createMainWindow } = require("./window");

async function bootstrap() {
  app.setName("Consync Desktop");

  await app.whenReady();

  const diagnostics = createAppDiagnostics();
  diagnostics.logEvent("app-startup", {
    isPackaged: app.isPackaged,
    version: app.getVersion(),
  });

  process.on("uncaughtException", error => {
    diagnostics.logError("main-uncaught-exception", error);
    console.error(error);
  });

  process.on("unhandledRejection", reason => {
    diagnostics.logError("main-unhandled-rejection", reason);
    console.error(reason);
  });

  app.on("before-quit", () => {
    diagnostics.logEvent("app-shutdown");
  });

  registerDesktopIpcHandlers(ipcMain, { diagnostics });
  createMainWindow();

  app.on("activate", () => {
    if (app.getAllWindows().length === 0) {
      createMainWindow();
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
