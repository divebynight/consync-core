# ScaffoldAI State Write Surfaces Reference

Status: CURRENT REFERENCE
Role: operational reference for state mutation boundaries

## Purpose

Map every known code path that reads or mutates ScaffoldAI operational state so future sim-mode and MCP authority work can be scoped safely.

This document covers current behavior only. It does not grant new authority.

## State Surfaces Covered

- .scaffoldai/state/*
- .scaffoldai/streams/*
- .scaffoldai/packets/*

## Classification Legend

- READ_ONLY: may read state but does not mutate covered surfaces.
- APPEND_ONLY: may append records, no overwrite/delete of authoritative files.
- AUTHORITATIVE_WRITE: may create/overwrite authoritative state files.
- DESTRUCTIVE_WRITE: may delete or rename covered files.
- UNKNOWN_REVIEW_REQUIRED: behavior is unclear and must be reviewed before relying on it.

## Direct Loop-State Function Map

Only direct ScaffoldAI loop-state surfaces are listed below.

### CLI Entrypoints To State Writers

- Command entry: src/scaffoldai/commands/gatekeeper.cmd.scaffoldai.js
- Delegates:
  - runGatekeeperMount -> src/lib/gatekeeperMount.auth.scaffoldai.js
  - runGatekeeperClose -> src/lib/gatekeeperClose.auth.scaffoldai.js
  - runGatekeeperSwitch -> src/lib/gatekeeperSwitch.auth.scaffoldai.js
- Command entry: src/scaffoldai/commands/scaffoldai-packet.cmd.scaffoldai.js
- Delegate:
  - activate/status/clear -> src/lib/scaffoldaiPacketActivation.auth.scaffoldai.js
- Canonical state writer helper:
  - src/lib/scaffoldaiState.state.scaffoldai.js

### Canonical Loop-State Files Affected By CLI Gatekeeper Flows

- .scaffoldai/state/next-action.md
- .scaffoldai/state/active-contract.json
- .scaffoldai/state/handoff.md
- .scaffoldai/state/snapshot.md
- .scaffoldai/state/active-stream.md
- .scaffoldai/state/history.jsonl
- .scaffoldai/streams/*/stream.md

## Diagram: CLI Surface

```mermaid
flowchart LR
    CLIEntry[CLI gatekeeper command entry]
    Mount[runGatekeeperMount]
    Close[runGatekeeperClose]
    Switch[runGatekeeperSwitch]
    StateMod[scaffoldaiState.state.scaffoldai]

    Next[(.scaffoldai/state/next-action.md)]
    Handoff[(.scaffoldai/state/handoff.md)]
    Snapshot[(.scaffoldai/state/snapshot.md)]
    Active[(.scaffoldai/state/active-stream.md)]
    Hist[(.scaffoldai/state/history.jsonl)]
    StreamDoc[(.scaffoldai/streams/*/stream.md)]

    CLIEntry --> Mount
    CLIEntry --> Close
    CLIEntry --> Switch

    Mount --> StateMod
    Close --> StateMod
    Switch --> StateMod

    StateMod -->|AUTHORITATIVE_WRITE| Next
    StateMod -->|AUTHORITATIVE_WRITE| Handoff
    StateMod -->|AUTHORITATIVE_WRITE| Snapshot
    StateMod -->|AUTHORITATIVE_WRITE| Active
    StateMod -->|AUTHORITATIVE_WRITE| StreamDoc
    StateMod -->|APPEND_ONLY| Hist
```

## Diagram: MCP Stdio Surface

```mermaid
flowchart LR
    StdioServer[src/scaffoldai/mcp/server.js]
    Tools[src/scaffoldai/mcp/tools.js]
    ReadTools[status or preflight or question or verify_recommend or closeout_readiness]
    SignalTool[signal tool]
    MemoryTool[memory_write tool]

    State[(.scaffoldai/state/*.md)]
    StreamDoc[(.scaffoldai/streams/*/stream.md)]
    SharedMem[(.scaffoldai/runtime/mcp/shared-memory.jsonl)]
    SignalLog[(.scaffoldai/runtime/mcp/signals.jsonl)]

    StdioServer --> Tools
    Tools --> ReadTools
    StdioServer --> SignalTool
    StdioServer --> MemoryTool

    ReadTools -->|READ_ONLY| State
    ReadTools -->|READ_ONLY| StreamDoc
    MemoryTool -->|APPEND_ONLY| SharedMem
    SignalTool -->|APPEND_ONLY| SignalLog
```

