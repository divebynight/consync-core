"use strict";

const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { createReadonlyMcpServer } = require("./index");

function log(message) {
  process.stderr.write(`[MCP readonly] ${message}\n`);
}

async function main() {
  const server = createReadonlyMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("server started");
}

main().catch((error) => {
  log(error && error.message ? error.message : String(error));
  process.exitCode = 1;
});
