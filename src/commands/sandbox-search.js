const { buildSandboxSearchOutput } = require("../lib/sandbox-anchors");

function runSandboxSearchCommand(targetPath, query) {
  if (!targetPath) {
    console.log("Path is required");
    process.exitCode = 1;
    return;
  }

  const result = buildSandboxSearchOutput(targetPath, query);

  if (!result.ok) {
    console.log(result.output);
    process.exitCode = 1;
    return;
  }

  console.log(result.output);
}

module.exports = {
  runSandboxSearchCommand,
};