const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const {
  createDesktopPingResponse,
  getDesktopBackendSummary,
  getDesktopConsyncSummary,
  getDesktopShellInfo,
} = require("../core/desktop-shell");
const {
  createBookmark,
  getLatestSessionFileName,
  getSessionState,
  resetSessionState,
} = require("../core/session");
const { IPC_CHANNELS } = require("../electron/shared/ipc-channels");
const { registerDesktopIpcHandlers } = require("../electron/main/ipc");
const { createMainWindowOptions } = require("../electron/main/window");
const { createDesktopBridge } = require("../electron/preload/bridge");

function testPreloadBridgeIsolation() {
  const mainIpcPath = require.resolve("../electron/main/ipc");
  delete require.cache[mainIpcPath];

  const bridgePath = require.resolve("../electron/preload/bridge");
  delete require.cache[bridgePath];
  require(bridgePath);

  assert.strictEqual(
    require.cache[mainIpcPath],
    undefined,
    "preload bridge must not load the main IPC module"
  );
}

function testCoreSurface() {
  const shellInfo = getDesktopShellInfo();
  const backendSummary = getDesktopBackendSummary();
  const consyncSummary = getDesktopConsyncSummary();
  const pingResponse = createDesktopPingResponse("desktop-test");

  assert.strictEqual(shellInfo.appName, "Consync Desktop");
  assert.strictEqual(shellInfo.sharedCorePath, "src/core");
  assert.deepStrictEqual(backendSummary, {
    cwd: process.cwd(),
    platform: process.platform,
  });
  assert.deepStrictEqual(shellInfo.pausedWork, [
    "audio playback",
    "timeline sync",
    "renderer filesystem access",
  ]);
  assert.deepStrictEqual(consyncSummary, {
    sessionCount: fs.readdirSync(path.join(process.cwd(), "sandbox", "current")).filter(entry => entry.endsWith(".json")).length,
    sessionDirectoryExists: true,
  });
  assert.deepStrictEqual(pingResponse, {
    ok: true,
    message: "pong:desktop-test",
  });
}

function testMainWindowOptions() {
  const fakeBuildDir = path.join("/tmp", ".vite", "build");
  const windowOptions = createMainWindowOptions(fakeBuildDir);

  assert.strictEqual(windowOptions.width, 1200);
  assert.strictEqual(windowOptions.height, 820);
  assert.strictEqual(windowOptions.webPreferences.preload, path.join(fakeBuildDir, "preload.js"));
  assert.strictEqual(windowOptions.webPreferences.contextIsolation, true);
  assert.strictEqual(windowOptions.webPreferences.nodeIntegration, false);
  assert.strictEqual(windowOptions.webPreferences.sandbox, true);
}

function testIpcRegistration() {
  resetSessionState();
  const handlers = new Map();

  registerDesktopIpcHandlers({
    handle(channel, handler) {
      handlers.set(channel, handler);
    },
  });

  assert.ok(handlers.has(IPC_CHANNELS.getShellInfo));
  assert.ok(handlers.has(IPC_CHANNELS.getSessionState));
  assert.ok(handlers.has(IPC_CHANNELS.createBookmark));
  assert.ok(handlers.has(IPC_CHANNELS.ping));
  assert.ok(handlers.has(IPC_CHANNELS.getBackendSummary));
  assert.ok(handlers.has(IPC_CHANNELS.getConsyncSummary));

  const backendSummary = handlers.get(IPC_CHANNELS.getBackendSummary)();
  const consyncSummary = handlers.get(IPC_CHANNELS.getConsyncSummary)();
  const shellInfo = handlers.get(IPC_CHANNELS.getShellInfo)();
  const sessionState = handlers.get(IPC_CHANNELS.getSessionState)();
  const updatedSessionState = handlers.get(IPC_CHANNELS.createBookmark)(null, "Bridge bookmark");
  const pingResponse = handlers.get(IPC_CHANNELS.ping)(null, "from-renderer");

  assert.deepStrictEqual(backendSummary, getDesktopBackendSummary());
  assert.deepStrictEqual(consyncSummary, getDesktopConsyncSummary());
  assert.strictEqual(shellInfo.layer, "desktop-scaffold");
  assert.strictEqual(sessionState.currentFile, getLatestSessionFileName());
  assert.strictEqual(sessionState.currentPositionSeconds, 84);
  assert.deepStrictEqual(updatedSessionState.bookmarks, [
    {
      id: "bookmark-1",
      note: "Bridge bookmark",
      timeSeconds: 84,
    },
  ]);
  assert.deepStrictEqual(pingResponse, {
    ok: true,
    message: "pong:from-renderer",
  });
}

