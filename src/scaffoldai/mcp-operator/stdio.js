"use strict";

const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { createOperatorMcpServer } = require("./index");

function log(message) {
  process.stderr.write(`[MCP operator] ${message}\n`);
}

async function main() {
  const server = createOperatorMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("server started");
}

main().catch((error) => {
  log(error && error.message ? error.message : String(error));
  process.exitCode = 1;
});
