const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const {
  createDesktopPingResponse,
  getDesktopBackendSummary,
  getDesktopConsyncSummary,
  getDesktopShellInfo,
  revealDesktopPath,
  runDesktopMockSearch,
} = require("../core/desktop-shell");
const {
  createBookmark,
  getSessionArtifactCount,
  getLatestSessionFileName,
  getSessionState,
  resetSessionState,
} = require("../core/session");
const { IPC_CHANNELS } = require("../electron/shared/ipc-channels");
const { registerDesktopIpcHandlers } = require("../electron/main/ipc");
const { createMainWindowOptions } = require("../electron/main/window");
const { createDesktopBridge } = require("../electron/preload/bridge");

function withTemporarySessionDir(run) {
  const temporarySessionDir = fs.mkdtempSync(path.join(os.tmpdir(), "consync-session-"));
  const originalSessionDir = process.env.CONSYNC_SESSION_DIR;
  const artifactPath = path.join(temporarySessionDir, "20260405T154039301Z.json");

  fs.writeFileSync(
    artifactPath,
    JSON.stringify({
      created_at: "2026-04-05T15:40:39.301Z",
      guid: "44bfa0e1-e2be-426c-9bf2-1966718a58b2",
      note: "sanity check",
    }, null, 2) + "\n"
  );

  process.env.CONSYNC_SESSION_DIR = temporarySessionDir;
  const cleanup = () => {
    if (originalSessionDir === undefined) {
      delete process.env.CONSYNC_SESSION_DIR;
    } else {
      process.env.CONSYNC_SESSION_DIR = originalSessionDir;
    }

    fs.rmSync(temporarySessionDir, { force: true, recursive: true });
  };

  try {
    const result = run({ artifactPath, temporarySessionDir });

    if (result && typeof result.then === "function") {
      return result.finally(cleanup);
    }

    cleanup();
    return result;
  } catch (error) {
    cleanup();
    throw error;
  }
}

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
  const mockSearchResult = runDesktopMockSearch("sandbox/fixtures/nested-anchor-trial", "moss");
  const revealedPath = revealDesktopPath("sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg", {
    shellLike: {
      showItemInFolder() {},
    },
  });
  const pingResponse = createDesktopPingResponse("desktop-test");

  assert.strictEqual(shellInfo.appName, "Consync Desktop");
  assert.strictEqual(shellInfo.sharedCorePath, "src/core");
  assert.deepStrictEqual(backendSummary, {
    cwd: process.cwd(),
    platform: process.platform,
  });
  assert.deepStrictEqual(shellInfo.pausedWork, [
    "audio waveform",
    "timeline sync",
    "renderer filesystem access",
  ]);
  assert.deepStrictEqual(consyncSummary, {
    sessionCount: fs.readdirSync(path.join(process.cwd(), "sandbox", "current")).filter(entry => entry.endsWith(".json")).length,
    sessionDirectoryExists: true,
  });
  assert.strictEqual(mockSearchResult.ok, true);
  assert.strictEqual(mockSearchResult.rootPath, "sandbox/fixtures/nested-anchor-trial");
  assert.strictEqual(mockSearchResult.query, "moss");
  assert.strictEqual(mockSearchResult.sessionCount, 2);
  assert.strictEqual(mockSearchResult.matchCount, 2);
  assert.deepStrictEqual(revealedPath, {
    ok: true,
    requestedPath: "sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg",
    revealedPath: "sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg",
  });
  assert.deepStrictEqual(mockSearchResult.groups[0], {
    anchorPath: "2026/april/balcony-zine",
    sessionTitle: "Balcony Zine Session",
    matches: [
      {
        anchorPath: "2026/april/balcony-zine",
        artifactPath: "exports/cover-notes.md",
        note: "Moss motif for cover transition",
        sessionTitle: "Balcony Zine Session",
        tags: ["cover", "moss", "print"],
      },
    ],
  });
  assert.ok(mockSearchResult.output.includes("DESKTOP SEARCH PREVIEW"));
  assert.ok(mockSearchResult.output.includes("SESSION: Balcony Zine Session"));
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

