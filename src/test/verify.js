const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const reset = "\x1b[0m";

const GROUPS = {
  CLI: "CLI / COMMAND TESTS",
  BRIDGE: "BRIDGE / STATE TESTS",
  SYSTEM: "SYSTEM TESTS",
  RENDERER: "RENDERER TESTS",
  E2E: "E2E TESTS",
};

const SURFACES = {
  CONSYNC: "consync",
  SCAFFOLDAI: "scaffoldai",
  ALL: "all",
};

const surfaceArg = process.argv.find((arg) => arg.startsWith("--surface="));
const activeSurface = surfaceArg ? surfaceArg.split("=")[1] : SURFACES.ALL;

const groupResults = new Map(Object.values(GROUPS).map((group) => [group, { status: "NOT RUN", failedStep: null }]));

function shouldRunSurface(surface) {
  return activeSurface === SURFACES.ALL || surface === SURFACES.ALL || surface === activeSurface;
}

function green(text) {
  return `\x1b[32m${text}${reset}`;
}

function red(text) {
  return `\x1b[31m${text}${reset}`;
}

function yellow(text) {
  return `\x1b[33m${text}${reset}`;
}

function cyan(text) {
  return `\x1b[36m${text}${reset}`;
}

function runNodeStep(title, args, group, surface = SURFACES.CONSYNC) {
  if (!shouldRunSurface(surface)) return;
  console.log(title);
  markGroupRunning(group);

  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 60000,
  });

  printOutput(result.stdout);
  printOutput(result.stderr);

  if (result.signal === "SIGTERM") {
    console.log(red(`TIMEOUT: step did not complete within 60s — ${title}`));
    markGroupFailed(group, title);
    printSummary();
    process.exit(1);
  }

  if (result.status !== 0) {
    markGroupFailed(group, title);
    printSummary();
    process.exit(result.status || 1);
  }

  markGroupPassed(group);
}

function runCommandStep(title, command, args, group, surface = SURFACES.CONSYNC) {
  if (!shouldRunSurface(surface)) return;
  console.log(title);
  markGroupRunning(group);

  // 120s timeout: npm + vitest startup can be slow; jsdom teardown occasionally hangs
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 120000,
  });

  printOutput(result.stdout);
  printOutput(result.stderr);

  if (result.signal === "SIGTERM") {
    console.log(red(`TIMEOUT: step did not complete within 120s — ${title}`));
    markGroupFailed(group, title);
    printSummary();
    process.exit(1);
  }

  if (result.status !== 0) {
    markGroupFailed(group, title);
    printSummary();
    process.exit(result.status || 1);
  }

  markGroupPassed(group);
}

function runExpectationStep(title, args, expectationPath, group, surface = SURFACES.CONSYNC) {
  if (!shouldRunSurface(surface)) return;
  console.log(title);
  markGroupRunning(group);

  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 60000,
  });

  if (result.signal === "SIGTERM") {
    console.log(red(`TIMEOUT: step did not complete within 60s — ${title}`));
    markGroupFailed(group, title);
    printSummary();
    process.exit(1);
  }

  const actualOutput = result.stdout.trimEnd();
  const expectedOutput = fs.readFileSync(expectationPath, "utf8").trimEnd();

  if (result.status !== 0 || actualOutput !== expectedOutput) {
    printOutput(result.stdout);
    printOutput(result.stderr);
    console.log(red("FAIL"));
    markGroupFailed(group, title);
    printSummary();
    process.exit(1);
  }

  console.log(green("PASS"));
  markGroupPassed(group);
}

function printOutput(output) {
  const trimmed = output.trim();

  if (!trimmed) {
    return;
  }

  console.log(colorOutput(trimmed));
}

function colorOutput(output) {
  return output.split(/\r?\n/).map(colorOutputLine).join("\n");
}

function colorOutputLine(line) {
  if (/^STATUS:\s*(PASS|ON_TRACK)\b/.test(line)) {
    return green(line);
  }

  if (/^STATUS:\s*(FAIL|BLOCKED)\b/.test(line)) {
    return red(line);
  }

  if (/^Warnings?:/i.test(line) || /\bWARNINGS?\b/.test(line)) {
    return yellow(line);
  }

  if (/^\s*PASS\b/.test(line) || /\]\s*PASS$/.test(line)) {
    return green(line);
  }

  if (/^\s*FAIL\b/.test(line) || /\]\s*FAIL$/.test(line)) {
    return red(line);
  }

  if (/\bBLOCKED\b/.test(line)) {
    return red(line);
  }

  return line;
}

