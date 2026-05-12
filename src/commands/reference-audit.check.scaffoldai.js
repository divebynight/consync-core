const fs = require("fs");
const path = require("path");

const REFERENCE_CATEGORIES = [
  {
    name: "process",
    needle: ".scaffoldai/process/",
    expectedZones: [".scaffoldai/", ".github/", "AGENTS.md"],
  },
  {
    name: "agents",
    needle: ".scaffoldai/agents/",
    expectedZones: [".scaffoldai/", ".github/", "AGENTS.md"],
  },
  {
    name: "skills",
    needle: ".scaffoldai/skills/",
    expectedZones: [".scaffoldai/", ".github/", "AGENTS.md"],
  },
  {
    name: "templates",
    needle: ".scaffoldai/templates/",
    expectedZones: [".scaffoldai/", "src/lib/portableScaffold.js"],
  },
  {
    name: "contracts",
    needle: ".scaffoldai/contracts/",
    expectedZones: [".scaffoldai/", ".github/", "AGENTS.md"],
  },
  {
    name: "state",
    needle: ".scaffoldai/state/",
    expectedZones: [".scaffoldai/", ".github/", "AGENTS.md", "scripts/", "src/commands/", "src/lib/", "src/test/"],
  },
  {
    name: "streams",
    needle: ".scaffoldai/streams/",
    expectedZones: [".scaffoldai/", ".github/", "AGENTS.md", "src/lib/", "src/test/"],
  },
];

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "out",
  "test-results",
  ".vite",
  "dist",
  "coverage",
]);

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".txt",
  ".yml",
  ".yaml",
]);

function runReferenceAuditCommand() {
  const rootPath = process.cwd();
  const results = new Map(REFERENCE_CATEGORIES.map((category) => [category.name, []]));

  for (const filePath of listTextFiles(rootPath)) {
    const relativePath = normalizePath(path.relative(rootPath, filePath));

    if (relativePath === "src/commands/reference-audit.check.scaffoldai.js") {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");

    for (const category of REFERENCE_CATEGORIES) {
      const referenceCount = countOccurrences(content, category.needle);

      if (referenceCount > 0) {
        results.get(category.name).push({
          path: relativePath,
          referenceCount,
          outsideExpectedZone: !isInExpectedZone(relativePath, category.expectedZones),
        });
      }
    }
  }

  printResults(results);
}

function listTextFiles(rootPath) {
  const files = [];

  walk(rootPath, files);

  return files.sort((left, right) => normalizePath(left).localeCompare(normalizePath(right)));
}

function walk(currentPath, files) {
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        walk(entryPath, files);
      }
      continue;
    }

    if (entry.isFile() && isTextFile(entry.name)) {
      files.push(entryPath);
    }
  }
}

function isTextFile(fileName) {
  return TEXT_EXTENSIONS.has(path.extname(fileName));
}

function countOccurrences(content, needle) {
  let count = 0;
  let index = content.indexOf(needle);

  while (index !== -1) {
    count += 1;
    index = content.indexOf(needle, index + needle.length);
  }

  return count;
}

function isInExpectedZone(relativePath, expectedZones) {
  return expectedZones.some((zone) => relativePath === zone || relativePath.startsWith(zone));
}

function printResults(results) {
  console.log("REFERENCE AUDIT");
  console.log("");

  for (const category of REFERENCE_CATEGORIES) {
    const matches = results.get(category.name);
    const totalReferences = matches.reduce((sum, match) => sum + match.referenceCount, 0);
    const outsideExpectedZone = matches.filter((match) => match.outsideExpectedZone);

    console.log(`${category.name}:`);
    console.log(`references: ${totalReferences}`);
    console.log(`files: ${matches.length}`);
    console.log(`outside_expected_zones: ${outsideExpectedZone.length}`);

    if (matches.length === 0) {
      console.log("- file: NONE");
    } else {
      for (const match of matches) {
        const outsideMarker = match.outsideExpectedZone ? " outside_expected_zone: yes" : "";
        console.log(`- file: ${match.path} references: ${match.referenceCount}${outsideMarker}`);
      }
    }

    console.log("");
  }
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

module.exports = {
  runReferenceAuditCommand,
};
