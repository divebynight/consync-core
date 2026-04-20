const path = require("path");
const { evaluateStateIntegrity } = require("../lib/stateIntegrityCheck");

function runStateIntegrityCheckCommand(options) {
  const mode = options && options.mode ? options.mode : "preflight";
  const rootPath = options && options.rootPath ? options.rootPath : process.cwd();
  const result = evaluateStateIntegrity(path.resolve(rootPath), mode);

  console.log(`MODE: ${result.mode.toUpperCase()}`);
  console.log(`STATUS: ${result.status}`);
  console.log(`- active stream: ${result.activeStream}`);
  console.log(`- active package: ${result.activePackage}`);
  console.log(`- system state: ${result.systemState}`);
  console.log(`- next safe action: ${result.nextSafeAction}`);

  if (!result.ok) {
    for (const failure of result.failures) {
      console.log(`- ${failure}`);
    }

    console.log("- reconciliation required");
    process.exitCode = 1;
  }
}

module.exports = {
  runStateIntegrityCheckCommand,
};