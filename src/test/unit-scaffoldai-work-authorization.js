"use strict";

// Proposal B: task-bound work authorization. Acceptance selects the reviewed
// instructions; work prompts and commands additionally require an explicit
// work authorization bound to that exact acceptance instance.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");

const { activatePacket, clearActivePacket } = require("../lib/scaffoldaiPacketActivation.auth.scaffoldai");
const { reviewHash } = require("../lib/scaffoldaiPacketIntake.auth.scaffoldai");
const acceptance = require("../lib/scaffoldaiTaskAcceptance.auth.scaffoldai");
const workAuthorization = require("../lib/scaffoldaiWorkAuthorization.auth.scaffoldai");
const { resolveExecutorContext, buildPlanPrompt } = require("../lib/executorAdapter.lib.scaffoldai");
const { buildWorkPrompt, runScaffoldWorkCommand } = require("../scaffoldai/commands/scaffoldai-work.cmd.scaffoldai");
const { runScaffoldaiPacketCommand } = require("../scaffoldai/commands/scaffoldai-packet.cmd.scaffoldai");
const { resetRuntimeState } = require("../lib/scaffoldaiHousekeeping.auth.scaffoldai");
const scaffoldaiState = require("../lib/scaffoldaiState.state.scaffoldai");

const AUTH_RELATIVE = scaffoldaiState.WORK_AUTHORIZATION_RELATIVE;
const MARKER = "WORK-AUTH-MARKER-5T8V";

function packetText(title, { approval = "PENDING", marker = MARKER } = {}) {
  const lines = [
    `# SDC — ${title}`,
    "",
    "MODE: PLANNING",
    "EXECUTION SURFACE: Read-only fixture",
    "",
  ];
  if (approval !== null) {
    lines.push("APPROVAL:", `  execute: ${approval}`, `  commit: ${approval}`, "");
  }
  lines.push(
    "GOAL:", `${marker}: list template file names.`, "",
    "TASKS:", `1. ${marker}-TASK: list the files.`, "",
    "VERIFY:", "Run:", "- npm run verify:scaffoldai", "",
    "OUTPUT:", "1. file names", "",
    "CONSTRAINTS:", "- no file changes", "",
  );
  return lines.join("\n");
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "scaffoldai-work-auth-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (relative, content) => {
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    fs.writeFileSync(path.join(root, relative), content);
  };
  const read = (relative) => {
    try { return fs.readFileSync(path.join(root, relative), "utf8"); } catch { return null; }
  };
  write(".scaffoldai/contracts/active-policy.json", JSON.stringify({ mode: "TEST" }) + "\n");
  write(".scaffoldai/state/active-stream.md", "ACTIVE STREAM\n\nprocess\n");
  write(".scaffoldai/streams/process/stream.md", "# Process\n\n- id: process\n- status: active\n");
  write(".scaffoldai/state/handoff.md", "TYPE: REFACTOR\nPACKAGE: earlier-task.sdc\n\nSTATUS\n\nPASS\n");
  write(".scaffoldai/packets/task.sdc.md", packetText("Task"));
  write(".scaffoldai/packets/other.sdc.md", packetText("Other", { marker: "OTHER-MARKER" }));
  const hashOf = (file) => reviewHash(read(`.scaffoldai/packets/${file}`));
  const activate = (file, options = {}) =>
    activatePacket(root, file, { expectedPacketSha256: hashOf(file), ...options });
  const authorize = (file, options = {}) =>
    workAuthorization.authorizeWork(root, file, { expectedPacketSha256: hashOf(file), ...options });
  return { root, write, read, hashOf, activate, authorize };
}

// Every file under .scaffoldai/state and runtime, with content, for
// no-side-effect assertions.
function stateSnapshot(root) {
  const out = {};
  for (const dir of [".scaffoldai/state", ".scaffoldai/runtime"]) {
    const walk = (relative) => {
      const absolute = path.join(root, relative);
      if (!fs.existsSync(absolute)) return;
      for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
        const child = path.join(relative, entry.name);
        if (entry.isDirectory()) walk(child);
        else out[child] = fs.readFileSync(path.join(root, child), "utf8");
      }
    };
    walk(dir);
  }
  return out;
}

