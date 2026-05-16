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
//    Hard invariant checks enforce active truth only.
//
//    Soft drift checks may scan broader docs, produce warnings, and tolerate
//    history, migration evidence, quoted invalid examples, and negative
//    examples. This hard check is narrower: it scans only active authoritative
//    repo surfaces and fails only when stale process-state paths appear there.
//
//    Do not scan transient/output artifacts such as copied terminal output,
//    clipboard dumps, pbcopy captures, generated logs, or historical archives.
// -----------------------------------------------------------------------

const FORBIDDEN_PATTERNS = [
  ".consync/state",
  ".consync/streams",
  ".consync/packets",
];

const ACTIVE_AUTHORITY_ROOTS = [
  "package.json",
  "README.md",
  "Makefile",
  "scripts",
  "src",
  ".github",
];

// Directory names that are entirely skipped within active authority roots.
const SCAN_SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "repo-archive",
  ".consync",
  ".scaffoldai",
  ".vite",
  ".vscode",
  "out",
  "test-results",
]);

// Individual files that are explicitly historical records or self-referential — skip them.
const SCAN_SKIP_FILES = new Set([
  // This file contains the forbidden strings as string literals for comparison purposes.
  path.join(repoRoot, "src", "test", "scaffoldai-invariants.test.js"),
  // This file checks for migrated ScaffoldAI directories as part of status/preflight warnings
  path.join(repoRoot, "src", "lib", "scaffoldaiStatus.query.scaffoldai.js"),
]);

function collectActiveFiles(target, files = []) {
  const absoluteTarget = path.join(repoRoot, target);

  if (!fs.existsSync(absoluteTarget)) {
    return files;
  }

  const stat = fs.statSync(absoluteTarget);

  if (stat.isFile()) {
    if (!SCAN_SKIP_FILES.has(absoluteTarget)) {
      files.push(absoluteTarget);
    }
    return files;
  }

  collectActiveFilesInDirectory(absoluteTarget, files);
  return files;
}

