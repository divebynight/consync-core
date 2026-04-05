const { spawnSync } = require("child_process");
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

  runNodeStep("[verify] System and process surface", [path.join(repoRoot, "src", "index.js"), "system-check"]);
  console.log("");

  console.log("[verify] PASS");
}

main();