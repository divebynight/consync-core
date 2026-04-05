const fs = require("fs");
const path = require("path");

function compareText(left, right) {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function runSandboxScanCommand(targetPath) {
  if (!targetPath) {
    console.log("Path is required");
    process.exitCode = 1;
    return;
  }

  const absolutePath = path.resolve(process.cwd(), targetPath);

  if (!fs.existsSync(absolutePath)) {
    console.log("Path not found");
    process.exitCode = 1;
    return;
  }

  const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
  const fileNames = entries
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .sort(compareText);

  const typeCounts = {};

  for (const fileName of fileNames) {
    const extension = path.extname(fileName).slice(1).toLowerCase() || "noext";
    typeCounts[extension] = (typeCounts[extension] || 0) + 1;
  }

  console.log(`total files: ${fileNames.length}`);
  console.log("");
  console.log("types:");

  for (const extension of Object.keys(typeCounts).sort(compareText)) {
    console.log(`- ${extension}: ${typeCounts[extension]}`);
  }

  console.log("");
  console.log("files:");

  for (const fileName of fileNames) {
    console.log(`- ${fileName}`);
  }
}

module.exports = {
  runSandboxScanCommand,
};