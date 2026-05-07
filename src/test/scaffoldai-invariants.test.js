const assert = require("assert");
const fs = require("fs");
const path = require("path");

const TEST_NAME = "scaffoldai-invariants";
const repoRoot = path.resolve(__dirname, "..", "..");

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack || error.message);
  process.exit(1);
}

// -----------------------------------------------------------------------
// A. Forbidden active references
//    Scan active source files for stale .consync/ repo-root paths.
//    Excludes: historical diff logs, process harness docs, archive.
// -----------------------------------------------------------------------

const FORBIDDEN_PATTERNS = [
  ".consync/docs",
  ".consync/state",
  ".consync/streams",
  ".consync/packets",
];

// Directory names that are entirely skipped during the scan.
const SCAN_SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "repo-archive",
  ".consync",
  ".scaffoldai",
]);

// Individual files that are explicitly historical records or self-referential — skip them.
const SCAN_SKIP_FILES = new Set([
  path.join(repoRoot, "refactor-changes.txt"),
  // This file contains the forbidden strings as string literals for comparison purposes.
  path.join(repoRoot, "src", "test", "scaffoldai-invariants.test.js"),
]);

function collectActiveFiles(dir, files = []) {
  let entries;

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    if (SCAN_SKIP_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      collectActiveFiles(fullPath, files);
    } else if (entry.isFile() && !SCAN_SKIP_FILES.has(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkForbiddenReferences() {
  const activeFiles = collectActiveFiles(repoRoot);
  const violations = [];

  for (const filePath of activeFiles) {
    let content;

    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      continue; // skip unreadable / binary files
    }

    const relPath = path.relative(repoRoot, filePath);

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (content.includes(pattern)) {
        violations.push(`  ${relPath}: contains "${pattern}"`);
      }
    }
  }

  assert.ok(
    violations.length === 0,
    `Forbidden active .consync/ references found in live files:\n${violations.join("\n")}`
  );

  console.log("  PASS: no forbidden .consync/ references in active source files");
}

// -----------------------------------------------------------------------
// B. README link integrity
//    Check that local markdown links in active README files resolve to
//    existing paths.
// -----------------------------------------------------------------------

const ACTIVE_READMES = [
  "README.md",
  "src/README.md",
  "src/lib/README.md",
  "src/commands/README.md",
  "src/test/README.md",
  "src/electron/README.md",
  "sandbox/README.md",
  "scripts/README.md",
  ".github/README.md",
  ".scaffoldai/README.md",
];

const LINK_PATTERN = /\[([^\]]*)\]\(([^)]+)\)/g;

function extractLocalLinks(content) {
  const links = [];
  let match;
  const re = new RegExp(LINK_PATTERN.source, "g");

  while ((match = re.exec(content)) !== null) {
    const href = match[2].trim();

    // Skip external URLs and pure anchor links.
    if (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("#")
    ) {
      continue;
    }

    // Strip fragment before checking existence.
    const hrefWithoutFragment = href.split("#")[0];

    if (hrefWithoutFragment) {
      links.push(hrefWithoutFragment);
    }
  }

  return links;
}

function checkReadmeLinkIntegrity() {
  const broken = [];

  for (const relReadmePath of ACTIVE_READMES) {
    const readmePath = path.join(repoRoot, relReadmePath);

    if (!fs.existsSync(readmePath)) {
      broken.push(`  ${relReadmePath}: README file does not exist`);
      continue;
    }

    const content = fs.readFileSync(readmePath, "utf8");
    const readmeDir = path.dirname(readmePath);
    const localLinks = extractLocalLinks(content);

    for (const link of localLinks) {
      const resolvedPath = path.resolve(readmeDir, link);

      if (!fs.existsSync(resolvedPath)) {
        broken.push(`  ${relReadmePath}: broken link → ${link}`);
      }
    }
  }

  assert.ok(
    broken.length === 0,
    `README link integrity failures:\n${broken.join("\n")}`
  );

  console.log("  PASS: all active README local links resolve to existing files");
}

// -----------------------------------------------------------------------
// C. Verify surface invariants
//    Inspect package.json scripts — do not execute e2e during this check.
// -----------------------------------------------------------------------

