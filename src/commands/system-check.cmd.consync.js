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

function evaluateConsyncSystemCheck(rootPath = process.cwd()) {
  const signals = [];
  const warnings = [];

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
    ["new-guid.cmd.consync.js", "src/commands/new-guid.cmd.consync.js"],
    ["list-guid.cmd.consync.js", "src/commands/list-guid.cmd.consync.js"],
    ["show-guid.cmd.consync.js", "src/commands/show-guid.cmd.consync.js"],
    ["sandbox-scan.cmd.consync.js", "src/commands/sandbox-scan.cmd.consync.js"],
    ["sandbox-verify.cmd.consync.js", "src/commands/sandbox-verify.cmd.consync.js"],
    ["sandbox-describe.cmd.consync.js", "src/commands/sandbox-describe.cmd.consync.js"],
    ["sandbox-propose.cmd.consync.js", "src/commands/sandbox-propose.cmd.consync.js"],
    ["sandbox-catalog.cmd.consync.js", "src/commands/sandbox-catalog.cmd.consync.js"],
    ["sandbox-discover.cmd.consync.js", "src/commands/sandbox-discover.cmd.consync.js"],
    ["sandbox-search.cmd.consync.js", "src/commands/sandbox-search.cmd.consync.js"],
    ["sandbox-desktop-search.cmd.consync.js", "src/commands/sandbox-desktop-search.cmd.consync.js"],
  ];

  for (const [fileName, relativePath] of requiredCommands) {
    if (fs.existsSync(path.join(rootPath, relativePath))) {
      signals.push(`${fileName.replace(/\.js$/, "")} command present`);
    } else {
      warnings.push(`missing ${relativePath}`);
    }
  }

  const desktopFiles = [
    ["forge config present", "forge.config.js"],
    ["desktop main scaffold present", "src/electron/main/index.js"],
    ["desktop preload scaffold present", "src/electron/preload/preload.js"],
    ["desktop renderer scaffold present", "src/electron/renderer/App.jsx"],
    ["shared core scaffold present", "src/core/desktop-shell.js"],
  ];

  for (const [label, relativePath] of desktopFiles) {
    if (existsFromRoot(rootPath, relativePath)) {
      signals.push(label);
    } else {
      warnings.push(`missing ${relativePath}`);
    }
  }

  return {
    status: warnings.length === 0 ? "ON_TRACK" : "CHECK_WARNINGS",
    signals,
    warnings,
  };
}

function printResult(result) {
  console.log(`STATUS: ${result.status}`);
  console.log("Signals:");

  for (const signal of result.signals) {
    console.log(`- ${signal}`);
  }

  console.log("Warnings:");

  if (result.warnings.length === 0) {
    console.log("- none");
    return;
  }

  for (const warning of result.warnings) {
    console.log(`- ${warning}`);
  }
}

function runSystemCheckCommand() {
  const result = evaluateConsyncSystemCheck(process.cwd());
  printResult(result);
}

module.exports = {
  evaluateConsyncSystemCheck,
  runSystemCheckCommand,
};