Current stance: stdio MCP does not perform authoritative loop-state writes to .scaffoldai/state/*.md or .scaffoldai/streams/*/stream.md.

## Diagram: MCP HTTP Surface

```mermaid
flowchart LR
    HttpServer[src/scaffoldai/mcp-readonly/http.js]
    ReadonlyIndex[src/scaffoldai/mcp-readonly/index.js]
    IdentityTool[scaffoldai_identity]
    StatusTool[scaffoldai_status]

    State[(.scaffoldai/state/*.md)]
    StreamDoc[(.scaffoldai/streams/*/stream.md)]

    HttpServer --> ReadonlyIndex
    ReadonlyIndex --> IdentityTool
    ReadonlyIndex --> StatusTool

    StatusTool -->|READ_ONLY| State
    StatusTool -->|READ_ONLY| StreamDoc
```

Current stance: MCP HTTP is read-only and has no write-capable loop-state tool registration.

## Diagram: Combined State Impact Map

```mermaid
flowchart TB
    Human[Human]
    CLI[CLI]
    StdioClients[Copilot or Codex or Claude via MCP stdio]
    HttpClient[ChatGPT via MCP HTTP readonly]

    Next[(.scaffoldai/state/next-action.md)]
    Handoff[(.scaffoldai/state/handoff.md)]
    Snapshot[(.scaffoldai/state/snapshot.md)]
    Active[(.scaffoldai/state/active-stream.md)]
    Hist[(.scaffoldai/state/history.jsonl)]
    StreamDoc[(.scaffoldai/streams/*/stream.md)]
    SharedMem[(.scaffoldai/runtime/mcp/shared-memory.jsonl)]
    SignalLog[(.scaffoldai/runtime/mcp/signals.jsonl)]
    Packets[(.scaffoldai/packets/*)]

    Human -->|approves and directs| CLI
    Human -->|requests observations| StdioClients
    Human -->|requests observations| HttpClient

    CLI -->|AUTHORITATIVE_WRITE| Next
    CLI -->|AUTHORITATIVE_WRITE| Handoff
    CLI -->|AUTHORITATIVE_WRITE| Snapshot
    CLI -->|AUTHORITATIVE_WRITE| Active
    CLI -->|AUTHORITATIVE_WRITE| StreamDoc
    CLI -->|APPEND_ONLY| Hist

    StdioClients -->|READ_ONLY| Next
    StdioClients -->|READ_ONLY| Handoff
    StdioClients -->|READ_ONLY| Snapshot
    StdioClients -->|READ_ONLY| Active
    StdioClients -->|READ_ONLY| StreamDoc
    StdioClients -->|APPEND_ONLY| SharedMem
    StdioClients -->|APPEND_ONLY| SignalLog

    HttpClient -->|READ_ONLY| Next
    HttpClient -->|READ_ONLY| Handoff
    HttpClient -->|READ_ONLY| Snapshot
    HttpClient -->|READ_ONLY| Active
    HttpClient -->|READ_ONLY| StreamDoc

    CLI -->|AUTHORITATIVE_WRITE intake durable packet file| Packets
```

## Inventory: Runtime And Command Surfaces