function workPrompt(root) {
  return buildWorkPrompt(resolveExecutorContext(root));
}

function assertWorkRefused(root, acceptanceCode = undefined) {
  assert.throws(() => workPrompt(root), (error) => {
    if (error.code === "EXECUTION_NOT_AUTHORIZED") {
      return acceptanceCode === undefined ? !error.acceptance_code : error.acceptance_code === acceptanceCode;
    }
    // resolveExecutorContext refuses first when acceptance is already gone.
    return acceptanceCode !== undefined && error.code === acceptanceCode;
  }, `expected EXECUTION_NOT_AUTHORIZED${acceptanceCode ? ` (${acceptanceCode})` : ""}`);
}

// Distinct accepted_at values for consecutive acceptances.
function nextMillisecond() {
  const start = Date.now();
  while (Date.now() <= start) { /* spin */ }
}

function capture(fn) {
  const lines = [];
  const original = { log: console.log, error: console.error, exitCode: process.exitCode };
  console.log = (...args) => lines.push(args.join(" "));
  console.error = (...args) => lines.push(args.join(" "));
  process.exitCode = undefined;
  try {
    fn();
    return { output: lines.join("\n"), exitCode: process.exitCode || 0 };
  } finally {
    console.log = original.log;
    console.error = original.error;
    process.exitCode = original.exitCode;
  }
}

// ---------------------------------------------------------------------------
// Authorization is separate from acceptance
// ---------------------------------------------------------------------------

test("plain activation accepts but does not authorize work; planning still works", (t) => {
  const f = fixture(t);
  assert.equal(f.activate("task.sdc.md").status, "PASS");
  assert.equal(f.read(AUTH_RELATIVE), null);
  assertWorkRefused(f.root);
  const plan = buildPlanPrompt(resolveExecutorContext(f.root));
  assert.ok(plan.includes(`${MARKER}-TASK`), "planning uses the accepted instructions without work authorization");
});

test("authorize-work binds the record to the current acceptance and unlocks the work prompt", (t) => {
  const f = fixture(t);
  f.activate("task.sdc.md");
  const result = f.authorize("task.sdc.md");
  assert.equal(result.status, "PASS");

  const record = JSON.parse(f.read(AUTH_RELATIVE));
  const accepted = acceptance.readAcceptanceRecord(f.root);
  assert.equal(record.schema, workAuthorization.WORK_AUTHORIZATION_SCHEMA);
  assert.equal(record.mode, "work");
  for (const field of ["packet_id", "packet_file", "packet_sha256", "next_action_sha256", "accepted_at"]) {
    assert.equal(record[field], accepted[field], field);
  }
  assert.equal(record.authorized_via, "scaffoldai packet authorize-work");
  assert.ok(workPrompt(f.root).includes(`${MARKER}-TASK`));
});

test("activation launches nothing and creates no executor job", (t) => {
  const f = fixture(t);
  f.activate("task.sdc.md");
  f.authorize("task.sdc.md");
  assert.equal(fs.existsSync(path.join(f.root, ".scaffoldai/runtime/executor-plans")), false);
  const runtime = Object.keys(stateSnapshot(f.root)).filter((file) => file.startsWith(".scaffoldai/runtime"));
  assert.deepEqual(runtime, []);
});

// ---------------------------------------------------------------------------
// authorize-work refusals change nothing
// ---------------------------------------------------------------------------

function assertRefusedUnchanged(f, run, reason) {
  const before = stateSnapshot(f.root);
  const result = run();
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.reason, reason);
  assert.deepEqual(stateSnapshot(f.root), before, "refusal writes nothing");
  return result;
}

test("authorize-work refuses without an acceptance record", (t) => {
  const f = fixture(t);
  assertRefusedUnchanged(f, () => f.authorize("task.sdc.md"), "acceptance_missing");
  assert.equal(f.read(AUTH_RELATIVE), null);
});

test("authorize-work refuses a packet other than the accepted one", (t) => {
  const f = fixture(t);
  f.activate("task.sdc.md");
  assertRefusedUnchanged(f, () => f.authorize("other.sdc.md"), "acceptance_packet_mismatch");
});

