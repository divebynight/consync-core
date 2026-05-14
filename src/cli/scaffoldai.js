const { runScaffoldaiStatusCommand } = require("../scaffoldai/commands/scaffoldai-status.cmd.scaffoldai");
const { runScaffoldaiPreflightCommand } = require("../scaffoldai/commands/scaffoldai-preflight.cmd.scaffoldai");
const { runScaffoldaiVerifyCommand } = require("../scaffoldai/commands/scaffoldai-verify.cmd.scaffoldai");
const { runScaffoldaiCloseoutCommand } = require("../scaffoldai/commands/scaffoldai-closeout.cmd.scaffoldai");
const { runScaffoldaiQuestionCommand } = require("../scaffoldai/commands/scaffoldai-question.cmd.scaffoldai");
const { runHandoffBundleCommand } = require("../commands/handoff-bundle.process.scaffoldai");
const { runSystemCheckCommand } = require("../commands/system-check.check.system");
const { runStateIntegrityCheckCommand } = require("../scaffoldai/commands/state-integrity-check.check.scaffoldai");
const { runPortableCommand } = require("../commands/portable.process.scaffoldai");
const { runGatekeeperCommand } = require("../scaffoldai/commands/gatekeeper.cmd.scaffoldai");
const { runReentryCheckCommand } = require("../commands/reentry-check.agent.scaffoldai");
const { runDryRunCheckCommand } = require("../commands/dry-run-check.check.scaffoldai");
const { runConsyncRunCommand } = require("../commands/consync-run.cmd.scaffoldai");
const { runIntakeRunCommand } = require("../scaffoldai/commands/intake-run.agent.scaffoldai");
const { runReferenceAuditCommand } = require("../commands/reference-audit.check.scaffoldai");

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

function parseHandoffBundleOptions(argv) {
  if (argv.length === 0) {
    return {
      full: false,
    };
  }

  if (argv.length === 1 && argv[0] === "--full") {
    return {
      full: true,
    };
  }

  throw new Error("Usage: handoff-bundle [--full]");
}

async function main() {
  const command = process.argv[2];

  if (command === "handoff-bundle") {
    runHandoffBundleCommand(parseHandoffBundleOptions(process.argv.slice(3)));
    return;
  }

  if (command === "system-check") {
    runSystemCheckCommand();
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

  if (command === "reentry-check") {
    await runReentryCheckCommand();
    return;
  }

  if (command === "dry-run-check") {
    runDryRunCheckCommand(process.argv.slice(3));
    return;
  }

  if (command === "consync-run") {
    await runConsyncRunCommand(process.argv.slice(3));
    return;
  }

  if (command === "intake-run") {
    runIntakeRunCommand(process.argv.slice(3));
    return;
  }

  if (command === "reference-audit") {
    runReferenceAuditCommand();
    return;
  }

  if (command === "preflight-run") {
    const { runPreflightRunCommand } = require("../scaffoldai/commands/preflight-run.agent.scaffoldai");
    runPreflightRunCommand(process.argv.slice(3));
    return;
  }

  if (command === "verify-run") {
    const { runVerifyRunCommand } = require("../scaffoldai/commands/verify-run.agent.scaffoldai");
    runVerifyRunCommand(process.argv.slice(3));
    return;
  }

  if (command === "scaffoldai") {
    const subcommand = process.argv[3];
    if (subcommand === "status") {
      runScaffoldaiStatusCommand();
      return;
    }
    if (subcommand === "preflight") {
      runScaffoldaiPreflightCommand();
      return;
    }
    if (subcommand === "verify") {
      runScaffoldaiVerifyCommand(process.argv.slice(4));
      return;
    }
    if (subcommand === "closeout") {
      runScaffoldaiCloseoutCommand(process.argv.slice(4));
      return;
    }
    if (subcommand === "question") {
      runScaffoldaiQuestionCommand(process.argv.slice(4));
      return;
    }
    console.error(`Unknown scaffoldai subcommand: ${subcommand || "(none)"}`);
    process.exitCode = 1;
    return;
  }

  console.error("Unknown ScaffoldAI command");
  process.exitCode = 1;
}

module.exports = {
  main,
};
