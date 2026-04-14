const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");
const { spawn } = require("node:child_process");
const { randomUUID } = require("node:crypto");

function createSessionFileName(date) {
  return `${date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}.json`;
}

function writeSessionFile(filePath, session) {
  fs.writeFileSync(filePath, `${JSON.stringify(session, null, 2)}\n`);
}

function buildSessionEntry(startedAtMs, currentFile, text, mediaTimestamp = null) {
  const createdAt = new Date();
  const entry = {
    at: createdAt.toISOString(),
    elapsedMs: createdAt.getTime() - startedAtMs,
    file: currentFile,
    text,
  };

  if (mediaTimestamp) {
    entry.mediaTimestamp = mediaTimestamp;
  }

  return entry;
}

function formatMediaTimestamp(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function parseMediaTimestamp(input) {
  const trimmed = input.trim();

  if (/^\d{1,2}$/.test(trimmed)) {
    const totalSeconds = Number.parseInt(trimmed, 10);

    return {
      raw: formatMediaTimestamp(totalSeconds),
      seconds: totalSeconds,
    };
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const minutes = Number.parseInt(match[1], 10);
  const seconds = Number.parseInt(match[2], 10);

  if (seconds > 59) {
    return null;
  }

  return {
    raw: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    seconds: (minutes * 60) + seconds,
  };
}

function normalizePotentialFilePathInput(input) {
  const trimmed = input.trim();

  if (!trimmed) {
    return "";
  }

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).replace(/\\(.)/g, "$1");
  }

  return trimmed.replace(/\\(.)/g, "$1");
}

function formatStoredFileReference(cwd, resolvedPath) {
  const canonicalCwd = fs.realpathSync.native(cwd);
  const canonicalResolvedPath = fs.realpathSync.native(resolvedPath);
  const relativePath = path.relative(canonicalCwd, canonicalResolvedPath);

  if (!relativePath || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))) {
    return relativePath || path.basename(resolvedPath);
  }

  return canonicalResolvedPath;
}

function resolveExistingFileReference(cwd, input) {
  const normalizedPath = normalizePotentialFilePathInput(input);

  if (!normalizedPath) {
    return null;
  }

  const resolvedPath = path.isAbsolute(normalizedPath)
    ? path.resolve(normalizedPath)
    : path.resolve(cwd, normalizedPath);

  if (!fs.existsSync(resolvedPath)) {
    return null;
  }

  const stats = fs.statSync(resolvedPath);

  if (!stats.isFile()) {
    return null;
  }

  return formatStoredFileReference(cwd, resolvedPath);
}

function resolveManualFileReference(cwd, input) {
  const existingFileReference = resolveExistingFileReference(cwd, input);

  if (existingFileReference) {
    return existingFileReference;
  }

  return normalizePotentialFilePathInput(input);
}

function resolveStoredFilePath(cwd, storedFileReference) {
  if (!storedFileReference) {
    return null;
  }

  if (path.isAbsolute(storedFileReference)) {
    return storedFileReference;
  }

  return path.resolve(cwd, storedFileReference);
}

function launchPreview(cwd, currentFile, spawnProcess = spawn) {
  if (!currentFile) {
    return null;
  }

  const resolvedFilePath = resolveStoredFilePath(cwd, currentFile);
  const child = spawnProcess("qlmanage", ["-p", resolvedFilePath], {
    detached: true,
    stdio: "ignore",
  });

  child.unref();

  return resolvedFilePath;
}

function createHelpText() {
  return [
    "Commands:",
    "/file <name-or-path> - set current file manually",
    "/preview - open current file in Quick Look",
    "/at <timestamp> - set media timestamp for next note",
    "/clear-file - clear current file",
    "/end - save and exit",
    "/help - show command help",
  ].join("\n");
}

