const fs = require("fs");
const path = require("path");

function existsFromRoot(rootPath, relativePath) {
  return fs.existsSync(path.join(rootPath, relativePath));
}

function evaluateProcessCheck(rootPath = process.cwd()) {
  const signals = [];
  const warnings = [];

  const requiredFiles = [
    ["handoff present", ".scaffoldai/state/handoff.md"],
  ];

  for (const [label, relativePath] of requiredFiles) {
    if (existsFromRoot(rootPath, relativePath)) {
      signals.push(label);
    } else {
      warnings.push(`missing ${relativePath}`);
    }
  }

  const requiredCommands = [
    ["portable.process.scaffoldai.js", "src/scaffoldai/commands/portable.process.scaffoldai.js"],
    ["state-integrity-check.check.scaffoldai.js", "src/scaffoldai/commands/state-integrity-check.check.scaffoldai.js"],
  ];

  for (const [fileName, relativePath] of requiredCommands) {
    if (existsFromRoot(rootPath, relativePath)) {
      signals.push(`${fileName.replace(/\.js$/, "")} command present`);
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

function runProcessCheckCommand() {
  const result = evaluateProcessCheck(process.cwd());
  printResult(result);
}

module.exports = {
  evaluateProcessCheck,
  runProcessCheckCommand,
};
