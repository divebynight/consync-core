const fs = require("fs");
const path = require("path");

function writeJsonArtifact(cwd, fileName, json) {
  const absolutePath = path.join(cwd, fileName);
  fs.writeFileSync(absolutePath, json + "\n");
  return `./${fileName}`;
}

function appendEventLog(cwd, line) {
  const stateDir = path.join(cwd, "state");
  const logPath = path.join(stateDir, "events.log");

  fs.mkdirSync(stateDir, { recursive: true });
  fs.appendFileSync(logPath, line + "\n");
}

module.exports = {
  writeJsonArtifact,
  appendEventLog,
};