function markGroupRunning(group) {
  if (!group) {
    return;
  }

  const result = groupResults.get(group);

  if (result && result.status === "NOT RUN") {
    result.status = "RUNNING";
  }
}

function markGroupPassed(group) {
  if (!group) {
    return;
  }

  const result = groupResults.get(group);

  if (result && result.status !== "FAIL") {
    result.status = "PASS";
  }
}

function markGroupFailed(group, failedStep) {
  if (!group) {
    return;
  }

  const result = groupResults.get(group);

  if (result) {
    result.status = "FAIL";
    result.failedStep = failedStep;
  }
}

function surfaceLabel() {
  if (activeSurface === SURFACES.CONSYNC) return "Consync fast (no e2e)";
  if (activeSurface === SURFACES.SCAFFOLDAI) return "ScaffoldAI";
  return "All";
}

function printSummary() {
  const overall = [...groupResults.values()].some((result) => result.status === "FAIL") ? "FAIL" : "PASS";

  console.log("");
  console.log(cyan("VERIFY SUMMARY"));
  console.log("");
  console.log(`VERIFY SURFACE............. ${surfaceLabel()}`);
  console.log("");

  for (const [group, result] of groupResults) {
    const failedStep = result.failedStep ? ` (${result.failedStep})` : "";
    console.log(`${group}: ${colorResult(result.status)}${failedStep}`);
  }

  console.log("");
  console.log(`OVERALL: ${colorResult(overall)}`);
}

function printCoverageConfidenceSummary() {
  const COL_AREA = 32;
  const COL_STATUS = 12;

  const areas = [
    { label: "Lib / Core",                   group: GROUPS.CLI,      signal: "unit — guid, folder-summary",                  surface: SURFACES.CONSYNC },
    { label: "CLI Commands",                  group: GROUPS.CLI,      signal: "unit + integration + expectation snapshots",    surface: SURFACES.CONSYNC },
    { label: "Sandbox Fixtures",              group: GROUPS.CLI,      signal: "deterministic expectation snapshots",           surface: SURFACES.CONSYNC },
    { label: "Renderer UI",                   group: GROUPS.RENDERER, signal: "panel slices + UI flow + bookmark loop",        surface: SURFACES.CONSYNC },
    { label: "E2E Electron App",              group: GROUPS.E2E,      signal: "run verify:consync:e2e or verify:full",          surface: SURFACES.CONSYNC },
    { label: "ScaffoldAI Bridge / State",     group: GROUPS.BRIDGE,   signal: "bridge state + gatekeeper + in-flight packet",  surface: SURFACES.SCAFFOLDAI },
    { label: "ScaffoldAI Runtime Commands",   group: GROUPS.CLI,      signal: "consync-run, intake, preflight, verify, handoff", surface: SURFACES.SCAFFOLDAI },
    { label: "ScaffoldAI / Process Boundary", group: GROUPS.SYSTEM,   signal: "system-check + path boundary validation",       surface: SURFACES.ALL },
  ];

  const filteredAreas = activeSurface === SURFACES.ALL
    ? areas
    : areas.filter((a) => a.surface === activeSurface || a.surface === SURFACES.ALL);

  console.log("");
  console.log(cyan("SYSTEM COVERAGE CONFIDENCE"));
  console.log("");

  const headerArea = "System Area".padEnd(COL_AREA);
  const headerStatus = "Status".padEnd(COL_STATUS);
  console.log(`${headerArea}  ${headerStatus}  Coverage`);
  console.log("-".repeat(88));

  for (const { label, group, signal } of filteredAreas) {
    const result = groupResults.get(group);
    const status = result ? result.status : "NOT RUN";

    const dotsCount = Math.max(2, COL_AREA - label.length - 1);
    const areaCol = label + " " + ".".repeat(dotsCount);
    const statusPadding = " ".repeat(Math.max(0, COL_STATUS - status.length));

    console.log(`${areaCol}  ${colorResult(status)}${statusPadding}  ${signal}`);
  }

  console.log("");
}

function colorResult(status) {
  if (status === "PASS" || status === "ON_TRACK") {
    return green(status);
  }

  if (status === "FAIL" || status === "BLOCKED") {
    return red(status);
  }

  if (status === "WARN" || status === "WARNING" || status === "WARNINGS") {
    return yellow(status);
  }

  return status;
}

