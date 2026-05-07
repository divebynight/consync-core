"use strict";

// SDK version assumption: @modelcontextprotocol/sdk@1.29.0
// Transport: StdioClientTransport (CJS: @modelcontextprotocol/sdk/client/stdio.js)
// Client:    Client              (CJS: @modelcontextprotocol/sdk/client/index.js)

const path = require("path");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

const TEST_NAME = "mcp-transport-e2e";
const OVERALL_TIMEOUT_MS = 30000;
const CALL_TIMEOUT_MS = 5000;

const repoRoot = path.resolve(__dirname, "..", "..");
const SERVER_PATH = path.join(repoRoot, "src", "mcp", "server.js");

function pass(msg) {
  console.log(`  PASS: ${msg}`);
}

function fail(msg) {
  console.error(`  FAIL: ${msg}`);
  process.exitCode = 1;
}

function check(condition, msg) {
  if (condition) pass(msg);
  else fail(msg);
}

/**
 * Call a tool and parse the JSON from content[0].text.
 * Returns { result, parsed } or throws on call failure.
 */
async function callTool(client, name) {
  const result = await client.callTool(
    { name, arguments: {} },
    undefined,
    { timeout: CALL_TIMEOUT_MS }
  );
  const text = (result.content && result.content[0] && result.content[0].text) || "";
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }
  return { result, parsed };
}