test("authorize-work refuses a missing or wrong review hash", (t) => {
  const f = fixture(t);
  f.activate("task.sdc.md");
  assertRefusedUnchanged(f,
    () => workAuthorization.authorizeWork(f.root, "task.sdc.md", {}), "review_hash_required");
  assertRefusedUnchanged(f,
    () => f.authorize("task.sdc.md", { expectedPacketSha256: f.hashOf("other.sdc.md") }), "review_hash_mismatch");
  assertRefusedUnchanged(f,
    () => f.authorize("task.sdc.md", { expectedPacketSha256: "not-a-hash" }), "review_hash_mismatch");
});

test("authorize-work refuses a closed task", (t) => {
  const f = fixture(t);
  f.activate("task.sdc.md");
  f.write(".scaffoldai/state/handoff.md", "TYPE: PLANNING\nPACKAGE: task.sdc\n\nSTATUS\n\nPASS\n");
  assertRefusedUnchanged(f, () => f.authorize("task.sdc.md"), "task_not_open");
});

test("authorize-work refuses when the packet or next-action changed after acceptance", (t) => {
  const f = fixture(t);
  f.activate("task.sdc.md");
  const original = f.read(".scaffoldai/packets/task.sdc.md");
  f.write(".scaffoldai/packets/task.sdc.md", packetText("Task", { marker: "EDITED" }));
  // The reviewer hashes the edited file; it is still not the accepted packet.
  const edited = assertRefusedUnchanged(f, () => f.authorize("task.sdc.md"), "acceptance_invalid");
  assert.equal(edited.acceptance_code, "ACCEPTANCE_STALE");

  f.write(".scaffoldai/packets/task.sdc.md", original);
  f.write(".scaffoldai/state/next-action.md", `${f.read(".scaffoldai/state/next-action.md")}\nExtra.\n`);
  const nextAction = assertRefusedUnchanged(f,
    () => f.authorize("task.sdc.md", { expectedPacketSha256: reviewHash(original) }), "acceptance_invalid");
  assert.equal(nextAction.acceptance_code, "ACCEPTANCE_CONTENT_MISMATCH");
});

test("authorize-work refuses an accepted packet whose APPROVAL text is not PENDING", (t) => {
  // Simulates an acceptance made before PENDING-only activation (Proposal A).
  const f = fixture(t);
  const content = packetText("Old", { approval: "APPROVED" });
  f.write(".scaffoldai/packets/old.sdc.md", content);
  const nextActionContent = acceptance.buildAcceptedNextAction({ packetId: "old.sdc", category: "planning", packetContent: content });
  f.write(".scaffoldai/state/next-action.md", nextActionContent);
  acceptance.writeAcceptanceRecord(f.root, acceptance.buildAcceptanceRecord({
    packetId: "old.sdc", packetFile: ".scaffoldai/packets/old.sdc.md", packetContent: content, nextActionContent,
  }));
  assert.equal(f.authorize("old.sdc.md").reason, "packet_approval_not_pending");
  assert.equal(f.read(AUTH_RELATIVE), null);
});

test("a legacy packet without any APPROVAL text can be authorized under the PENDING default", (t) => {
  const f = fixture(t);
  f.write(".scaffoldai/packets/legacy.sdc.md", packetText("Legacy", { approval: null }));
  assert.equal(f.activate("legacy.sdc.md").status, "PASS");
  const result = f.authorize("legacy.sdc.md");
  assert.equal(result.status, "PASS");
  assert.equal(result.approval_compatibility, "legacy_missing_approval_block_treated_as_pending");
  assert.equal(JSON.parse(f.read(AUTH_RELATIVE)).approval_compatibility, result.approval_compatibility);
});

// ---------------------------------------------------------------------------
// Invalidation
// ---------------------------------------------------------------------------

test("re-activating the same accepted packet ends the authorization", (t) => {
  const f = fixture(t);
  f.activate("task.sdc.md");
  f.authorize("task.sdc.md");
  const result = f.activate("task.sdc.md");
  assert.equal(result.idempotent, true);
  assert.equal(result.work_authorization_cleared, true);
  assert.equal(f.read(AUTH_RELATIVE), null);
  assertWorkRefused(f.root);
});

