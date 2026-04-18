const assert = require("node:assert");
const { validateLoopTexts } = require("../lib/handoffContractChecker");

function main() {
  const validNextAction = [
    "TYPE: PROCESS",
    "PACKAGE: sample_package",
    "",
    "GOAL",
    "",
    "Capture the current contract.",
    "",
    "DO",
    "",
    "1. Inspect the files.",
    "",
    "CONSTRAINTS",
    "",
    "- Keep it small.",
    "",
    "VERIFICATION",
    "",
    "- Run the checker.",
  ].join("\n");

  const validHandoff = [
    "TYPE: PROCESS",
    "PACKAGE: sample_package",
    "",
    "STATUS",
    "",
    "PASS",
    "",
    "SUMMARY",
    "",
    "Captured the contract.",
    "",
    "FILES CREATED",
    "",
    "- none",
    "",
    "FILES MODIFIED",
    "",
    "- none",
    "",
    "COMMANDS TO RUN",
    "",
    "- node scripts/check-handoff-contract.js",
    "",
    "HUMAN VERIFICATION",
    "",
    "1. Confirm the sections exist.",
    "",
    "VERIFICATION NOTES",
    "",
    "- Checked manually.",
    "",
    "NEXT RECOMMENDED PACKAGE",
    "",
    "- Add a tiny generator later.",
  ].join("\n");

  const validResult = validateLoopTexts(validNextAction, validHandoff);
  assert.strictEqual(validResult.ok, true);
  assert.deepStrictEqual(validResult.errors, []);

  const invalidHandoff = validHandoff.replace("PACKAGE: sample_package", "PACKAGE: other_package").replace(
    "VERIFICATION NOTES\n\n- Checked manually.\n\nNEXT RECOMMENDED PACKAGE",
    "NEXT RECOMMENDED PACKAGE"
  );

  const invalidResult = validateLoopTexts(validNextAction, invalidHandoff);
  assert.strictEqual(invalidResult.ok, false);
  assert(invalidResult.errors.includes("handoff missing section: VERIFICATION NOTES"));
  assert(invalidResult.errors.includes("PACKAGE mismatch: next-action=sample_package, handoff=other_package"));

  console.log("PASS");
}

main();