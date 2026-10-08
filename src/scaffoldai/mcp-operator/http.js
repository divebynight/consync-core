"use strict";

const http = require("http");
const { randomUUID } = require("crypto");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { isInitializeRequest } = require("@modelcontextprotocol/sdk/types.js");
const { createOperatorMcpServer } = require("./index");
const { stopOwnedPlanJobs } = require("../../lib/scaffoldaiExecutorPlanJob.lib.scaffoldai");
const { loadAuthConfig, loadSubjectCapture, createAccessVerifier, stripCredentials, getAuthFailure } = require("./auth");
const { withPrincipal } = require("../authorization");

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
  const verifyAssertion = options.verifyAssertion || createAccessVerifier(loadAuthConfig(options.authEnvironment),
    { subjectCapture: loadSubjectCapture(options.authEnvironment) });
  if (typeof verifyAssertion !== "function") throw new Error("Invalid authentication configuration.");
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
  let diagnosticRequests = 0;

  function requestDiagnostic(request, response, route) {
    // Temporary capture: at most five fixed-schema events for each of 128 requests.
    const number = diagnosticRequests < 128 ? ++diagnosticRequests : 0;
    const emit = (event, fields) => {
      if (number) process.stderr.write(`[MCP diagnostic] ${JSON.stringify({
        timestamp: new Date().toISOString(), request: number, event, ...fields,
      })}\n`);
    };
    let protocolError;
    let ended = false;
    const finish = (completion) => {
      if (ended) return;
      ended = true;
      emit("response", {
        ...(response.headersSent ? { status: response.statusCode } : {}),
        completion,
        ...(protocolError ? { protocol_error: protocolError } :
          response.headersSent && response.statusCode >= 400 ? { protocol_error: "http_rejected" } : {}),
      });
    };
    response.once("finish", () => finish("completion"));
    response.once("close", () => finish("disconnect"));
    emit("request", {
      http_method: ["GET", "POST", "DELETE", "HEAD", "OPTIONS", "PUT", "PATCH"].includes(request.method)
        ? request.method : "other",
      route,
      assertion_present: Object.hasOwn(request.headers, "cf-access-jwt-assertion"),
    });
    return { emit, error: (category) => { protocolError ||= category; } };
  }

  function expireSessions() {
    for (const [id, session] of sessions) {
      if (session.inFlight === 0 && Date.now() - session.lastUsed >= limits.sessionIdleMs) {
        sessions.delete(id);
        session.server.close().catch(() => log("Session close failed."));
      }
    }
  }
  const sweep = setInterval(expireSessions, Math.min(60000, limits.sessionIdleMs));
  sweep.unref();

  async function newSession(principal) {
    const session = { lastUsed: Date.now(), inFlight: 0, issuer: principal.issuer, subject: principal.subject };
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

  async function handleMcp(request, response, diagnostic, health = false) {
    // Admission includes authentication work; sessions require verified identity.
    expireSessions();
    const isStream = request.method === "GET" && String(request.headers.accept || "").includes("text/event-stream");
    if (activeRequests >= limits.maxRequests || (isStream && streams >= limits.maxStreams)) {
      diagnostic.error("capacity");
      sendJson(response, 503, "MCP capacity reached. Retry later.");
      return;
    }
    activeRequests++;
    if (isStream) streams++;
    let session;
    let finished = false;
    let authenticating = true;
    let released = false;
    let heartbeat;
    let streamTimer;
    let authenticationTimer;
    const release = () => {
      // Disconnecting cannot free admission while verification still consumes resources.
      if (released || !finished || authenticating) return;
      released = true;
      activeRequests--;
      if (isStream) streams--;
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      release();
      clearInterval(heartbeat);
      clearTimeout(streamTimer);
      clearTimeout(authenticationTimer);
      if (session) {
        session.inFlight--;
        session.lastUsed = Date.now();
      }
    };
    response.once("finish", finish);
    response.once("close", finish);
    let principal;
    try {
      principal = await verifyAssertion(request);
    } catch (error) {
      diagnostic.emit("authentication", { success: false, ...getAuthFailure(error) });
      const status = error.status === 403 ? 403 : 401;
      sendJson(response, status, status === 403 ? "Principal is not approved." : "Invalid authentication.");
      return;
    } finally {
      authenticating = false;
      release();
    }
    if (!principal || !principal.issuer || !principal.subject ||
        !Number.isFinite(principal.expiresAt) || principal.expiresAt * 1000 <= Date.now()) {
      diagnostic.emit("authentication", { success: false, reason: "other_auth_failure" });
      sendJson(response, 401, "Invalid authentication.");
      return;
    }
    diagnostic.emit("authentication", { success: true, subject_match: true });
    if (finished) return;
    stripCredentials(request);
    const remaining = principal.expiresAt * 1000 - Date.now();
    authenticationTimer = setTimeout(() => {
      if (!response.headersSent) sendJson(response, 401, "Authentication expired.");
      else response.end();
    }, Math.min(remaining, 2147483647));
    if (health) {
      sendJson(response, 200, { status: "healthy", server: "scaffoldai-operator" });
      return;
    }
    if (isStream) streamTimer = setTimeout(() => response.end(), Math.min(limits.streamLifetimeMs, remaining));

    if (isStream && !request.headers["mcp-session-id"]) {
      diagnostic.emit("session", {
        session_header_present: Object.hasOwn(request.headers, "mcp-session-id"), session_found: false,
      });
      response.writeHead(200, {
        "content-type": "text/event-stream", "cache-control": "no-cache",
        connection: "keep-alive", "x-mcp-session-id": "authenticated-bootstrap",
      });
      response.write(": MCP operator SSE bootstrap ready\n\n");
      heartbeat = setInterval(() => response.write(": MCP operator SSE keepalive\n\n"), 15000);
      return;
    }

    let body;
    if (request.method === "POST") {
      try { body = await collectBody(request, limits); } catch (error) {
        diagnostic.error(error.status === 413 ? "body_too_large" :
          error.status === 408 ? "body_timeout" :
            error.message === "Parse error." ? "invalid_json" : "body_read_failure");
        response.setHeader("connection", "close");
        sendJson(response, error.status || 400, error.status ? error.message : "Invalid request.");
        return;
      }
      if (finished) return;
      diagnostic.emit("protocol", { method:
        ["initialize", "notifications/initialized", "tools/list"].includes(body?.method) ? body.method : "other" });
    }
    const id = request.headers["mcp-session-id"];
    session = id ? sessions.get(id) : undefined;
    diagnostic.emit("session", {
      session_header_present: Object.hasOwn(request.headers, "mcp-session-id"), session_found: Boolean(session),
      ...(session ? { owner_match: session.issuer === principal.issuer && session.subject === principal.subject } : {}) });
    let reserved = false;
    if (!id && request.method === "POST" && isInitializeRequest(body)) {
      if (sessions.size + pendingSessions >= limits.maxSessions) {
        diagnostic.error("session_capacity");
        sendJson(response, 503, "MCP session capacity reached. Retry later.");
        return;
      }
      pendingSessions++;
      reserved = true;
      try { session = await newSession(principal); } catch (error) {
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
      diagnostic.error("missing_session");
      sendJson(response, 400, "Bad Request: No valid session ID provided");
      return;
    }
    if (session.issuer !== principal.issuer || session.subject !== principal.subject) {
      diagnostic.error("session_owner_mismatch");
      session = undefined;
      sendJson(response, 403, "Session is not accessible.");
      return;
    }
    session.inFlight++;
    session.lastUsed = Date.now();
    try {
      await withPrincipal(principal, () => session.transport.handleRequest(request, response, body));
    } catch (error) {
      diagnostic.error("transport_error");
      throw error;
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
      const diagnostic = requestDiagnostic(request, response, "other");
      diagnostic.error("invalid_url");
      sendJson(response, 400, "Invalid request URL.");
      return;
    }
    const diagnostic = requestDiagnostic(request, response,
      url.pathname === "/mcp" ? "/mcp" : url.pathname === "/health" ? "/health" : "other");
    if (url.pathname === "/mcp" || (request.method === "GET" && url.pathname === "/health")) {
      handleMcp(request, response, diagnostic, url.pathname === "/health").catch(() => {
        diagnostic.error("internal_error");
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
    for (const session of sessions.values()) session.server.close().catch(() => log("Session close failed."));
    sessions.clear();
  });
  return server;
}

function operatorAddress(env = process.env) {
  if (env.HOST && env.HOST !== "127.0.0.1") {
    throw new Error("ScaffoldAI HTTP operator must bind to 127.0.0.1.");
  }
  const port = Number(env.PORT || 3133);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Invalid operator port.");
  return { host: "127.0.0.1", port };
}

if (require.main === module) {
  const { host, port } = operatorAddress();
  const server = createOperatorHttpServer();
  server.listen(port, host, () => {
    log(`server listening on 127.0.0.1:${server.address().port}`);
    log("Access assertion verification enabled; remote policy is metadata:read and report:read only.");
    log("Cloudflare and ChatGPT integration must be verified separately.");
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

module.exports = { createOperatorHttpServer, operatorAddress, DEFAULT_LIMITS };
