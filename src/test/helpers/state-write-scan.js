"use strict";

const fs = require("node:fs");
const path = require("node:path");

// Invariant H (indirect writes): a source file that references a
// .scaffoldai/state location and also calls a filesystem mutation is treated as
// writing state directly, even when the target path is built from variables.

const STATE_LOCATION_PATTERNS = [
  /\.scaffoldai[\/\\]state/,
  /["']\.scaffoldai["']\s*,\s*["']state["']/,
  /["'](next-action\.md|active-runtime\.json|snapshot\.md|handoff\.md|accepted-task\.json|active-stream\.md|history\.jsonl|verify-evidence\.json|active-contract\.json)["']/,
];
const FS_MUTATION_PATTERN = /\b(writeFileSync|writeFile|appendFileSync|appendFile|renameSync|rmSync|unlinkSync|copyFileSync|truncateSync)\s*\(/;

function findIndirectStateWriteViolations({ repoRoot, srcDirs, isExempt = () => false, exemptions = new Map() }) {
  const violations = [];
  for (const srcDir of srcDirs) {
    const dirPath = path.join(repoRoot, srcDir);
    if (!fs.existsSync(dirPath)) continue;
    for (const fileName of fs.readdirSync(dirPath).filter((f) => f.endsWith(".js"))) {
      const filePath = path.join(dirPath, fileName);
      const relPath = path.relative(repoRoot, filePath).split(path.sep).join("/");
      if (isExempt(filePath) || exemptions.has(relPath)) continue;
      const content = fs.readFileSync(filePath, "utf8");
      if (STATE_LOCATION_PATTERNS.some((pattern) => pattern.test(content)) && FS_MUTATION_PATTERN.test(content)) {
        violations.push(relPath);
      }
    }
  }
  return violations;
}

module.exports = { findIndirectStateWriteViolations };
