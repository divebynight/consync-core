const { app, ipcMain } = require("electron");
const { registerDesktopIpcHandlers } = require("./ipc");
const { createMainWindow } = require("./window");

async function bootstrap() {
  app.setName("Consync Desktop");

  await app.whenReady();

  registerDesktopIpcHandlers(ipcMain);
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