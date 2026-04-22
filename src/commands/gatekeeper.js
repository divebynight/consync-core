const path = require("path");
const { runGatekeeperMount } = require("../lib/gatekeeperMount");
const { runGatekeeperClose } = require("../lib/gatekeeperClose");

async function runGatekeeperCommand(subcommand, args) {
  const rootPath = path.resolve(process.cwd());

  if (subcommand === "mount") {
    const requestText = args.join(" ").trim();
    await runGatekeeperMount(rootPath, requestText);
    return;
  }

  if (subcommand === "close") {
    await runGatekeeperClose(rootPath);
    return;
  }

  console.error(`Unknown gatekeeper subcommand: ${subcommand}`);
  console.error("Usage: gatekeeper mount \"<request>\"");
  console.error("       gatekeeper close");
  process.exitCode = 1;
}

module.exports = {
  runGatekeeperCommand,
};
