const { runNewGuidCommand } = require("../commands/new-guid");
const { runListGuidCommand } = require("../commands/list-guid");
const { runShowGuidCommand } = require("../commands/show-guid");
const { runSandboxScanCommand } = require("../commands/sandbox-scan");
const { runSandboxVerifyCommand } = require("../commands/sandbox-verify");
const { runSandboxDescribeCommand } = require("../commands/sandbox-describe");
const { runSandboxProposeCommand } = require("../commands/sandbox-propose");
const { runSandboxCatalogCommand } = require("../commands/sandbox-catalog");
const { runSandboxDiscoverCommand } = require("../commands/sandbox-discover");
const { runSandboxSearchCommand } = require("../commands/sandbox-search");
const { runSandboxDesktopSearchCommand } = require("../commands/sandbox-desktop-search");
const { runSystemCheckCommand } = require("../commands/system-check");
const { runSystemSummaryCommand } = require("../commands/system-summary");
const { runStateIntegrityCheckCommand } = require("../commands/state-integrity-check");
const { runPortableCommand } = require("../commands/portable");
const { runGatekeeperCommand } = require("../commands/gatekeeper");

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

function parseStateIntegrityCheckOptions(argv) {
  const mode = argv[0];

  if (!mode || (mode !== "preflight" && mode !== "postflight")) {
    throw new Error("Usage: state-integrity-check <preflight|postflight> [--root <path>]");
  }

  let rootPath;

  for (let index = 1; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--root") {
      rootPath = argv[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${argument}`);
  }

  return {
    mode,
    rootPath,
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

  if (command === "system-check") {
    runSystemCheckCommand();
    return;
  }

  if (command === "system-summary") {
    runSystemSummaryCommand();
    return;
  }

  if (command === "state-integrity-check") {
    runStateIntegrityCheckCommand(parseStateIntegrityCheckOptions(process.argv.slice(3)));
    return;
  }

  if (command === "portable") {
    runPortableCommand(parsePortableOptions(process.argv.slice(3)));
    return;
  }

  if (command === "gatekeeper") {
    await runGatekeeperCommand(process.argv[3], process.argv.slice(4));
    return;
  }

  console.error("Unknown command");
  process.exitCode = 1;
}

module.exports = {
  main,
};