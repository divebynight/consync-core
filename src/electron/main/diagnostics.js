const fs = require("node:fs");
const path = require("node:path");
const { app } = require("electron");
const { getLatestSessionArtifactPath, getLatestSessionFileName, getSessionArtifactCount } = require("../../core/session");
const packageJson = require("../../../package.json");

function createTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function normalizeError(error) {
  if (!error) {
    return {
      message: "Unknown error",
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack || null,
    };
  }

  if (typeof error === "object") {
    return {
      message: typeof error.message === "string" ? error.message : JSON.stringify(error),
      name: typeof error.name === "string" ? error.name : null,
      stack: typeof error.stack === "string" ? error.stack : null,
    };
  }

  return {
    message: String(error),
  };
}

function sanitizeDetails(details) {
  if (!details || typeof details !== "object") {
    return {};
  }

  return JSON.parse(JSON.stringify(details));
}

function createAppDiagnostics(options = {}) {
  const appLike = options.appLike || app;
  const fsModule = options.fsModule || fs;
  const pathModule = options.pathModule || path;
  const now = options.now || (() => new Date());
  const startedAt = now().toISOString();
  const diagnosticsRoot = pathModule.join(appLike.getPath("userData"), "diagnostics");
  const logPath = pathModule.join(diagnosticsRoot, "app-events.jsonl");
  const errorPath = pathModule.join(diagnosticsRoot, "errors.jsonl");
  const supportBundleRoot = pathModule.join(diagnosticsRoot, "support-bundles");

  function ensureDiagnosticsRoot() {
    fsModule.mkdirSync(diagnosticsRoot, { recursive: true });
  }

  function appendJsonLine(filePath, payload) {
    ensureDiagnosticsRoot();
    fsModule.appendFileSync(filePath, `${JSON.stringify(payload)}\n`);
  }

  function getAppInfo() {
    return {
      appName: typeof appLike.getName === "function" ? appLike.getName() : "Consync Desktop",
      appVersion: typeof appLike.getVersion === "function" ? appLike.getVersion() : packageJson.version,
      buildVersion: packageJson.version,
      diagnosticsRoot,
      isPackaged: Boolean(appLike.isPackaged),
      platform: process.platform,
      startedAt,
    };
  }

  function logEvent(type, details = {}) {
    const entry = {
      details: sanitizeDetails(details),
      timestamp: now().toISOString(),
      type,
    };

    appendJsonLine(logPath, entry);
    return entry;
  }

  function logError(type, error, details = {}) {
    const entry = {
      details: sanitizeDetails(details),
      error: normalizeError(error),
      timestamp: now().toISOString(),
      type,
    };

    appendJsonLine(errorPath, entry);
    logEvent(type, {
      ...details,
      errorMessage: entry.error.message,
    });
    return entry;
  }

  function getRecentSessionMetadata() {
    return {
      artifactCount: getSessionArtifactCount(),
      latestSessionArtifactPath: getLatestSessionArtifactPath(),
      latestSessionFileName: getLatestSessionFileName(),
    };
  }

  function copyFileIfPresent(sourcePath, targetPath) {
    if (!fsModule.existsSync(sourcePath)) {
      return false;
    }

    fsModule.copyFileSync(sourcePath, targetPath);
    return true;
  }

  function exportSupportBundle() {
    const bundlePath = pathModule.join(supportBundleRoot, `support-${createTimestamp(now())}`);
    const appInfo = getAppInfo();
    const sessionMetadata = getRecentSessionMetadata();
    const includedFiles = [];

    fsModule.mkdirSync(bundlePath, { recursive: true });

    const appInfoPath = pathModule.join(bundlePath, "app-info.json");
    fsModule.writeFileSync(appInfoPath, `${JSON.stringify(appInfo, null, 2)}\n`);
    includedFiles.push(appInfoPath);

    const sessionMetadataPath = pathModule.join(bundlePath, "recent-session-metadata.json");
    fsModule.writeFileSync(sessionMetadataPath, `${JSON.stringify(sessionMetadata, null, 2)}\n`);
    includedFiles.push(sessionMetadataPath);

    const bundleLogPath = pathModule.join(bundlePath, "app-events.jsonl");
    if (copyFileIfPresent(logPath, bundleLogPath)) {
      includedFiles.push(bundleLogPath);
    }

    const bundleErrorPath = pathModule.join(bundlePath, "errors.jsonl");
    if (copyFileIfPresent(errorPath, bundleErrorPath)) {
      includedFiles.push(bundleErrorPath);
    }

    logEvent("support-bundle-exported", {
      bundlePath,
      includedFileCount: includedFiles.length,
    });

    return {
      appInfo,
      bundlePath,
      includedFiles,
      ok: true,
      sessionMetadata,
    };
  }

  return {
    errorPath,
    exportSupportBundle,
    getAppInfo,
    logError,
    logEvent,
    logPath,
  };
}

module.exports = {
  createAppDiagnostics,
  createTimestamp,
  normalizeError,
};
