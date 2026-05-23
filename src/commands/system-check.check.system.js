const { evaluateConsyncSystemCheck } = require("./system-check.cmd.consync");
const { evaluateProcessCheck } = require("../scaffoldai/commands/process-check.check.scaffoldai");

function printSection(title, result) {
  console.log(title);
  console.log(`STATUS: ${result.status}`);
  console.log("Signals:");

  for (const signal of result.signals) {
    console.log(`- ${signal}`);
  }

  console.log("Warnings:");

  if (result.warnings.length === 0) {
    console.log("- none");
    return;
  }

  for (const warning of result.warnings) {
    console.log(`- ${warning}`);
  }
}

function runSystemCheckCommand() {
  try {
    const consyncResult = evaluateConsyncSystemCheck(process.cwd());
    const processResult = evaluateProcessCheck(process.cwd());
    const status = consyncResult.warnings.length === 0 && processResult.warnings.length === 0
      ? "ON_TRACK"
      : "CHECK_WARNINGS";

    console.log("SYSTEM CHECK (COMPATIBILITY)");
    console.log("-");
    printSection("CONSYNC PRODUCT/RUNTIME", consyncResult);
    console.log("-");
    printSection("SCAFFOLDAI PROCESS", processResult);
    console.log("-");
    console.log(`STATUS: ${status}`);
  } catch (error) {
    console.error(`STATUS: CHECK_FAILED (${error.message})`);
    process.exitCode = 1;
  }
}

module.exports = {
  runSystemCheckCommand,
};
