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
      assert.strictEqual(result.execution_class, "LOCAL_CANDIDATE_INBOX_WRITE_ONLY");
      assert.strictEqual(result.candidate_submitted, true);
      assert.strictEqual(result.accepted, false);
      assert.strictEqual(result.activated, false);
      assert.strictEqual(result.claimed, false);
      assert.strictEqual(result.active_runtime_mutated, false);
      assert.strictEqual(result.next_action_mutated, false);
      assert.ok(result.next_safe_action.includes("scaffoldai packet intake"));

      const candidatePath = path.join(fixture, result.candidate.path);
      assert.ok(fs.existsSync(candidatePath), "candidate should be written under inbox");

      const afterRuntime = fs.readFileSync(path.join(fixture, ".scaffoldai", "state", "active-runtime.json"), "utf8");
      const afterNextAction = fs.readFileSync(path.join(fixture, ".scaffoldai", "state", "next-action.md"), "utf8");
      assert.strictEqual(afterRuntime, beforeRuntime, "active-runtime must not change");
      assert.strictEqual(afterNextAction, beforeNextAction, "next-action must not change");

      console.log("  PASS: valid candidate writes only to inbox without lifecycle mutation");
    }

    // 2) Empty content is rejected without writes.
    {
      const result = runSubmitSdcCandidateTool({ content: "   " }, { repoRoot: fixture });
      assert.strictEqual(result.status, "rejected");
      assert.strictEqual(result.candidate_submitted, false);
      assert.strictEqual(result.reason, "content is required");
      console.log("  PASS: empty content rejected");
    }

    // 3) Intake-incompatible content is rejected and reports validation errors.
    {
      const invalid = runSubmitSdcCandidateTool(
        {
          content: "# SDC - Invalid\n\nMODE: PROCESS_REFACTOR\n",
        },
        { repoRoot: fixture }
      );
      assert.strictEqual(invalid.status, "rejected");
      assert.strictEqual(invalid.validation.valid, false);
      assert.ok(Array.isArray(invalid.validation.errors) && invalid.validation.errors.length > 0);
      console.log("  PASS: intake-incompatible content rejected with validation details");
    }

    // 4) suggestedFileName path traversal is rejected.
    {
      const result = runSubmitSdcCandidateTool(
        {
          content: validPacketContent("Traversal Reject Candidate"),
          suggestedFileName: "../escape.sdc.md",
        },
        { repoRoot: fixture }
      );
      assert.strictEqual(result.status, "rejected");
      assert.ok(result.reason.includes("plain filename"));
      console.log("  PASS: path traversal in suggested filename rejected");
    }

    // 5) overwrite is rejected deterministically.
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
      assert.strictEqual(second.status, "rejected");
      assert.ok(second.reason.includes("already exists"));
      console.log("  PASS: candidate overwrite is rejected");
    }

    // 6) suggestedFileName sanitizes and preserves canonical identity distinction.
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