async function testIpcRegistration() {
  await withTemporarySessionDir(async ({ artifactPath, temporarySessionDir }) => {
    resetSessionState();
    const handlers = new Map();
    const revealedPaths = [];
    const audioPath = path.join(temporarySessionDir, "sample.mp3");

    fs.writeFileSync(audioPath, "audio");

    registerDesktopIpcHandlers({
      handle(channel, handler) {
        handlers.set(channel, handler);
      },
    }, {
      dialogLike: {
        async showOpenDialog() {
          return {
            canceled: false,
            filePaths: [audioPath],
          };
        },
      },
      shellLike: {
        showItemInFolder(targetPath) {
          revealedPaths.push(targetPath);
        },
      },
    });

    assert.ok(handlers.has(IPC_CHANNELS.getShellInfo));
    assert.ok(handlers.has(IPC_CHANNELS.getSessionState));
    assert.ok(handlers.has(IPC_CHANNELS.revealSearchResult));
    assert.ok(handlers.has(IPC_CHANNELS.runMockSearch));
    assert.ok(handlers.has(IPC_CHANNELS.createBookmark));
    assert.ok(handlers.has(IPC_CHANNELS.ping));
    assert.ok(handlers.has(IPC_CHANNELS.getBackendSummary));
    assert.ok(handlers.has(IPC_CHANNELS.getConsyncSummary));
    assert.ok(handlers.has(IPC_CHANNELS.selectAudioFile));

    const backendSummary = handlers.get(IPC_CHANNELS.getBackendSummary)();
    const consyncSummary = handlers.get(IPC_CHANNELS.getConsyncSummary)();
    const shellInfo = handlers.get(IPC_CHANNELS.getShellInfo)();
    const sessionState = handlers.get(IPC_CHANNELS.getSessionState)();
    const selectedAudioFile = await handlers.get(IPC_CHANNELS.selectAudioFile)();
    const revealResult = handlers.get(IPC_CHANNELS.revealSearchResult)(null, "sandbox/fixtures/nested-anchor-trial/2026/april/balcony-zine/exports/cover-notes.md");
    const mockSearch = handlers.get(IPC_CHANNELS.runMockSearch)(null, "sandbox/fixtures/nested-anchor-trial", "moss");
    const updatedSessionState = handlers.get(IPC_CHANNELS.createBookmark)(null, {
      createdAt: "2026-04-23T18:00:00.000Z",
      filePath: audioPath,
      note: "Bridge bookmark",
      timeLabel: "00:42",
      timeSeconds: 42,
    });
    const pingResponse = handlers.get(IPC_CHANNELS.ping)(null, "from-renderer");
    const persistedArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    assert.deepStrictEqual(backendSummary, getDesktopBackendSummary());
    assert.deepStrictEqual(consyncSummary, getDesktopConsyncSummary());
    assert.strictEqual(shellInfo.layer, "desktop-scaffold");
    assert.strictEqual(sessionState.artifactCount, getSessionArtifactCount());
    assert.strictEqual(sessionState.currentFile, getLatestSessionFileName());
    assert.strictEqual(sessionState.currentPositionSeconds, 84);
    assert.deepStrictEqual(selectedAudioFile, {
      audioSrc: "data:audio/mpeg;base64,YXVkaW8=",
      canceled: false,
      fileName: "sample.mp3",
      filePath: audioPath,
      fileUrl: pathToFileURL(audioPath).href,
      ok: true,
    });
    assert.deepStrictEqual(revealResult, {
      ok: true,
      requestedPath: "sandbox/fixtures/nested-anchor-trial/2026/april/balcony-zine/exports/cover-notes.md",
      revealedPath: "sandbox/fixtures/nested-anchor-trial/2026/april/balcony-zine/exports/cover-notes.md",
    });
    assert.deepStrictEqual(revealedPaths, [
      path.join(process.cwd(), "sandbox/fixtures/nested-anchor-trial/2026/april/balcony-zine/exports/cover-notes.md"),
    ]);
    assert.strictEqual(mockSearch.ok, true);
    assert.strictEqual(mockSearch.sessionCount, 2);
    assert.strictEqual(mockSearch.matchCount, 2);
    assert.strictEqual(mockSearch.groups[1].sessionTitle, "Greenhouse Poster Session");
    assert.ok(mockSearch.output.includes("ANCHOR: 2026/april/greenhouse-poster"));
    assert.strictEqual(updatedSessionState.artifactCount, getSessionArtifactCount());
    assert.deepStrictEqual(updatedSessionState.bookmarks, [
      {
        id: "bookmark-1",
        createdAt: "2026-04-23T18:00:00.000Z",
        filePath: audioPath,
        note: "Bridge bookmark",
        timeLabel: "00:42",
        timeSeconds: 42,
      },
    ]);
    assert.deepStrictEqual(persistedArtifact.bookmarks, [
      {
        id: "bookmark-1",
        createdAt: "2026-04-23T18:00:00.000Z",
        filePath: audioPath,
        note: "Bridge bookmark",
        timeLabel: "00:42",
        timeSeconds: 42,
      },
    ]);
    assert.deepStrictEqual(pingResponse, {
      ok: true,
      message: "pong:from-renderer",
    });
  });
}