test("re-acceptance of the same packet ends the authorization, and an old record cannot be replayed", (t) => {
  const f = fixture(t);
  f.activate("task.sdc.md");
  f.authorize("task.sdc.md");
  const oldRecord = f.read(AUTH_RELATIVE);

  // Damage the acceptance so activation takes the explicit re-acceptance path.
  f.write(acceptance.ACCEPTANCE_RELATIVE, "{}");
  nextMillisecond();
  const result = f.activate("task.sdc.md");
  assert.equal(result.reaccepted, true);
  assert.equal(f.read(AUTH_RELATIVE), null);
  assertWorkRefused(f.root);

  // Same packet and next-action hashes, but a different acceptance instance.
  f.write(AUTH_RELATIVE, oldRecord);
  assertWorkRefused(f.root);
});

test("clear and housekeeping reset remove the authorization", (t) => {
  const cleared = fixture(t);
  cleared.activate("task.sdc.md");
  cleared.authorize("task.sdc.md");
  const context = resolveExecutorContext(cleared.root);
  clearActivePacket(cleared.root);
  assert.equal(cleared.read(AUTH_RELATIVE), null);
  assert.throws(() => buildWorkPrompt(context),
    (error) => error.code === "EXECUTION_NOT_AUTHORIZED" && error.acceptance_code === "ACCEPTANCE_MISSING");

  const reset = fixture(t);
  reset.activate("task.sdc.md");
  reset.authorize("task.sdc.md");
  const result = resetRuntimeState(reset.root);
  assert.equal(result.status, "PASS");
  assert.ok(result.data.touched.includes(".scaffoldai/state/work-authorization.json"));
  assert.equal(reset.read(AUTH_RELATIVE), null);
  assert.equal(reset.read(acceptance.ACCEPTANCE_RELATIVE), null);
});

test("an interrupted clear still removes the authorization", (t) => {
  const f = fixture(t);
  f.activate("task.sdc.md");
  f.authorize("task.sdc.md");
  fs.rmSync(path.join(f.root, ".scaffoldai/contracts/active-policy.json"));
  assert.throws(() => clearActivePacket(f.root), /active-policy/);
  assert.equal(f.read(AUTH_RELATIVE), null);
});

test("closing the task makes the authorization unusable", (t) => {
  const f = fixture(t);
  f.activate("task.sdc.md");
  f.authorize("task.sdc.md");
  const context = resolveExecutorContext(f.root);
  f.write(".scaffoldai/state/handoff.md", "TYPE: PLANNING\nPACKAGE: task.sdc\n\nSTATUS\n\nPASS\n");
  assert.ok(f.read(AUTH_RELATIVE), "closeout does not need to remove the record");
  assert.throws(() => buildWorkPrompt(context),
    (error) => error.code === "EXECUTION_NOT_AUTHORIZED" && error.acceptance_code === "ACCEPTANCE_STALE");
});

test("changing the packet or next-action makes the authorization unusable", (t) => {
  const f = fixture(t);
  f.activate("task.sdc.md");
  f.authorize("task.sdc.md");
  const context = resolveExecutorContext(f.root);
  const original = f.read(".scaffoldai/packets/task.sdc.md");

  f.write(".scaffoldai/packets/task.sdc.md", packetText("Task", { marker: "SWAPPED" }));
  assert.throws(() => buildWorkPrompt(context),
    (error) => error.code === "EXECUTION_NOT_AUTHORIZED" && error.acceptance_code === "ACCEPTANCE_STALE");

  f.write(".scaffoldai/packets/task.sdc.md", original);
  assert.ok(buildWorkPrompt(context));
  assert.throws(() => buildWorkPrompt({ ...context, nextActionContent: `${context.nextActionContent}\nExtra.\n` }),
    (error) => error.code === "EXECUTION_NOT_AUTHORIZED" && error.acceptance_code === "ACCEPTANCE_CONTENT_MISMATCH");
});

