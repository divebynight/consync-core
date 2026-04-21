const path = require("path");
const { runGatekeeperMount } = require("../lib/gatekeeperMount");

async function runGatekeeperCommand(subcommand, args) {
  const rootPath = path.resolve(process.cwd());

  if (subcommand === "mount") {
    const requestText = args.join(" ").trim();
    await runGatekeeperMount(rootPath, requestText);
    return;
  }

  console.error(`Unknown gatekeeper subcommand: ${subcommand}`);
  console.error("Usage: gatekeeper mount \"<request>\"");
  process.exitCode = 1;
}

module.exports = {
  runGatekeeperCommand,
};
