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

function walkDirectory(absolutePath, results) {
  const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
  const sorted = [...entries].sort((a, b) => compareText(a.name, b.name));

  for (const entry of sorted) {
    const entryPath = path.join(absolutePath, entry.name);

    if (entry.isDirectory()) {
      results.folders.push(entryPath);
      walkDirectory(entryPath, results);
      continue;
    }

    if (entry.isFile()) {
      results.files.push(entryPath);
    }
  }
}

function summarizeFolder(targetPath) {
  const absolutePath = path.resolve(process.cwd(), targetPath);

  if (!fs.existsSync(absolutePath)) {
    return { ok: false, error: `Path not found: ${targetPath}` };
  }

  const stat = fs.statSync(absolutePath);

  if (!stat.isDirectory()) {
    return { ok: false, error: `Not a directory: ${targetPath}` };
  }

  const results = { files: [], folders: [] };
  walkDirectory(absolutePath, results);

  const extensions = {};
  let totalBytes = 0;

  for (const filePath of results.files) {
    const ext = path.extname(filePath).toLowerCase();
    const label = ext || "[no extension]";
    extensions[label] = (extensions[label] || 0) + 1;

    const fileStat = fs.statSync(filePath);
    totalBytes += fileStat.size;
  }

  return {
    ok: true,
    absolutePath,
    fileCount: results.files.length,
    folderCount: results.folders.length,
    extensions,
    totalBytes,
  };
}

module.exports = { summarizeFolder };
