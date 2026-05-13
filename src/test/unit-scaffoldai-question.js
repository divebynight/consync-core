const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");

const TEST_NAME = "unit-scaffoldai-question";
const repoRoot = path.resolve(__dirname, "..", "..");
const cliPath = path.join(repoRoot, "src", "scaffoldai.js");

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack || error.message);
  process.exit(1);
}

function runQuestion(args = []) {
  return spawnSync(process.execPath, [cliPath, "scaffoldai", "question", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 15000,
  });
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  try {
    // 1. Command runs and produces [scaffoldai question] header
    {
      const result = runQuestion();

      assert.ok(
        result.status === 0 || result.status === 1,
        `Expected exit code 0 or 1. Got: ${result.status}\nstderr: ${result.stderr}`
      );
      assert.ok(
        result.stdout.includes("[scaffoldai question]"),
        `Expected [scaffoldai question] header. Got:\n${result.stdout}`
      );
      console.log("  PASS: command runs and produces [scaffoldai question] header");
    }

    // 2. Output includes STATUS line with a valid value
    {
      const result = runQuestion();
      const out = result.stdout;

      const hasValidStatus =
        out.includes("STATUS: CLEAR") ||
        out.includes("STATUS: QUESTION") ||
        out.includes("STATUS: WARNING") ||
        out.includes("STATUS: BLOCKED");

      assert.ok(
        hasValidStatus,
        `Expected one of STATUS: CLEAR/QUESTION/WARNING/BLOCKED. Got:\n${out}`
      );
      console.log("  PASS: output includes a valid STATUS line");
    }

    // 3. Output contains all required sections
    {
      const result = runQuestion();
      const out = result.stdout;

      assert.ok(out.includes("ACTIVE PACKET:"), `Missing ACTIVE PACKET section. Got:\n${out}`);
      assert.ok(out.includes("STREAM:"), `Missing STREAM section. Got:\n${out}`);
      assert.ok(out.includes("VERIFY COMMAND:"), `Missing VERIFY COMMAND section. Got:\n${out}`);
      assert.ok(out.includes("QUESTIONS DETECTED:"), `Missing QUESTIONS DETECTED section. Got:\n${out}`);
      assert.ok(out.includes("NEXT SAFE ACTION:"), `Missing NEXT SAFE ACTION section. Got:\n${out}`);
      console.log("  PASS: output contains all required sections");
    }

    // 4. QUESTIONS DETECTED line contains a number
    {
      const result = runQuestion();
      const out = result.stdout;

      const match = out.match(/QUESTIONS DETECTED:\s+(\d+)/);
      assert.ok(match, `Expected QUESTIONS DETECTED: <number>. Got:\n${out}`);

      const count = parseInt(match[1], 10);
      assert.ok(count >= 0, `Expected non-negative question count. Got: ${count}`);
      console.log(`  PASS: QUESTIONS DETECTED: ${count} (non-negative)`);
    }

    // 5. In healthy repo: exits 0, not BLOCKED
    {
      const result = runQuestion();

      assert.strictEqual(
        result.status,
        0,
        `Expected exit code 0 in healthy repo state. Got: ${result.status}\nOutput:\n${result.stdout}`
      );
      assert.ok(
        !result.stdout.includes("STATUS: BLOCKED"),
        `Expected no BLOCKED status in healthy repo state. Got:\n${result.stdout}`
      );
      console.log("  PASS: exits 0 and not BLOCKED in healthy repo state");
    }

    // 6. In healthy repo: question count is at or below noise threshold (3)
    {
      const result = runQuestion();
      const out = result.stdout;

      const match = out.match(/QUESTIONS DETECTED:\s+(\d+)/);
      assert.ok(match, `Expected QUESTIONS DETECTED line. Got:\n${out}`);

      const count = parseInt(match[1], 10);
      assert.ok(
        count <= 3,
        `Expected 0–3 questions in healthy repo (noise threshold). Got: ${count}\nOutput:\n${out}`
      );
      console.log(`  PASS: question count ${count} is within noise threshold (≤3)`);
    }

    // 7. When CLEAR: NEXT SAFE ACTION mentions proceeding
    //    When QUESTION/WARNING: NEXT SAFE ACTION mentions review
    {
      const result = runQuestion();
      const out = result.stdout;

      const isClear = out.includes("STATUS: CLEAR");
      const isQuestion = out.includes("STATUS: QUESTION");
      const isWarning = out.includes("STATUS: WARNING");

      if (isClear) {
        assert.ok(
          out.includes("NEXT SAFE ACTION:"),
          `Expected NEXT SAFE ACTION in CLEAR output. Got:\n${out}`
        );
        // CLEAR should not say "Resolve blocked"
        const actionLine = out.slice(out.indexOf("NEXT SAFE ACTION:"), out.indexOf("\n", out.indexOf("NEXT SAFE ACTION:")));
        assert.ok(
          !actionLine.toLowerCase().includes("blocked"),
          `CLEAR state should not reference BLOCKED in NEXT SAFE ACTION. Got: ${actionLine}`
        );
      }

      if (isQuestion || isWarning) {
        // Should mention review, not auto-action
        const actionLine = out.slice(out.indexOf("NEXT SAFE ACTION:"), out.indexOf("\n", out.indexOf("NEXT SAFE ACTION:")));
        assert.ok(
          actionLine.toLowerCase().includes("review") || actionLine.toLowerCase().includes("question"),
          `Expected review-oriented NEXT SAFE ACTION for QUESTION/WARNING state. Got: ${actionLine}`
        );
      }

      console.log("  PASS: NEXT SAFE ACTION is appropriate for current status");
    }

    // 8. Unknown flag exits 1 with error
    {
      const result = runQuestion(["--bad-flag"]);
      assert.strictEqual(result.status, 1, `Expected exit code 1 for unknown flag. Got: ${result.status}`);
      console.log("  PASS: unknown flag exits 1 with error");
    }

    // 9. Output does not contain agentic language
    {
      const result = runQuestion();
      const out = result.stdout.toLowerCase();

      const forbiddenPhrases = ["i will", "i am deciding", "i have resolved", "autonomously", "orchestrat"];
      for (const phrase of forbiddenPhrases) {
        assert.ok(
          !out.includes(phrase),
          `Output must not contain agentic language "${phrase}". Got:\n${result.stdout}`
        );
      }
      console.log("  PASS: output contains no agentic language");
    }

    // 10. Each listed question contains CATEGORY, SEVERITY, CONDITION, WHY, ACTION
    {
      const result = runQuestion();
      const out = result.stdout;

      const match = out.match(/QUESTIONS DETECTED:\s+(\d+)/);
      const count = parseInt(match[1], 10);

      if (count > 0) {
        assert.ok(out.includes("CATEGORY:"), `Expected CATEGORY: in question output. Got:\n${out}`);
        assert.ok(out.includes("SEVERITY:"), `Expected SEVERITY: in question output. Got:\n${out}`);
        assert.ok(out.includes("CONDITION:"), `Expected CONDITION: in question output. Got:\n${out}`);
        assert.ok(out.includes("WHY:"), `Expected WHY: in question output. Got:\n${out}`);
        assert.ok(out.includes("ACTION:"), `Expected ACTION: in question output. Got:\n${out}`);
        console.log(`  PASS: ${count} question(s) each include required fields`);
      } else {
        console.log("  PASS: 0 questions — field structure check skipped (CLEAR state)");
      }
    }

    // 11. EXECUTION_CLASS_BOUNDARY category is present in the lib module
    {
      const { CATEGORIES } = require("../lib/scaffoldaiQuestion.query.scaffoldai");
      assert.ok(
        CATEGORIES.EXECUTION_CLASS_BOUNDARY === "EXECUTION_CLASS_BOUNDARY",
        "Expected EXECUTION_CLASS_BOUNDARY category to be defined in CATEGORIES"
      );
      console.log("  PASS: EXECUTION_CLASS_BOUNDARY category is defined in the command module");
    }

    // 12. In healthy repo (classification doc present and DECIDED): no EXECUTION_CLASS_BOUNDARY question raised
    {
      const result = runQuestion();
      const out = result.stdout;

      assert.ok(
        !out.includes("EXECUTION_CLASS_BOUNDARY"),
        `Expected no EXECUTION_CLASS_BOUNDARY question in healthy repo state. Got:\n${out}`
      );
      console.log("  PASS: no EXECUTION_CLASS_BOUNDARY question in healthy repo state");
    }

    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  }
}

main();
