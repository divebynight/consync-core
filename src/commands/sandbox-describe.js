const path = require("path");
const { buildSandboxScanSummary, compareText } = require("./sandbox-scan");

function categoryForExtension(extension) {
  if (["png", "jpg", "jpeg"].includes(extension)) {
    return "image";
  }

  if (["wav", "mp3"].includes(extension)) {
    return "audio";
  }

  if (["blend", "psd"].includes(extension)) {
    return "design";
  }

  if (["txt", "md"].includes(extension)) {
    return "text";
  }

  return "unknown";
}

function hasNonStandardPattern(fileName) {
  const baseName = path.basename(fileName);

  if (baseName.includes("__") || baseName.includes("!!")) {
    return true;
  }

  const lettersOnly = baseName.replace(/[^A-Za-z]/g, "");

  if (lettersOnly.length < 4) {
    return false;
  }

  const uppercaseCount = lettersOnly.split("").filter(character => character >= "A" && character <= "Z").length;
  return uppercaseCount >= 4;
}

function runSandboxDescribeCommand(targetPath) {
  if (!targetPath) {
    console.log("Path is required");
    process.exitCode = 1;
    return;
  }

  const summary = buildSandboxScanSummary(targetPath);

  if (!summary.ok) {
    console.log(summary.output);
    process.exitCode = 1;
    return;
  }

  const categoryCounts = {};

  for (const fileName of summary.fileNames) {
    const extension = path.extname(fileName).slice(1).toLowerCase() || "noext";
    const category = categoryForExtension(extension);
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  }

  const notes = [];

  if (Object.keys(categoryCounts).length > 1) {
    notes.push("mixed media directory");
  }

  if (summary.fileNames.some(hasNonStandardPattern)) {
    notes.push("contains non-standard filename patterns");
  }

  console.log(`PATH: ${targetPath}`);
  console.log(`TOTAL FILES: ${summary.fileNames.length}`);
  console.log("FILE TYPES:");

  for (const category of Object.keys(categoryCounts).sort(compareText)) {
    console.log(`- ${category}: ${categoryCounts[category]}`);
  }

  console.log("NOTES:");

  if (notes.length === 0) {
    console.log("- none");
    return;
  }

  for (const note of notes) {
    console.log(`- ${note}`);
  }
}

module.exports = {
  runSandboxDescribeCommand,
};