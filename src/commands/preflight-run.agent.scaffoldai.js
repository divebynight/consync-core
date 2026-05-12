const { classifyInput } = require("../lib/intakeClassify.agent.scaffoldai");

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


  // Minimal packet field extraction (from prompt or flags)
  // Accept both --mode=, --execution-surface=, etc. or parse from prompt lines
  const requiredFields = ["mode", "execution-surface", "context", "expectation", "task", "output-format"];
  const missingFields = [];
  for (const field of requiredFields) {
    if (!flags[field] || !flags[field].trim()) missingFields.push(field.toUpperCase().replace(/-/g, " "));
  }

  // Execution surface check
  const declaredSurface = (flags["execution-surface"] || "").toLowerCase();
  const currentSurface = "copilot"; // Hardcoded for Copilot execution surface
  let surfaceMismatch = false;
  if (declaredSurface && declaredSurface !== currentSurface) surfaceMismatch = true;

  const result = classifyInput(prompt);
  let status = "PASS";
  let readiness = "ready";
  let warn = false;


  if (missingFields.length > 0) {
    status = "BLOCKED";
    readiness = "missing_fields";
    out.write(`STATUS: BLOCKED\n`);
    out.write(`BLOCKED FIELDS: ${missingFields.join(", ")}\n`);
    out.write("REQUIRED NEXT STEP: Provide all required packet fields.\n");
    if (!options.outputStream) process.exitCode = 1;
    return;
  }

  if (surfaceMismatch) {
    status = "BLOCKED";
    readiness = "surface_mismatch";
    out.write(`STATUS: BLOCKED\n`);
    out.write(`READINESS: surface_mismatch\n`);
    out.write(`EXECUTION SURFACE MISMATCH: declared='${declaredSurface}', current='${currentSurface}'\n`);
    out.write("RECOMMENDED NEXT ACTION: Run this packet in the declared execution surface or correct the packet.\n");
    out.write("REQUIRED NEXT STEP: Update the EXECUTION SURFACE field to match the current execution context ('copilot') or run in the correct agent.\n");
    if (!options.outputStream) process.exitCode = 1;
    return;
  }

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
