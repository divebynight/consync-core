const fs = require("fs");
const path = require("path");

const CORE_STATE_FILES = {
  activeStream: path.join(".scaffoldai", "state", "active-stream.md"),
  nextAction: path.join(".scaffoldai", "state", "next-action.md"),
  handoff: path.join(".scaffoldai", "state", "handoff.md"),
  snapshot: path.join(".scaffoldai", "state", "snapshot.md"),
};
const STREAMS_ROOT = path.join(".scaffoldai", "streams");

const REQUIRED_HANDOFF_SECTIONS = [
  "STATUS",
  "SUMMARY",
  "FILES CREATED",
  "FILES MODIFIED",
  "COMMANDS TO RUN",
  "HUMAN VERIFICATION",
  "VERIFICATION NOTES",
];

const REQUIRED_SNAPSHOT_SECTIONS = [
  "## Active Stream",
  "## Current Package",
  "## Next Likely Packages",
];

function readRequiredFile(rootPath, relativePath, failures) {
  const absolutePath = path.join(rootPath, relativePath);

  if (!fs.existsSync(absolutePath)) {
    failures.push(`missing ${relativePath}`);
    return "";
  }

  return fs.readFileSync(absolutePath, "utf8");
}

function readOptionalFile(rootPath, relativePath) {
  const absolutePath = path.join(rootPath, relativePath);

  if (!fs.existsSync(absolutePath)) {
    return "";
  }

  return fs.readFileSync(absolutePath, "utf8");
}

function getSectionBody(text, heading) {
  const lines = text.split(/\r?\n/);
  const startIndex = lines.findIndex(line => line.trim() === heading);

  if (startIndex === -1) {
    return null;
  }

  const sectionLines = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed && /^[A-Z][A-Z0-9\s\-]+$/.test(trimmed)) {
      break;
    }

    sectionLines.push(line);
  }

  return sectionLines.join("\n").trim();
}