| Surface | File / Symbol | Caller Surface | Covered Path(s) | Classification | Notes |
| --- | --- | --- | --- | --- | --- |
| State authority module | src/lib/scaffoldaiState.state.scaffoldai.js (writeNextAction, writeHandoff, writeSnapshot, writeActiveStream, writeStreamDoc) | helper/library | .scaffoldai/state/*.md, .scaffoldai/streams/*/stream.md | AUTHORITATIVE_WRITE | Canonical writer for operational state markdown files. |
| State history append | src/lib/scaffoldaiState.state.scaffoldai.js (appendHistory) | helper/library | .scaffoldai/state/history.jsonl | APPEND_ONLY | Creates file if missing, appends JSONL records. |
| Gatekeeper mount writes | src/lib/gatekeeperMount.auth.scaffoldai.js (executeMountWrites) | helper/library (called by CLI) | next-action.md, snapshot.md, streams/*/stream.md, state/history.jsonl | AUTHORITATIVE_WRITE + APPEND_ONLY | Uses scaffoldaiState write and append APIs. |
| Gatekeeper close writes | src/lib/gatekeeperClose.auth.scaffoldai.js (executeCloseWritesA/B) | helper/library (called by CLI) | handoff.md, snapshot.md, streams/*/stream.md, state/history.jsonl | AUTHORITATIVE_WRITE + APPEND_ONLY | Uses scaffoldaiState write and append APIs. |
| Gatekeeper switch writes | src/lib/gatekeeperSwitch.auth.scaffoldai.js (executeSwitchWrites) | helper/library (called by CLI) | active-stream.md, snapshot.md, streams/*/stream.md, state/history.jsonl | AUTHORITATIVE_WRITE + APPEND_ONLY | Uses scaffoldaiState write and append APIs. |
| Packet activation writes | src/lib/scaffoldaiPacketActivation.auth.scaffoldai.js (activatePacket, clearActivePacket) | helper/library (called by CLI) | active-runtime.json, next-action.md, snapshot.md, accepted-task.json, work-authorization.json (removed), state/history.jsonl | AUTHORITATIVE_WRITE + APPEND_ONLY | Packet files are read-only inputs. Activation and clear remove work-authorization.json first (re-activation of the same packet included), rebuild next-action.md from the accepted packet and write accepted-task.json last; on failure activation restores the prior files but never the work authorization. Refused activations write nothing. All writes go through scaffoldaiState. |
| Task acceptance record | src/lib/scaffoldaiTaskAcceptance.auth.scaffoldai.js | helper/library (called by activation, executor adapter) | accepted-task.json (via scaffoldaiState: atomic write, remove) | AUTHORITATIVE_WRITE (activation only) + READ_ONLY (prompt builders) | Prompt builders refuse missing, mismatched or stale records. |
| Work authorization record | src/lib/scaffoldaiWorkAuthorization.auth.scaffoldai.js (authorizeWork, authorizedWorkInput, clearWorkAuthorization) | helper/library (called by `scaffoldai packet authorize-work`, `packet activate --authorize-work`, activation, work prompt) | work-authorization.json (via scaffoldaiState: atomic write, remove) | AUTHORITATIVE_WRITE (explicit human command only) + READ_ONLY (work prompt) | Bound to packet_id, packet_file, packet_sha256, next_action_sha256 and accepted_at of the current acceptance; refusals write nothing. The work prompt refuses EXECUTION_NOT_AUTHORIZED unless every bound field matches and the task is open. |
| Housekeeping runtime reset | src/lib/scaffoldaiHousekeeping.auth.scaffoldai.js (resetRuntimeState, cleanIntakeArtifacts) | helper/library (called by CLI) | work-authorization.json and accepted-task.json (removed first), active-runtime.json, next-action.md, snapshot.md; runtime logs when requested; consumed inbox candidate and latest intake result | AUTHORITATIVE_WRITE + DESTRUCTIVE_WRITE | Housekeeping performs no direct filesystem writes. State changes go through scaffoldaiState (history.jsonl via removeHistoryLog). Runtime and inbox deletions go through scaffoldaiRuntimeFiles.removeRuntimeFile. |
| Runtime/inbox file deletion | src/lib/scaffoldaiRuntimeFiles.auth.scaffoldai.js (removeRuntimeFile) | helper/library (called by housekeeping) | regular files under .scaffoldai/runtime/ and .scaffoldai/inbox/ only | DESTRUCTIVE_WRITE (bounded) | Lexical and real-path containment. The runtime/inbox root must resolve exactly to that directory under the real .scaffoldai, so a symlinked root (even one pointing inside .scaffoldai, such as runtime -> state or inbox -> packets) is refused. Also refuses traversal, symlinked subdirectories that leave the root, final-file symlinks (never followed or deleted), and non-files. scaffoldaiState.removeHistoryLog applies the same exact-match rule to .scaffoldai/state. |
| Packet intake writes | src/lib/scaffoldaiPacketIntake.auth.scaffoldai.js (intakePacket) | helper/library (called by CLI) | .scaffoldai/packets/*.sdc.md, .scaffoldai/runtime/packet-intake/latest-intake.json | AUTHORITATIVE_WRITE + AUTHORITATIVE_WRITE (runtime-derived metadata) | Valid accepted packet content is normalized into durable packet storage; latest intake metadata is runtime-derived. |
| Gatekeeper command entry | src/scaffoldai/commands/gatekeeper.cmd.scaffoldai.js | CLI | Indirect: delegates to gatekeeper auth modules above | AUTHORITATIVE_WRITE + APPEND_ONLY | Primary stream and closeout mutation entrypoint. |
| ScaffoldAI packet command entry | src/scaffoldai/commands/scaffoldai-packet.cmd.scaffoldai.js | CLI | Indirect: delegates to packet activation auth module | AUTHORITATIVE_WRITE + APPEND_ONLY | Human-approved activation surface for in-flight packet pointer. |
| Consync run soft gate | src/scaffoldai/commands/consync-run.cmd.scaffoldai.js | CLI | Reads .scaffoldai/state/active-contract.json + next-action.md | READ_ONLY | Prompts approval but does not execute writes. |
| Dry-run check | src/scaffoldai/commands/dry-run-check.check.scaffoldai.js | CLI | Reads .scaffoldai/state/active-contract.json + next-action.md | READ_ONLY | Simulation only. |
| ScaffoldAI status | src/scaffoldai/commands/scaffoldai-status.cmd.scaffoldai.js + src/lib/scaffoldaiStatus.query.scaffoldai.js | CLI | Reads state and stream docs | READ_ONLY | Observation only. |
| ScaffoldAI preflight/question/verify/closeout recommendation paths | src/scaffoldai/commands/scaffoldai-preflight.cmd.scaffoldai.js, scaffoldai-question.cmd.scaffoldai.js, scaffoldai-verify.cmd.scaffoldai.js, scaffoldai-closeout.cmd.scaffoldai.js | CLI | Reads state and git | READ_ONLY | Closeout command reports readiness only. |
| Stdio MCP read tools | src/scaffoldai/mcp/tools.js (status/preflight/question/verify_recommend/closeout_readiness) | MCP stdio | Reads state and git | READ_ONLY | Declares execution_class READ_ONLY. |
| Stdio MCP signal tool | src/scaffoldai/mcp/signal.js | MCP stdio | .scaffoldai/runtime/mcp/signals.jsonl | APPEND_ONLY | Rotates/deletes only runtime signal log, not operational state. |
| Stdio MCP shared memory | src/scaffoldai/mcp/shared-memory.js | MCP stdio | .scaffoldai/runtime/mcp/shared-memory.jsonl | APPEND_ONLY | Writes append-only runtime shared-memory JSONL. |
| MCP snapshot export | src/scaffoldai/mcp/snapshot.js | npm script / MCP utility | .scaffoldai/tmp/mcp-runtime-snapshot.json | AUTHORITATIVE_WRITE (tmp only) | Writes tmp snapshot only, no state/stream authority files. |
| HTTP MCP readonly server | src/scaffoldai/mcp-readonly/http.js + index.js + tools/* | MCP HTTP | Reads status/identity only | READ_ONLY | No write-capable tools registered. |
| Handoff bundle command | src/scaffoldai/commands/handoff-bundle.process.scaffoldai.js | CLI | Reads handoff.md, snapshot.md | READ_ONLY | Prints bundle to stdout only. |
| Portable scaffold command | src/lib/portableScaffold.process.scaffoldai.js + src/scaffoldai/commands/portable.process.scaffoldai.js | CLI | Writes template files into target path (can include .scaffoldai files) | AUTHORITATIVE_WRITE (target-scoped) | Scaffolding utility; not part of live loop authority, but can write if target is this repo. |
| Integrity and handoff scripts | scripts/check-handoff-contract.js, scripts/check-scaffoldai-docs.js, scripts/check-scaffoldai-links-and-commands.js | npm script | Reads state/docs | READ_ONLY | Verification and docs audit only. |

## Inventory: Test Fixtures And Test Utilities

| Surface | File | Caller Surface | Covered Path(s) | Classification | Notes |
| --- | --- | --- | --- | --- | --- |
| State fixture writer helpers | src/test/state-integrity-checks.js, src/test/integration-handoff-bundle-cli.js, src/test/unit-get-in-flight-packet.js, src/test/unit-dry-run-check.js, src/test/unit-consync-run.js | test fixture | Temp .scaffoldai/state and .scaffoldai/streams fixtures | AUTHORITATIVE_WRITE + DESTRUCTIVE_WRITE | Test-only fixture setup/teardown, not runtime authority. |
| MCP signal/shared-memory test cleanup | src/test/mcp-transport-e2e.js, src/test/unit-scaffoldai-mcp-readonly.js | test fixture | tmp/signal and test files | DESTRUCTIVE_WRITE | Test cleanup only. |
| History append unit tests | src/test/unit-scaffoldai-history.test.js | test fixture | Temp .scaffoldai/state/history.jsonl | APPEND_ONLY + DESTRUCTIVE_WRITE | Validates appendHistory behavior and teardown. |

## Current Intended Policy

- Authoritative writes to .scaffoldai/state/*.md and .scaffoldai/streams/*/stream.md are centralized in scaffoldaiState.state.scaffoldai.js and reached via gatekeeper auth flows.
- .scaffoldai/state/history.jsonl is append-only observational history.
- Stdio MCP operational tools are read-only except:
  - scaffoldai_memory_write appends to .scaffoldai/runtime/mcp/shared-memory.jsonl
  - scaffoldai_signal appends/rotates .scaffoldai/runtime/mcp/signals.jsonl
