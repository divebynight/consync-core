const fs = require("fs");
const path = require("path");
const { validateLoopTexts } = require("../src/lib/handoffContractChecker");

const repoRoot = path.resolve(__dirname, "..");
const nextActionPath = path.join(repoRoot, ".consync", "state", "next-action.md");
const handoffPath = path.join(repoRoot, ".consync", "state", "handoff.md");

function main() {
  const nextActionText = fs.readFileSync(nextActionPath, "utf8");
  const handoffText = fs.readFileSync(handoffPath, "utf8");
  const result = validateLoopTexts(nextActionText, handoffText);

  if (result.ok) {
    console.log("STATUS: PASS");
    console.log("CHECKS:");
    console.log("- next-action identity present");
    console.log("- handoff required sections present");
    console.log("- TYPE matches between live files");
    console.log("- PACKAGE matches between live files");
    process.exit(0);
  }

  console.log("STATUS: FAIL");
  console.log("ERRORS:");

  for (const error of result.errors) {
    console.log(`- ${error}`);
  }

  process.exit(1);
}

main();