async function main() {
  console.log(`[${TEST_NAME}] Running`);

  const transport = new StdioClientTransport({
    command: "node",
    args: [SERVER_PATH],
  });

  const client = new Client({ name: "mcp-e2e-client", version: "0.1.0" });

  try {
    await client.connect(transport);
    pass("server starts and connects without error");
  } catch (err) {
    fail(`server failed to connect: ${err.message}`);
    process.exit(1);
  }

  try {

    // -----------------------------------------------------------------------
    // scaffoldai_status
    // -----------------------------------------------------------------------

    {
      let parsed;
      try {
        ({ parsed } = await callTool(client, "scaffoldai_status"));
        pass("scaffoldai_status call succeeds");
      } catch (err) {
        fail(`scaffoldai_status call failed: ${err.message}`);
        parsed = null;
      }

      if (parsed) {
        check(parsed.execution_class === "READ_ONLY", 'scaffoldai_status returns execution_class "READ_ONLY"');
        check(typeof parsed.status === "string" && parsed.status.length > 0, "scaffoldai_status returns a valid status field");
        check(parsed.data !== null && typeof parsed.data === "object", "scaffoldai_status returns a data object");
        check(
          typeof parsed.data.active_stream === "string" || parsed.data.active_stream === null,
          "scaffoldai_status returns active_stream as string or null"
        );
        check(typeof parsed.next_safe_action === "string" && parsed.next_safe_action.length > 0, "scaffoldai_status returns next_safe_action");
      }
    }

    // -----------------------------------------------------------------------
    // scaffoldai_preflight
    // -----------------------------------------------------------------------

    {
      let parsed;
      try {
        ({ parsed } = await callTool(client, "scaffoldai_preflight"));
        pass("scaffoldai_preflight call succeeds");
      } catch (err) {
        fail(`scaffoldai_preflight call failed: ${err.message}`);
        parsed = null;
      }

      if (parsed) {
        check(parsed.execution_class === "READ_ONLY", 'scaffoldai_preflight returns execution_class "READ_ONLY"');
        check(
          parsed.status === "PASS" || parsed.status === "WARNING",
          `scaffoldai_preflight status is PASS or WARNING in healthy repo (got: ${parsed.status})`
        );
        check(Array.isArray(parsed.data && parsed.data.blockers), "scaffoldai_preflight data.blockers is an array");
        check(Array.isArray(parsed.data && parsed.data.warnings), "scaffoldai_preflight data.warnings is an array");
        check(parsed.status !== "BLOCKED", "scaffoldai_preflight is not BLOCKED in healthy repo");
      }
    }

    // -----------------------------------------------------------------------
    // scaffoldai_question
    // -----------------------------------------------------------------------

    {
      let parsed;
      try {
        ({ parsed } = await callTool(client, "scaffoldai_question"));
        pass("scaffoldai_question call succeeds");
      } catch (err) {
        fail(`scaffoldai_question call failed: ${err.message}`);
        parsed = null;
      }

      if (parsed) {
        check(parsed.execution_class === "READ_ONLY", 'scaffoldai_question returns execution_class "READ_ONLY"');
        check(parsed.status === "CLEAR", `scaffoldai_question returns status CLEAR in healthy repo (got: ${parsed.status})`);
        check(parsed.data.question_count === 0, `scaffoldai_question returns question_count 0 in healthy repo (got: ${parsed.data.question_count})`);
        check(Array.isArray(parsed.data.questions), "scaffoldai_question data.questions is an array");
        check(parsed.data.questions.length === 0, "scaffoldai_question data.questions is empty in healthy repo");
      }
    }

    // -----------------------------------------------------------------------
    // scaffoldai_verify_recommend
    // -----------------------------------------------------------------------

    {
      let parsed;
      try {
        ({ parsed } = await callTool(client, "scaffoldai_verify_recommend"));
        pass("scaffoldai_verify_recommend call succeeds");
      } catch (err) {
        fail(`scaffoldai_verify_recommend call failed: ${err.message}`);
        parsed = null;
      }

      if (parsed) {
        check(parsed.execution_class === "READ_ONLY", 'scaffoldai_verify_recommend returns execution_class "READ_ONLY"');
        check(parsed.status === "RECOMMEND", `scaffoldai_verify_recommend returns status RECOMMEND (got: ${parsed.status})`);
        check(parsed.status !== "PASS" && parsed.status !== "FAIL", "scaffoldai_verify_recommend does not return PASS or FAIL");
        check(
          parsed.data &&
            typeof parsed.data.verify_command === "string" &&
            parsed.data.verify_command.length > 0,
          "scaffoldai_verify_recommend returns a non-empty verify_command string"
        );
        // Verify evidence fields must not be present (tool is recommend-only)
        check(
          !Object.prototype.hasOwnProperty.call(parsed, "verify_passed") &&
            !Object.prototype.hasOwnProperty.call(parsed, "verify_result"),
          "scaffoldai_verify_recommend does not return verify execution evidence"
        );
      }
    }

    // -----------------------------------------------------------------------
    // scaffoldai_closeout_readiness
    // -----------------------------------------------------------------------

    {
      let parsed;
      try {
        ({ parsed } = await callTool(client, "scaffoldai_closeout_readiness"));
        pass("scaffoldai_closeout_readiness call succeeds");
      } catch (err) {
        fail(`scaffoldai_closeout_readiness call failed: ${err.message}`);
        parsed = null;
      }

      if (parsed) {
        check(parsed.execution_class === "READ_ONLY", 'scaffoldai_closeout_readiness returns execution_class "READ_ONLY"');
        check(parsed.status !== "READY_FOR_REVIEW", `scaffoldai_closeout_readiness does not return READY_FOR_REVIEW (got: ${parsed.status})`);
        check(
          parsed.data && parsed.data.verify_evidence === "not provided",
          'scaffoldai_closeout_readiness returns verify_evidence "not provided"'
        );
        check(
          typeof parsed.data.changed_file_count === "number",
          "scaffoldai_closeout_readiness returns changed_file_count as a number"
        );
        check(
          Array.isArray(parsed.data.changed_files),
          "scaffoldai_closeout_readiness returns changed_files as an array"
        );
      }
    }

  } finally {
    await client.close().catch(() => {});
  }

  if (process.exitCode !== 1) {
    console.log(`[${TEST_NAME}] PASS`);
  }
}

Promise.race([
  main(),
  new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`Test timed out after ${OVERALL_TIMEOUT_MS}ms`)),
      OVERALL_TIMEOUT_MS
    )
  ),
]).catch((err) => {
  console.error(`[${TEST_NAME}] FATAL: ${err.message}`);
  process.exitCode = 1;
  process.exit(1);
});
