"use strict";

// SDK version assumption: @modelcontextprotocol/sdk@1.29.0
// Transport: StdioClientTransport (CJS: @modelcontextprotocol/sdk/client/stdio.js)
// Client:    Client              (CJS: @modelcontextprotocol/sdk/client/index.js)

const fs = require("fs");
const path = require("path");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const { getRepoRoot } = require("../lib/repoRoot.util.shared");
const {
  MAX_LOG_BYTES,
  rotatedSignalPath,
  signalPath,
  signalPathRelative,
} = require("../scaffoldai/mcp/signal");

const TEST_NAME = "mcp-transport-e2e";
const OVERALL_TIMEOUT_MS = 30000;
const CALL_TIMEOUT_MS = 5000;

const repoRoot = getRepoRoot(__dirname);
const SERVER_PATH = path.join(repoRoot, "src", "scaffoldai", "mcp", "server.js");

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
function removeFileIfPresent(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

function readSignalRecords() {
  const text = fs.readFileSync(signalPath, "utf8");
  return text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function callTool(client, name, args = {}) {
  const result = await client.callTool(
    { name, arguments: args },
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
  removeFileIfPresent(signalPath);
  removeFileIfPresent(rotatedSignalPath);

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

    // -----------------------------------------------------------------------
    // scaffoldai_completion_status
    // -----------------------------------------------------------------------

    {
      let parsed;
      try {
        ({ parsed } = await callTool(client, "scaffoldai_completion_status", {
          latestOnly: true,
          limit: 5,
        }));
        pass("scaffoldai_completion_status call succeeds");
      } catch (err) {
        fail(`scaffoldai_completion_status call failed: ${err.message}`);
        parsed = null;
      }

      if (parsed) {
        check(parsed.execution_class === "READ_ONLY", 'scaffoldai_completion_status returns execution_class "READ_ONLY"');
        check(parsed.status === "OBSERVE", `scaffoldai_completion_status returns OBSERVE (got: ${parsed.status})`);
        check(parsed.data && Array.isArray(parsed.data.completions), "scaffoldai_completion_status returns completions array");
        check(parsed.data && parsed.data.filter && parsed.data.filter.latest_only === true, "scaffoldai_completion_status reflects latest_only filter");
      }
    }

    // -----------------------------------------------------------------------
    // scaffoldai_signal
    // -----------------------------------------------------------------------

    {
      let parsed;
      try {
        ({ parsed } = await callTool(client, "scaffoldai_signal", {
          client_id: "mcp-e2e-client",
          signal_type: "connected",
          message: "transport e2e connected",
          capabilities: ["mcp_read_only", "signal_append_only"],
        }));
        pass("scaffoldai_signal valid connected call succeeds");
      } catch (err) {
        fail(`scaffoldai_signal valid connected call failed: ${err.message}`);
        parsed = null;
      }

      if (parsed) {
        check(parsed.status === "accepted", 'scaffoldai_signal returns status "accepted" for valid connected signal');
        check(parsed.execution_class === "LOCAL_SIGNAL_APPEND_ONLY", 'scaffoldai_signal returns execution_class "LOCAL_SIGNAL_APPEND_ONLY"');
        check(parsed.path === signalPathRelative, "scaffoldai_signal reports the repo-local signal path");
        check(parsed.non_authoritative === true, "scaffoldai_signal marks the record non_authoritative");
        check(typeof parsed.timestamp === "string" && parsed.timestamp.length > 0, "scaffoldai_signal returns an accepted timestamp");
      }

      if (fs.existsSync(signalPath)) {
        pass("scaffoldai_signal writes the signal file under .scaffoldai/tmp/");
        const records = readSignalRecords();
        const record = records[records.length - 1];
        check(record.client_id === "mcp-e2e-client", "signal record stores client_id");
        check(record.signal_type === "connected", "signal record stores signal_type");
        check(record.message === "transport e2e connected", "signal record stores optional message");
        check(Array.isArray(record.capabilities) && record.capabilities.length === 2, "signal record stores capabilities array");
      } else {
        fail("scaffoldai_signal did not write the signal file under .scaffoldai/tmp/");
      }
    }

    {
      const cases = [
        [
          "unknown signal type is rejected",
          { client_id: "bad-type-client", signal_type: "unknown_signal" },
        ],
        [
          "unknown fields are rejected",
          { client_id: "unknown-field-client", signal_type: "note", extra: "nope" },
        ],
        [
          "oversized message is rejected",
          { client_id: "oversized-message-client", signal_type: "note", message: "x".repeat(251) },
        ],
        [
          "invalid client_id is rejected",
          { client_id: "bad client", signal_type: "note" },
        ],
      ];

      for (const [label, args] of cases) {
        let parsed;
        try {
          ({ parsed } = await callTool(client, "scaffoldai_signal", args));
        } catch (err) {
          fail(`scaffoldai_signal ${label} call failed unexpectedly: ${err.message}`);
          parsed = null;
        }
        if (parsed) {
          check(parsed.status === "rejected", `scaffoldai_signal ${label}`);
          check(typeof parsed.reason === "string" && parsed.reason.length > 0, `scaffoldai_signal ${label} includes a reason`);
        }
      }
    }

    {
      const first = await callTool(client, "scaffoldai_signal", {
        client_id: "heartbeat-rate-client",
        signal_type: "heartbeat",
      });
      const second = await callTool(client, "scaffoldai_signal", {
        client_id: "heartbeat-rate-client",
        signal_type: "heartbeat",
      });

      check(first.parsed && first.parsed.status === "accepted", "scaffoldai_signal accepts first heartbeat");
      check(second.parsed && second.parsed.status === "rejected", "scaffoldai_signal enforces heartbeat rate limit");
    }

    {
      const first = await callTool(client, "scaffoldai_signal", {
        client_id: "non-heartbeat-rate-client",
        signal_type: "note",
      });
      const second = await callTool(client, "scaffoldai_signal", {
        client_id: "non-heartbeat-rate-client",
        signal_type: "capability_check",
      });

      check(first.parsed && first.parsed.status === "accepted", "scaffoldai_signal accepts first non-heartbeat signal");
      check(second.parsed && second.parsed.status === "rejected", "scaffoldai_signal enforces non-heartbeat rate limit");
    }

    {
      fs.writeFileSync(signalPath, "x".repeat(MAX_LOG_BYTES - 10), "utf8");
      removeFileIfPresent(rotatedSignalPath);

      const rotated = await callTool(client, "scaffoldai_signal", {
        client_id: "rotation-client",
        signal_type: "connected",
      });

      check(rotated.parsed && rotated.parsed.status === "accepted", "scaffoldai_signal accepts signal when rotating full log");
      check(fs.existsSync(rotatedSignalPath), "scaffoldai_signal rotates the signal log at 64 KB");
      check(readSignalRecords().length === 1, "scaffoldai_signal starts a fresh active log after rotation");
    }

  } finally {
    await client.close().catch(() => {});
    removeFileIfPresent(signalPath);
    removeFileIfPresent(rotatedSignalPath);
  }

  if (process.exitCode !== 1) {
    console.log(`[${TEST_NAME}] PASS`);
  }
}

function withOverallTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Test timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
    if (typeof timeoutId.unref === "function") timeoutId.unref();
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise,
  ]);
}

withOverallTimeout(main(), OVERALL_TIMEOUT_MS).catch((err) => {
  console.error(`[${TEST_NAME}] FATAL: ${err.message}`);
  process.exitCode = 1;
  process.exit(1);
});
