const { summarizeFolder } = require("../lib/folder-summary");

function runFolderSummaryCommand(targetPath) {
  if (!targetPath) {
    console.error("Usage: folder-summary <path>");
    process.exitCode = 1;
    return;
  }

  const summary = summarizeFolder(targetPath);

  if (!summary.ok) {
    console.error(summary.error);
    process.exitCode = 1;
    return;
  }

  const lines = [];
  lines.push(`path:    ${summary.absolutePath}`);
  lines.push(`files:   ${summary.fileCount}`);
  lines.push(`folders: ${summary.folderCount}`);
  lines.push(`size:    ${summary.totalBytes} bytes`);
  lines.push("");
  lines.push("extensions:");

  const sortedExtensions = Object.keys(summary.extensions).sort();

  for (const ext of sortedExtensions) {
    lines.push(`  ${ext}: ${summary.extensions[ext]}`);
  }

  console.log(lines.join("\n"));
}

module.exports = { runFolderSummaryCommand };
