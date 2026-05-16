"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { runSubmitSdcCandidateTool } = require("../scaffoldai/mcp/submit-sdc-candidate");

const TEST_NAME = "unit-scaffoldai-mcp-submit-sdc-candidate";
const repoRoot = path.resolve(__dirname, "..", "..");
const tempRoot = path.join(repoRoot, ".scaffoldai", "tmp");

function validPacketContent(title = "Candidate Submission Packet") {
  return [
    `# SDC — ${title}`,
    "",
    "MODE: PROCESS_REFACTOR",
    "EXECUTION SURFACE: MCP candidate submission test",
    "",
    "APPROVAL:",
    "  execute: PENDING",
    "  commit: PENDING",
    "",
    "GOAL:",
    "Submit candidate safely.",
    "",
    "TASKS:",
    "1. Validate candidate submission.",
    "",
    "VERIFY:",
    "- npm run verify:scaffoldai",
    "",
    "OUTPUT:",
    "1. candidate submission result",
    "",
    "CONSTRAINTS:",
    "- no activation",
    "- no claim",
    "- no cleanup",
    "",
  ].join("\n");
}

function createFixtureRepo() {
  fs.mkdirSync(tempRoot, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(tempRoot, "mcp-submit-candidate-"));

  fs.mkdirSync(path.join(fixture, ".scaffoldai", "state"), { recursive: true });
  fs.mkdirSync(path.join(fixture, ".scaffoldai", "contracts"), { recursive: true });
  fs.mkdirSync(path.join(fixture, ".scaffoldai", "inbox"), { recursive: true });

  fs.writeFileSync(
    path.join(fixture, ".scaffoldai", "state", "active-runtime.json"),
    JSON.stringify({ in_flight_packet: "active-fixture-packet.sdc" }, null, 2) + "\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(fixture, ".scaffoldai", "state", "next-action.md"),
    "TYPE: REFACTOR\nPACKET_ID: active-fixture-packet.sdc\n",
    "utf8"
  );

  return fixture;
}

function cleanupFixture(fixturePath) {
  fs.rmSync(fixturePath, { recursive: true, force: true });
}

function assertCommonDiagnosticsShape(result) {
  assert.ok(Object.prototype.hasOwnProperty.call(result, "candidate_submitted"));
  assert.ok(Object.prototype.hasOwnProperty.call(result, "candidate_path"));
  assert.ok(Object.prototype.hasOwnProperty.call(result, "accepted"));
  assert.ok(Object.prototype.hasOwnProperty.call(result, "activated"));
  assert.ok(Object.prototype.hasOwnProperty.call(result, "claimed"));
  assert.ok(Object.prototype.hasOwnProperty.call(result, "active_runtime_mutated"));
  assert.ok(Object.prototype.hasOwnProperty.call(result, "next_action_mutated"));
  assert.ok(Object.prototype.hasOwnProperty.call(result, "validation_errors"));
  assert.ok(Object.prototype.hasOwnProperty.call(result, "guard_errors"));
  assert.ok(Object.prototype.hasOwnProperty.call(result, "error_category"));
}

function assertRejectedInvariants(result) {
  assertCommonDiagnosticsShape(result);
  assert.strictEqual(result.status, "rejected");
  assert.strictEqual(result.accepted, false);
  assert.strictEqual(result.activated, false);
  assert.strictEqual(result.claimed, false);
  assert.strictEqual(result.active_runtime_mutated, false);
  assert.strictEqual(result.next_action_mutated, false);
}

