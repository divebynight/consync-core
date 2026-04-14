const { contextBridge, ipcRenderer } = require("electron");
const { createDesktopBridge } = require("./bridge");

contextBridge.exposeInMainWorld(
  "consyncDesktop",
  createDesktopBridge((channel, ...args) => ipcRenderer.invoke(channel, ...args))
);