- The HTTP MCP operator exposes metadata and report reads plus the append-only `scaffoldai_message_send` (`message:write`, writes `.scaffoldai/runtime/mcp/shared-memory.jsonl` only). It exposes no lifecycle or `.scaffoldai/state` write tools.
- Intake runtime path mutates .scaffoldai/packets by writing normalized accepted packets via scaffoldai packet intake.
- Packet activation/clear and MCP runtime surfaces do not mutate packet files; they mutate pointer/state surfaces.

## Task Acceptance Record

`.scaffoldai/state/accepted-task.json` (gitignored) records the task a human accepted through `scaffoldai packet activate`:

- `packet_id`, `packet_file`, `packet_sha256`, `next_action_sha256`, `accepted_at`, `accepted_via`.
- Only packet activation creates it. It is written atomically through `scaffoldaiState.writeAcceptedTaskRaw` and removed through `scaffoldaiState.removeAcceptedTask`.
- `scaffoldai packet clear` and `housekeeping reset-runtime-state` remove it before rewriting next-action.md.
- Plan and work prompt builders (and the executor MCP tools that use them) refuse with `ACCEPTANCE_MISSING`, `ACCEPTANCE_PACKET_MISMATCH`, `ACCEPTANCE_CONTENT_MISMATCH` or `ACCEPTANCE_STALE` unless the next-action text they embed matches the record, the packet file is unchanged and inside `.scaffoldai/packets/`, and the task is still open.
- A hash is not approval: the record's authority comes from the human running activation. It is not a signature; a local process with write access to `.scaffoldai/state/` could forge it.

