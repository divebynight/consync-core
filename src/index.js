const { runNewGuidCommand } = require("./commands/new-guid");
const { runListGuidCommand } = require("./commands/list-guid");
const { runShowGuidCommand } = require("./commands/show-guid");
const { runSandboxScanCommand } = require("./commands/sandbox-scan");
const { runSandboxVerifyCommand } = require("./commands/sandbox-verify");
const { runSystemCheckCommand } = require("./commands/system-check");

function parseNewGuidOptions(argv) {
  if (argv[0] === "--note") {
    return {
      note: argv[1] || "",
    };
  }

  return {};
}

async function main() {
  const command = process.argv[2];

  if (command === "new-guid") {
    await runNewGuidCommand(parseNewGuidOptions(process.argv.slice(3)));
    return;
  }

  if (command === "list-guid") {
    runListGuidCommand();
    return;
  }

  if (command === "show-guid") {
    runShowGuidCommand(process.argv[3]);
    return;
  }

  if (command === "sandbox-scan") {
    runSandboxScanCommand(process.argv[3]);
    return;
  }

  if (command === "sandbox-verify") {
    runSandboxVerifyCommand(process.argv[3]);
    return;
  }

  if (command === "system-check") {
    runSystemCheckCommand();
    return;
  }

  console.error("Unknown command");
  process.exitCode = 1;
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});