const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  createHelpText,
  launchPreview,
  normalizePotentialFilePathInput,
  parseMediaTimestamp,
} = require("./capture-session");

function createTempSessionDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "consync-audio-probe-"));
}

function readSingleSessionFile(tempDir) {
  const sessionsDir = path.join(tempDir, ".consync", "sessions");
  const sessionFiles = fs.readdirSync(sessionsDir);

  assert.strictEqual(sessionFiles.length, 1, "expected exactly one session file");

  return JSON.parse(fs.readFileSync(path.join(sessionsDir, sessionFiles[0]), "utf8"));
}

function runProbeSession(cwd, lines, extraEnv = {}) {
  const result = spawnSync(process.execPath, [path.join(__dirname, "capture-session.js")], {
    cwd,
    env: {
      ...process.env,
      ...extraEnv,
    },
    input: `${lines.join("\n")}\n`,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "probe session failed");
  }

  return {
    session: readSingleSessionFile(cwd),
    stdout: result.stdout,
  };
}

function writeFakeQlmanage(tempDir) {
  const binDir = path.join(tempDir, "bin");
  const scriptPath = path.join(binDir, "qlmanage");

  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(
    scriptPath,
    "#!/bin/sh\nexit 0\n",
    { mode: 0o755 }
  );

  return binDir;
}

function testDraggedAbsolutePathSetsCurrentFile() {
  const tempDir = createTempSessionDir();
  const mediaDir = path.join(tempDir, "media");
  const samplePath = path.join(mediaDir, "sample audio.wav");

  fs.mkdirSync(mediaDir, { recursive: true });
  fs.writeFileSync(samplePath, "audio");

  const draggedPath = samplePath.replace(/ /g, "\\ ");
  const { session, stdout } = runProbeSession(tempDir, [draggedPath, "first note", "/end"]);

  assert.match(stdout, /Current file set to media\/sample audio\.wav/);
  assert.strictEqual(session.currentFile, "media/sample audio.wav");
  assert.strictEqual(session.entries[0].file, "media/sample audio.wav");
  assert.strictEqual(session.entries[0].text, "first note");
}

function testManualRelativeFileStillWorks() {
  const tempDir = createTempSessionDir();
  const mediaDir = path.join(tempDir, "media");
  const samplePath = path.join(mediaDir, "clip.wav");

  fs.mkdirSync(mediaDir, { recursive: true });
  fs.writeFileSync(samplePath, "audio");

  const { session, stdout } = runProbeSession(tempDir, ["/file media/clip.wav", "manual note", "/end"]);

  assert.match(stdout, /Current file set to media\/clip\.wav/);
  assert.strictEqual(session.currentFile, "media/clip.wav");
  assert.strictEqual(session.entries[0].file, "media/clip.wav");
  assert.strictEqual(session.entries[0].text, "manual note");
}

function testNormalNoteStillCreatesEntry() {
  const tempDir = createTempSessionDir();
  const { session } = runProbeSession(tempDir, ["this is a plain note", "/end"]);

  assert.strictEqual(session.currentFile, null);
  assert.strictEqual(session.entries.length, 1);
  assert.strictEqual(session.entries[0].file, null);
  assert.strictEqual(session.entries[0].text, "this is a plain note");
}

function testInvalidNonFileInputIsNotMisclassified() {
  const tempDir = createTempSessionDir();
  const { session, stdout } = runProbeSession(tempDir, ["missing-audio-file.wav", "/end"]);

  assert.doesNotMatch(stdout, /Current file set to/);
  assert.strictEqual(session.currentFile, null);
  assert.strictEqual(session.entries.length, 1);
  assert.strictEqual(session.entries[0].text, "missing-audio-file.wav");
}

function testPreviewWithoutCurrentFilePrintsHelpfulMessage() {
  const tempDir = createTempSessionDir();
  const { session, stdout } = runProbeSession(tempDir, ["/preview", "/end"]);

  assert.match(stdout, /No current file to preview/);
  assert.strictEqual(session.currentFile, null);
  assert.strictEqual(session.entries.length, 0);
}

function testPreviewWithCurrentFileLaunchesAndLoopContinues() {
  const tempDir = createTempSessionDir();
  const mediaDir = path.join(tempDir, "media");
  const samplePath = path.join(mediaDir, "clip.wav");
  const fakeBinDir = writeFakeQlmanage(tempDir);

  fs.mkdirSync(mediaDir, { recursive: true });
  fs.writeFileSync(samplePath, "audio");

  const { session, stdout } = runProbeSession(
    tempDir,
    ["/file media/clip.wav", "/preview", "note after preview", "/end"],
    {
      PATH: `${fakeBinDir}:${process.env.PATH}`,
    }
  );

  assert.match(stdout, /Preview opened for media\/clip\.wav/);
  assert.strictEqual(session.entries.length, 1);
  assert.strictEqual(session.entries[0].text, "note after preview");
  assert.strictEqual(session.entries[0].file, "media/clip.wav");
}

function testAtWithNoCurrentFilePrintsHelpfulMessage() {
  const tempDir = createTempSessionDir();
  const { session, stdout } = runProbeSession(tempDir, ["/at 8:22", "/end"]);

  assert.match(stdout, /No current file set for timestamped notes/);
  assert.strictEqual(session.entries.length, 0);
}

function testInvalidTimestampInputPrintsUsage() {
  const tempDir = createTempSessionDir();
  const mediaDir = path.join(tempDir, "media");
  const samplePath = path.join(mediaDir, "clip.wav");

  fs.mkdirSync(mediaDir, { recursive: true });
  fs.writeFileSync(samplePath, "audio");

  const { session, stdout } = runProbeSession(tempDir, ["/file media/clip.wav", "/at 8:99", "plain note", "/end"]);

  assert.match(stdout, /Usage: \/at <ss\|m:ss\|mm:ss>/);
  assert.strictEqual(session.entries.length, 1);
  assert.strictEqual(session.entries[0].mediaTimestamp, undefined);
}

