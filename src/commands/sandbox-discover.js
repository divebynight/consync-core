const { buildSandboxDiscoverOutput } = require("../lib/sandbox-anchors");

function runSandboxDiscoverCommand(targetPath) {
  if (!targetPath) {
    console.log("Path is required");
    process.exitCode = 1;
    return;
  }

  const result = buildSandboxDiscoverOutput(targetPath);

  if (!result.ok) {
    console.log(result.output);
    process.exitCode = 1;
    return;
  }

  console.log(result.output);
}

module.exports = {
  runSandboxDiscoverCommand,
};