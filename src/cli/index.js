const { runNewGuidCommand } = require("../commands/new-guid");
const { runListGuidCommand } = require("../commands/list-guid");
const { runShowGuidCommand } = require("../commands/show-guid");
const { runSandboxScanCommand } = require("../commands/sandbox-scan");
const { runSandboxVerifyCommand } = require("../commands/sandbox-verify");
const { runSandboxDescribeCommand } = require("../commands/sandbox-describe");
const { runSandboxProposeCommand } = require("../commands/sandbox-propose");
const { runSandboxCatalogCommand } = require("../commands/sandbox-catalog");
const { runSystemCheckCommand } = require("../commands/system-check");
const { runSystemSummaryCommand } = require("../commands/system-summary");
const { runPortableCommand } = require("../commands/portable");

function parseNewGuidOptions(argv) {
  if (argv[0] === "--note") {
    return {
      note: argv[1] || "",
    };
  }

  return {};
}

function parsePortableOptions(argv) {
  let targetPath;
  let force = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--target") {
      targetPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === "--force") {
      force = true;
      continue;
    }

    throw new Error(`Unknown option: ${argument}`);
  }

  return {
    force,
    targetPath,
  };
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

  if (command === "system-check") {
    runSystemCheckCommand();
    return;
  }

  if (command === "system-summary") {
    runSystemSummaryCommand();
    return;
  }

  if (command === "portable") {
    runPortableCommand(parsePortableOptions(process.argv.slice(3)));
    return;
  }

  console.error("Unknown command");
  process.exitCode = 1;
}

module.exports = {
  main,
};