const fs = require("fs");
const path = require("path");
const { SANDBOX_CURRENT_DIR } = require("../lib/fs");

function runListGuidCommand() {
  const artifactDir = path.join(process.cwd(), SANDBOX_CURRENT_DIR);

  if (!fs.existsSync(artifactDir)) {
    console.log("No artifacts found");
    return;
  }

  const fileNames = fs
    .readdirSync(artifactDir)
    .filter(fileName => fileName.endsWith(".json"));

  if (fileNames.length === 0) {
    console.log("No artifacts found");
    return;
  }

  for (const fileName of fileNames) {
    const filePath = path.join(artifactDir, fileName);

    try {
      const artifact = JSON.parse(fs.readFileSync(filePath, "utf8"));
      console.log(`${artifact.guid || ""}  ${artifact.created_at || ""}  ${artifact.note || ""}`.trimEnd());
    } catch {
      // Skip invalid JSON files.
    }
  }
}

module.exports = {
  runListGuidCommand,
};