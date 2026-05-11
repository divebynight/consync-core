"use strict";

const http = require("http");
const { randomUUID } = require("crypto");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { isInitializeRequest } = require("@modelcontextprotocol/sdk/types.js");
const { createReadonlyMcpServer } = require("./index");

const DEFAULT_PORT = 3000;
const PORT = Number.parseInt(process.env.PORT || `${DEFAULT_PORT}`, 10);
const HOST = process.env.HOST || "127.0.0.1";

const sessions = new Map();

function log(message) {
  process.stderr.write(`[MCP readonly] ${message}\n`);
}

function sendJson(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    "content-type": "application/json",
    ...headers,
  });
  response.end(JSON.stringify(body));
}

function collectBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      if (!body.trim()) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

async function createSessionTransport() {
  let transport;
  transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      sessions.set(sessionId, transport);
      log(`session initialized: ${sessionId}`);
    },
  });

  transport.onclose = () => {
    const sessionId = transport.sessionId;
    if (sessionId) {
      sessions.delete(sessionId);
      log(`session closed: ${sessionId}`);
    }
  };

  const server = createReadonlyMcpServer();
  await server.connect(transport);
  return transport;
}

async function handleMcp(request, response) {
  if (
    request.method === "GET" &&
    !request.headers["mcp-session-id"] &&
    String(request.headers.accept || "").includes("text/event-stream")
  ) {
    response.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
      "x-mcp-session-id": "anonymous-bootstrap",
    });
    response.write(": MCP readonly SSE bootstrap ready\n\n");

    const heartbeat = setInterval(() => {
      if (!response.writableEnded) {
        response.write(": MCP readonly SSE keepalive\n\n");
      }
    }, 15000);

    request.on("close", () => {
      clearInterval(heartbeat);
    });
    return;
  }

  let parsedBody;
  if (request.method === "POST") {
    try {
      parsedBody = await collectBody(request);
    } catch {
      sendJson(response, 400, {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: "Parse error",
        },
      });
      return;
    }
  }

  const sessionId = request.headers["mcp-session-id"];
  let transport = sessionId ? sessions.get(sessionId) : null;

  if (!transport && request.method === "POST" && isInitializeRequest(parsedBody)) {
    transport = await createSessionTransport();
  }

  if (!transport) {
    sendJson(response, 400, {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32000,
        message: "Bad Request: No valid session ID provided",
      },
    });
    return;
  }

  await transport.handleRequest(request, response, parsedBody);
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, {
      status: "healthy",
      server: "scaffoldai-readonly",
    });
    return;
  }

  if (url.pathname === "/mcp") {
    handleMcp(request, response).catch((error) => {
      log(error && error.message ? error.message : String(error));
      if (!response.headersSent) {
        sendJson(response, 500, {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32603,
            message: "Internal error",
          },
        });
      }
    });
    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(PORT, HOST, () => {
  log(`server listening on ${HOST}:${PORT}`);
});