function main() {
  const startedAt = new Date();
  const cwd = process.cwd();
  const sessionsDirectory = path.join(cwd, ".consync", "sessions");

  fs.mkdirSync(sessionsDirectory, { recursive: true });

  const session = {
    sessionId: randomUUID(),
    startedAt: startedAt.toISOString(),
    stoppedAt: null,
    cwd,
    currentFile: null,
    entries: [],
  };

  const sessionFilePath = path.join(sessionsDirectory, createSessionFileName(startedAt));
  const startedAtMs = startedAt.getTime();
  let pendingMediaTimestamp = null;

  writeSessionFile(sessionFilePath, session);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  let ending = false;

  function persistAndPrompt(message) {
    writeSessionFile(sessionFilePath, session);
    if (message) {
      console.log(message);
    }
    rl.prompt();
  }

  function endSession() {
    if (ending) {
      return;
    }

    ending = true;
    session.stoppedAt = new Date().toISOString();
    writeSessionFile(sessionFilePath, session);
    console.log(`Saved session to ${sessionFilePath}`);
    rl.close();
  }

  console.log(`Started audio session capture in ${cwd}`);
  console.log(`Session file: ${sessionFilePath}`);
  console.log("Commands: /file <name-or-path>, /preview, /at <timestamp>, /clear-file, /end, /help");
  rl.prompt();

  rl.on("line", line => {
    if (line.startsWith("/file ")) {
      const fileReference = line.slice(6).trim();

      if (!fileReference) {
        console.log("Usage: /file <name-or-path>");
        rl.prompt();
        return;
      }

      session.currentFile = resolveManualFileReference(cwd, fileReference);
      persistAndPrompt(`Current file set to ${session.currentFile}`);
      return;
    }

    if (line.startsWith("/at ")) {
      if (!session.currentFile) {
        console.log("No current file set for timestamped notes");
        rl.prompt();
        return;
      }

      const parsedTimestamp = parseMediaTimestamp(line.slice(4).trim());

      if (!parsedTimestamp) {
        console.log("Usage: /at <ss|m:ss|mm:ss>");
        rl.prompt();
        return;
      }

      pendingMediaTimestamp = parsedTimestamp;
      console.log(`Pending media timestamp set to ${parsedTimestamp.raw}`);
      rl.prompt();
      return;
    }

    if (line.trim() === "/preview") {
      if (!session.currentFile) {
        console.log("No current file to preview");
        rl.prompt();
        return;
      }

      launchPreview(cwd, session.currentFile);
      console.log(`Preview opened for ${session.currentFile}`);
      rl.prompt();
      return;
    }

    if (line.trim() === "/help") {
      console.log(createHelpText());
      rl.prompt();
      return;
    }

    if (line.trim() === "/clear-file") {
      session.currentFile = null;
      pendingMediaTimestamp = null;
      persistAndPrompt("Current file cleared");
      return;
    }

    if (line.trim() === "/end") {
      endSession();
      return;
    }

    const detectedFileReference = resolveExistingFileReference(cwd, line);

    if (detectedFileReference) {
      session.currentFile = detectedFileReference;
      persistAndPrompt(`Current file set to ${detectedFileReference}`);
      return;
    }

    if (line.startsWith("/")) {
      console.log("Unknown command. Use /file <name-or-path>, /preview, /at <timestamp>, /clear-file, /end, or /help");
      rl.prompt();
      return;
    }

    session.entries.push(buildSessionEntry(startedAtMs, session.currentFile, line, pendingMediaTimestamp));
    pendingMediaTimestamp = null;
    writeSessionFile(sessionFilePath, session);
    rl.prompt();
  });

  rl.on("close", () => {
    process.exit(0);
  });

  process.on("SIGINT", () => {
    endSession();
  });
}

if (require.main === module) {
  main();
}

module.exports = {
  createHelpText,
  formatStoredFileReference,
  formatMediaTimestamp,
  launchPreview,
  normalizePotentialFilePathInput,
  parseMediaTimestamp,
  resolveExistingFileReference,
  resolveManualFileReference,
  resolveStoredFilePath,
};