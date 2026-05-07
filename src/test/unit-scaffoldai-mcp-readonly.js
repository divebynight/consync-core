"use strict";

const fs = require("fs");
const path = require("path");

const TEST_NAME = "unit-scaffoldai-mcp-readonly";

console.log(`[${TEST_NAME}] Running`);

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

// -----------------------------------------------------------------------
// Test 1: tools.js loads without error
// -----------------------------------------------------------------------

let tools;
try {
  tools = require("../mcp/tools");
  pass("tools.js loads without error");
} catch (err) {
  fail(`tools.js threw on require: ${err.message}`);
  process.exit(1);
}

// -----------------------------------------------------------------------
// Test 2: All 5 tool functions are exported
// -----------------------------------------------------------------------

const EXPECTED_TOOL_FNS = [
  "runStatusTool",
  "runPreflightTool",
  "runQuestionTool",
  "runVerifyRecommendTool",
  "runCloseoutReadinessTool",
];

for (const name of EXPECTED_TOOL_FNS) {
  check(typeof tools[name] === "function", `${name} is exported as a function`);
}

// -----------------------------------------------------------------------
// Tests 3–7: Each tool returns execution_class: "READ_ONLY"
// -----------------------------------------------------------------------

const toolFns = [
  ["runStatusTool", tools.runStatusTool],
  ["runPreflightTool", tools.runPreflightTool],
  ["runQuestionTool", tools.runQuestionTool],
  ["runVerifyRecommendTool", tools.runVerifyRecommendTool],
  ["runCloseoutReadinessTool", tools.runCloseoutReadinessTool],
];

for (const [name, fn] of toolFns) {
  try {
    const result = fn();
    check(
      result.execution_class === "READ_ONLY",
      `${name} returns execution_class "READ_ONLY"`
    );
  } catch (err) {
    fail(`${name} threw during execution: ${err.message}`);
  }
}

// -----------------------------------------------------------------------
// Test 8: runStatusTool returns active_stream when state is readable
// -----------------------------------------------------------------------

{
  const result = tools.runStatusTool();
  check(
    result.data &&
      (typeof result.data.active_stream === "string" || result.data.active_stream === null),
    "runStatusTool returns active_stream as string or null"
  );
}

// -----------------------------------------------------------------------
// Test 9: runQuestionTool returns 0 questions in healthy repo
// -----------------------------------------------------------------------

{
  const result = tools.runQuestionTool();
  check(
    result.data.question_count === 0,
    "runQuestionTool returns 0 questions in healthy repo"
  );
}

// -----------------------------------------------------------------------
// Test 10: runVerifyRecommendTool returns a non-empty verify_command string
// -----------------------------------------------------------------------

{
  const result = tools.runVerifyRecommendTool();
  check(
    result.data &&
      typeof result.data.verify_command === "string" &&
      result.data.verify_command.length > 0,
    "runVerifyRecommendTool returns a non-empty verify_command string"
  );
}

// -----------------------------------------------------------------------
// Test 11: runVerifyRecommendTool does NOT return PASS or FAIL status
// -----------------------------------------------------------------------

{
  const result = tools.runVerifyRecommendTool();
  const s = result.status || "";
  check(s !== "PASS" && s !== "FAIL", "runVerifyRecommendTool does not return PASS or FAIL status");
}

// -----------------------------------------------------------------------
// Test 12: runCloseoutReadinessTool status is not READY_FOR_REVIEW
// -----------------------------------------------------------------------

{
  const result = tools.runCloseoutReadinessTool();
  check(result.status !== "READY_FOR_REVIEW", "runCloseoutReadinessTool status is not READY_FOR_REVIEW");
}

// -----------------------------------------------------------------------
// Test 13: runCloseoutReadinessTool always returns verify_evidence: "not provided"
// -----------------------------------------------------------------------