function main() {
  console.log("[verify] Starting verification");
  console.log("");

  runNodeStep("[verify] Core CLI behavior: unit new-guid", [path.join(repoRoot, "src", "test", "unit-new-guid.js")], GROUPS.CLI);
  console.log("");

  runNodeStep("[verify] Core CLI behavior: integration new-guid", [path.join(repoRoot, "src", "test", "integration-new-guid-cli.js")], GROUPS.CLI);
  console.log("");

  runNodeStep("[verify] Desktop scaffold boundary", [path.join(repoRoot, "src", "test", "desktop-scaffold.js")], GROUPS.RENDERER);
  console.log("");

  runNodeStep("[verify] Renderer session panel slice", [path.join(repoRoot, "src", "test", "renderer-session-panel.js")], GROUPS.RENDERER);
  console.log("");

  runNodeStep("[verify] Renderer mock search panel slice", [path.join(repoRoot, "src", "test", "renderer-mock-search-panel.js")], GROUPS.RENDERER);
  console.log("");

  runNodeStep("[verify] Renderer folder summary panel slice", [path.join(repoRoot, "src", "test", "renderer-folder-summary-panel.js")], GROUPS.RENDERER);
  console.log("");

  runNodeStep("[verify] Renderer workspace panel slice", [path.join(repoRoot, "src", "test", "renderer-workspace-panel.js")], GROUPS.RENDERER);
  console.log("");

  runCommandStep("[verify] Renderer search flow UI slice", npmCommand, ["run", "test:ui-search"], GROUPS.RENDERER);
  console.log("");

  runNodeStep("[verify] Renderer bookmark read-after-write slice", [path.join(repoRoot, "src", "test", "renderer-bookmark-flow.js")], GROUPS.RENDERER);
  console.log("");

  runNodeStep("[verify] Bookmark write/read/render loop slice", [path.join(repoRoot, "src", "test", "bookmark-write-read-render-loop.js")], GROUPS.RENDERER);
  console.log("");

  runNodeStep("[verify] Standalone notes grouping", [path.join(repoRoot, "src", "test", "unit-standalone-notes-grouping.js")], GROUPS.RENDERER);
  console.log("");

  runNodeStep("[verify] Fixture verification: basic-mixed", [path.join(repoRoot, "src", "index.js"), "sandbox-verify", "sandbox/fixtures/basic-mixed"], GROUPS.CLI);
  console.log("");

  runNodeStep("[verify] Fixture verification: nested-mixed", [path.join(repoRoot, "src", "index.js"), "sandbox-verify", "sandbox/fixtures/nested-mixed"], GROUPS.CLI);
  console.log("");

  runNodeStep("[verify] Descriptive layer: basic-mixed", [path.join(repoRoot, "src", "index.js"), "sandbox-describe", "sandbox/fixtures/basic-mixed"], GROUPS.CLI);
  console.log("");

  runNodeStep("[verify] Descriptive layer: nested-mixed", [path.join(repoRoot, "src", "index.js"), "sandbox-describe", "sandbox/fixtures/nested-mixed"], GROUPS.CLI);
  console.log("");

  runExpectationStep(
    "[verify] Nested anchor discovery trial",
    [path.join(repoRoot, "src", "index.js"), "sandbox-discover", "sandbox/fixtures/nested-anchor-trial"],
    path.join(repoRoot, "sandbox", "expectations", "nested-anchor-trial-discover.md"),
    GROUPS.CLI
  );
  console.log("");

  runExpectationStep(
    "[verify] Nested anchor search trial",
    [path.join(repoRoot, "src", "index.js"), "sandbox-search", "sandbox/fixtures/nested-anchor-trial", "moss"],
    path.join(repoRoot, "sandbox", "expectations", "nested-anchor-trial-search-moss.md"),
    GROUPS.CLI
  );
  console.log("");

  runExpectationStep(
    "[verify] Desktop mock search flow",
    [path.join(repoRoot, "src", "index.js"), "sandbox-desktop-search", "sandbox/fixtures/nested-anchor-trial", "moss"],
    path.join(repoRoot, "sandbox", "expectations", "nested-anchor-trial-desktop-search-moss.md"),
    GROUPS.CLI
  );
  console.log("");

  runExpectationStep(
    "[verify] Proposal layer: basic-mixed",
    [path.join(repoRoot, "src", "index.js"), "sandbox-propose", "sandbox/fixtures/basic-mixed"],
    path.join(repoRoot, "sandbox", "expectations", "basic-mixed-propose.md"),
    GROUPS.CLI
  );
  console.log("");

  runExpectationStep(
    "[verify] Proposal layer: nested-mixed",
    [path.join(repoRoot, "src", "index.js"), "sandbox-propose", "sandbox/fixtures/nested-mixed"],
    path.join(repoRoot, "sandbox", "expectations", "nested-mixed-propose.md"),
    GROUPS.CLI
  );
  console.log("");

  runExpectationStep(
    "[verify] Proposal layer: single-type-flat",
    [path.join(repoRoot, "src", "index.js"), "sandbox-propose", "sandbox/fixtures/single-type-flat"],
    path.join(repoRoot, "sandbox", "expectations", "single-type-flat-propose.md"),
    GROUPS.CLI
  );
  console.log("");

  runExpectationStep(
    "[verify] Proposal layer: mixed-flat-small",
    [path.join(repoRoot, "src", "index.js"), "sandbox-propose", "sandbox/fixtures/mixed-flat-small"],
    path.join(repoRoot, "sandbox", "expectations", "mixed-flat-small-propose.md"),
    GROUPS.CLI
  );
  console.log("");

  runNodeStep("[verify] Sandbox catalog", [path.join(repoRoot, "src", "index.js"), "sandbox-catalog"], GROUPS.CLI);
  console.log("");

  runNodeStep("[verify] Gatekeeper decision rules", [path.join(repoRoot, "src", "test", "unit-dry-run-check.js")], GROUPS.BRIDGE, SURFACES.SCAFFOLDAI);
  console.log("");

  runNodeStep("[verify] In-flight packet state reader", [path.join(repoRoot, "src", "test", "unit-get-in-flight-packet.js")], GROUPS.BRIDGE, SURFACES.SCAFFOLDAI);
  console.log("");

  runNodeStep("[verify] Bridge integrity checks", [path.join(repoRoot, "src", "test", "bridge-integrity-checks.js")], GROUPS.BRIDGE, SURFACES.SCAFFOLDAI);
  console.log("");

  runNodeStep("[verify] Handoff bundle integration", [path.join(repoRoot, "src", "test", "integration-handoff-bundle-cli.js")], GROUPS.CLI, SURFACES.SCAFFOLDAI);
  console.log("");

  runNodeStep("[verify] Consync-run command", [path.join(repoRoot, "src", "test", "unit-consync-run.js")], GROUPS.CLI, SURFACES.SCAFFOLDAI);
  console.log("");

  runNodeStep("[verify] Intake agent execution", [path.join(repoRoot, "src", "test", "unit-intake-run.js")], GROUPS.CLI, SURFACES.SCAFFOLDAI);
  console.log("");

    runNodeStep("[verify] Preflight agent execution", [path.join(repoRoot, "src", "test", "unit-preflight-run.js")], GROUPS.CLI, SURFACES.SCAFFOLDAI);
    console.log("");

    runNodeStep("[verify] Verify agent execution", [path.join(repoRoot, "src", "test", "unit-verify-run.js")], GROUPS.CLI, SURFACES.SCAFFOLDAI);
    console.log("");

  runNodeStep("[verify] Folder summary lib", [path.join(repoRoot, "src", "test", "unit-folder-summary.js")], GROUPS.CLI);
  console.log("");
  console.log("");

  runNodeStep("[verify] ScaffoldAI architectural invariants", [path.join(repoRoot, "src", "test", "scaffoldai-invariants.test.js")], GROUPS.SYSTEM, SURFACES.SCAFFOLDAI);
  console.log("");

  runNodeStep("[verify] ScaffoldAI status command", [path.join(repoRoot, "src", "test", "unit-scaffoldai-status.js")], GROUPS.SYSTEM, SURFACES.SCAFFOLDAI);
  console.log("");

  runNodeStep("[verify] ScaffoldAI preflight command", [path.join(repoRoot, "src", "test", "unit-scaffoldai-preflight.js")], GROUPS.SYSTEM, SURFACES.SCAFFOLDAI);
  console.log("");

  runNodeStep("[verify] ScaffoldAI verify command", [path.join(repoRoot, "src", "test", "unit-scaffoldai-verify.js")], GROUPS.SYSTEM, SURFACES.SCAFFOLDAI);
  console.log("");

  runNodeStep("[verify] ScaffoldAI closeout command", [path.join(repoRoot, "src", "test", "unit-scaffoldai-closeout.js")], GROUPS.SYSTEM, SURFACES.SCAFFOLDAI);
  console.log("");

  runNodeStep("[verify] ScaffoldAI question command", [path.join(repoRoot, "src", "test", "unit-scaffoldai-question.js")], GROUPS.SYSTEM, SURFACES.SCAFFOLDAI);
  console.log("");

  runNodeStep("[verify] System and process surface", [path.join(repoRoot, "src", "index.js"), "system-check"], GROUPS.SYSTEM, SURFACES.ALL);
  console.log("");

  printSummary();
  printCoverageConfidenceSummary();
  console.log("");
  console.log("[verify] PASS");
}

main();
