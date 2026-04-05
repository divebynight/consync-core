const fs = require("fs");
const path = require("path");
const { buildSandboxScanOutput } = require("./sandbox-scan");

function runSandboxVerifyCommand(targetPath) {
  if (!targetPath) {
    console.log("Path is required");
    process.exitCode = 1;
    return;
  }

  const fixtureName = path.basename(path.resolve(process.cwd(), targetPath));
  const expectationPath = path.resolve(process.cwd(), "sandbox", "expectations", `${fixtureName}-scan.md`);

  if (!fs.existsSync(expectationPath)) {
    console.log("FAIL");
    process.exitCode = 1;
    return;
  }

  const result = buildSandboxScanOutput(targetPath);

  if (!result.ok) {
    console.log("FAIL");
    process.exitCode = 1;
    return;
  }

  const expectedOutput = fs.readFileSync(expectationPath, "utf8").trimEnd();
  const actualOutput = result.output.trimEnd();

  if (actualOutput === expectedOutput) {
    console.log("PASS");
    return;
  }

  console.log("FAIL");
  process.exitCode = 1;
}

module.exports = {
  runSandboxVerifyCommand,
};