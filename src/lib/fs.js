const fs = require("fs");
const path = require("path");

const SANDBOX_CURRENT_DIR = path.join("sandbox", "current");
const CONSYNC_STATE_DIR = path.join(".consync", "state");
const CONSYNC_STATE_HISTORY_DIR = path.join(CONSYNC_STATE_DIR, "history");

function writeJsonArtifact(cwd, fileName, json) {
  const artifactDir = path.join(cwd, SANDBOX_CURRENT_DIR);
  const absolutePath = path.join(artifactDir, fileName);

  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(absolutePath, json + "\n");
  return `./${path.join(SANDBOX_CURRENT_DIR, fileName)}`;
}

function appendEventLog(cwd, line) {
  const historyDir = path.join(cwd, CONSYNC_STATE_HISTORY_DIR);
  const logPath = path.join(historyDir, "events.log");

  fs.mkdirSync(historyDir, { recursive: true });
  fs.appendFileSync(logPath, line + "\n");
}

module.exports = {
  CONSYNC_STATE_HISTORY_DIR,
  CONSYNC_STATE_DIR,
  SANDBOX_CURRENT_DIR,
  writeJsonArtifact,
  appendEventLog,
};