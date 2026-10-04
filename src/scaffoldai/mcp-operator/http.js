"use strict";

const http = require("http");
const { randomUUID } = require("crypto");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { isInitializeRequest } = require("@modelcontextprotocol/sdk/types.js");
const { createOperatorMcpServer } = require("./index");
const { stopOwnedPlanJobs } = require("../../lib/scaffoldaiExecutorPlanJob.lib.scaffoldai");

const DEFAULT_LIMITS = Object.freeze({
  maxBodyBytes: 256 * 1024,
  maxSessions: 16,
  sessionIdleMs: 15 * 60 * 1000,
  maxRequests: 32,
  maxStreams: 8,
  streamLifetimeMs: 60 * 1000,
  bodyTimeoutMs: 15 * 1000,
});

function log(message) {
  process.stderr.write(`[MCP operator] ${message}\n`);
}

function sendJson(response, statusCode, message) {
  if (response.headersSent || response.destroyed) return;
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(JSON.stringify(typeof message === "string"
    ? { jsonrpc: "2.0", id: null, error: { code: -32000, message } } : message));
}

function collectBody(request, limits) {
  return new Promise((resolve, reject) => {
    let bytes = 0;
    let chunks = [];
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      chunks = [];
      if (error) reject(error);
      else resolve(value);
    };
    const timer = setTimeout(() => finish(Object.assign(new Error("Request body timed out."), { status: 408 })),
      limits.bodyTimeoutMs);
    request.on("data", (chunk) => {
      if (settled) return;
      bytes += chunk.length;
      if (bytes > limits.maxBodyBytes) {
        finish(Object.assign(new Error("Request body too large."), { status: 413 }));
      } else chunks.push(chunk);
    });
    request.on("end", () => {
      if (settled) return;
      try {
        const body = Buffer.concat(chunks).toString("utf8");
        finish(null, body.trim() ? JSON.parse(body) : undefined);
      } catch {
        finish(Object.assign(new Error("Parse error."), { status: 400 }));
      }
    });
    request.on("aborted", () => finish(Object.assign(new Error("Request aborted."), { status: 400 })));
    request.on("error", (error) => finish(error));
  });
}

