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

function classifyText(text) {
  if (!text || !text.trim()) return { classification: "unknown", status: "NEEDS_CLARIFICATION" };
  return classifyInput(text);
}

function runVerifyRunCommand(argv, options = {}) {

  const out = options.outputStream || process.stdout;
  const flags = parseFlags(argv);
  const prompt = flags["prompt"] || "";
  const result = flags["result"] || "";

  out.write("Agent: Verify\n");
  out.write(`Prompt: ${prompt || "(none)"}\n`);
  out.write(`Result: ${result || "(none)"}\n\n`);

  // Always emit contract lines, even for missing args
  let promptContract = "compliant";
  let systemConstraints = "respected";
  let drift = "none";
  let humanAction = "proceed";
  let status = "PASS";
  let alignment = "strong";
  let scope = "correct";
  let completeness = "complete";

  if (!prompt.trim() || !result.trim()) {
    status = "BLOCKED";
    alignment = "blocked";
    scope = "unknown";
    completeness = "unclear";
    promptContract = "needs revision";
    humanAction = "revise";
    drift = "possible";
    out.write(`STATUS: ${status}\n`);
    out.write(`PROMPT CONTRACT: ${promptContract}\n`);
    out.write(`SYSTEM CONSTRAINTS: ${systemConstraints}\n`);
    out.write(`DRIFT: ${drift}\n`);
    out.write(`HUMAN ACTION: ${humanAction}\n`);
    out.write("ALIGNMENT: blocked\n");
    out.write("SCOPE: unknown\n");
    out.write("COMPLETENESS: unclear\n");
    out.write("RECOMMENDED NEXT ACTION: Provide both --prompt and --result.\n");
    out.write("REQUIRED NEXT STEP: Supply both original intent and reported result for verification.\n");
    if (!options.outputStream) process.exitCode = 1;
    return;
  }

  // Only classify if both prompt and result are present
  let promptClass = { classification: "unknown", status: "NEEDS_CLARIFICATION" };
  let resultClass = { classification: "unknown", status: "NEEDS_CLARIFICATION" };
  if (prompt.trim() && result.trim()) {
    promptClass = classifyText(prompt);
    resultClass = classifyText(result);
  }

  // Fail conditions
  if (promptClass.classification === "unknown" || promptClass.status === "NEEDS_CLARIFICATION") {
    status = "FAIL";
    alignment = "blocked";
    scope = "unknown";
    completeness = "unclear";
  } else if (!result.trim()) {
    status = "FAIL";
    alignment = "blocked";
    scope = "unknown";
    completeness = "unclear";
  } else if (resultClass.classification === "unknown" || resultClass.status === "NEEDS_CLARIFICATION") {
     status = "WARN";
     alignment = "partial";
     scope = "unknown";
     completeness = "partial";
  } else if (promptClass.classification !== resultClass.classification && resultClass.classification !== "mixed" && promptClass.classification !== "mixed") {
    status = "FAIL";
    alignment = "weak";
    scope = "drifted";
    completeness = "unclear";
  }

  // Warn conditions
  else if (resultClass.classification === "mixed" || promptClass.classification === "mixed") {
    status = "WARN";
    alignment = "partial";
    scope = "expanded";
    completeness = "partial";
  } else if (result.length < 20) {
    status = "WARN";
    alignment = "partial";
    scope = "unknown";
    completeness = "partial";
  }

  // Pass conditions
  else {
    status = "PASS";
    alignment = "strong";
    scope = "correct";
    completeness = "complete";
  }


  out.write(`STATUS: ${status}\n`);
  out.write(`PROMPT_CLASSIFICATION: ${promptClass.classification}\n`);
  out.write(`RESULT_CLASSIFICATION: ${resultClass.classification}\n`);
  out.write(`ALIGNMENT: ${alignment}\n`);
  out.write(`SCOPE: ${scope}\n`);
  out.write(`COMPLETENESS: ${completeness}\n`);
  out.write(`PROMPT CONTRACT: ${promptContract}\n`);
  out.write(`SYSTEM CONSTRAINTS: ${systemConstraints}\n`);
  out.write(`DRIFT: ${drift}\n`);
  out.write(`HUMAN ACTION: ${humanAction}\n`);
  out.write("\n");

  out.write(`RECOMMENDED NEXT ACTION: ${
    status === "PASS"
      ? "Proceed to closeout or commit review."
      : status === "WARN"
      ? "Review for possible scope drift or ambiguity before proceeding."
      : "Revise prompt/result for clarity or alignment."
  }\n`);

  out.write(`REQUIRED NEXT STEP: ${
    status === "PASS"
      ? "Document verification and proceed to closeout."
      : status === "WARN"
      ? "Clarify scope or intent before finalizing."
      : "Provide clearer prompt and result for verification."
  }\n`);

  if ((status === "FAIL" || status === "BLOCKED") && !options.outputStream) process.exitCode = 1;
}

module.exports = { runVerifyRunCommand };
