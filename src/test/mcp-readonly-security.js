"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const TEST_NAME = "mcp-readonly-security";
const repoRoot = path.resolve(__dirname, "..", "..");
const sourceRoot = path.join(repoRoot, "src", "mcp-readonly");

function collectFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

function assertNoMatch(source, pattern, label, filePath) {
  assert.ok(!pattern.test(source), `${path.relative(repoRoot, filePath)} must not contain ${label}`);
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  const files = collectFiles(sourceRoot);
  assert.ok(files.length > 0, "Expected src/mcp-readonly JavaScript files");

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, "utf8");

    assertNoMatch(source, /require\(["']fs["']\)/, "fs import", filePath);
    assertNoMatch(source, /require\(["']node:fs["']\)/, "node:fs import", filePath);
    assertNoMatch(source, /require\(["']child_process["']\)/, "child_process import", filePath);
    assertNoMatch(source, /\bspawn\s*\(/, "spawn call", filePath);
    assertNoMatch(source, /\bexec\s*\(/, "exec call", filePath);
    assertNoMatch(source, /\bgit\s+(status|diff|add|commit|push|checkout|branch)\b/, "git command", filePath);
    assertNoMatch(source, /\.scaffoldai\//, "direct ScaffoldAI path", filePath);
    assertNoMatch(source, /\bwriteFile(?:Sync)?\s*\(/, "writeFile call", filePath);
    assertNoMatch(source, /\bappendFile(?:Sync)?\s*\(/, "appendFile call", filePath);
    assertNoMatch(source, /\bmkdirSync\s*\(/, "mkdirSync call", filePath);
    assertNoMatch(source, /require\(["']\.\.\/mcp\//, "existing MCP module import", filePath);
  }

  console.log(`  PASS: ${files.length} MCP read-only source files passed static boundary checks`);
  console.log(`[${TEST_NAME}] PASS`);
}

try {
  main();
} catch (error) {
  console.error(`[${TEST_NAME}] FAIL: ${error.message}`);
  process.exitCode = 1;
}