function createOperatorHttpServer(options = {}) {
  const limits = { ...DEFAULT_LIMITS, ...options.limits };
  for (const [name, value] of Object.entries(limits)) {
    if (!(name in DEFAULT_LIMITS) || !Number.isInteger(value) || value <= 0 || value > DEFAULT_LIMITS[name]) {
      throw new Error(`Invalid HTTP limit: ${name}`);
    }
  }
  const sessions = new Map();
  let pendingSessions = 0;
  let activeRequests = 0;
  let streams = 0;

  function expireSessions() {
    for (const [id, session] of sessions) {
      if (session.inFlight === 0 && Date.now() - session.lastUsed >= limits.sessionIdleMs) {
        sessions.delete(id);
        session.server.close().catch((error) => log(error.message));
      }
    }
  }
  const sweep = setInterval(expireSessions, Math.min(60000, limits.sessionIdleMs));
  sweep.unref();

  async function newSession() {
    const session = { lastUsed: Date.now(), inFlight: 0 };
    session.transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: randomUUID,
      enableJsonResponse: true,
      onsessioninitialized: (id) => sessions.set(id, session),
    });
    session.transport.onclose = () => sessions.delete(session.transport.sessionId);
    session.server = options.createMcpServer
      ? options.createMcpServer() : createOperatorMcpServer({ remote: true });
    await session.server.connect(session.transport);
    return session;
  }

  async function handleMcp(request, response) {
    // Future authentication must precede admission/session creation here.
    // MCP session IDs are transport state, NOT authenticated principals.
    expireSessions();
    const isStream = request.method === "GET" && String(request.headers.accept || "").includes("text/event-stream");
    if (activeRequests >= limits.maxRequests || (isStream && streams >= limits.maxStreams)) {
      sendJson(response, 503, "MCP capacity reached. Retry later.");
      return;
    }
    activeRequests++;
    if (isStream) streams++;
    let session;
    let finished = false;
    let heartbeat;
    let streamTimer;
    const finish = () => {
      if (finished) return;
      finished = true;
      activeRequests--;
      if (isStream) streams--;
      clearInterval(heartbeat);
      clearTimeout(streamTimer);
      if (session) {
        session.inFlight--;
        session.lastUsed = Date.now();
      }
    };
    response.once("finish", finish);
    response.once("close", finish);
    if (isStream) streamTimer = setTimeout(() => response.end(), limits.streamLifetimeMs);

    if (isStream && !request.headers["mcp-session-id"]) {
      response.writeHead(200, {
        "content-type": "text/event-stream", "cache-control": "no-cache",
        connection: "keep-alive", "x-mcp-session-id": "anonymous-bootstrap",
      });
      response.write(": MCP operator SSE bootstrap ready\n\n");
      heartbeat = setInterval(() => response.write(": MCP operator SSE keepalive\n\n"), 15000);
      return;
    }

    let body;
    if (request.method === "POST") {
      try { body = await collectBody(request, limits); } catch (error) {
        response.setHeader("connection", "close");
        sendJson(response, error.status || 400, error.status ? error.message : "Invalid request.");
        return;
      }
      if (finished) return;
    }
    const id = request.headers["mcp-session-id"];
    session = id ? sessions.get(id) : undefined;
    let reserved = false;
    if (!id && request.method === "POST" && isInitializeRequest(body)) {
      if (sessions.size + pendingSessions >= limits.maxSessions) {
        sendJson(response, 503, "MCP session capacity reached. Retry later.");
        return;
      }
      pendingSessions++;
      reserved = true;
      try { session = await newSession(); } catch (error) {
        pendingSessions--;
        throw error;
      }
      if (finished) {
        pendingSessions--;
        await session.server.close();
        return;
      }
    }
    if (!session) {
      sendJson(response, 400, "Bad Request: No valid session ID provided");
      return;
    }
    session.inFlight++;
    session.lastUsed = Date.now();
    try {
      await session.transport.handleRequest(request, response, body);
    } finally {
      if (reserved) {
        pendingSessions--;
        if (!session.transport.sessionId) await session.server.close();
      }
    }
  }

  const server = http.createServer((request, response) => {
    let url;
    try { url = new URL(request.url || "/", "http://localhost"); } catch {
      sendJson(response, 400, "Invalid request URL.");
      return;
    }
    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { status: "healthy", server: "scaffoldai-operator" });
    } else if (url.pathname === "/mcp") {
      handleMcp(request, response).catch((error) => {
        log(error.message);
        sendJson(response, 500, "Internal error. Inspect local diagnostics.");
        if (response.headersSent && !response.writableEnded) response.end();
      });
    } else sendJson(response, 404, { error: "Not found" });
  });
  server.maxConnections = 64;
  server.headersTimeout = 15000;
  server.requestTimeout = 30000;
  server.on("close", () => {
    clearInterval(sweep);
    for (const session of sessions.values()) session.server.close().catch((error) => log(error.message));
    sessions.clear();
  });
  return server;
}

if (require.main === module) {
  if (process.env.HOST && process.env.HOST !== "127.0.0.1") {
    throw new Error("ScaffoldAI HTTP operator must bind to 127.0.0.1.");
  }
  const port = Number(process.env.PORT || 3133);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Invalid operator port.");
  const server = createOperatorHttpServer();
  server.listen(port, "127.0.0.1", () => {
    log(`server listening on 127.0.0.1:${server.address().port}`);
    log("WARNING: caller authentication is not implemented. This is not a secure public endpoint.");
  });
  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    stopOwnedPlanJobs();
    server.close();
    server.closeAllConnections();
    setTimeout(() => {
      log("Shutdown deadline exceeded; inspect retained admission lock and executor diagnostics.");
      process.exit(1);
    }, 5000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

module.exports = { createOperatorHttpServer, DEFAULT_LIMITS };