function testSessionCoreSurface() {
  resetSessionState();

  const sessionState = getSessionState();
  const updatedSessionState = createBookmark("First bookmark");

  assert.deepStrictEqual(sessionState, {
    currentFile: getLatestSessionFileName(),
    currentPositionSeconds: 84,
    bookmarks: [],
  });
  assert.deepStrictEqual(updatedSessionState, {
    currentFile: getLatestSessionFileName(),
    currentPositionSeconds: 84,
    bookmarks: [
      {
        id: "bookmark-1",
        note: "First bookmark",
        timeSeconds: 84,
      },
    ],
  });
}

async function testPreloadBridge() {
  resetSessionState();
  const invokedChannels = [];
  const bridge = createDesktopBridge((channel, ...args) => {
    invokedChannels.push({ channel, args });

    if (channel === IPC_CHANNELS.getBackendSummary) {
      return Promise.resolve(getDesktopBackendSummary());
    }

    if (channel === IPC_CHANNELS.getConsyncSummary) {
      return Promise.resolve(getDesktopConsyncSummary());
    }

    if (channel === IPC_CHANNELS.getShellInfo) {
      return Promise.resolve({ bridge: true });
    }

    if (channel === IPC_CHANNELS.getSessionState) {
      return Promise.resolve({
        bookmarks: [],
        currentFile: getLatestSessionFileName(),
        currentPositionSeconds: 84,
      });
    }

    if (channel === IPC_CHANNELS.createBookmark) {
      return Promise.resolve({
        bookmarks: [
          {
            id: "bookmark-1",
            note: args[0],
            timeSeconds: 84,
          },
        ],
      });
    }

    return Promise.resolve({ ok: true, args });
  });

  const backendSummary = await bridge.getBackendSummary();
  const bridgeStatus = await bridge.getBridgeStatus();
  const consyncSummary = await bridge.getConsyncSummary();
  const shellInfo = await bridge.getShellInfo();
  const sessionState = await bridge.getSessionState();
  const bookmarkState = await bridge.createBookmark("renderer bookmark");
  const pingResponse = await bridge.ping("renderer-ready");

  assert.deepStrictEqual(backendSummary, getDesktopBackendSummary());
  assert.deepStrictEqual(consyncSummary, getDesktopConsyncSummary());
  assert.deepStrictEqual(bridgeStatus, {
    status: "ready",
    surface: "preload",
    version: "bridge-v1",
  });
  assert.deepStrictEqual(shellInfo, { bridge: true });
  assert.deepStrictEqual(sessionState, {
    bookmarks: [],
    currentFile: getLatestSessionFileName(),
    currentPositionSeconds: 84,
  });
  assert.deepStrictEqual(bookmarkState, {
    bookmarks: [
      {
        id: "bookmark-1",
        note: "renderer bookmark",
        timeSeconds: 84,
      },
    ],
  });
  assert.deepStrictEqual(pingResponse, { ok: true, args: ["renderer-ready"] });
  assert.deepStrictEqual(invokedChannels, [
    { channel: IPC_CHANNELS.getBackendSummary, args: [] },
    { channel: IPC_CHANNELS.getConsyncSummary, args: [] },
    { channel: IPC_CHANNELS.getShellInfo, args: [] },
    { channel: IPC_CHANNELS.getSessionState, args: [] },
    { channel: IPC_CHANNELS.createBookmark, args: ["renderer bookmark"] },
    { channel: IPC_CHANNELS.ping, args: ["renderer-ready"] },
  ]);
}

async function main() {
  testCoreSurface();
  testMainWindowOptions();
  testPreloadBridgeIsolation();
  testSessionCoreSurface();
  testIpcRegistration();
  await testPreloadBridge();
  console.log("PASS");
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});