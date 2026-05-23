const { classifyInput } = require("../../lib/intakeClassify.agent.scaffoldai");

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

function runIntakeRunCommand(argv, options = {}) {
  const out = options.outputStream || process.stdout;
  const flags = parseFlags(argv);
  const prompt = flags["prompt"] || "";

  out.write("Agent: Intake\n");
  out.write(`Input: ${prompt || "(none)"}\n`);
  out.write("\n");

  if (!prompt.trim()) {
    out.write("STATUS: BLOCKED\n");
    out.write("SUMMARY: No input provided. Intake requires a prompt to classify.\n");
    out.write("REQUIRED NEXT STEP: Provide a --prompt value describing the work to classify.\n");

    if (!options.outputStream) {
      process.exitCode = 1;
    }

    return;
  }

  const result = classifyInput(prompt);

  out.write(`STATUS: ${result.status}\n`);
  out.write(`CLASSIFICATION: ${result.classification}\n`);
  out.write(`RISK: ${result.risk}\n`);
  out.write(`AMBIGUITY: ${result.ambiguity}\n`);
  out.write(`RECOMMENDED NEXT ACTION: ${result.recommendedNextAction}\n`);
  out.write(`TARGET SURFACES: ${result.targetSurfaces.join(", ")}\n`);
  out.write(`OUT OF SCOPE: ${result.outOfScope.join(", ")}\n`);
  out.write(`VERIFICATION LEVEL: ${result.verificationLevel}\n`);
  out.write("\n");
  out.write(`REQUIRED NEXT STEP: ${result.requiredNextStep}\n`);
}

module.exports = { runIntakeRunCommand };
