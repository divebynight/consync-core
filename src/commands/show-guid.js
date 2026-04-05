const fs = require("fs");
const path = require("path");
const { SANDBOX_CURRENT_DIR } = require("../lib/fs");

function findMatchingFiles(directoryPath, targetFileName, matches) {
  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      findMatchingFiles(entryPath, targetFileName, matches);
      continue;
    }

    if (entry.isFile() && entry.name === targetFileName) {
      matches.push(entryPath);
    }
  }
}

function runShowGuidCommand(guid) {
  if (!guid) {
    console.log("GUID is required");
    process.exitCode = 1;
    return;
  }

  const rootPath = path.join(process.cwd(), SANDBOX_CURRENT_DIR);

  if (!fs.existsSync(rootPath)) {
    console.log("No artifacts found");
    process.exitCode = 1;
    return;
  }

  const matches = [];
  findMatchingFiles(rootPath, `${guid}.json`, matches);

  if (matches.length === 0) {
    console.log("No artifacts found");
    process.exitCode = 1;
    return;
  }

  if (matches.length > 1) {
    console.log("Multiple artifacts found");
    process.exitCode = 1;
    return;
  }

  try {
    const artifact = JSON.parse(fs.readFileSync(matches[0], "utf8"));
    console.log(JSON.stringify(artifact, null, 2));
  } catch {
    console.log("Invalid artifact JSON");
    process.exitCode = 1;
  }
}

module.exports = {
  runShowGuidCommand,
};