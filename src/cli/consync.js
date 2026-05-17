const { runNewGuidCommand } = require("../commands/new-guid.cmd.consync");
const { runListGuidCommand } = require("../commands/list-guid.cmd.consync");
const { runShowGuidCommand } = require("../commands/show-guid.cmd.consync");
const { runSandboxScanCommand } = require("../commands/sandbox-scan.cmd.consync");
const { runSandboxVerifyCommand } = require("../commands/sandbox-verify.cmd.consync");
const { runSandboxDescribeCommand } = require("../commands/sandbox-describe.cmd.consync");
const { runSandboxProposeCommand } = require("../commands/sandbox-propose.cmd.consync");
const { runSandboxCatalogCommand } = require("../commands/sandbox-catalog.cmd.consync");
const { runSandboxDiscoverCommand } = require("../commands/sandbox-discover.cmd.consync");
const { runSandboxSearchCommand } = require("../commands/sandbox-search.cmd.consync");
const { runSandboxDesktopSearchCommand } = require("../commands/sandbox-desktop-search.cmd.consync");
const { runSystemSummaryCommand } = require("../commands/system-summary.cmd.consync");
const { runFolderSummaryCommand } = require("../commands/folder-summary.cmd.consync");
const { runSystemCheckCommand } = require("../commands/system-check.cmd.consync");

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

  if (command === "sandbox-describe") {
    runSandboxDescribeCommand(process.argv[3]);
    return;
  }

  if (command === "sandbox-propose") {
    runSandboxProposeCommand(process.argv[3]);
    return;
  }

  if (command === "sandbox-catalog") {
    runSandboxCatalogCommand();
    return;
  }

  if (command === "sandbox-discover") {
    runSandboxDiscoverCommand(process.argv[3]);
    return;
  }

  if (command === "sandbox-search") {
    runSandboxSearchCommand(process.argv[3], process.argv.slice(4).join(" "));
    return;
  }

  if (command === "sandbox-desktop-search") {
    runSandboxDesktopSearchCommand(process.argv[3], process.argv.slice(4).join(" "));
    return;
  }

  if (command === "system-summary") {
    runSystemSummaryCommand();
    return;
  }

  if (command === "folder-summary") {
    runFolderSummaryCommand(process.argv[3]);
    return;
  }

  if (command === "system-check") {
    runSystemCheckCommand();
    return;
  }

  console.error("Unknown Consync command");
  process.exitCode = 1;
}

module.exports = {
  main,
};
