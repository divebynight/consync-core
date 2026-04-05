const fs = require("fs");
const path = require("path");

const SANDBOX_CURRENT_DIR = path.join("sandbox", "current");

function writeJsonArtifact(cwd, fileName, json) {
  const artifactDir = path.join(cwd, SANDBOX_CURRENT_DIR);
  const absolutePath = path.join(artifactDir, fileName);

  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(absolutePath, json + "\n");
  return `./${path.join(SANDBOX_CURRENT_DIR, fileName)}`;
}

function appendEventLog(cwd, line) {
  const stateDir = path.join(cwd, "state");
  const logPath = path.join(stateDir, "events.log");

  fs.mkdirSync(stateDir, { recursive: true });
  fs.appendFileSync(logPath, line + "\n");
}

module.exports = {
  SANDBOX_CURRENT_DIR,
  writeJsonArtifact,
  appendEventLog,
};