{
  const result = tools.runCloseoutReadinessTool();
  check(
    result.data.verify_evidence === "not provided",
    'runCloseoutReadinessTool returns verify_evidence: "not provided"'
  );
}

// -----------------------------------------------------------------------
// Test 13: No MCP server/tool source file contains write operations
// -----------------------------------------------------------------------

{
  const mcpDir = path.join(__dirname, "..", "mcp");
  const forbidden = ["writeFile", "appendFile", "mkdirSync", "writeFileSync"];
  const readOnlyFiles = ["server.js", "tools.js"].map((f) => path.join(mcpDir, f));

  for (const filePath of readOnlyFiles) {
    try {
      const source = fs.readFileSync(filePath, "utf8");
      for (const pattern of forbidden) {
        check(!source.includes(pattern), `${path.basename(filePath)} does not contain "${pattern}"`);
      }
    } catch {
      fail(`Could not read ${path.basename(filePath)} for write operation check`);
    }
  }
}

// -----------------------------------------------------------------------
// Test 14: Snapshot runtime has exactly the planned local write boundary
// -----------------------------------------------------------------------

{
  const snapshotPath = path.join(__dirname, "..", "mcp", "snapshot.js");

  try {
    const source = fs.readFileSync(snapshotPath, "utf8");

    check(source.includes("StdioClientTransport"), "snapshot.js uses local stdio MCP transport");
    check(source.includes("client.callTool"), "snapshot.js calls MCP tools through the client");
    check(!source.includes('require("./tools")'), "snapshot.js does not import MCP tool functions directly");
    check(!source.includes("require(\"./tools\")"), "snapshot.js does not import MCP tool functions directly");
    check(source.includes('".scaffoldai/tmp/mcp-runtime-snapshot.json"'), "snapshot.js writes the planned snapshot path");
    check(source.includes("fs.writeFileSync(outputPath, json)"), "snapshot.js write is limited to the snapshot output variable");
    check(!source.includes("appendFile"), "snapshot.js does not append files");
    check(!source.includes("mkdirSync"), "snapshot.js does not create directories");
    check(!source.includes("http://"), "snapshot.js does not include an HTTP URL");
    check(!source.includes("https://"), "snapshot.js does not include a remote URL");
    check(!source.includes("ngrok.com"), "snapshot.js does not include ngrok usage");
  } catch {
    fail("Could not read snapshot.js for snapshot boundary check");
  }
}

// -----------------------------------------------------------------------
// Test 15: server.js is not imported by src/cli/index.js or src/index.js
// -----------------------------------------------------------------------

{
  const filesToCheck = [
    path.join(__dirname, "..", "cli", "index.js"),
    path.join(__dirname, "..", "index.js"),
  ];

  for (const filePath of filesToCheck) {
    try {
      const source = fs.readFileSync(filePath, "utf8");
      check(
        !source.includes("mcp/server") && !source.includes("mcp\\server"),
        `${path.basename(filePath)} does not import src/mcp/server.js`
      );
    } catch {
      fail(`Could not read ${path.basename(filePath)}`);
    }
  }
}

// -----------------------------------------------------------------------
// Test 16: No MCP source file contains /tmp path usage
// -----------------------------------------------------------------------

{
  const mcpDir = path.join(__dirname, "..", "mcp");

  try {
    const mcpFiles = fs
      .readdirSync(mcpDir)
      .filter((f) => f.endsWith(".js"))
      .map((f) => path.join(mcpDir, f));

    if (mcpFiles.length === 0) {
      fail("No .js files found in src/mcp/ — cannot check for /tmp usage");
    } else {
      for (const filePath of mcpFiles) {
        const source = fs.readFileSync(filePath, "utf8");
        check(!source.includes('"/tmp'), `${path.basename(filePath)} does not use /tmp path`);
      }
    }
  } catch {
    fail("Could not read src/mcp/ for /tmp check");
  }
}

if (process.exitCode !== 1) {
  console.log(`[${TEST_NAME}] PASS`);
}