## Work Authorization Record

`.scaffoldai/state/work-authorization.json` (gitignored) records that a human authorized work on the currently accepted task (Proposal B):

- `schema` (`scaffoldai.work-authorization.v1`), `packet_id`, `packet_file`, `packet_sha256`, `next_action_sha256`, `accepted_at`, `mode: "work"`, `authorized_at`, `authorized_via`, and `approval_compatibility` for legacy packets.
- Only `scaffoldai packet authorize-work <packet> --sha256 <hash>` and `scaffoldai packet activate <packet> --sha256 <hash> --authorize-work` create it, through `scaffoldaiState.writeWorkAuthorizationRaw` (atomic). Refusals write nothing.
- Activation (every non-refused path, including re-activation of the same packet), `packet clear` and `housekeeping reset-runtime-state` remove it through `scaffoldaiState.removeWorkAuthorization` before changing task state. Closeout does not remove it; a closed task makes it unusable.
- `buildWorkPrompt` and `scaffoldai work` refuse with `EXECUTION_NOT_AUTHORIZED` unless every bound field equals the current acceptance record and the task is open. Planning does not read it.
- Limits: file scope inside the instructions is not enforced; the record is not a signature and same-user processes can forge it; a command already printed cannot be revoked by the check.

Invariant H (`src/test/scaffoldai-invariants.test.js`, scan in `src/test/helpers/state-write-scan.js`) also flags indirect state writes: any file that references a `.scaffoldai/state` location and calls a filesystem mutation, outside `scaffoldaiState.state.scaffoldai.js` and two named exemptions (lifecycle probe temp root, verify-evidence state module). The former housekeeping exemption was removed in MAR-6; housekeeping now deletes only through `scaffoldaiState.removeHistoryLog` and `removeRuntimeFile`.

