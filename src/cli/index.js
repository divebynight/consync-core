// Compatibility router — delegates to surface-specific CLI routers
// This maintains backward compatibility with existing invocations

const SCAFFOLDAI_COMMANDS = [
  "scaffoldai",
  "gatekeeper",
  "state-integrity-check",
  "portable",
  "handoff-bundle",
  "reentry-check",
  "dry-run-check",
  "consync-run",
  "intake-run",
  "preflight-run",
  "verify-run",
  "reference-audit",
  "system-check",
];

async function main() {
  const command = process.argv[2];

  if (SCAFFOLDAI_COMMANDS.includes(command)) {
    const scaffoldaiCli = require("./scaffoldai");
    await scaffoldaiCli.main();
    return;
  }

  // Default to Consync CLI for all other commands
  const consyncCli = require("./consync");
  await consyncCli.main();
}

module.exports = {
  main,
};
