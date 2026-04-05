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

function collectFilePaths(rootPath, currentPath, results) {
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      collectFilePaths(rootPath, entryPath, results);
      continue;
    }

    if (entry.isFile()) {
      results.push(path.relative(rootPath, entryPath));
    }
  }
}

function buildSandboxScanOutput(targetPath) {
  const absolutePath = path.resolve(process.cwd(), targetPath);

  if (!fs.existsSync(absolutePath)) {
    return {
      ok: false,
      output: "Path not found",
    };
  }

  const fileNames = [];
  collectFilePaths(absolutePath, absolutePath, fileNames);
  fileNames.sort(compareText);

  const typeCounts = {};

  for (const fileName of fileNames) {
    const extension = path.extname(fileName).slice(1).toLowerCase() || "noext";
    typeCounts[extension] = (typeCounts[extension] || 0) + 1;
  }

  const lines = [];
  lines.push(`total files: ${fileNames.length}`);
  lines.push("");
  lines.push("types:");

  for (const extension of Object.keys(typeCounts).sort(compareText)) {
    lines.push(`- ${extension}: ${typeCounts[extension]}`);
  }

  lines.push("");
  lines.push("files:");

  for (const fileName of fileNames) {
    lines.push(`- ${fileName}`);
  }

  return {
    ok: true,
    output: lines.join("\n"),
  };
}

function runSandboxScanCommand(targetPath) {
  if (!targetPath) {
    console.log("Path is required");
    process.exitCode = 1;
    return;
  }

  const result = buildSandboxScanOutput(targetPath);

  if (!result.ok) {
    console.log(result.output);
    process.exitCode = 1;
    return;
  }

  console.log(result.output);
}

module.exports = {
  buildSandboxScanOutput,
  runSandboxScanCommand,
};