## Authority Mismatches And Risk Notes

No hard policy violations were found in current runtime code. The following boundary risks are worth tracking:

1. Portable scaffold can write .scaffoldai content
- portable.process.scaffoldai command can copy template .scaffoldai files into any target path.
- This is intentional scaffolding behavior, but should remain outside normal live-loop state authority assumptions.

2. Generic helper naming inside canonical state module
- readFile/writeFile names are generic inside scaffoldaiState module; context is clear in-file but still broad names.
- Not a blocker; optional naming hardening is possible.

## MCP Write Access Status

- MCP stdio: has bounded append capability only (shared-memory JSONL and signals JSONL under runtime/mcp). No write access to authoritative state markdown files.
- MCP HTTP readonly: no write capability exposed.

## .scaffoldai/packets Status

- Packet intake runtime writes normalized accepted packet files under .scaffoldai/packets.
- Packet activation/clear and MCP runtime surfaces do not mutate packet files.
- Packet files serve as durable packet content source for manual CLI activation.
- Active packet pointer authority lives in .scaffoldai/state/active-runtime.json and .scaffoldai/state/next-action.md (with active-contract.json compatibility during migration).

## Mermaid Authority Map

```mermaid
flowchart LR
    H[Human]
    C1[Copilot or Codex via stdio MCP]
    C2[ChatGPT via HTTP MCP readonly]
    CLI[CLI Commands]

    SState[(.scaffoldai/state/*.md)]
    SHist[(.scaffoldai/state/history.jsonl)]
    SStream[(.scaffoldai/streams/*/stream.md)]
    SMemory[(.scaffoldai/runtime/mcp/shared-memory.jsonl)]
    SPackets[(.scaffoldai/packets/*)]
    SignalLog[(.scaffoldai/runtime/mcp/signals.jsonl)]

    C1 -->|READ_ONLY tools| SState
    C1 -->|READ_ONLY tools| SStream
    C1 -->|APPEND_ONLY scaffoldai_memory_write| SMemory
    C1 -->|APPEND_ONLY scaffoldai_signal| SignalLog

    C2 -->|READ_ONLY tools| SState
    C2 -->|READ_ONLY tools| SStream

    CLI -->|AUTHORITATIVE_WRITE gatekeeper| SState
    CLI -->|AUTHORITATIVE_WRITE gatekeeper| SStream
    CLI -->|APPEND_ONLY appendHistory| SHist

    CLI -->|READ_ONLY verify or status| SState
    CLI -->|READ_ONLY verify or status| SStream
    CLI -->|AUTHORITATIVE_WRITE intake| SPackets

    H -->|approves execution and commit| CLI
```

## Follow-up Recommendations

1. Keep MCP append-only runtime artifacts confined to .scaffoldai/runtime/mcp and out of authoritative state and stream doc namespaces.
2. If stdio MCP state-write authority is expanded later, require explicit command-level boundary contracts and preserve HTTP read-only separation.
3. Consider optional helper naming hardening in scaffoldaiState module (for example writeStateFile/readStateFile) only if clarity issues continue.
