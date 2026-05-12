const path = require("path");
const {
  gatherQuestions,
  CATEGORIES,
  SEVERITY,
  NOISE_THRESHOLD,
} = require("../lib/scaffoldaiQuestion.scaffoldai");

const repoRoot = path.resolve(__dirname, "..", "..");

// -----------------------------------------------------------------------
// CLI Command — Thin wrapper for terminal output
// -----------------------------------------------------------------------

function runScaffoldaiQuestionCommand(argv) {
  // No flags accepted in v1; reject unknown flags
  const args = argv || [];
  for (const arg of args) {
    if (arg.startsWith("-")) {
      console.error(`Unknown flag: ${arg}`);
      console.error("Usage: node src/index.js scaffoldai question");
      process.exitCode = 1;
      return;
    }
  }

  const result = gatherQuestions(repoRoot);
  const { questions, inFlightPacket, streamName, status, resolvedVerify } = result;

  // Structural noise check
  const noiseWarning = questions.length > NOISE_THRESHOLD
    ? `WARNING: ${questions.length} questions detected — exceeds expected threshold of ${NOISE_THRESHOLD}. Structural noise risk.`
    : null;

  const verifyCommand = resolvedVerify.error ? "(unavailable)" : resolvedVerify.command;

  // NEXT SAFE ACTION
  let nextSafeAction;
  if (status === "BLOCKED") {
    nextSafeAction = "Resolve the BLOCKED condition(s) above before continuing.";
  } else if (status === "QUESTION" || status === "WARNING") {
    nextSafeAction = "Review the question(s) above. No automatic action is taken.";
  } else {
    nextSafeAction = "No open structural questions. Run the recommended VERIFY COMMAND before closeout.";
  }

  // --- Print output ---
  console.log("[scaffoldai question]");
  console.log("");
  console.log(`ACTIVE PACKET:       ${inFlightPacket || "(none)"}`);
  console.log(`STREAM:              ${streamName}`);
  console.log(`VERIFY COMMAND:      ${verifyCommand}`);
  console.log("");
  console.log(`QUESTIONS DETECTED:  ${questions.length}`);

  if (questions.length > 0) {
    console.log("");
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      console.log(`  [${i + 1}] CATEGORY:  ${q.category}`);
      console.log(`      SEVERITY:  ${q.severity}`);
      console.log(`      CONDITION: ${q.condition}`);
      console.log(`      WHY:       ${q.why}`);
      console.log(`      ACTION:    ${q.action}`);
      if (i < questions.length - 1) console.log("");
    }
  }

  if (noiseWarning) {
    console.log("");
    console.log(`  ${noiseWarning}`);
  }

  console.log("");
  console.log(`NEXT SAFE ACTION:    ${nextSafeAction}`);
  console.log("");
  console.log(`STATUS: ${status}`);

  if (status === "BLOCKED") {
    process.exitCode = 1;
  }
}

module.exports = { runScaffoldaiQuestionCommand };
