const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");
const { inferCommitPrefix, parseArgs } = require("../commands/scaffoldai-closeout");

const TEST_NAME = "unit-scaffoldai-closeout";
const repoRoot = path.resolve(__dirname, "..", "..");
const cliPath = path.join(repoRoot, "src", "index.js");

function fail(error) {
  console.error(`[${TEST_NAME}] FAIL`);
  console.error(error.stack || error.message);
  process.exit(1);
}

function runCloseout(args = []) {
  return spawnSync(process.execPath, [cliPath, "scaffoldai", "closeout", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 15000,
  });
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  try {
    // -----------------------------------------------------------------------
    // Unit tests — inferCommitPrefix
    // -----------------------------------------------------------------------

    // 1. No files → null
    {
      const result = inferCommitPrefix([], null);
      assert.strictEqual(result, null, `Expected null for empty files. Got: ${result}`);
      console.log("  PASS: no changed files → no prefix");
    }

    // 2. .scaffoldai/ only → process:
    // Use real git status --short format: XY (2 chars) + space + path
    {
      const result = inferCommitPrefix([" M .scaffoldai/state/next-action.md"], null);
      assert.strictEqual(result, "process:", `Expected process: for .scaffoldai/ only. Got: ${result}`);
      console.log("  PASS: .scaffoldai/ only → process:");
    }

    // 3. src/test/ only → test:
    {
      const result = inferCommitPrefix([" M src/test/unit-something.js"], null);
      assert.strictEqual(result, "test:", `Expected test: for src/test/ only. Got: ${result}`);
      console.log("  PASS: src/test/ only → test:");
    }

    // 4. src/commands/ → feat: (no contract context)
    {
      const result = inferCommitPrefix([" M src/commands/foo.js"], null);
      assert.strictEqual(result, "feat:", `Expected feat: for src/commands/ only. Got: ${result}`);
      console.log("  PASS: src/commands/ only → feat:");
    }

    // 5. process contract + src/commands/ → process:
    {
      const contract = { allowed_packet_types: ["process", "contract", "planning"] };
      const result = inferCommitPrefix([" M src/commands/scaffoldai-closeout.js"], contract);
      assert.strictEqual(result, "process:", `Expected process: with process contract context. Got: ${result}`);
      console.log("  PASS: process contract context → process:");
    }

    // 6. README.md only → docs:
    {
      const result = inferCommitPrefix([" M README.md"], null);
      assert.strictEqual(result, "docs:", `Expected docs: for .md only. Got: ${result}`);
      console.log("  PASS: .md only → docs:");
    }

    // 7. package.json only → chore:
    {
      const result = inferCommitPrefix([" M package.json"], null);
      assert.strictEqual(result, "chore:", `Expected chore: for package.json only. Got: ${result}`);
      console.log("  PASS: package.json only → chore:");
    }

    // -----------------------------------------------------------------------
    // Unit tests — parseArgs
    // -----------------------------------------------------------------------

    // 8. No args
    {
      const result = parseArgs([]);
      assert.strictEqual(result.verifyPassed, false, "Expected verifyPassed: false for empty args");
      assert.ok(!result.error, `Unexpected error: ${result.error}`);
      console.log("  PASS: parseArgs([]) → verifyPassed: false");
    }

    // 9. --verify-passed
    {
      const result = parseArgs(["--verify-passed"]);
      assert.strictEqual(result.verifyPassed, true, "Expected verifyPassed: true");
      assert.ok(!result.error, `Unexpected error: ${result.error}`);
      console.log("  PASS: parseArgs(['--verify-passed']) → verifyPassed: true");
    }

    // 10. Unknown flag
    {
      const result = parseArgs(["--unknown-flag"]);
      assert.ok(result.error, "Expected error for unknown flag");
      console.log("  PASS: unknown flag → error");
    }

    // -----------------------------------------------------------------------
    // CLI integration tests
    // -----------------------------------------------------------------------

    // 11. Command runs and produces [scaffoldai closeout] header
    {
      const result = runCloseout();

      assert.ok(
        result.status === 0 || result.status === 1,
        `Expected exit code 0 or 1. Got: ${result.status}\nstderr: ${result.stderr}`
      );
      assert.ok(
        result.stdout.includes("[scaffoldai closeout]"),
        `Expected [scaffoldai closeout] header. Got:\n${result.stdout}`
      );
      console.log("  PASS: command runs and produces [scaffoldai closeout] header");
    }

    // 12. Output contains all required sections
    {
      const result = runCloseout();
      const out = result.stdout;

      assert.ok(out.includes("ACTIVE PACKET:"), `Missing ACTIVE PACKET. Got:\n${out}`);
      assert.ok(out.includes("CHANGED FILES:"), `Missing CHANGED FILES. Got:\n${out}`);
      assert.ok(out.includes("VERIFY COMMAND:"), `Missing VERIFY COMMAND. Got:\n${out}`);
      assert.ok(out.includes("VERIFICATION EVIDENCE:"), `Missing VERIFICATION EVIDENCE. Got:\n${out}`);
      assert.ok(out.includes("COMMIT PREFIX:"), `Missing COMMIT PREFIX. Got:\n${out}`);
      assert.ok(out.includes("COMMIT SUGGESTION:"), `Missing COMMIT SUGGESTION. Got:\n${out}`);
      assert.ok(out.includes("BLOCKERS:"), `Missing BLOCKERS. Got:\n${out}`);
      assert.ok(out.includes("WARNINGS:"), `Missing WARNINGS. Got:\n${out}`);
      assert.ok(out.includes("NEXT SAFE ACTION:"), `Missing NEXT SAFE ACTION. Got:\n${out}`);
      assert.ok(out.includes("STATUS:"), `Missing STATUS line. Got:\n${out}`);
      console.log("  PASS: output contains all required sections");
    }

    // 13. Without --verify-passed, status must not be READY_FOR_REVIEW when changes exist
    //     (in a dirty repo) — or be CLEAN/NEEDS_VERIFICATION in clean repo
    {
      const result = runCloseout();
      const out = result.stdout;

      const isClean = out.includes("STATUS: CLEAN");
      const isNeedsVerification = out.includes("STATUS: NEEDS_VERIFICATION");
      const isBlocked = out.includes("STATUS: BLOCKED");
      const isReadyForReview = out.includes("STATUS: READY_FOR_REVIEW");

      // Without --verify-passed, READY_FOR_REVIEW must not appear
      assert.ok(
        !isReadyForReview,
        `STATUS: READY_FOR_REVIEW must not appear without --verify-passed. Got:\n${out}`
      );

      assert.ok(
        isClean || isNeedsVerification || isBlocked,
        `Expected STATUS: CLEAN, NEEDS_VERIFICATION, or BLOCKED without --verify-passed. Got:\n${out}`
      );

      console.log("  PASS: without --verify-passed → no READY_FOR_REVIEW");
    }

    // 14. With --verify-passed, if there are changes → READY_FOR_REVIEW or WARNING
    //     If no changes → CLEAN
    {
      const result = runCloseout(["--verify-passed"]);
      const out = result.stdout;

      const isClean = out.includes("STATUS: CLEAN");
      const isReady = out.includes("STATUS: READY_FOR_REVIEW");
      const isWarning = out.includes("STATUS: WARNING");
      const isBlocked = out.includes("STATUS: BLOCKED");

      assert.ok(
        isClean || isReady || isWarning || isBlocked,
        `Expected a valid status with --verify-passed. Got:\n${out}`
      );

      // Verify evidence line mentions --verify-passed
      assert.ok(
        out.includes("--verify-passed"),
        `Expected --verify-passed in VERIFICATION EVIDENCE line. Got:\n${out}`
      );

      console.log("  PASS: --verify-passed changes verification evidence line");
    }

    // 15. Commit prefix section is advisory (contains prefix text, not a command that runs)
    {
      const result = runCloseout();
      const out = result.stdout;

      // COMMIT SUGGESTION must be present and contain advisory text only
      const suggestionIdx = out.indexOf("COMMIT SUGGESTION:");
      assert.ok(suggestionIdx !== -1, `Expected COMMIT SUGGESTION section. Got:\n${out}`);

      const line = out.slice(suggestionIdx, out.indexOf("\n", suggestionIdx));

      // Must not contain shell execution indicators (npm/node run lines)
      assert.ok(!line.includes("npm run"), `COMMIT SUGGESTION should not contain npm run. Got: ${line}`);
      assert.ok(!line.includes("node src/"), `COMMIT SUGGESTION should not contain node invocations. Got: ${line}`);

      console.log("  PASS: commit suggestion is advisory text only");
    }

    // 16. Unknown flag exits non-zero with error
    {
      const result = runCloseout(["--bad-flag"]);
      assert.strictEqual(result.status, 1, `Expected exit code 1 for unknown flag. Got: ${result.status}`);
      console.log("  PASS: unknown flag exits 1 with error");
    }

    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    fail(error);
  }
}

main();
