const fs = require("fs");
const path = require("path");

function isRepoRoot(candidateDir) {
  const packagePath = path.join(candidateDir, "package.json");
  const scaffoldaiPath = path.join(candidateDir, ".scaffoldai");

  if (!fs.existsSync(packagePath) || !fs.existsSync(scaffoldaiPath)) {
    return false;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    return pkg.name === "consync-core";
  } catch {
    return false;
  }
}

function normalizeStartDir(startDir) {
  const resolved = path.resolve(startDir || __dirname);

  try {
    return fs.statSync(resolved).isFile() ? path.dirname(resolved) : resolved;
  } catch {
    return resolved;
  }
}

function getRepoRoot(startDir = __dirname) {
  let currentDir = normalizeStartDir(startDir);

  while (true) {
    if (isRepoRoot(currentDir)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error(`Could not find repository root from ${startDir}`);
    }

    currentDir = parentDir;
  }
}

function resolveFromRepoRoot(...parts) {
  return path.join(getRepoRoot(__dirname), ...parts);
}

function resolveScaffoldAIPath(...parts) {
  return resolveFromRepoRoot(".scaffoldai", ...parts);
}

module.exports = {
  getRepoRoot,
  resolveFromRepoRoot,
  resolveScaffoldAIPath,
};
