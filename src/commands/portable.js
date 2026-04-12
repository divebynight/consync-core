const fs = require("fs");
const path = require("path");
const { scaffoldPortableTemplate } = require("../lib/portableScaffold");

function printList(label, filePaths) {
  console.log(label);

  if (filePaths.length === 0) {
    console.log("- none");
    return;
  }

  for (const filePath of filePaths) {
    console.log(`- ${filePath}`);
  }
}

function runPortableCommand(options = {}) {
  if (!options.targetPath) {
    throw new Error("Missing required --target <path>");
  }

  const targetPath = path.resolve(options.targetPath);

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Target directory does not exist: ${targetPath}`);
  }

  if (!fs.statSync(targetPath).isDirectory()) {
    throw new Error(`Target path is not a directory: ${targetPath}`);
  }

  const result = scaffoldPortableTemplate(targetPath, {
    force: Boolean(options.force),
  });

  console.log(`Target: ${result.targetPath}`);
  printList("Created:", result.created);
  printList("Skipped:", result.skipped);
  printList("Overwritten:", result.overwritten);
}

module.exports = {
  runPortableCommand,
};