function getFirstSectionValue(text, heading) {
  const lines = text.split(/\r?\n/);
  const startIndex = lines.findIndex(line => line.trim() === heading);

  if (startIndex === -1) {
    return null;
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

function extractField(text, fieldName) {
  const match = text.match(new RegExp(`^${fieldName}:\\s*(.+)$`, "m"));
  return match ? match[1].trim() : null;
}

function extractBacktickListValue(text, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = "^- " + escapedLabel + ": `([^`]+)`$";
  const match = text.match(new RegExp(pattern, "m"));
  return match ? match[1] : null;
}

function parseActiveStream(text) {
  return {
    activeStream: getFirstSectionValue(text, "ACTIVE STREAM"),
    previousStream: getFirstSectionValue(text, "PREVIOUS STREAM"),
    pausedStreams: getSectionList(text, "PAUSED STREAMS"),
    liveOwnerNote: getSectionBody(text, "LIVE OWNER NOTE"),
  };
}

function getSectionList(text, heading) {
  const body = getSectionBody(text, heading);

  if (!body) {
    return [];
  }

  return body
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith("- "))
    .map(line => line.slice(2).trim())
    .filter(value => value && value !== "none");
}

function parseNextAction(text) {
  return {
    type: extractField(text, "TYPE"),
    packageName: extractField(text, "PACKAGE"),
  };
}

function parseHandoff(text) {
  return {
    type: extractField(text, "TYPE"),
    packageName: extractField(text, "PACKAGE"),
    status: getFirstSectionValue(text, "STATUS"),
  };
}

function parseSnapshot(text) {
  return {
    activeStream: extractBacktickListValue(text, "recorded active stream"),
    currentPackage: extractBacktickListValue(text, "package"),
  };
}

function parseStreamDoc(text) {
  return {
    id: extractField(text, "- id"),
    status: extractField(text, "- status"),
  };
}

function evaluateStreamLocalState(rootPath, activeStream, failures) {
  const streamsToCheck = [activeStream.activeStream, ...activeStream.pausedStreams].filter(Boolean);

  for (const streamName of streamsToCheck) {
    const relativeRoot = path.join(STREAMS_ROOT, streamName);
    const streamDocText = readRequiredFile(rootPath, path.join(relativeRoot, "stream.md"), failures);

    if (!streamDocText) {
      continue;
    }

    const streamDoc = parseStreamDoc(streamDocText);
    const isActiveStream = streamName === activeStream.activeStream;
    const expectedStatus = isActiveStream ? "active" : "paused";

    if (streamDoc.id && streamDoc.id !== streamName) {
      failures.push(`stream id mismatch for ${streamName}: ${streamDoc.id} != ${streamName}`);
    }

    if (streamDoc.status !== expectedStatus) {
      failures.push(`stream ${streamName} status mismatch: expected ${expectedStatus}, found ${streamDoc.status || "unreadable"}`);
    }
  }
}

function getMissingSections(text, sections) {
  return sections.filter(section => !text.includes(section));
}

function evaluateStateIntegrity(rootPath, mode) {
  const failures = [];
  const warnings = [];
  const normalizedMode = mode === "postflight" ? "postflight" : "preflight";
  
  // Runtime state files (gitignored) can be missing in both modes on clean checkout
  // or after cleaning ignored files. Read them optionally and validate what we have.
  // Postflight validates handoff sections more strictly, but missing runtime state
  // from a clean checkout is still acceptable.
  
  const files = {
    activeStream: readOptionalFile(rootPath, CORE_STATE_FILES.activeStream),
    nextAction: readOptionalFile(rootPath, CORE_STATE_FILES.nextAction),
    handoff: readRequiredFile(rootPath, CORE_STATE_FILES.handoff, failures),
    snapshot: readOptionalFile(rootPath, CORE_STATE_FILES.snapshot),
  };
  
  // Track missing runtime files as warnings
  const hasRuntimeState = Boolean(files.activeStream || files.snapshot);
  if (!hasRuntimeState) {
    if (!files.activeStream) warnings.push("active-stream.md missing (will be reconciled when work begins)");
    if (!files.snapshot) warnings.push("snapshot.md missing (will be reconciled when work begins)");
    if (!files.nextAction) warnings.push("next-action.md missing (will be reconciled when work begins)");
  }

  const activeStream = parseActiveStream(files.activeStream);
  const nextAction = parseNextAction(files.nextAction);
  const handoff = parseHandoff(files.handoff);
  const snapshot = parseSnapshot(files.snapshot);

  // Validate activeStream only if the file was present
  if (files.activeStream && !activeStream.activeStream) {
    failures.push("active stream is missing or unreadable");
  }

  // Validate nextAction only if the file was present  
  if (files.nextAction && (!nextAction.type || !nextAction.packageName)) {
    failures.push("mounted next-action package is missing TYPE or PACKAGE");
  }

  // Always validate handoff (it's tracked and should exist)
  if (!handoff.type || !handoff.packageName) {
    failures.push("handoff package is missing TYPE or PACKAGE");
  }

  if (!handoff.status) {
    failures.push("handoff status is missing or unreadable");
  }

  // Validate snapshot only if the file was present
  if (files.snapshot) {
    const missingSnapshotSections = getMissingSections(files.snapshot, REQUIRED_SNAPSHOT_SECTIONS);
    for (const section of missingSnapshotSections) {
      failures.push(`snapshot missing section: ${section.replace(/^##\s*/, "")}`);
    }

    if (snapshot.activeStream && activeStream.activeStream && snapshot.activeStream !== activeStream.activeStream) {
      failures.push(`snapshot active stream mismatch: ${snapshot.activeStream} != ${activeStream.activeStream}`);
    }

    if (snapshot.currentPackage && nextAction.packageName && snapshot.currentPackage !== nextAction.packageName) {
      failures.push(`snapshot current package mismatch: ${snapshot.currentPackage} != ${nextAction.packageName}`);
    }
  }

  // Validate live owner note only if active stream data is present
  if (
    activeStream.activeStream &&
    activeStream.liveOwnerNote &&
    !activeStream.liveOwnerNote.includes(`\`${activeStream.activeStream}\``)
  ) {
    failures.push("live owner note does not name the active stream explicitly");
  }

  // Validate stream-local state only if active stream is known
  if (activeStream.activeStream) {
    evaluateStreamLocalState(rootPath, activeStream, failures);
  }

  // Preflight-specific validation
  if (normalizedMode === "preflight") {
    if (
      nextAction.packageName &&
      handoff.packageName &&
      nextAction.packageName === handoff.packageName &&
      handoff.status === "PASS"
    ) {
      warnings.push("mounted next-action already matches a PASS handoff and appears stale — reconciliation recommended");
    }
  }

  if (normalizedMode === "postflight") {
    const missingHandoffSections = getMissingSections(files.handoff, REQUIRED_HANDOFF_SECTIONS);
    for (const section of missingHandoffSections) {
      failures.push(`handoff missing section: ${section}`);
    }
  }

  const ok = failures.length === 0;
  const isPackageMounted = Boolean(nextAction.packageName && nextAction.packageName !== "NONE");
  const systemState = isPackageMounted ? "OPEN" : "CLOSED";
  let nextSafeAction = "reconcile live state before continuing";
  
  // Determine status: FAIL for actual corruption, WARNING for advisory issues, PASS for clean
  let status;
  if (!ok) {
    status = "FAIL";
  } else if (warnings.length > 0) {
    status = "WARNING";
  } else {
    status = "PASS";
  }

  if (ok && normalizedMode === "preflight") {
    if (!hasRuntimeState) {
      nextSafeAction = "runtime state files missing — reconcile with scaffoldai:preflight or begin work to initialize";
    } else if (isPackageMounted) {
      nextSafeAction = `execute mounted package ${nextAction.packageName}`;
    } else {
      nextSafeAction = "no active package; define and mount the next work package";
    }
  }

  if (ok && normalizedMode === "postflight") {
    if (!hasRuntimeState) {
      nextSafeAction = "verification passed with missing runtime state — reconcile before resuming work";
    } else if (isPackageMounted && handoff.packageName && nextAction.packageName === handoff.packageName) {
      nextSafeAction = `accept closeout for ${handoff.packageName} and mount the next package intentionally`;
    } else if (isPackageMounted) {
      nextSafeAction = `last completed handoff ${handoff.packageName} is coherent; mounted package ${nextAction.packageName} is now live`;
    } else {
      nextSafeAction = `last completed handoff ${handoff.packageName} is coherent; no active package mounted`;
    }
  }

  return {
    ok,
    mode: normalizedMode,
    status,
    activeStream: activeStream.activeStream || (!hasRuntimeState ? "(runtime state missing)" : "unreadable"),
    activePackage: nextAction.packageName || (!hasRuntimeState ? "(runtime state missing)" : "unreadable"),
    handoffPackage: handoff.packageName || "unreadable",
    systemState: !hasRuntimeState ? "RUNTIME_STATE_MISSING" : systemState,
    nextSafeAction,
    streamLocalStatus: failures.some(item => item.includes("stream ") || item.includes("stream id ")) ? "FAIL" : "PASS",
    failures,
    warnings,
    hasRuntimeState,
  };
}

module.exports = {
  CORE_STATE_FILES,
  evaluateStateIntegrity,
  parseActiveStream,
  parseNextAction,
  parseHandoff,
};
