const fs = require("fs");
const path = require("path");

const CORE_STATE_FILES = {
  activeStream: path.join(".consync", "state", "active-stream.md"),
  nextAction: path.join(".consync", "state", "next-action.md"),
  handoff: path.join(".consync", "state", "handoff.md"),
  snapshot: path.join(".consync", "state", "snapshot.md"),
};
const STREAMS_ROOT = path.join(".consync", "streams");

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
  const normalizedMode = mode === "postflight" ? "postflight" : "preflight";
  const files = {
    activeStream: readRequiredFile(rootPath, CORE_STATE_FILES.activeStream, failures),
    nextAction: readRequiredFile(rootPath, CORE_STATE_FILES.nextAction, failures),
    handoff: readRequiredFile(rootPath, CORE_STATE_FILES.handoff, failures),
    snapshot: readRequiredFile(rootPath, CORE_STATE_FILES.snapshot, failures),
  };

  const activeStream = parseActiveStream(files.activeStream);
  const nextAction = parseNextAction(files.nextAction);
  const handoff = parseHandoff(files.handoff);
  const snapshot = parseSnapshot(files.snapshot);

  if (!activeStream.activeStream) {
    failures.push("active stream is missing or unreadable");
  }

  if (!nextAction.type || !nextAction.packageName) {
    failures.push("mounted next-action package is missing TYPE or PACKAGE");
  }

  if (!handoff.type || !handoff.packageName) {
    failures.push("handoff package is missing TYPE or PACKAGE");
  }

  if (!handoff.status) {
    failures.push("handoff status is missing or unreadable");
  }

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

  if (
    activeStream.activeStream &&
    activeStream.liveOwnerNote &&
    !activeStream.liveOwnerNote.includes(`\`${activeStream.activeStream}\``)
  ) {
    failures.push("live owner note does not name the active stream explicitly");
  }

  evaluateStreamLocalState(rootPath, activeStream, failures);

  if (normalizedMode === "preflight") {
    if (
      nextAction.packageName &&
      handoff.packageName &&
      nextAction.packageName === handoff.packageName &&
      handoff.status === "PASS"
    ) {
      failures.push("mounted next-action already matches a PASS handoff and appears stale");
    }
  }

  if (normalizedMode === "postflight") {
    const missingHandoffSections = getMissingSections(files.handoff, REQUIRED_HANDOFF_SECTIONS);
    for (const section of missingHandoffSections) {
      failures.push(`handoff missing section: ${section}`);
    }

    if (nextAction.type && handoff.type && nextAction.type !== handoff.type) {
      failures.push(`TYPE mismatch: next-action=${nextAction.type}, handoff=${handoff.type}`);
    }

    if (nextAction.packageName && handoff.packageName && nextAction.packageName !== handoff.packageName) {
      failures.push(`PACKAGE mismatch: next-action=${nextAction.packageName}, handoff=${handoff.packageName}`);
    }
  }

  const ok = failures.length === 0;
  const systemState = nextAction.packageName ? "OPEN" : "CLOSED";
  let nextSafeAction = "reconcile live state before continuing";

  if (ok && normalizedMode === "preflight") {
    nextSafeAction = `execute mounted package ${nextAction.packageName}`;
  }

  if (ok && normalizedMode === "postflight") {
    nextSafeAction = `accept closeout for ${handoff.packageName} and mount the next package intentionally`;
  }

  return {
    ok,
    mode: normalizedMode,
    status: ok ? "PASS" : "FAIL",
    activeStream: activeStream.activeStream || "unreadable",
    activePackage: nextAction.packageName || "unreadable",
    handoffPackage: handoff.packageName || "unreadable",
    systemState,
    nextSafeAction,
    streamLocalStatus: failures.some(item => item.includes("stream ") || item.includes("stream id ")) ? "FAIL" : "PASS",
    failures,
  };
}

module.exports = {
  CORE_STATE_FILES,
  evaluateStateIntegrity,
  parseActiveStream,
  parseNextAction,
  parseHandoff,
};