test("an authorization record that differs from the acceptance in any bound field is refused", (t) => {
  const f = fixture(t);
  f.activate("task.sdc.md");
  f.authorize("task.sdc.md");
  const good = JSON.parse(f.read(AUTH_RELATIVE));
  const variants = {
    mode: "plan",
    packet_id: "other.sdc",
    packet_file: ".scaffoldai/packets/other.sdc.md",
    packet_sha256: "0".repeat(64),
    next_action_sha256: "0".repeat(64),
    accepted_at: "2000-01-01T00:00:00.000Z",
    schema: "scaffoldai.work-authorization.v0",
  };
  for (const [field, value] of Object.entries(variants)) {
    f.write(AUTH_RELATIVE, JSON.stringify({ ...good, [field]: value }));
    assertWorkRefused(f.root);
  }
  const missing = { ...good };
  delete missing.accepted_at;
  f.write(AUTH_RELATIVE, JSON.stringify(missing));
  assertWorkRefused(f.root);
  f.write(AUTH_RELATIVE, "{ not json");
  assertWorkRefused(f.root);
  f.write(AUTH_RELATIVE, JSON.stringify(good));
  assert.ok(workPrompt(f.root));
});

test("refused activations leave a valid authorization untouched", (t) => {
  const f = fixture(t);
  f.activate("task.sdc.md");
  f.authorize("task.sdc.md");
  const before = stateSnapshot(f.root);

  assert.equal(activatePacket(f.root, "task.sdc.md", {}).reason, "review_hash_required");
  assert.equal(f.activate("task.sdc.md", { expectedPacketSha256: "f".repeat(64) }).reason, "review_hash_mismatch");
  assert.equal(f.activate("other.sdc.md").reason, "active_packet_exists");

  assert.deepEqual(stateSnapshot(f.root), before);
  assert.ok(workPrompt(f.root));
});

test("a failed activation leaves work unauthorized", (t) => {
  const f = fixture(t);
  f.activate("task.sdc.md");
  f.authorize("task.sdc.md");
  f.write(".scaffoldai/state/handoff.md", "TYPE: PLANNING\nPACKAGE: task.sdc\n\nSTATUS\n\nPASS\n");
  fs.rmSync(path.join(f.root, ".scaffoldai/contracts/active-policy.json"));
  assert.throws(() => f.activate("other.sdc.md"), /active-policy/);
  assert.equal(f.read(AUTH_RELATIVE), null);
});

// ---------------------------------------------------------------------------
// CLI: combined command, authorize-work, intake, scaffoldai work
// ---------------------------------------------------------------------------

test("activate --authorize-work creates both records; plain activate creates only acceptance", (t) => {
  const plain = fixture(t);
  const plainRun = capture(() => runScaffoldaiPacketCommand(
    ["activate", "task.sdc.md", "--sha256", plain.hashOf("task.sdc.md")], { repoRoot: plain.root }));
  assert.equal(plainRun.exitCode, 0);
  assert.ok(plain.read(acceptance.ACCEPTANCE_RELATIVE));
  assert.equal(plain.read(AUTH_RELATIVE), null);

  const combined = fixture(t);
  const run = capture(() => runScaffoldaiPacketCommand(
    ["activate", "task.sdc.md", "--sha256", combined.hashOf("task.sdc.md"), "--authorize-work"], { repoRoot: combined.root }));
  assert.equal(run.exitCode, 0, run.output);
  assert.match(run.output, /\[scaffoldai packet authorize-work\][\s\S]*STATUS: PASS/);
  const record = JSON.parse(combined.read(AUTH_RELATIVE));
  assert.equal(record.authorized_via, "scaffoldai packet activate --authorize-work");
  assert.equal(record.accepted_at, acceptance.readAcceptanceRecord(combined.root).accepted_at);
  assert.ok(workPrompt(combined.root));
});

test("a refused combined command writes neither record", (t) => {
  const f = fixture(t);
  const before = stateSnapshot(f.root);
  const run = capture(() => runScaffoldaiPacketCommand(
    ["activate", "task.sdc.md", "--sha256", f.hashOf("other.sdc.md"), "--authorize-work"], { repoRoot: f.root }));
  assert.equal(run.exitCode, 1);
  assert.ok(!run.output.includes("[scaffoldai packet authorize-work]"), "authorization is not attempted");
  assert.deepEqual(stateSnapshot(f.root), before);
});

