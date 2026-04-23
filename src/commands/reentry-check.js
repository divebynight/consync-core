const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

const STATE_ROOT = path.join(".consync", "state");

function readFile(rootPath, relativePath) {
  const absolutePath = path.join(rootPath, relativePath);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  return fs.readFileSync(absolutePath, "utf8");
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

function getNextLikelyPackages(text) {
  const lines = text.split(/\r?\n/);
  const startIndex = lines.findIndex(line => line.trim() === "## Next Likely Packages");

  if (startIndex === -1) {
    return [];
  }

  const items = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (line.startsWith("## ")) {
      break;
    }

    if (line.startsWith("- ")) {
      items.push(line.slice(2).trim());
    }
  }

  return items;
}

function getCurrentPackage(text) {
  const lines = text.split(/\r?\n/);
  const startIndex = lines.findIndex(line => line.trim() === "## Current Package");

  if (startIndex === -1) {
    return null;
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (line.startsWith("## ")) {
      break;
    }

    if (line && line !== "- none") {
      return line.replace(/^-\s*/, "").trim();
    }
  }

  return null;
}

function getHandoffField(text, fieldName) {
  // Try inline format first: "FIELD: value"
  const inlineMatch = text.match(new RegExp(`^${fieldName}:\\s*(.+)$`, "m"));

  if (inlineMatch) {
    return inlineMatch[1].trim();
  }

  // Fall back to section-heading format: heading then next non-empty line
  const lines = text.split(/\r?\n/);
  const headingIndex = lines.findIndex(line => line.trim() === fieldName);

  if (headingIndex === -1) {
    return null;
  }

  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

function getWorkingTreeStatus(rootPath) {
  try {
    const result = execSync("git status --porcelain", {
      cwd: rootPath,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    return result.trim().length === 0 ? "clean" : "dirty";
  } catch {
    return "unknown";
  }
}

function makePromptSession() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  const lineQueue = [];
  const waiters = [];

  rl.on("line", line => {
    if (waiters.length > 0) {
      waiters.shift()(line.trim());
    } else {
      lineQueue.push(line.trim());
    }
  });

  return {
    ask(question) {
      process.stdout.write(question);
      return new Promise(resolve => {
        if (lineQueue.length > 0) {
          resolve(lineQueue.shift());
        } else {
          waiters.push(resolve);
        }
      });
    },
    close() {
      rl.close();
    },
  };
}

async function runReentryCheckCommand(options) {
  const rootPath = options && options.rootPath ? path.resolve(options.rootPath) : process.cwd();

  const activeStreamText = readFile(rootPath, path.join(STATE_ROOT, "active-stream.md"));
  const snapshotText = readFile(rootPath, path.join(STATE_ROOT, "snapshot.md"));
  const handoffText = readFile(rootPath, path.join(STATE_ROOT, "handoff.md"));

  if (!activeStreamText || !snapshotText || !handoffText) {
    console.log("RE-ENTRY CHECK: state files missing — run check:state-preflight for details");
    process.exitCode = 1;
    return;
  }

  const activeStream = getFirstSectionValue(activeStreamText, "ACTIVE STREAM") || "unknown";
  const pausedStreams = getSectionList(activeStreamText, "PAUSED STREAMS");
  const currentPackage = getCurrentPackage(snapshotText);
  const systemState = currentPackage ? "OPEN" : "CLOSED";
  const nextLikely = getNextLikelyPackages(snapshotText);
  const lastPackage = getHandoffField(handoffText, "PACKAGE") || "unknown";
  const lastStatus = getHandoffField(handoffText, "STATUS") || "unknown";
  const lastSummary = getHandoffField(handoffText, "SUMMARY") || "unknown";
  const workingTree = getWorkingTreeStatus(rootPath);

  const recommendedAction = systemState === "CLOSED" && workingTree === "clean"
    ? "mount new package"
    : workingTree === "dirty"
      ? "review working tree before mount"
      : "review state before proceeding";

  console.log("");
  console.log("CONSYNC RE-ENTRY SUMMARY");
  console.log("");
  console.log(`ACTIVE STREAM:     ${activeStream}`);
  console.log(`SYSTEM STATE:      ${systemState}${systemState === "CLOSED" ? "  (no open package)" : `  (open: ${currentPackage})`}`);
  console.log(`WORKING TREE:      ${workingTree}`);
  console.log("");
  console.log(`LAST PACKAGE:      ${lastPackage}`);
  console.log(`LAST STATUS:       ${lastStatus}`);
  console.log(`LAST SUMMARY:      ${lastSummary}`);
  console.log("");

  if (nextLikely.length > 0) {
    console.log("NEXT LIKELY:");

    for (const item of nextLikely) {
      console.log(`  - ${item}`);
    }

    console.log("");
  }

  if (pausedStreams.length > 0) {
    console.log(`PAUSED STREAMS:    ${pausedStreams.join(", ")}`);
    console.log("");
  }

  console.log(`RECOMMENDED NEXT ACTION: ${recommendedAction}`);
  console.log("");

  const session = makePromptSession();
  const answer = (await session.ask("Does this match what you expect? (yes / no): ")).toLowerCase();
  session.close();

  console.log("");

  if (answer === "yes" || answer === "y") {
    console.log("Re-entry confirmed. System is ready for next mount.");
  } else {
    console.log("Review .consync/state/ before proceeding. Run check:state-preflight for detailed integrity check.");
    process.exitCode = 1;
  }
}

module.exports = {
  runReentryCheckCommand,
};
