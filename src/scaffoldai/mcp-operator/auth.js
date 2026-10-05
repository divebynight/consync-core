"use strict";

const TEAM_ISSUER = /^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.cloudflareaccess\.com$/;
const validSubject = (value) => typeof value === "string" && value.length > 0 &&
  value.length <= 256 && value.trim() === value;

function validateConfig(config) {
  if (!config || !TEAM_ISSUER.test(config.issuer) || !/^[a-f0-9]{64}$/.test(config.audience) ||
      !Array.isArray(config.subjects) || config.subjects.length < 1 || config.subjects.length > 16 ||
      !config.subjects.every(validSubject) || new Set(config.subjects).size !== config.subjects.length ||
      Object.keys(config).some((key) => !["issuer", "audience", "subjects"].includes(key))) {
    throw new Error("Invalid or missing ScaffoldAI authentication configuration.");
  }
  return Object.freeze({ issuer: config.issuer, audience: config.audience,
    subjects: Object.freeze([...config.subjects]) });
}

function loadAuthConfig(env = process.env) {
  let subjects;
  try { subjects = JSON.parse(env.SCAFFOLDAI_ACCESS_SUBJECTS || "null"); } catch {
    throw new Error("Invalid or missing ScaffoldAI authentication configuration.");
  }
  return validateConfig({ issuer: env.SCAFFOLDAI_ACCESS_ISSUER,
    audience: env.SCAFFOLDAI_ACCESS_AUD, subjects });
}

const authDiagnostics = new WeakMap();
const unknownFailure = Object.freeze({ reason: "other_auth_failure" });

function getAuthFailure(error) {
  return authDiagnostics.get(error) || unknownFailure;
}

function authError(status, reason = "other_auth_failure") {
  const error = Object.assign(new Error(status === 403 ? "Principal is not approved." : "Invalid authentication."),
    { status, code: status === 403 ? "PRINCIPAL_DENIED" : "AUTH_INVALID" });
  authDiagnostics.set(error, Object.freeze({ reason,
    ...(reason === "unapproved_subject" ? { subject_match: false } : {}) }));
  return error;
}

function createAccessVerifier(configuration, deps = {}) {
  const config = validateConfig(configuration);
  const fetchKeys = deps.fetch || globalThis.fetch;
  const now = deps.now || Date.now;
  const jwksUrl = `${config.issuer}/cdn-cgi/access/certs`;
  let nextFetchAt = -Infinity;

  async function boundedFetch(url, init) {
    // JOSE coalesces concurrent requests. This cooldown also covers failed fetches.
    if (String(url) !== jwksUrl || now() < nextFetchAt) throw authError(401);
    nextFetchAt = now() + 30000;
    const controller = new AbortController();
    let reader;
    let timer;
    try {
      return await Promise.race([
        (async () => {
          const response = await fetchKeys(url, { ...init, redirect: "error", signal: controller.signal });
          if (response.status !== 200 || response.redirected ||
              Number(response.headers.get("content-length")) > 65536 || !response.body) throw authError(401);
          reader = response.body.getReader();
          const chunks = [];
          let size = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 65536 || controller.signal.aborted) throw authError(401);
            chunks.push(value);
          }
          return new Response(Buffer.concat(chunks), { headers: { "content-type": "application/json" } });
        })(),
        new Promise((_, reject) => {
          timer = setTimeout(() => { controller.abort(); reject(authError(401)); }, 3000);
        }),
      ]);
    } finally {
      clearTimeout(timer);
      controller.abort();
      if (reader) reader.cancel().catch(() => {
        process.stderr.write("[MCP auth] JWKS stream cancellation failed.\n");
      });
    }
  }

  const joseReady = import("jose").then((jose) => {
    const keys = jose.createRemoteJWKSet(new URL(jwksUrl), {
      timeoutDuration: 3000, cooldownDuration: 30000, cacheMaxAge: 600000,
      [jose.customFetch]: boundedFetch,
    });
    return { jwtVerify: jose.jwtVerify, errors: jose.errors, keys: async (...args) => {
      try { return await keys(...args); } catch {
        throw authError(401, "jwks_failure");
      }
    } };
  });

  return async function verifyAssertion(request) {
    const assertion = request.headers["cf-access-jwt-assertion"];
    if (assertion === undefined) throw authError(401, "missing_assertion");
    const occurrences = request.rawHeaders?.filter((value, index) =>
      index % 2 === 0 && value.toLowerCase() === "cf-access-jwt-assertion").length;
    if (typeof assertion !== "string" || assertion.length > 8192 ||
        !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(assertion) ||
        (occurrences !== undefined && occurrences !== 1)) throw authError(401);
    let payload;
    let errors;
    try {
      const { jwtVerify, keys, errors: joseErrors } = await joseReady;
      errors = joseErrors;
      ({ payload } = await jwtVerify(assertion, keys, {
        algorithms: ["RS256"], issuer: config.issuer, audience: config.audience,
        requiredClaims: ["iss", "aud", "exp", "iat", "sub"],
        currentDate: new Date(now()),
      }));
      if (payload.type !== "app" || Object.hasOwn(payload, "common_name") ||
          Object.hasOwn(payload, "service_token_id")) throw authError(401, "invalid_token_type");
      if (Number.isSafeInteger(payload.iat) && payload.iat > Math.floor(now() / 1000)) {
        throw authError(401, "not_yet_valid");
      }
      if (!validSubject(payload.sub) ||
          !Number.isSafeInteger(payload.iat) || payload.iat < 0 || payload.iat > Math.floor(now() / 1000) ||
          !Number.isSafeInteger(payload.exp) || payload.exp <= payload.iat) throw authError(401);
    } catch (error) {
      // Never propagate JOSE/network diagnostics or caller-controlled assertions.
      if (authDiagnostics.has(error)) throw error;
      let reason = "other_auth_failure";
      if (errors && error instanceof errors.JWSSignatureVerificationFailed) reason = "signature_failure";
      else if (errors && error instanceof errors.JWTExpired) reason = "expired";
      else if (errors && error instanceof errors.JWTClaimValidationFailed && error.reason === "check_failed") {
        if (error.claim === "iss") reason = "issuer_mismatch";
        else if (error.claim === "aud") reason = "audience_mismatch";
        else if (error.claim === "nbf") reason = "not_yet_valid";
      }
      throw authError(401, reason);
    }
    if (!config.subjects.includes(payload.sub)) throw authError(403, "unapproved_subject");
    return Object.freeze({ issuer: config.issuer, subject: payload.sub, expiresAt: payload.exp,
      capabilities: Object.freeze(["metadata:read"]) });
  };
}

function stripCredentials(request) {
  const sensitive = new Set(["cf-access-jwt-assertion", "authorization", "cookie"]);
  for (const name of sensitive) delete request.headers[name];
  if (request.rawHeaders) request.rawHeaders = request.rawHeaders.filter((value, index, headers) =>
    !sensitive.has(headers[index - index % 2].toLowerCase()));
}

module.exports = { loadAuthConfig, createAccessVerifier, stripCredentials, getAuthFailure };