function collectActiveFilesInDirectory(dir, files) {
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
      collectActiveFilesInDirectory(fullPath, files);
    } else if (entry.isFile() && !SCAN_SKIP_FILES.has(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function isScaffoldaiProcessSurface(filePath) {
  const relPath = path.relative(repoRoot, filePath).split(path.sep).join("/");

  return (
    relPath.startsWith("src/scaffoldai/mcp/") ||
    relPath.startsWith("src/scaffoldai/mcp-readonly/") ||
    relPath.startsWith("scripts/") ||
    relPath === "package.json" ||
    relPath === "Makefile" ||
    relPath === "AGENTS.md" ||
    relPath === "README.md" ||
    relPath === "src/cli/index.js" ||
    relPath === "src/test/scaffoldai-invariants.test.js" ||
    /^src\/scaffoldai\/commands\/.*\.scaffoldai\.js$/.test(relPath) ||
    /^src\/lib\/.*\.scaffoldai\.js$/.test(relPath)
  );
}

function checkForbiddenReferences() {
  const activeFiles = ACTIVE_AUTHORITY_ROOTS.flatMap((target) => collectActiveFiles(target));
  const violations = [];
  const constructedPathPatterns = [
    /path\s*\.\s*join\s*\(\s*["']\.consync["']\s*,\s*["']state["']/,
    /path\s*\.\s*join\s*\(\s*["']\.consync["']\s*,\s*["']streams["']/,
    /path\s*\.\s*join\s*\(\s*["']\.consync["']\s*,\s*["']packets["']/,
  ];

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

    if (isScaffoldaiProcessSurface(filePath)) {
      for (const pattern of constructedPathPatterns) {
        if (pattern.test(content)) {
          violations.push(`  ${relPath}: contains constructed legacy ScaffoldAI process path matching ${pattern}`);
        }
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
  ".github/OVERVIEW.md",
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

  // .consync/ may exist for Consync product observational artifacts (e.g., history/)
  // but .consync/state/, .consync/streams/, .consync/packets/ must NOT be reintroduced
  const consyncStateDir = path.join(repoRoot, ".consync", "state");
  const consyncStreamsDir = path.join(repoRoot, ".consync", "streams");
  const consyncPacketsDir = path.join(repoRoot, ".consync", "packets");
  
  assert.ok(
    !fs.existsSync(consyncStateDir),
    "Expected .consync/state/ NOT to exist — migrated to .scaffoldai/state/"
  );
  assert.ok(
    !fs.existsSync(consyncStreamsDir),
    "Expected .consync/streams/ NOT to exist — migrated to .scaffoldai/streams/"
  );
  assert.ok(
    !fs.existsSync(consyncPacketsDir),
    "Expected .consync/packets/ NOT to exist — migrated to .scaffoldai/packets/"
  );
  console.log("  PASS: .consync/ does not contain migrated ScaffoldAI state directories");

  const githubOverviewPath = path.join(repoRoot, ".github", "OVERVIEW.md");
  assert.ok(fs.existsSync(githubOverviewPath), "Expected .github/OVERVIEW.md to exist");

  const githubOverview = fs.readFileSync(githubOverviewPath, "utf8").toLowerCase();
  assert.ok(
    githubOverview.includes("adapter"),
    "Expected .github/OVERVIEW.md to describe .github/ as an adapter layer, not a canonical source"
  );
  console.log("  PASS: .github/OVERVIEW.md describes .github/ as an adapter layer");
}

// -----------------------------------------------------------------------
// E. intakeClassify docs routing (v2)
//    Assert TARGET_SURFACES.docs is correctly routed away from .consync/docs
//    and toward active documentation surfaces.
// -----------------------------------------------------------------------

function checkIntakeClassifyDocsRouting() {
  const classifyPath = path.join(repoRoot, "src", "lib", "intakeClassify.agent.scaffoldai.js");
  assert.ok(fs.existsSync(classifyPath), "Expected src/lib/intakeClassify.agent.scaffoldai.js to exist");

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
  const auditPath = path.join(repoRoot, "src", "scaffoldai", "commands", "reference-audit.check.scaffoldai.js");
  assert.ok(fs.existsSync(auditPath), "Expected src/scaffoldai/commands/reference-audit.check.scaffoldai.js to exist");

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
// G. ScaffoldAI authority boundary enforcement
//    After extracting ScaffoldAI business logic from CLI commands to
//    src/lib/*.scaffoldai.js, enforce that:
//      - MCP never imports from command surfaces
//      - src/lib/*.scaffoldai.js never imports from command surfaces
//      - CLI commands and MCP both import from src/lib/*.scaffoldai.js
//
//    Architectural layers:
//      Surface Layer:  src/commands/*, src/scaffoldai/commands/*, src/scaffoldai/mcp/*
//      Authority Layer: src/lib/*.scaffoldai.js
//      State Layer:     .scaffoldai/state/*
//
//    Allowed:
//      src/commands/*             → src/lib/*.scaffoldai.js
//      src/scaffoldai/commands/*  → src/lib/*.scaffoldai.js
//      src/scaffoldai/mcp/*       → src/lib/*.scaffoldai.js
//
//    Forbidden:
//      src/scaffoldai/mcp/*      → command surfaces
//      src/lib/*.scaffoldai.js   → command surfaces
// -----------------------------------------------------------------------

const REQUIRE_PATTERN = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function extractRequirePaths(content) {
  const paths = [];
  let match;
  const re = new RegExp(REQUIRE_PATTERN.source, "g");

  while ((match = re.exec(content)) !== null) {
    paths.push(match[1]);
  }

  return paths;
}

function checkScaffoldaiAuthorityBoundary() {
  const violations = [];

  // 1. Check MCP files do not import from command surfaces
  const mcpDir = path.join(repoRoot, "src", "scaffoldai", "mcp");
  const mcpFiles = fs.existsSync(mcpDir)
    ? fs.readdirSync(mcpDir).filter((f) => f.endsWith(".js")).map((f) => path.join(mcpDir, f))
    : [];

  for (const mcpFile of mcpFiles) {
    const content = fs.readFileSync(mcpFile, "utf8");
    const requires = extractRequirePaths(content);
    const relMcpFile = path.relative(repoRoot, mcpFile);

    for (const req of requires) {
      // Check if this is a relative import pointing to a command surface
      if (req.includes("../commands/") || req.includes("commands/")) {
        violations.push(
          `  ${relMcpFile}: imports from commands layer → require("${req}")`
        );
      }
    }
  }

  assert.ok(
    violations.length === 0,
    `MCP files must not import from command surfaces:\n${violations.join("\n")}`
  );
  console.log("  PASS: MCP files do not import from command surfaces");

  // 2. Check src/lib/*.scaffoldai.js files do not import from command surfaces
  const libDir = path.join(repoRoot, "src", "lib");
  const scaffoldaiLibFiles = fs.existsSync(libDir)
    ? fs
        .readdirSync(libDir)
        .filter((f) => f.endsWith(".scaffoldai.js"))
        .map((f) => path.join(libDir, f))
    : [];

  for (const libFile of scaffoldaiLibFiles) {
    const content = fs.readFileSync(libFile, "utf8");
    const requires = extractRequirePaths(content);
    const relLibFile = path.relative(repoRoot, libFile);

    for (const req of requires) {
      // Check if this is a relative import pointing to a command surface
      if (req.includes("../commands/") || req.includes("commands/")) {
        violations.push(
          `  ${relLibFile}: imports from commands layer → require("${req}")`
        );
      }
    }
  }

  assert.ok(
    violations.length === 0,
    `src/lib/*.scaffoldai.js files must not import from command surfaces:\n${violations.join("\n")}`
  );
  console.log("  PASS: src/lib/*.scaffoldai.js files do not import from command surfaces");

  // 3. Verify expected imports exist (MCP and CLI both import from lib)
  const mcpToolsPath = path.join(repoRoot, "src", "scaffoldai", "mcp", "tools.js");
  if (fs.existsSync(mcpToolsPath)) {
    const mcpContent = fs.readFileSync(mcpToolsPath, "utf8");
    const mcpRequires = extractRequirePaths(mcpContent);

    const hasLibImport = mcpRequires.some(
      (req) => req.includes("../lib/") && req.includes(".scaffoldai")
    );

    assert.ok(
      hasLibImport,
      "Expected src/scaffoldai/mcp/tools.js to import from src/lib/*.scaffoldai.js"
    );
    console.log("  PASS: MCP tools.js imports from src/lib/*.scaffoldai.js");
  }

  // Check a representative ScaffoldAI CLI command imports from lib
  const representativeCommands = [
    "scaffoldai-status.cmd.scaffoldai.js",
    "scaffoldai-preflight.cmd.scaffoldai.js",
    "scaffoldai-question.cmd.scaffoldai.js",
    "scaffoldai-closeout.cmd.scaffoldai.js",
  ];

  let cliLibImportFound = false;
  for (const cmd of representativeCommands) {
    const cmdPath = path.join(repoRoot, "src", "scaffoldai", "commands", cmd);
    if (fs.existsSync(cmdPath)) {
      const cmdContent = fs.readFileSync(cmdPath, "utf8");
      const cmdRequires = extractRequirePaths(cmdContent);

      if (cmdRequires.some((req) => req.includes("../../lib/") && req.includes(".scaffoldai"))) {
        cliLibImportFound = true;
        break;
      }
    }
  }

  assert.ok(
    cliLibImportFound,
    "Expected ScaffoldAI CLI commands to import from src/lib/*.scaffoldai.js"
  );
  console.log("  PASS: ScaffoldAI CLI commands import from src/lib/*.scaffoldai.js");
}

// -----------------------------------------------------------------------
// H. ScaffoldAI state write authority boundary
//    Enforce that all writes to .scaffoldai/state/* go through the approved
//    state authority module: src/lib/scaffoldaiState.state.scaffoldai.js
//
//    Write boundary rules:
//      - Only scaffoldaiState.state.scaffoldai.js may contain writeFileSync/writeFile
//        calls that write directly to .scaffoldai/state/*
//      - src/scaffoldai/mcp/* must not write to .scaffoldai/state/*
//      - src/commands/* must not write to .scaffoldai/state/*
//      - src/lib/gatekeeper*.js must use scaffoldaiState.* functions
//      - Test files are exempt (they legitimately write temp state)
//
//    Architecture:
//      CLI / MCP → gatekeeper / authority functions → scaffoldaiState → .scaffoldai/state/*
// -----------------------------------------------------------------------

function checkScaffoldaiStateWriteBoundary() {
  const violations = [];

  // Files exempt from state write boundary checks
  const exemptPatterns = [
    /src\/test\//,
    /src\/lib\/scaffoldaiState\.state\.scaffoldai\.js$/,
  ];

  function isExempt(filePath) {
    return exemptPatterns.some((pattern) => pattern.test(filePath));
  }

  // Scan all relevant source files
  const srcDirs = ["src/commands", "src/scaffoldai/commands", "src/scaffoldai/mcp", "src/lib"];

  for (const srcDir of srcDirs) {
    const dirPath = path.join(repoRoot, srcDir);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".js"))
      .map((f) => path.join(dirPath, f));

    for (const filePath of files) {
      if (isExempt(filePath)) continue;

      const content = fs.readFileSync(filePath, "utf8");
      const relPath = path.relative(repoRoot, filePath);

      // Check for direct writes to .scaffoldai/state/*
      // Pattern: writeFileSync or writeFile with ".scaffoldai/state/" or ".scaffoldai", "state"
      const stateWritePatterns = [
        /writeFileSync\s*\([^)]*\.scaffoldai[\/\\]state/,
        /writeFile\s*\([^)]*\.scaffoldai[\/\\]state/,
        /appendFileSync\s*\([^)]*\.scaffoldai[\/\\]state/,
        /appendFile\s*\([^)]*\.scaffoldai[\/\\]state/,
      ];

      for (const pattern of stateWritePatterns) {
        if (pattern.test(content)) {
          violations.push(
            `  ${relPath}: contains direct write to .scaffoldai/state/* (should use scaffoldaiState module)`
          );
          break;
        }
      }
    }
  }

  assert.ok(
    violations.length === 0,
    `All writes to .scaffoldai/state/* must go through src/lib/scaffoldaiState.state.scaffoldai.js:\n${violations.join("\n")}`
  );
  console.log("  PASS: All state writes go through scaffoldaiState authority module");

  // Verify scaffoldaiState.state.scaffoldai.js exists and exports expected functions
  const stateAuthPath = path.join(repoRoot, "src", "lib", "scaffoldaiState.state.scaffoldai.js");
  assert.ok(fs.existsSync(stateAuthPath), "scaffoldaiState.state.scaffoldai.js must exist");

  const stateAuthContent = fs.readFileSync(stateAuthPath, "utf8");
  const expectedExports = [
    "writeNextAction",
    "writeHandoff",
    "writeSnapshot",
    "writeActiveStream",
    "writeStreamDoc",
  ];

  for (const exportName of expectedExports) {
    assert.ok(
      stateAuthContent.includes(exportName),
      `scaffoldaiState.state.scaffoldai.js must export ${exportName}`
    );
  }
  console.log("  PASS: scaffoldaiState.state.scaffoldai.js exports all required functions");

  // Verify gatekeeper files use scaffoldaiState module
  const gatekeeperFiles = ["gatekeeperMount.auth.scaffoldai.js", "gatekeeperClose.auth.scaffoldai.js", "gatekeeperSwitch.auth.scaffoldai.js"];
  for (const gkFile of gatekeeperFiles) {
    const gkPath = path.join(repoRoot, "src", "lib", gkFile);
    if (!fs.existsSync(gkPath)) continue;

    const gkContent = fs.readFileSync(gkPath, "utf8");
    assert.ok(
      gkContent.includes("scaffoldaiState"),
      `${gkFile} must import scaffoldaiState module`
    );
  }
  console.log("  PASS: Gatekeeper files import scaffoldaiState module");
}

// -----------------------------------------------------------------------
// K. ScaffoldAI State Read Authority Boundary
//    Verify that all reads from .scaffoldai/state/* go through the
//    approved authority layer (src/lib/scaffoldaiState.state.scaffoldai.js).
//
//    Architecture:
//      CLI / MCP → authority functions → scaffoldaiState → .scaffoldai/state/*
// -----------------------------------------------------------------------

function checkScaffoldaiStateReadBoundary() {
  const violations = [];

  // Files exempt from state read boundary checks
  const exemptPatterns = [
    /src\/test\//,
    /src\/lib\/scaffoldaiState\.state\.scaffoldai\.js$/,
    /src\/lib\/stateIntegrityCheck\.check\.scaffoldai\.js$/,  // Diagnostic/integrity checking
    /src\/lib\/gatekeeperMount\.auth\.scaffoldai\.js$/,      // Already uses scaffoldaiState
  ];

  function isExempt(filePath) {
    return exemptPatterns.some((pattern) => pattern.test(filePath));
  }

  // Scan command and MCP surface files (these should not directly read state)
  const surfaceDirs = ["src/commands", "src/scaffoldai/commands", "src/scaffoldai/mcp"];

  for (const srcDir of surfaceDirs) {
    const dirPath = path.join(repoRoot, srcDir);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".js"))
      .map((f) => path.join(dirPath, f));

    for (const filePath of files) {
      if (isExempt(filePath)) continue;

      const content = fs.readFileSync(filePath, "utf8");
      const relPath = path.relative(repoRoot, filePath);

      // Check for direct reads from .scaffoldai/state/*
      // Pattern: readFileSync or readFile with ".scaffoldai/state/" or ".scaffoldai", "state"
      const stateReadPatterns = [
        /readFileSync\s*\([^)]*\.scaffoldai[\/\\]state/,
        /readFile\s*\([^)]*\.scaffoldai[\/\\]state/,
      ];

      for (const pattern of stateReadPatterns) {
        if (pattern.test(content)) {
          violations.push(
            `  ${relPath}: contains direct read from .scaffoldai/state/* (should use scaffoldaiState module)`
          );
          break;
        }
      }
    }
  }

  assert.ok(
    violations.length === 0,
    `All reads from .scaffoldai/state/* in command/MCP surface must go through src/lib/scaffoldaiState.state.scaffoldai.js:\n${violations.join("\n")}`
  );
  console.log("  PASS: Command and MCP surface reads go through scaffoldaiState authority module");

  // Verify scaffoldaiState.state.scaffoldai.js exports read functions
  const stateAuthPath = path.join(repoRoot, "src", "lib", "scaffoldaiState.state.scaffoldai.js");
  const stateAuthContent = fs.readFileSync(stateAuthPath, "utf8");
  const expectedReadExports = [
    "readNextAction",
    "readHandoff",
    "readSnapshot",
    "readActiveStream",
    "readActiveContract",
    "readStreamDoc",
  ];

  for (const exportName of expectedReadExports) {
    assert.ok(
      stateAuthContent.includes(exportName),
      `scaffoldaiState.state.scaffoldai.js must export ${exportName}`
    );
  }
  console.log("  PASS: scaffoldaiState.state.scaffoldai.js exports all required read functions");
}

// -----------------------------------------------------------------------
// L. Shared Utility Boundary
//    Verify that *.shared.js files remain neutral mechanics and do not
//    encode ScaffoldAI or Consync policy/state concepts.
//
//    Architecture:
//      *.scaffoldai.js ─┐
//                       ├──> *.shared.js (neutral mechanics only)
//      *.consync.js ────┘
//
//    *.shared.js must not import back into domain-specific modules.
// -----------------------------------------------------------------------

function checkSharedUtilityBoundary() {
  const violations = [];

  // Find all *.shared.js files
  const sharedFiles = fs
    .readdirSync(path.join(repoRoot, "src", "lib"))
    .filter((f) => f.endsWith(".shared.js"))
    .map((f) => path.join(repoRoot, "src", "lib", f));

  // Forbidden patterns in *.shared.js files
  const DOMAIN_IMPORT_PATTERNS = [
    /require\(["'].*\.scaffoldai\.js["']\)/,
    /require\(["'].*\.scaffoldai["']\)/,
    /require\(["'].*\.consync\.js["']\)/,
    /require\(["'].*\.consync["']\)/,
    /import\s+.*from\s+["'].*\.scaffoldai/,
    /import\s+.*from\s+["'].*\.consync/,
  ];

  const DOMAIN_PATH_PATTERNS = [
    /\.scaffoldai\/state/,
    /\.scaffoldai\/streams/,
    /\.scaffoldai\/packets/,
    /\.consync\/state/,
    /\.consync\/streams/,
    /\.consync\/packets/,
  ];

  const SCAFFOLDAI_STATE_FILE_PATTERNS = [
    /next-action\.md/,
    /handoff\.md/,
    /snapshot\.md/,
    /active-contract\.json/,
    /active-stream\.md/,
  ];

  const CONSYNC_PRODUCT_PATTERNS = [
    /\bsession\b.*\bmetadata\b/i,
    /\bbookmark\b.*\bmetadata\b/i,
    /\bannotation\b.*\bmetadata\b/i,
  ];

  for (const filePath of sharedFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const relPath = path.relative(repoRoot, filePath);

    // Check for domain-specific imports
    for (const pattern of DOMAIN_IMPORT_PATTERNS) {
      if (pattern.test(content)) {
        violations.push(
          `  ${relPath}: imports domain-specific module (*.scaffoldai.js or *.consync.js) - shared utilities must remain neutral`
        );
        break;
      }
    }

    // Check for domain-specific path references
    for (const pattern of DOMAIN_PATH_PATTERNS) {
      if (pattern.test(content)) {
        violations.push(
          `  ${relPath}: references .scaffoldai/ or .consync/ paths - shared utilities must not encode domain paths`
        );
        break;
      }
    }

    // Check for ScaffoldAI state file references
    for (const pattern of SCAFFOLDAI_STATE_FILE_PATTERNS) {
      if (pattern.test(content)) {
        violations.push(
          `  ${relPath}: references ScaffoldAI state file names - shared utilities must not encode ScaffoldAI state concepts`
        );
        break;
      }
    }

    // Check for Consync product concept patterns (more lenient - just warn in comments)
    for (const pattern of CONSYNC_PRODUCT_PATTERNS) {
      if (pattern.test(content)) {
        violations.push(
          `  ${relPath}: appears to encode Consync product concepts (session/bookmark/annotation metadata) - consider renaming to *.consync.js`
        );
        break;
      }
    }
  }

  assert.ok(
    violations.length === 0,
    `Shared utilities (*.shared.js) must remain neutral mechanics without domain-specific imports or policy:\n${violations.join("\n")}`
  );
  console.log("  PASS: All *.shared.js files remain neutral without domain contamination");

  // Verify dependency direction: domain files may import shared, not the reverse
  const domainFiles = [
    ...fs
      .readdirSync(path.join(repoRoot, "src", "lib"))
      .filter((f) => f.endsWith(".scaffoldai.js"))
      .map((f) => path.join(repoRoot, "src", "lib", f)),
    ...fs
      .readdirSync(path.join(repoRoot, "src", "lib"))
      .filter((f) => f.endsWith(".consync.js"))
      .map((f) => path.join(repoRoot, "src", "lib", f)),
  ];

  // This is allowed and expected - just verify files exist
  assert.ok(
    sharedFiles.length > 0,
    "Expected at least one *.shared.js file in src/lib/"
  );
  console.log(`  PASS: Found ${sharedFiles.length} shared utility files`);
  console.log(`  PASS: Found ${domainFiles.length} domain-specific files (*.scaffoldai.js or *.consync.js)`);
}

// -----------------------------------------------------------------------
// M. ScaffoldAI State Schema Invariant
//    Verify that .scaffoldai/state/ contains only approved files and
//    directories per the state schema contract.
//
//    Architecture:
//      .scaffoldai/state/ is operational ScaffoldAI state. Adding,
//      removing, or renaming state artifacts requires explicit approval
//      and contract updates.
//
//    Contract: .scaffoldai/contracts/state-schema.contract.md
// -----------------------------------------------------------------------

function checkStateSchemaInvariant() {
  const stateDir = path.join(repoRoot, ".scaffoldai", "state");

  // Approved state files (per state-schema.contract.md)
  const APPROVED_STATE_FILES = new Set([
    "active-contract.json", // legacy compatibility artifact (optional)
    "active-contract.md",
    "active-runtime.json",
    "active-stream.md",
    "next-action.md",
    "handoff.md",
    "snapshot.md",
    "cleanup-complete-checkpoint.md",
    "history.md",
    "history.jsonl", // Created on first append — may not exist initially
    "verify-evidence.json", // Canonical verification evidence for active packet
  ]);

  // Approved subdirectories (per state-schema.contract.md)
  const APPROVED_STATE_DIRS = new Set([
    "history", // Observational history artifacts (not authoritative state)
  ]);

  // Required files that must always exist
  const REQUIRED_STATE_FILES = new Set([
    "active-contract.md",
    "active-runtime.json",
    "active-stream.md",
    "next-action.md",
    "handoff.md",
    "snapshot.md",
    "cleanup-complete-checkpoint.md",
    "history.md",
    // history.jsonl is intentionally NOT required — created on first append
  ]);

  if (!fs.existsSync(stateDir)) {
    throw new Error(`.scaffoldai/state/ does not exist`);
  }

  const policyPath = path.join(repoRoot, ".scaffoldai", "contracts", "active-policy.json");
  assert.ok(
    fs.existsSync(policyPath),
    "Missing required contract file: .scaffoldai/contracts/active-policy.json"
  );

  const entries = fs.readdirSync(stateDir, { withFileTypes: true });
  const violations = [];

  // Check for unexpected files or directories
  for (const entry of entries) {
    const name = entry.name;

    // Skip .DS_Store and other OS metadata files
    if (name === ".DS_Store" || name === ".gitkeep") {
      continue;
    }

    if (entry.isDirectory()) {
      if (!APPROVED_STATE_DIRS.has(name)) {
        violations.push(
          `  Unexpected directory: ${name} (not in approved list — update .scaffoldai/contracts/state-schema.contract.md)`
        );
      }
    } else if (entry.isFile()) {
      if (!APPROVED_STATE_FILES.has(name)) {
        violations.push(
          `  Unexpected file: ${name} (not in approved list — update .scaffoldai/contracts/state-schema.contract.md)`
        );
      }
    }
  }

  // Check for missing required files
  for (const requiredFile of REQUIRED_STATE_FILES) {
    const filePath = path.join(stateDir, requiredFile);
    if (!fs.existsSync(filePath)) {
      violations.push(
        `  Missing required file: ${requiredFile} (per .scaffoldai/contracts/state-schema.contract.md)`
      );
    }
  }

  assert.ok(
    violations.length === 0,
    `.scaffoldai/state/ schema violations:\n${violations.join("\n")}\n\nSee: .scaffoldai/contracts/state-schema.contract.md`
  );

  console.log("  PASS: .scaffoldai/state/ contains only approved files and directories");
}

// -----------------------------------------------------------------------
// N. ScaffoldAI command surface topology
//    All *.scaffoldai.js command surfaces must live under
//    src/scaffoldai/commands/. src/commands/ is reserved for Consync product
//    and shared system commands; it must not contain any *.scaffoldai.js
//    files after the ScaffoldAI command migration.
//
//    Architecture:
//      ScaffoldAI command surfaces → src/scaffoldai/commands/*.scaffoldai.js
//      Consync product commands    → src/commands/*.consync.js
//      System commands             → src/commands/*.system.js
// -----------------------------------------------------------------------

function checkScaffoldaiCommandTopology() {
  const commandsDir = path.join(repoRoot, "src", "commands");
  assert.ok(fs.existsSync(commandsDir), "Expected src/commands/ to exist");

  const stragglers = collectActiveFiles("src/commands")
    .map((filePath) => path.relative(repoRoot, filePath).split(path.sep).join("/"))
    .filter((relPath) => relPath.endsWith(".scaffoldai.js"));

  assert.ok(
    stragglers.length === 0,
    `src/commands/ must not contain any descendant *.scaffoldai.js files — ScaffoldAI command surfaces belong under src/scaffoldai/commands/. Found:\n${stragglers.map((s) => `  ${s}`).join("\n")}`
  );
  console.log("  PASS: src/commands/ contains no descendant *.scaffoldai.js files");

  const scaffoldaiCommandsDir = path.join(repoRoot, "src", "scaffoldai", "commands");
  assert.ok(
    fs.existsSync(scaffoldaiCommandsDir),
    "Expected src/scaffoldai/commands/ to exist as the ScaffoldAI command surface root"
  );

  const migratedExpected = [
    "handoff-bundle.process.scaffoldai.js",
    "reentry-check.agent.scaffoldai.js",
    "reference-audit.check.scaffoldai.js",
  ];

  for (const fileName of migratedExpected) {
    const filePath = path.join(scaffoldaiCommandsDir, fileName);
    assert.ok(
      fs.existsSync(filePath),
      `Expected migrated file src/scaffoldai/commands/${fileName} to exist`
    );
  }
  console.log("  PASS: migrated ScaffoldAI command files present under src/scaffoldai/commands/");
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
    checkScaffoldaiAuthorityBoundary();
    checkScaffoldaiStateWriteBoundary();
    checkScaffoldaiStateReadBoundary();
    checkSharedUtilityBoundary();
    checkStateSchemaInvariant();
    checkScaffoldaiCommandTopology();
    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  }
}

main();
