const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");

function runNodeStep(title, args) {
  console.log(title);

  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
  });

  printOutput(result.stdout);
  printOutput(result.stderr);

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function runExpectationStep(title, args, expectationPath) {
  console.log(title);

  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
  });

  const actualOutput = result.stdout.trimEnd();
  const expectedOutput = fs.readFileSync(expectationPath, "utf8").trimEnd();

  if (result.status !== 0 || actualOutput !== expectedOutput) {
    printOutput(result.stdout);
    printOutput(result.stderr);
    console.log("FAIL");
    process.exit(1);
  }

  console.log("PASS");
}

function printOutput(output) {
  const trimmed = output.trim();

  if (!trimmed) {
    return;
  }

  console.log(trimmed);
}

function main() {
  console.log("[verify] Starting verification");
  console.log("");

  runNodeStep("[verify] Core CLI behavior: unit new-guid", [path.join(repoRoot, "src", "test", "unit-new-guid.js")]);
  console.log("");

  runNodeStep("[verify] Core CLI behavior: integration new-guid", [path.join(repoRoot, "src", "test", "integration-new-guid-cli.js")]);
  console.log("");

  runNodeStep("[verify] Fixture verification: basic-mixed", [path.join(repoRoot, "src", "index.js"), "sandbox-verify", "sandbox/fixtures/basic-mixed"]);
  console.log("");

  runNodeStep("[verify] Fixture verification: nested-mixed", [path.join(repoRoot, "src", "index.js"), "sandbox-verify", "sandbox/fixtures/nested-mixed"]);
  console.log("");

  runNodeStep("[verify] Descriptive layer: basic-mixed", [path.join(repoRoot, "src", "index.js"), "sandbox-describe", "sandbox/fixtures/basic-mixed"]);
  console.log("");

  runNodeStep("[verify] Descriptive layer: nested-mixed", [path.join(repoRoot, "src", "index.js"), "sandbox-describe", "sandbox/fixtures/nested-mixed"]);
  console.log("");

  runExpectationStep(
    "[verify] Proposal layer: basic-mixed",
    [path.join(repoRoot, "src", "index.js"), "sandbox-propose", "sandbox/fixtures/basic-mixed"],
    path.join(repoRoot, "sandbox", "expectations", "basic-mixed-propose.md")
  );
  console.log("");

  runExpectationStep(
    "[verify] Proposal layer: nested-mixed",
    [path.join(repoRoot, "src", "index.js"), "sandbox-propose", "sandbox/fixtures/nested-mixed"],
    path.join(repoRoot, "sandbox", "expectations", "nested-mixed-propose.md")
  );
  console.log("");

  runExpectationStep(
    "[verify] Proposal layer: single-type-flat",
    [path.join(repoRoot, "src", "index.js"), "sandbox-propose", "sandbox/fixtures/single-type-flat"],
    path.join(repoRoot, "sandbox", "expectations", "single-type-flat-propose.md")
  );
  console.log("");

  runExpectationStep(
    "[verify] Proposal layer: mixed-flat-small",
    [path.join(repoRoot, "src", "index.js"), "sandbox-propose", "sandbox/fixtures/mixed-flat-small"],
    path.join(repoRoot, "sandbox", "expectations", "mixed-flat-small-propose.md")
  );
  console.log("");

  runNodeStep("[verify] Surface summary", [path.join(repoRoot, "src", "index.js"), "system-summary"]);
  console.log("");

  runNodeStep("[verify] System and process surface", [path.join(repoRoot, "src", "index.js"), "system-check"]);
  console.log("");

  console.log("[verify] PASS");
}

main();