function main() {
  console.log(`[${TEST_NAME}] Running`);

  const fixture = createFixtureRepo();

  try {
    // 1) Valid candidate writes only to inbox and returns bounded guidance.
    {
      const beforeRuntime = fs.readFileSync(path.join(fixture, ".scaffoldai", "state", "active-runtime.json"), "utf8");
      const beforeNextAction = fs.readFileSync(path.join(fixture, ".scaffoldai", "state", "next-action.md"), "utf8");

      const result = runSubmitSdcCandidateTool(
        {
          content: validPacketContent("Bounded Inbox Candidate"),
          submittedBy: "copilot",
        },
        { repoRoot: fixture }
      );

      assert.strictEqual(result.status, "accepted");
      assertCommonDiagnosticsShape(result);
      assert.strictEqual(result.execution_class, "LOCAL_CANDIDATE_INBOX_WRITE_ONLY");
      assert.strictEqual(result.candidate_submitted, true);
      assert.ok(typeof result.candidate_path === "string" && result.candidate_path.includes(".scaffoldai/inbox/"));
      assert.strictEqual(result.accepted, false);
      assert.strictEqual(result.activated, false);
      assert.strictEqual(result.claimed, false);
      assert.strictEqual(result.active_runtime_mutated, false);
      assert.strictEqual(result.next_action_mutated, false);
      assert.strictEqual(result.error_category, null);
      assert.deepStrictEqual(result.validation_errors, []);
      assert.deepStrictEqual(result.guard_errors, []);
      assert.ok(result.next_safe_action.includes("scaffoldai packet intake"));

      const candidatePath = path.join(fixture, result.candidate.path);
      assert.ok(fs.existsSync(candidatePath), "candidate should be written under inbox");

      const afterRuntime = fs.readFileSync(path.join(fixture, ".scaffoldai", "state", "active-runtime.json"), "utf8");
      const afterNextAction = fs.readFileSync(path.join(fixture, ".scaffoldai", "state", "next-action.md"), "utf8");
      assert.strictEqual(afterRuntime, beforeRuntime, "active-runtime must not change");
      assert.strictEqual(afterNextAction, beforeNextAction, "next-action must not change");

      console.log("  PASS: valid candidate writes only to inbox without lifecycle mutation");
    }

    // 2) Missing content is rejected.
    {
      const result = runSubmitSdcCandidateTool({}, { repoRoot: fixture });
      assertRejectedInvariants(result);
      assert.strictEqual(result.candidate_submitted, false);
      assert.strictEqual(result.error_category, "schema_input_mismatch");
      assert.strictEqual(result.reason, "content must be a markdown string");
      console.log("  PASS: missing content rejected");
    }

    // 3) Non-string content is rejected.
    {
      const result = runSubmitSdcCandidateTool({ content: { markdown: true } }, { repoRoot: fixture });
      assertRejectedInvariants(result);
      assert.strictEqual(result.error_category, "schema_input_mismatch");
      assert.strictEqual(result.reason, "content must be a markdown string");
      console.log("  PASS: non-string content rejected");
    }

    // 4) Empty content is rejected without writes.
    {
      const result = runSubmitSdcCandidateTool({ content: "   " }, { repoRoot: fixture });
      assertRejectedInvariants(result);
      assert.strictEqual(result.candidate_submitted, false);
      assert.strictEqual(result.error_category, "schema_input_mismatch");
      assert.strictEqual(result.reason, "content is required");
      console.log("  PASS: empty content rejected");
    }

    // 5) Oversized content is rejected at 32KB boundary.
    {
      const overLimit = "# SDC — Oversized Candidate\n\n" + "x".repeat((32 * 1024) + 1);
      const result = runSubmitSdcCandidateTool({ content: overLimit }, { repoRoot: fixture });
      assertRejectedInvariants(result);
      assert.strictEqual(result.error_category, "size_limit");
      assert.ok(result.reason.includes("32768 bytes"));
      assert.ok(result.guard_errors.some((entry) => entry.includes("size limit")));
      console.log("  PASS: oversized content rejected at 32KB limit");
    }

    // 6) Path-style input attempts are rejected.
    {
      const result = runSubmitSdcCandidateTool(
        {
          content: validPacketContent("Path Input Attempt Candidate"),
          path: ".scaffoldai/inbox/attempt.sdc.md",
        },
        { repoRoot: fixture }
      );
      assertRejectedInvariants(result);
      assert.strictEqual(result.error_category, "schema_input_mismatch");
      assert.ok(result.reason.includes("path-based submission"));
      console.log("  PASS: path-style input attempts rejected");
    }

    // 7) Intake-incompatible content is rejected and reports validation errors.
    {
      const invalid = runSubmitSdcCandidateTool(
        {
          content: "# SDC - Invalid\n\nMODE: PROCESS_REFACTOR\n",
        },
        { repoRoot: fixture }
      );
      assertRejectedInvariants(invalid);
      assert.strictEqual(invalid.error_category, "validation_failure");
      assert.strictEqual(invalid.validation.valid, false);
      assert.ok(Array.isArray(invalid.validation_errors) && invalid.validation_errors.length > 0);
      assert.ok(Array.isArray(invalid.validation.errors) && invalid.validation.errors.length > 0);
      console.log("  PASS: intake-incompatible content rejected with validation details");
    }

    // 8) malformed markdown lacking required packet identity is rejected.
    {
      const invalid = runSubmitSdcCandidateTool(
        {
          content: [
            "MODE: PROCESS_REFACTOR",
            "EXECUTION SURFACE: missing packet identity",
            "",
            "APPROVAL:",
            "  execute: PENDING",
            "  commit: PENDING",
            "",
            "GOAL:",
            "Missing packet title identity.",
            "",
            "TASKS:",
            "1. Validate.",
            "",
            "VERIFY:",
            "- npm run verify:scaffoldai",
            "",
            "OUTPUT:",
            "1. result",
            "",
            "CONSTRAINTS:",
            "- no activation",
          ].join("\n"),
        },
        { repoRoot: fixture }
      );
      assertRejectedInvariants(invalid);
      assert.strictEqual(invalid.error_category, "validation_failure");
      assert.ok(Array.isArray(invalid.validation_errors) && invalid.validation_errors.length > 0);
      console.log("  PASS: malformed markdown lacking packet identity rejected");
    }

    // 9) suggestedFileName unsafe values are rejected.
    {
      const result = runSubmitSdcCandidateTool(
        {
          content: validPacketContent("Unsafe Filename Candidate"),
          suggestedFileName: "!!!",
        },
        { repoRoot: fixture }
      );
      assertRejectedInvariants(result);
      assert.strictEqual(result.error_category, "guard_failure");
      assert.ok(result.reason.includes("safe candidate filename"));
      console.log("  PASS: unsafe suggested filename rejected");
    }

    // 10) suggestedFileName path traversal is rejected.
    {
      const result = runSubmitSdcCandidateTool(
        {
          content: validPacketContent("Traversal Reject Candidate"),
          suggestedFileName: "../escape.sdc.md",
        },
        { repoRoot: fixture }
      );
      assertRejectedInvariants(result);
      assert.strictEqual(result.error_category, "guard_failure");
      assert.ok(result.reason.includes("plain filename"));
      console.log("  PASS: path traversal in suggested filename rejected");
    }

    // 11) duplicate filename is rejected deterministically.
    {
      const first = runSubmitSdcCandidateTool(
        {
          content: validPacketContent("Overwrite Guard Candidate"),
          suggestedFileName: "overwrite-guard",
        },
        { repoRoot: fixture }
      );
      assert.strictEqual(first.status, "accepted");

      const second = runSubmitSdcCandidateTool(
        {
          content: validPacketContent("Overwrite Guard Candidate"),
          suggestedFileName: "overwrite-guard",
        },
        { repoRoot: fixture }
      );
      assertRejectedInvariants(second);
      assert.strictEqual(second.error_category, "duplicate_or_pending_candidate_guard");
      assert.ok(second.reason.includes("already exists") || second.reason.includes("pending candidate"));
      console.log("  PASS: candidate overwrite is rejected");
    }

    // 12) duplicate packet identity is rejected deterministically.
    {
      const first = runSubmitSdcCandidateTool(
        {
          content: validPacketContent("Pending Duplicate Candidate"),
          suggestedFileName: "pending-duplicate-a",
        },
        { repoRoot: fixture }
      );
      assert.strictEqual(first.status, "accepted");

      const second = runSubmitSdcCandidateTool(
        {
          content: validPacketContent("Pending Duplicate Candidate"),
          suggestedFileName: "pending-duplicate-b",
        },
        { repoRoot: fixture }
      );
      assertRejectedInvariants(second);
      assert.strictEqual(second.error_category, "duplicate_or_pending_candidate_guard");
      assert.ok(second.reason.includes("pending candidate"));
      console.log("  PASS: pending duplicate packet identity rejected deterministically");
    }

    // 13) missing inbox is rejected without side effects.
    {
      fs.rmSync(path.join(fixture, ".scaffoldai", "inbox"), { recursive: true, force: true });
      const result = runSubmitSdcCandidateTool(
        {
          content: validPacketContent("Missing Inbox Candidate"),
        },
        { repoRoot: fixture }
      );
      assertRejectedInvariants(result);
      assert.strictEqual(result.error_category, "missing_inbox");
      assert.strictEqual(result.candidate_submitted, false);
      console.log("  PASS: missing inbox rejected clearly");

      fs.mkdirSync(path.join(fixture, ".scaffoldai", "inbox"), { recursive: true });
    }

    // 14) suggestedFileName sanitizes and preserves canonical identity distinction.
    {
      const result = runSubmitSdcCandidateTool(
        {
          content: validPacketContent("Identity Canonicalization Candidate"),
          suggestedFileName: "My Fancy Candidate Name!!!",
        },
        { repoRoot: fixture }
      );

      assert.strictEqual(result.status, "accepted");
      assert.strictEqual(result.candidate.file_name, "my-fancy-candidate-name.sdc.md");
      assert.strictEqual(result.identity.packet_id, "identity-canonicalization-candidate.sdc");
      assert.ok(result.warnings.some((entry) => entry.includes("differs from canonical intake filename")));
      console.log("  PASS: filename sanitization preserves packet identity coherence distinction");
    }

    console.log(`[${TEST_NAME}] PASS`);
  } catch (error) {
    console.error(`[${TEST_NAME}] FAIL`);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  } finally {
    cleanupFixture(fixture);
  }
}

main();
