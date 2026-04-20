const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { evaluateStateIntegrity } = require("../lib/stateIntegrityCheck");

function writeFile(rootPath, relativePath, content) {
  const absolutePath = path.join(rootPath, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

function createBaseFixture(rootPath) {
  writeFile(
    rootPath,
    ".consync/state/active-stream.md",
    [
      "ACTIVE STREAM",
      "",
      "process",
      "",
      "PREVIOUS STREAM",
      "",
      "electron_ui",
      "",
      "SWITCH REASON",
      "",
      "process owns the live loop",
      "",
      "PAUSED STREAMS",
      "",
      "- electron_ui",
      "",
      "SUPPORTING STREAMS",
      "",
      "- none",
      "",
      "BLOCKED STREAMS",
      "",
      "- none",
      "",
      "LIVE OWNER NOTE",
      "",
      "Only `process` currently owns `.consync/state/next-action.md` and `.consync/state/handoff.md`.",
      "",
    ].join("\n")
  );

  writeFile(
    rootPath,
    ".consync/state/next-action.md",
    [
      "TYPE: PROCESS",
      "PACKAGE: sample_current_package",
      "",
      "GOAL",
      "",
      "Run the mounted package.",
      "",
      "WORK INSTRUCTIONS",
      "",
      "1. Inspect the files.",
      "",
      "CONSTRAINTS",
      "",
      "- Keep it small.",
      "",
      "VERIFICATION",
      "",
      "- Run the check.",
      "",
    ].join("\n")
  );

  writeFile(
    rootPath,
    ".consync/state/snapshot.md",
    [
      "# Consync Snapshot",
      "",
      "## System Status",
      "",
      "- repo state is currently coherent",
      "",
      "## Active Stream",
      "",
      "- recorded active stream: `process`",
      "",
      "## Previous Or Paused Streams",
      "",
      "- previous stream: `electron_ui`",
      "- paused streams: `electron_ui`",
      "",
      "## Current Package",
      "",
      "- type: `PROCESS`",
      "- package: `sample_current_package`",
      "",
      "## Current Goal / Focus",
      "",
      "- keep state coherent",
      "",
      "## Current Loop State",
      "",
      "- the live loop is open",
      "",
      "## Known Tensions Or Pending Decisions",
      "",
      "- none",
      "",
      "## Next Likely Packages",
      "",
      "- another small package",
      "",
      "## Bootstrap Note For New AI Conversations",
      "",
      "- treat state files as authoritative",
      "",
    ].join("\n")
  );

  writeFile(
    rootPath,
    ".consync/streams/process/stream.md",
    [
      "# Stream",
      "",
      "- id: process",
      "- title: Process Stream",
      "- status: active",
      "- owner: human",
      "- mode: system",
      "- summary: active",
      "",
    ].join("\n")
  );

  writeFile(
    rootPath,
    ".consync/streams/process/state/next_action.md",
    [
      "STATUS: active",
      "",
      "Mounted next step:",
      "",
      "- `sample_current_package`",
      "",
      "Focus:",
      "",
      "- keep state coherent",
      "",
    ].join("\n")
  );

  writeFile(
    rootPath,
    ".consync/streams/process/state/snapshot.md",
    [
      "# Process Stream Snapshot",
      "",
      "Current state:",
      "",
      "- the process stream now owns the live loop again",
      "- the stream is active and readable",
      "",
      "What matters next:",
      "",
      "- execute the mounted package",
      "",
    ].join("\n")
  );

  writeFile(
    rootPath,
    ".consync/streams/process/state/handoff.md",
    [
      "TYPE: PROCESS",
      "STREAM: process",
      "",
      "STATUS",
      "",
      "active",
      "",
      "SUMMARY",
      "",
      "Process stream is active.",
      "",
    ].join("\n")
  );

  writeFile(
    rootPath,
    ".consync/streams/electron_ui/stream.md",
    [
      "# Stream",
      "",
      "- id: electron_ui",
      "- title: Electron UI Stream",
      "- status: paused",
      "- owner: human",
      "- mode: build",
      "- summary: paused",
      "",
    ].join("\n")
  );

  writeFile(
    rootPath,
    ".consync/streams/electron_ui/state/next_action.md",
    [
      "STATUS: paused",
      "",
      "Next likely step when this stream resumes:",
      "",
      "- bind bookmark markers later",
      "",
      "This stream is intentionally paused and ready to resume later from a clean checkpoint.",
      "",
    ].join("\n")
  );

  writeFile(
    rootPath,
    ".consync/streams/electron_ui/state/snapshot.md",
    [
      "# Electron UI Stream Snapshot",
      "",
      "Current state:",
      "",
      "- the stream is paused cleanly rather than active",
      "",
      "What matters next:",
      "",
      "- resume from this preserved state rather than chat memory",
      "",
    ].join("\n")
  );

  writeFile(
    rootPath,
    ".consync/streams/electron_ui/state/handoff.md",
    [
      "TYPE: FEATURE",
      "STREAM: electron_ui",
      "",
      "STATUS",
      "",
      "paused",
      "",
      "SUMMARY",
      "",
      "Electron UI stream is paused cleanly.",
      "",
    ].join("\n")
  );
}

function main() {
  const rootPath = fs.mkdtempSync(path.join(os.tmpdir(), "consync-integrity-"));

  createBaseFixture(rootPath);

  writeFile(
    rootPath,
    ".consync/state/handoff.md",
    [
      "TYPE: PROCESS",
      "PACKAGE: previous_package",
      "",
      "STATUS",
      "",
      "PASS",
      "",
      "SUMMARY",
      "",
      "Previous package closed.",
      "",
      "FILES CREATED",
      "",
      "- none",
      "",
      "FILES MODIFIED",
      "",
      "- none",
      "",
      "COMMANDS TO RUN",
      "",
      "- node src/index.js state-integrity-check preflight",
      "",
      "HUMAN VERIFICATION",
      "",
      "1. Confirm the sections exist.",
      "",
      "VERIFICATION NOTES",
      "",
      "- Checked manually.",
      "",
    ].join("\n")
  );

  const preflight = evaluateStateIntegrity(rootPath, "preflight");
  assert.strictEqual(preflight.ok, true);
  assert.strictEqual(preflight.status, "PASS");
  assert.strictEqual(preflight.activeStream, "process");
  assert.strictEqual(preflight.activePackage, "sample_current_package");

  writeFile(
    rootPath,
    ".consync/state/handoff.md",
    [
      "TYPE: PROCESS",
      "PACKAGE: sample_current_package",
      "",
      "STATUS",
      "",
      "PASS",
      "",
      "SUMMARY",
      "",
      "Current package closed.",
      "",
      "FILES CREATED",
      "",
      "- none",
      "",
      "FILES MODIFIED",
      "",
      "- none",
      "",
      "COMMANDS TO RUN",
      "",
      "- node src/index.js state-integrity-check postflight",
      "",
      "HUMAN VERIFICATION",
      "",
      "1. Confirm the sections exist.",
      "",
      "VERIFICATION NOTES",
      "",
      "- Checked manually.",
      "",
    ].join("\n")
  );

  const postflight = evaluateStateIntegrity(rootPath, "postflight");
  assert.strictEqual(postflight.ok, true);
  assert.strictEqual(postflight.status, "PASS");

  writeFile(
    rootPath,
    ".consync/state/snapshot.md",
    fs
      .readFileSync(path.join(rootPath, ".consync/state/snapshot.md"), "utf8")
      .replace("`process`", "`electron_ui`")
  );

  const failure = evaluateStateIntegrity(rootPath, "preflight");
  assert.strictEqual(failure.ok, false);
  assert(
    failure.failures.some(item => item.includes("snapshot active stream mismatch")),
    "expected snapshot mismatch failure"
  );

  writeFile(
    rootPath,
    ".consync/state/snapshot.md",
    fs
      .readFileSync(path.join(rootPath, ".consync/state/snapshot.md"), "utf8")
      .replace("`electron_ui`", "`process`")
  );

  writeFile(
    rootPath,
    ".consync/streams/process/stream.md",
    fs
      .readFileSync(path.join(rootPath, ".consync/streams/process/stream.md"), "utf8")
      .replace("- status: active", "- status: paused")
  );

  const activePausedFailure = evaluateStateIntegrity(rootPath, "preflight");
  assert.strictEqual(activePausedFailure.ok, false);
  assert(
    activePausedFailure.failures.some(item => item.includes("stream process status mismatch")),
    "expected active stream locally paused failure"
  );

  writeFile(
    rootPath,
    ".consync/streams/process/stream.md",
    fs
      .readFileSync(path.join(rootPath, ".consync/streams/process/stream.md"), "utf8")
      .replace("- status: paused", "- status: active")
  );

  writeFile(rootPath, ".consync/streams/electron_ui/state/snapshot.md", "# Electron UI Stream Snapshot\n\nNo resume notes.\n");

  const pausedResumeFailure = evaluateStateIntegrity(rootPath, "preflight");
  assert.strictEqual(pausedResumeFailure.ok, false);
  assert(
    pausedResumeFailure.failures.some(item => item.includes("paused stream electron_ui is missing readable local resume context")),
    "expected missing paused resume context failure"
  );

  console.log("PASS");
}

main();