function testSessionCoreSurface() {
  withTemporarySessionDir(({ artifactPath }) => {
    resetSessionState();

    const sessionState = getSessionState();
    const updatedSessionState = createBookmark("First bookmark");
    const persistedArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    assert.deepStrictEqual(sessionState, {
      artifactCount: getSessionArtifactCount(),
      currentFile: getLatestSessionFileName(),
      currentPositionSeconds: 84,
      bookmarks: [],
    });
    assert.deepStrictEqual(updatedSessionState, {
      artifactCount: getSessionArtifactCount(),
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
    assert.deepStrictEqual(persistedArtifact.bookmarks, [
      {
        id: "bookmark-1",
        note: "First bookmark",
        timeSeconds: 84,
      },
    ]);
  });
}

async function testPreloadBridge() {
  withTemporarySessionDir(async () => {
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
          artifactCount: getSessionArtifactCount(),
          bookmarks: [],
          currentFile: getLatestSessionFileName(),
          currentPositionSeconds: 84,
        });
      }

      if (channel === IPC_CHANNELS.selectAudioFile) {
        return Promise.resolve({
          audioSrc: "data:audio/mpeg;base64,c2FtcGxl",
          canceled: false,
          fileName: "sample.mp3",
          filePath: "/tmp/sample.mp3",
          fileUrl: "file:///tmp/sample.mp3",
          ok: true,
        });
      }

      if (channel === IPC_CHANNELS.revealSearchResult) {
        return Promise.resolve({
          ok: true,
          requestedPath: args[0],
          revealedPath: args[0],
        });
      }

      if (channel === IPC_CHANNELS.runMockSearch) {
        return Promise.resolve(runDesktopMockSearch(args[0], args[1]));
      }

      if (channel === IPC_CHANNELS.createBookmark) {
        return Promise.resolve({
          artifactCount: getSessionArtifactCount(),
          bookmarks: [
            {
              id: "bookmark-1",
              ...args[0],
            },
          ],
          currentFile: getLatestSessionFileName(),
          currentPositionSeconds: 84,
        });
      }

      return Promise.resolve({ ok: true, args });
    });

    const backendSummary = await bridge.getBackendSummary();
    const bridgeStatus = await bridge.getBridgeStatus();
    const consyncSummary = await bridge.getConsyncSummary();
    const shellInfo = await bridge.getShellInfo();
    const sessionState = await bridge.getSessionState();
    const selectedAudioFile = await bridge.selectAudioFile();
    const revealResult = await bridge.revealSearchResult("sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg");
    const mockSearch = await bridge.runMockSearch("sandbox/fixtures/nested-anchor-trial", "moss");
    const bookmarkState = await bridge.createBookmark({
      createdAt: "2026-04-23T18:00:00.000Z",
      filePath: "/tmp/sample.mp3",
      note: "renderer bookmark",
      timeLabel: "00:42",
      timeSeconds: 42,
    });
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
      artifactCount: getSessionArtifactCount(),
      bookmarks: [],
      currentFile: getLatestSessionFileName(),
      currentPositionSeconds: 84,
    });
    assert.deepStrictEqual(selectedAudioFile, {
      audioSrc: "data:audio/mpeg;base64,c2FtcGxl",
      canceled: false,
      fileName: "sample.mp3",
      filePath: "/tmp/sample.mp3",
      fileUrl: "file:///tmp/sample.mp3",
      ok: true,
    });
    assert.deepStrictEqual(revealResult, {
      ok: true,
      requestedPath: "sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg",
      revealedPath: "sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg",
    });
    assert.strictEqual(mockSearch.ok, true);
    assert.strictEqual(mockSearch.groups[0].matches[0].artifactPath, "exports/cover-notes.md");
    assert.ok(mockSearch.output.includes("SESSION: Greenhouse Poster Session"));
    assert.deepStrictEqual(bookmarkState, {
      artifactCount: getSessionArtifactCount(),
      bookmarks: [
        {
          id: "bookmark-1",
          createdAt: "2026-04-23T18:00:00.000Z",
          filePath: "/tmp/sample.mp3",
          note: "renderer bookmark",
          timeLabel: "00:42",
          timeSeconds: 42,
        },
      ],
      currentFile: getLatestSessionFileName(),
      currentPositionSeconds: 84,
    });
    assert.deepStrictEqual(pingResponse, { ok: true, args: ["renderer-ready"] });
    assert.deepStrictEqual(invokedChannels, [
      { channel: IPC_CHANNELS.getBackendSummary, args: [] },
      { channel: IPC_CHANNELS.getConsyncSummary, args: [] },
      { channel: IPC_CHANNELS.getShellInfo, args: [] },
      { channel: IPC_CHANNELS.getSessionState, args: [] },
      { channel: IPC_CHANNELS.selectAudioFile, args: [] },
      { channel: IPC_CHANNELS.revealSearchResult, args: ["sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg"] },
      { channel: IPC_CHANNELS.runMockSearch, args: ["sandbox/fixtures/nested-anchor-trial", "moss"] },
      {
        channel: IPC_CHANNELS.createBookmark,
        args: [
          {
            createdAt: "2026-04-23T18:00:00.000Z",
            filePath: "/tmp/sample.mp3",
            note: "renderer bookmark",
            timeLabel: "00:42",
            timeSeconds: 42,
          },
        ],
      },
      { channel: IPC_CHANNELS.ping, args: ["renderer-ready"] },
    ]);
  });
}

async function main() {
  testCoreSurface();
  testMainWindowOptions();
  testPreloadBridgeIsolation();
  testSessionCoreSurface();
  await testIpcRegistration();
  await testPreloadBridge();
  console.log("PASS");
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
