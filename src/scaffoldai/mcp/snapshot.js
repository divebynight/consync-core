"use strict";

const fs = require("fs");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const {
  getRepoRoot,
  resolveFromRepoRoot,
  resolveScaffoldAIPath,
} = require("../../lib/repoRoot.util.shared");

const SNAPSHOT_VERSION = "1.0.0";
const EXECUTION_CLASS = "READ_ONLY";
const CALL_TIMEOUT_MS = 5000;

const repoRoot = getRepoRoot(__dirname);
const outputPath = resolveScaffoldAIPath("tmp", "mcp-runtime-snapshot.json");
const outputPathRelative = ".scaffoldai/tmp/mcp-runtime-snapshot.json";
const serverPath = resolveFromRepoRoot("src", "scaffoldai", "mcp", "server.js");

const TOOL_NAMES = [
  "scaffoldai_status",
  "scaffoldai_preflight",
  "scaffoldai_question",
  "scaffoldai_verify_recommend",
  "scaffoldai_closeout_readiness",
];

function isoNow() {
  return new Date().toISOString();
}

function sanitizeErrorMessage(err) {
  const message = err && err.message ? String(err.message) : "Unknown error";
  return message.replaceAll(repoRoot, "<repo>");
}

function errorRecord(type, err, recoverable) {
  return {
    type,
    message: sanitizeErrorMessage(err),
    recoverable,
  };
}

function createBaseSnapshot(generatedAt) {
  return {
    snapshot_version: SNAPSHOT_VERSION,
    generated_at: generatedAt,
    execution_class: EXECUTION_CLASS,
    command: "npm run scaffoldai:mcp:snapshot",
    client: {
      name: "scaffoldai-mcp-snapshot",
      transport: "stdio",
      server_command: "node",
      server_args: ["src/scaffoldai/mcp/server.js"],
      remote_access: false,
      http: false,
      ngrok: false,
    },
    output: {
      path: outputPathRelative,
      format: "json",
      pretty_printed: true,
    },
    summary: {
      tool_count: TOOL_NAMES.length,
      succeeded: 0,
      failed: 0,
      partial_success: false,
    },
    tools: {},
  };
}

function updateSummary(snapshot) {
  const toolResults = Object.values(snapshot.tools);
  const succeeded = toolResults.filter((tool) => tool.ok === true).length;
  const failed = toolResults.filter((tool) => tool.ok === false).length;

  snapshot.summary = {
    tool_count: TOOL_NAMES.length,
    succeeded,
    failed,
    partial_success: succeeded > 0 && failed > 0,
  };
}

async function callSnapshotTool(client, toolName) {
  const calledAt = isoNow();

  try {
    const result = await client.callTool(
      { name: toolName, arguments: {} },
      undefined,
      { timeout: CALL_TIMEOUT_MS }
    );
    const text = (result.content && result.content[0] && result.content[0].text) || "";

    try {
      return {
        ok: true,
        called_at: calledAt,
        result: JSON.parse(text),
      };
    } catch (err) {
      return {
        ok: false,
        called_at: calledAt,
        error: errorRecord("TOOL_JSON_PARSE_FAILED", err, true),
      };
    }
  } catch (err) {
    return {
      ok: false,
      called_at: calledAt,
      error: errorRecord("TOOL_CALL_FAILED", err, true),
    };
  }
}

function markAllToolsFailed(snapshot, type, err) {
  for (const toolName of TOOL_NAMES) {
    snapshot.tools[toolName] = {
      ok: false,
      called_at: isoNow(),
      error: errorRecord(type, err, false),
    };
  }
  updateSummary(snapshot);
}

function writeAndPrintSnapshot(snapshot) {
  const json = JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(outputPath, json);
  process.stdout.write(json);
}

async function main() {
  const snapshot = createBaseSnapshot(isoNow());
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  });
  const client = new Client({ name: "scaffoldai-mcp-snapshot", version: SNAPSHOT_VERSION });
  let connected = false;

  try {
    await client.connect(transport);
    connected = true;

    for (const toolName of TOOL_NAMES) {
      snapshot.tools[toolName] = await callSnapshotTool(client, toolName);
    }

    updateSummary(snapshot);
  } catch (err) {
    markAllToolsFailed(snapshot, "MCP_CONNECT_FAILED", err);
  } finally {
    if (connected) {
      await client.close().catch(() => {});
    }
  }

  try {
    writeAndPrintSnapshot(snapshot);
  } catch (err) {
    snapshot.snapshot_error = errorRecord("SNAPSHOT_WRITE_FAILED", err, false);
    const json = JSON.stringify(snapshot, null, 2);
    process.stdout.write(json);
    process.exitCode = 1;
    return;
  }

  if (snapshot.summary.succeeded === 0 || snapshot.summary.failed === TOOL_NAMES.length) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  const snapshot = createBaseSnapshot(isoNow());
  markAllToolsFailed(snapshot, "MCP_CONNECT_FAILED", err);

  try {
    writeAndPrintSnapshot(snapshot);
  } catch (writeErr) {
    snapshot.snapshot_error = errorRecord("SNAPSHOT_WRITE_FAILED", writeErr, false);
    process.stdout.write(JSON.stringify(snapshot, null, 2));
  }

  process.exitCode = 1;
});
