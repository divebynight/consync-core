const fs = require("fs");
const path = require("path");

function existsFromRoot(rootPath, relativePath) {
  return fs.existsSync(path.join(rootPath, relativePath));
}

function hasFiles(rootPath, relativePath) {
  const absolutePath = path.join(rootPath, relativePath);

  if (!fs.existsSync(absolutePath)) {
    return false;
  }

  return fs.readdirSync(absolutePath).length > 0;
}

function runSystemCheckCommand() {
  const rootPath = process.cwd();
  const signals = [];
  const warnings = [];

  const requiredFiles = [
    ["feature map present", ".consync/artifacts/archive/system/feature-map.md"],
    ["work log present", ".consync/artifacts/03_work-log.md"],
    ["artifact index present", ".consync/artifacts/archive/system/artifact-index.md"],
    ["handoff present", ".consync/state/handoff.md"],
  ];

  for (const [label, relativePath] of requiredFiles) {
    if (existsFromRoot(rootPath, relativePath)) {
      signals.push(label);
    } else {
      warnings.push(`missing ${relativePath}`);
    }
  }

  if (hasFiles(rootPath, "sandbox/fixtures")) {
    signals.push("sandbox fixtures present");
  } else {
    warnings.push("missing sandbox fixtures");
  }

  if (hasFiles(rootPath, "sandbox/expectations")) {
    signals.push("sandbox expectations present");
  } else {
    warnings.push("missing sandbox expectations");
  }

  const requiredCommands = [
    "new-guid.js",
    "list-guid.js",
    "portable.js",
    "show-guid.js",
    "sandbox-scan.js",
    "sandbox-verify.js",
  ];

  const commandsDir = path.join(rootPath, "src", "commands");

  for (const fileName of requiredCommands) {
    if (fs.existsSync(path.join(commandsDir, fileName))) {
      signals.push(`${fileName.replace(/\.js$/, "")} command present`);
    } else {
      warnings.push(`missing src/commands/${fileName}`);
    }
  }

  console.log(`STATUS: ${warnings.length === 0 ? "ON_TRACK" : "CHECK_WARNINGS"}`);
  console.log("Signals:");

  for (const signal of signals) {
    console.log(`- ${signal}`);
  }

  console.log("Warnings:");

  if (warnings.length === 0) {
    console.log("- none");
    return;
  }

  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

module.exports = {
  runSystemCheckCommand,
};