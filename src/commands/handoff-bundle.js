const fs = require("fs");
const path = require("path");

const LEAN_FILES = [
  path.join(".consync", "state", "handoff.md"),
  path.join(".consync", "state", "snapshot.md"),
];

const RUNBOOK_PATH = path.join(".consync", "docs", "runbook.md");
const RUNBOOK_POINTER = `For operating rules, read ${RUNBOOK_PATH} in the repo.`;

function readRequiredFile(relativePath) {
  const absolutePath = path.join(process.cwd(), relativePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`Missing required file: ${relativePath}`);
    process.exitCode = 1;
    return null;
  }

  return {
    relativePath,
    text: fs.readFileSync(absolutePath, "utf8"),
  };
}

function printFileSection(relativePath, text) {
  console.log(`===== BEGIN ${relativePath} =====`);
  process.stdout.write(text);

  if (!text.endsWith("\n")) {
    process.stdout.write("\n");
  }

  console.log(`===== END ${relativePath} =====`);
  console.log("");
}

function runHandoffBundleCommand(options = {}) {
  const full = Boolean(options.full);
  const contents = [];

  for (const relativePath of LEAN_FILES) {
    const file = readRequiredFile(relativePath);

    if (!file) {
      return;
    }

    contents.push(file);
  }

  if (full) {
    const runbook = readRequiredFile(RUNBOOK_PATH);

    if (!runbook) {
      return;
    }

    contents.push(runbook);
  }

  console.log("CONSYNC HANDOFF BUNDLE");
  console.log("");
  console.log("SOURCE OF TRUTH");
  console.log("Local repo files under .consync/ remain canonical.");
  console.log("This bundle is a transport artifact for re-entry.");
  console.log("");

  for (const { relativePath, text } of contents) {
    printFileSection(relativePath, text);
  }

  if (!full) {
    console.log("RUNBOOK POINTER");
    console.log(RUNBOOK_POINTER);
    console.log("");
  }
}

module.exports = {
  LEAN_FILES,
  RUNBOOK_PATH,
  RUNBOOK_POINTER,
  runHandoffBundleCommand,
};