function testAtSsInputAppliesToNextNoteOnly() {
  const tempDir = createTempSessionDir();
  const mediaDir = path.join(tempDir, "media");
  const samplePath = path.join(mediaDir, "clip.wav");

  fs.mkdirSync(mediaDir, { recursive: true });
  fs.writeFileSync(samplePath, "audio");

  const { session, stdout } = runProbeSession(tempDir, ["/file media/clip.wav", "/at 08", "note one", "note two", "/end"]);

  assert.match(stdout, /Pending media timestamp set to 00:08/);
  assert.deepStrictEqual(session.entries[0].mediaTimestamp, {
    raw: "00:08",
    seconds: 8,
  });
  assert.strictEqual(session.entries[1].mediaTimestamp, undefined);
}

function testAtMssInputNormalizesToMmss() {
  const tempDir = createTempSessionDir();
  const mediaDir = path.join(tempDir, "media");
  const samplePath = path.join(mediaDir, "clip.wav");

  fs.mkdirSync(mediaDir, { recursive: true });
  fs.writeFileSync(samplePath, "audio");

  const { session, stdout } = runProbeSession(tempDir, ["/file media/clip.wav", "/at 1:05", "timed note", "/end"]);

  assert.match(stdout, /Pending media timestamp set to 01:05/);
  assert.deepStrictEqual(session.entries[0].mediaTimestamp, {
    raw: "01:05",
    seconds: 65,
  });
}

function testAtWorksAfterPreview() {
  const tempDir = createTempSessionDir();
  const mediaDir = path.join(tempDir, "media");
  const samplePath = path.join(mediaDir, "clip.wav");
  const fakeBinDir = writeFakeQlmanage(tempDir);

  fs.mkdirSync(mediaDir, { recursive: true });
  fs.writeFileSync(samplePath, "audio");

  const { session, stdout } = runProbeSession(
    tempDir,
    ["/file media/clip.wav", "/preview", "/at 8:22", "note after preview", "/end"],
    {
      PATH: `${fakeBinDir}:${process.env.PATH}`,
    }
  );

  assert.match(stdout, /Preview opened for media\/clip\.wav/);
  assert.match(stdout, /Pending media timestamp set to 08:22/);
  assert.deepStrictEqual(session.entries[0].mediaTimestamp, {
    raw: "08:22",
    seconds: 502,
  });
}

function testQuotedDraggedPathNormalization() {
  assert.strictEqual(
    normalizePotentialFilePathInput('"/tmp/sample\\ audio.wav"'),
    "/tmp/sample audio.wav"
  );
}

function testLaunchPreviewResolvesRelativeStoredPath() {
  const tempDir = createTempSessionDir();
  const spawned = [];

  const resolvedPath = launchPreview(tempDir, "media/clip.wav", (command, args, options) => {
    spawned.push({ command, args, options });
    return {
      unref() {},
    };
  });

  assert.strictEqual(resolvedPath, path.join(tempDir, "media", "clip.wav"));
  assert.strictEqual(spawned[0].command, "qlmanage");
  assert.deepStrictEqual(spawned[0].args, ["-p", path.join(tempDir, "media", "clip.wav")]);
  assert.deepStrictEqual(spawned[0].options, {
    detached: true,
    stdio: "ignore",
  });
}

function testHelpPrintsExpectedCommandHelpText() {
  const tempDir = createTempSessionDir();
  const { stdout } = runProbeSession(tempDir, ["/help", "/end"]);

  assert.match(stdout, /\/file <name-or-path> - set current file manually/);
  assert.match(stdout, /\/preview - open current file in Quick Look/);
  assert.match(stdout, /\/at <timestamp> - set media timestamp for next note/);
  assert.match(stdout, /\/help - show command help/);
}

function testParseMediaTimestampSupportsRequiredFormats() {
  assert.deepStrictEqual(parseMediaTimestamp("08"), {
    raw: "00:08",
    seconds: 8,
  });
  assert.deepStrictEqual(parseMediaTimestamp("8:22"), {
    raw: "08:22",
    seconds: 502,
  });
  assert.deepStrictEqual(parseMediaTimestamp("01:05"), {
    raw: "01:05",
    seconds: 65,
  });
}

function testCreateHelpTextIncludesNewCommands() {
  const helpText = createHelpText();

  assert.match(helpText, /\/at <timestamp> - set media timestamp for next note/);
  assert.match(helpText, /\/help - show command help/);
}

function main() {
  testDraggedAbsolutePathSetsCurrentFile();
  testManualRelativeFileStillWorks();
  testNormalNoteStillCreatesEntry();
  testInvalidNonFileInputIsNotMisclassified();
  testPreviewWithoutCurrentFilePrintsHelpfulMessage();
  testPreviewWithCurrentFileLaunchesAndLoopContinues();
  testAtWithNoCurrentFilePrintsHelpfulMessage();
  testInvalidTimestampInputPrintsUsage();
  testAtSsInputAppliesToNextNoteOnly();
  testAtMssInputNormalizesToMmss();
  testAtWorksAfterPreview();
  testHelpPrintsExpectedCommandHelpText();
  testParseMediaTimestampSupportsRequiredFormats();
  testCreateHelpTextIncludesNewCommands();
  testQuotedDraggedPathNormalization();
  testLaunchPreviewResolvesRelativeStoredPath();
  console.log("PASS");
}

main();