function checkVerifySurfaceInvariants() {
  const pkgPath = path.join(repoRoot, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const scripts = pkg.scripts || {};

  assert.ok(
    typeof scripts["verify:consync"] === "string",
    "Expected package.json to have a 'verify:consync' script"
  );
  assert.ok(
    !scripts["verify:consync"].includes("test:e2e") &&
      !scripts["verify:consync"].includes("playwright"),
    `'verify:consync' must not include e2e tests directly. Got: ${scripts["verify:consync"]}`
  );
  console.log("  PASS: verify:consync exists and does not include e2e tests");

  assert.ok(
    typeof scripts["verify:consync:e2e"] === "string",
    "Expected package.json to have a 'verify:consync:e2e' script"
  );
  console.log("  PASS: verify:consync:e2e exists");

  assert.ok(
    typeof scripts["verify:consync:full"] === "string",
    "Expected package.json to have a 'verify:consync:full' script"
  );
  console.log("  PASS: verify:consync:full exists");

  assert.ok(
    typeof scripts["verify:full"] === "string",
    "Expected package.json to have a 'verify:full' script"
  );
  console.log("  PASS: verify:full exists");
}

// -----------------------------------------------------------------------
// D. Active architecture invariants
//    Assert repo-level structural rules.
// -----------------------------------------------------------------------

function checkArchitectureInvariants() {
  assert.ok(
    fs.existsSync(path.join(repoRoot, ".scaffoldai")),
    "Expected .scaffoldai/ to exist at repo root"
  );
  console.log("  PASS: .scaffoldai/ exists at repo root");

  assert.ok(
    !fs.existsSync(path.join(repoRoot, ".consync")),
    "Expected .consync/ NOT to exist at repo root — reserved for future workspace-local use only"
  );
  console.log("  PASS: .consync/ does not exist at repo root");

  const githubReadmePath = path.join(repoRoot, ".github", "README.md");
  assert.ok(fs.existsSync(githubReadmePath), "Expected .github/README.md to exist");

  const githubReadme = fs.readFileSync(githubReadmePath, "utf8").toLowerCase();
  assert.ok(
    githubReadme.includes("adapter"),
    "Expected .github/README.md to describe .github/ as an adapter layer, not a canonical source"
  );
  console.log("  PASS: .github/README.md describes .github/ as an adapter layer");
}

// -----------------------------------------------------------------------
// E. intakeClassify docs routing (v2)
//    Assert TARGET_SURFACES.docs is correctly routed away from .consync/docs
//    and toward active documentation surfaces.
// -----------------------------------------------------------------------

function checkIntakeClassifyDocsRouting() {
  const classifyPath = path.join(repoRoot, "src", "lib", "intakeClassify.js");
  assert.ok(fs.existsSync(classifyPath), "Expected src/lib/intakeClassify.js to exist");

  const { classifyInput } = require(classifyPath);

  // Trigger the docs classification by using a known docs keyword.
  const result = classifyInput("write a readme document");

  assert.strictEqual(result.classification, "docs", "Expected 'document' prompt to classify as docs");

  const surfaces = result.targetSurfaces;

  assert.ok(
    !surfaces.some((s) => s.includes(".consync/docs")),
    `TARGET_SURFACES.docs must not include '.consync/docs'. Got: ${JSON.stringify(surfaces)}`
  );
  console.log("  PASS: TARGET_SURFACES.docs does not include .consync/docs");

  assert.ok(
    surfaces.includes("README.md"),
    `TARGET_SURFACES.docs must include 'README.md'. Got: ${JSON.stringify(surfaces)}`
  );
  console.log("  PASS: TARGET_SURFACES.docs includes README.md");

  assert.ok(
    surfaces.includes(".scaffoldai/process/"),
    `TARGET_SURFACES.docs must include '.scaffoldai/process/'. Got: ${JSON.stringify(surfaces)}`
  );
  console.log("  PASS: TARGET_SURFACES.docs includes .scaffoldai/process/");

  assert.ok(
    surfaces.includes(".scaffoldai/examples/"),
    `TARGET_SURFACES.docs must include '.scaffoldai/examples/'. Got: ${JSON.stringify(surfaces)}`
  );
  console.log("  PASS: TARGET_SURFACES.docs includes .scaffoldai/examples/");
}

// -----------------------------------------------------------------------
// F. reference-audit path targets (v2)
//    Assert all REFERENCE_CATEGORIES in reference-audit.js use .scaffoldai/
//    needles, not stale .consync/ targets.
// -----------------------------------------------------------------------

function checkReferenceAuditPathTargets() {
  const auditPath = path.join(repoRoot, "src", "commands", "reference-audit.js");
  assert.ok(fs.existsSync(auditPath), "Expected src/commands/reference-audit.js to exist");

  const content = fs.readFileSync(auditPath, "utf8");

  const stalePatterns = [".consync/state", ".consync/streams", ".consync/docs", ".consync/packets"];

  for (const stale of stalePatterns) {
    assert.ok(
      !content.includes(stale),
      `reference-audit.js must not reference stale path '${stale}'`
    );
  }
  console.log("  PASS: reference-audit.js contains no stale .consync/ path targets");

  // Assert it does reference .scaffoldai/ paths as expected.
  assert.ok(
    content.includes(".scaffoldai/state/"),
    "Expected reference-audit.js to reference .scaffoldai/state/ as a tracked zone"
  );
  assert.ok(
    content.includes(".scaffoldai/process/"),
    "Expected reference-audit.js to reference .scaffoldai/process/ as a tracked zone"
  );
  console.log("  PASS: reference-audit.js references .scaffoldai/ zones correctly");
}

// -----------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------

function main() {
  console.log(`[${TEST_NAME}] Running`);

  try {
    checkForbiddenReferences();
    checkReadmeLinkIntegrity();
    checkVerifySurfaceInvariants();
    checkArchitectureInvariants();
    checkIntakeClassifyDocsRouting();
    checkReferenceAuditPathTargets();
    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  }
}

main();