test("a combined command re-run on the active packet re-authorizes the same acceptance", (t) => {
  const f = fixture(t);
  const args = ["activate", "task.sdc.md", "--sha256", f.hashOf("task.sdc.md"), "--authorize-work"];
  capture(() => runScaffoldaiPacketCommand(args, { repoRoot: f.root }));
  const acceptedBefore = f.read(acceptance.ACCEPTANCE_RELATIVE);
  const run = capture(() => runScaffoldaiPacketCommand(args, { repoRoot: f.root }));
  assert.equal(run.exitCode, 0, run.output);
  assert.match(run.output, /Re-activation ended the previous work authorization/);
  assert.equal(f.read(acceptance.ACCEPTANCE_RELATIVE), acceptedBefore);
  assert.ok(workPrompt(f.root));
});

test("packet authorize-work CLI passes and refuses with the right exit codes", (t) => {
  const f = fixture(t);
  const missing = capture(() => runScaffoldaiPacketCommand(["authorize-work"], { repoRoot: f.root }));
  assert.equal(missing.exitCode, 1);

  const none = capture(() => runScaffoldaiPacketCommand(
    ["authorize-work", "task.sdc.md", "--sha256", f.hashOf("task.sdc.md")], { repoRoot: f.root }));
  assert.equal(none.exitCode, 1);
  assert.match(none.output, /REASON: +acceptance_missing/);

  f.activate("task.sdc.md");
  const noHash = capture(() => runScaffoldaiPacketCommand(["authorize-work", "task.sdc.md"], { repoRoot: f.root }));
  assert.equal(noHash.exitCode, 1);
  assert.match(noHash.output, /REASON: +review_hash_required/);
  assert.equal(f.read(AUTH_RELATIVE), null);

  const ok = capture(() => runScaffoldaiPacketCommand(
    ["authorize-work", ".scaffoldai/packets/task.sdc.md", "--sha256", f.hashOf("task.sdc.md")], { repoRoot: f.root }));
  assert.equal(ok.exitCode, 0, ok.output);
  assert.match(ok.output, /File scope in the instructions is not enforced/);
  assert.ok(f.read(AUTH_RELATIVE));
});

test("packet intake refuses --authorize-work before writing anything", (t) => {
  const f = fixture(t);
  const source = path.join(f.root, "inbox-candidate.md");
  fs.writeFileSync(source, packetText("Candidate"));
  const before = stateSnapshot(f.root);
  const run = capture(() => runScaffoldaiPacketCommand(
    ["intake", source, "--sha256", reviewHash(packetText("Candidate")), "--activate", "--authorize-work"], { repoRoot: f.root }));
  assert.equal(run.exitCode, 1);
  assert.match(run.output, /does not authorize work/);
  assert.deepEqual(stateSnapshot(f.root), before);
  assert.equal(fs.existsSync(path.join(f.root, ".scaffoldai/packets/candidate.sdc.md")), false);
});

test("scaffoldai work prints no prompt or command without authorization", (t) => {
  const f = fixture(t);
  f.activate("task.sdc.md");
  const refused = capture(() => runScaffoldWorkCommand({ repoRoot: f.root }));
  assert.equal(refused.exitCode, 1);
  assert.match(refused.output, /REFUSED: EXECUTION_NOT_AUTHORIZED/);
  assert.ok(!refused.output.includes("EXECUTOR COMMAND"));
  assert.ok(!refused.output.includes("copilot"));
  assert.ok(!refused.output.includes(`${MARKER}-TASK`));
  assert.ok(!refused.output.includes("ACTIVE PACKET"));

  f.authorize("task.sdc.md");
  const allowed = capture(() => runScaffoldWorkCommand({ repoRoot: f.root }));
  assert.equal(allowed.exitCode, 0, allowed.output);
  assert.match(allowed.output, /EXECUTOR COMMAND:\n {2}copilot /);
  assert.ok(allowed.output.includes(`${MARKER}-TASK`));

  f.activate("task.sdc.md"); // re-activation ends it again
  const again = capture(() => runScaffoldWorkCommand({ repoRoot: f.root }));
  assert.equal(again.exitCode, 1);
  assert.ok(!again.output.includes("EXECUTOR COMMAND"));
});
