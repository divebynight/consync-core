const path = require("path");
const { runGatekeeperMount } = require("../lib/gatekeeperMount");
const { runGatekeeperClose } = require("../lib/gatekeeperClose");
const { runGatekeeperSwitch } = require("../lib/gatekeeperSwitch");

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

  if (subcommand === "switch") {
    const targetStream = args[0] || "";
    await runGatekeeperSwitch(rootPath, targetStream);
    return;
  }

  console.error(`Unknown gatekeeper subcommand: ${subcommand}`);
  console.error("Usage: gatekeeper mount \"<request>\"");
  console.error("       gatekeeper close");
  console.error("       gatekeeper switch <stream>");
  process.exitCode = 1;
}

module.exports = {
  runGatekeeperCommand,
};
