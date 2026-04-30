const { classifyInput } = require("../lib/intakeClassify");

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const eqIndex = arg.indexOf("=");
      if (eqIndex !== -1) {
        flags[arg.slice(2, eqIndex)] = arg.slice(eqIndex + 1);
      } else {
        flags[arg.slice(2)] = argv[i + 1] || "";
        i++;
      }
    }
  }
  return flags;
}

function runPreflightRunCommand(argv, options = {}) {
  const out = options.outputStream || process.stdout;
  const flags = parseFlags(argv);
  const prompt = flags["prompt"] || "";

  out.write("Agent: Preflight\n");
  out.write(`Input: ${prompt || "(none)"}\n\n`);

  if (!prompt.trim()) {
    out.write("STATUS: BLOCKED\n");
    out.write("READINESS: needs_clarification\n");
    out.write("SUMMARY: No input provided. Preflight requires a prompt to validate.\n");
    out.write("REQUIRED NEXT STEP: Provide a --prompt value describing the work to validate.\n");
    if (!options.outputStream) process.exitCode = 1;
    return;
  }

  const result = classifyInput(prompt);
  let status = "PASS";
  let readiness = "ready";
  let warn = false;

  if (result.status === "NEEDS_CLARIFICATION" || result.classification === "unknown") {
    status = "BLOCKED";
    readiness = "needs_clarification";
  } else if (result.classification === "mixed" || result.ambiguity && result.ambiguity !== "none") {
    status = "WARN";
    readiness = "ambiguous";
    warn = true;
  }

  out.write(`STATUS: ${status}\n`);
  out.write(`CLASSIFICATION: ${result.classification}\n`);
  out.write(`READINESS: ${readiness}\n`);
  out.write(`AMBIGUITY: ${result.ambiguity}\n`);
  out.write(`RISK: ${result.risk}\n`);
  out.write("\n");

  out.write(`RECOMMENDED NEXT ACTION: ${
    status === "PASS"
      ? `Proceed to packet creation for ${result.classification}`
      : warn
      ? `Clarify or split ambiguous request before proceeding`
      : `Revise prompt to clarify work boundaries`
  }\n`);

  out.write(`REQUIRED NEXT STEP: ${
    status === "PASS"
      ? `Mount a ${result.classification} packet or proceed to Intake/Verify as appropriate.`
      : warn
      ? `Revise prompt to reduce ambiguity or clarify intent.`
      : `Provide a more specific prompt for Intake classification.`
  }\n`);

  if (status === "BLOCKED" && !options.outputStream) process.exitCode = 1;
}

module.exports = { runPreflightRunCommand };
