const assert = require("node:assert");
const {
  createDesktopPingResponse,
  getDesktopShellInfo,
} = require("../core/desktop-shell");
const { IPC_CHANNELS, registerDesktopIpcHandlers } = require("../electron/main/ipc");
const { createDesktopBridge } = require("../electron/preload/bridge");

function testCoreSurface() {
  const shellInfo = getDesktopShellInfo();
  const pingResponse = createDesktopPingResponse("desktop-test");

  assert.strictEqual(shellInfo.appName, "Consync Desktop");
  assert.strictEqual(shellInfo.sharedCorePath, "src/core");
  assert.deepStrictEqual(shellInfo.pausedWork, [
    "audio playback",
    "timeline sync",
    "renderer filesystem access",
  ]);
  assert.deepStrictEqual(pingResponse, {
    ok: true,
    message: "pong:desktop-test",
  });
}

function testIpcRegistration() {
  const handlers = new Map();

  registerDesktopIpcHandlers({
    handle(channel, handler) {
      handlers.set(channel, handler);
    },
  });

  assert.ok(handlers.has(IPC_CHANNELS.getShellInfo));
  assert.ok(handlers.has(IPC_CHANNELS.ping));

  const shellInfo = handlers.get(IPC_CHANNELS.getShellInfo)();
  const pingResponse = handlers.get(IPC_CHANNELS.ping)(null, "from-renderer");

  assert.strictEqual(shellInfo.layer, "desktop-scaffold");
  assert.deepStrictEqual(pingResponse, {
    ok: true,
    message: "pong:from-renderer",
  });
}

async function testPreloadBridge() {
  const invokedChannels = [];
  const bridge = createDesktopBridge((channel, ...args) => {
    invokedChannels.push({ channel, args });

    if (channel === IPC_CHANNELS.getShellInfo) {
      return Promise.resolve({ bridge: true });
    }

    return Promise.resolve({ ok: true, args });
  });

  const shellInfo = await bridge.getShellInfo();
  const pingResponse = await bridge.ping("renderer-ready");

  assert.deepStrictEqual(shellInfo, { bridge: true });
  assert.deepStrictEqual(pingResponse, { ok: true, args: ["renderer-ready"] });
  assert.deepStrictEqual(invokedChannels, [
    { channel: IPC_CHANNELS.getShellInfo, args: [] },
    { channel: IPC_CHANNELS.ping, args: ["renderer-ready"] },
  ]);
}

async function main() {
  testCoreSurface();
  testIpcRegistration();
  await testPreloadBridge();
  console.log("PASS");
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});