# Remote Proposal / Local Lifecycle Runbook

## Purpose

This runbook documents the current operator pattern for the bounded remote proposal flow and the local/manual lifecycle that follows it.

Use it when you need to answer four questions quickly:

1. What can a remote operator propose?
2. What must remain local and manual?
3. Which commands are the ergonomic human operator surface?
4. Which existing tests already cover the HTTPS SDC submit boundary?

This is a process document, not a contract. It explains the operating shape after the remote-proposal/local-lifecycle boundary was enforced.

## Authority Boundary

### Observer HTTPS Surface

The observer HTTPS MCP surface is read-only.

It may expose inspection tools such as status, visibility, and pending-question views, but it must not submit candidates and must not mutate lifecycle or git state.

### Operator HTTPS Surface

The operator HTTPS MCP surface supports bounded candidate submission, readonly
observation, and read-only executor planning.

It may accept `scaffoldai_submit_sdc_candidate` as a bounded inbox write and run
the existing planning executor. It must not intake, activate, claim, perform
writable execution, verify-run, close out, cleanup, commit, or mutate next-action.

Caller authentication is still absent. Do not treat these local limits as
front-door protection; keep the operator stopped when not actively needed.

### Local hardening limits

The operator entry point binds only to `127.0.0.1` (default port 3133). A
non-loopback HOST override is rejected. Cloudflare routing/authentication is
configured separately and was not changed by this hardening.

| Resource | Bound |
| --- | --- |
| HTTP request body | 256 KiB; oversized body returns 413 |
| Body collection deadline | 15 seconds; timeout returns 408 |
| MCP sessions | 16; excess initialization returns 503 |
| Session idle lifetime | 15 minutes; clients must reinitialize after expiry |
| Concurrent MCP requests, including streams | 32; excess returns 503 |
| Concurrent MCP SSE streams, including anonymous bootstrap | 8 |
| SSE connection lifetime | 60 seconds; reconnect using the still-valid session |
| HTTP sockets | 64; additional sockets are rejected |
| Inbox entries | 100; further submissions refused, no automatic deletion |
| Concurrent planning executors | One per repository, across existing entry points |
| Retained executor artifact entries | 100; refuse new jobs rather than delete evidence |
| Output capture | 8,000-character tail per stream; more than 1 MiB per stream triggers termination |
| JSON artifact reads | 128 KiB; larger artifacts are refused |

Use scaffoldai_executor_plan_start, then scaffoldai_executor_plan_status and
scaffoldai_executor_plan_result with the returned UUIDv4. Historical non-UUID
test labels are no longer accepted as job identifiers.

The legacy scaffoldai_executor_plan HTTP tool still returns a planning result,
but now awaits an artifact-backed async job without blocking other HTTP requests.
It shares the same admission and retention limits.
POST requests return JSON responses rather than opening additional SSE streams.
GET SSE/bootstrap streams retain the stream-count and connection-lifetime limits.

scaffoldai_executor_plan_cleanup is not exposed through HTTP. Trusted local
cleanup remains explicit: it preserves running/uncertain jobs and never infers
cancellation from elapsed time. Matching terminal status/result evidence is
required for removal. No historical artifacts are automatically pruned.

The admission lock is .scaffoldai/runtime/executor-plans/.executor.lock.
After a crash or uncertain termination, stop and inspect local process/evidence
state. Do not delete a lock simply because its timestamp is old, or retry by
creating another operator. Local recovery needs human confirmation that the
owned executor is no longer running; there is no remote unlock/cancel tool.

Timeouts, excessive output, and orderly operator shutdown terminate the owned
async executor, escalating after two seconds. POSIX execution uses a separate
process group; Windows and the trusted-local legacy synchronous path have only
child-level termination. Escaped groups and hostile local filesystem races are
not sandboxed. If termination is not confirmed, status remains running with an
explicit error and admission remains locked.

HTTP responses omit executor PIDs/absolute repository-root fields, replace known
repository-path prefixes, and avoid returning raw runner exceptions. Local
diagnostics retain detail. Planning output and readonly project observations
may still contain confidential material: this is not a comprehensive redactor.

Regression commands:

```sh
npm run test:scaffoldai:security
npm run test:executor:plan:async
node src/test/unit-scaffoldai-mcp-executor-plan.js
npm run test:mcp:operator:http
```

Security tests use isolated fixtures, mocked Copilot, and disposable loopback
servers. The process-group test launches only harmless Node fixtures, not Copilot.

### Local Lifecycle Surface

Local/manual lifecycle commands own the full lifecycle after a candidate exists in `.scaffoldai/inbox/`.

Only local commands may perform intake, activation, claim, verification, close-feature, cleanup, and idle recovery.

## Remote Proposal / Local Lifecycle Flow

1. A remote operator submits a canonical SDC candidate through the HTTPS operator submit-only surface.
2. The candidate lands only in `.scaffoldai/inbox/` and does not mutate runtime or lifecycle state.
3. A human operator runs local intake and activation when the candidate is ready.
4. Local verification runs against the active packet and persists canonical verification evidence.
5. Close-feature reads packet-bound verification evidence and fails closed when evidence is missing, stale, failed, or bound to a different packet.
6. Cleanup runs only after successful closeout and remains narrow and idempotent.
7. A final status check confirms the workspace has returned to a clean idle state with no active packet.

## Canonical SDC Candidate Expectations

A candidate that enters through the HTTPS submit boundary should be:

- packet-shaped and intake-compatible
- explicit about `MODE`, `EXECUTION SURFACE`, `APPROVAL`, `GOAL`, `TASKS`, `VERIFY`, `OUTPUT`, and `CONSTRAINTS`
- bounded to a single proposal, not a request for autonomous execution
- free of path-based submission tricks or broad filesystem intent
- safe to reject deterministically when duplicate, pending, or malformed

The submit surface is proposal creation only. It is not a lifecycle engine.

## Makefile Operator Workflow

The Makefile is the ergonomic human operator surface over existing npm and CLI primitives.

Primary targets:

- `make scaffold-status` — show current ScaffoldAI status
- `make scaffold-start` — intake + activate the latest intake-compatible candidate
- `make verify-scaffold` — run `npm run verify:scaffoldai`
- `make scaffold-close` — run the gated close-feature flow

Support targets that remain useful when working manually:

- `make scaffold-intake` — intake the latest intake-compatible candidate
- `make scaffold-activate` — activate the latest accepted packet

These targets are wrappers only. They do not add authority, weaken gates, or replace the underlying lifecycle primitives.

## Process / Product Boundary

ScaffoldAI is the process and orchestration harness.

Consync is the product being built inside that harness.

Boundary rules:

- `.scaffoldai/` holds process state, process docs, and harness artifacts
- `.consync/` holds product-facing docs and product metadata
- `src/` and the desktop runtime implement Consync behavior
- process packets should not collapse product and process concerns into one active lifecycle context after the boundary is enforced

If a packet needs both process and product work, it should be explicit about that boundary and keep the process docs separate from product changes.

## HTTPS SDC Submit Coverage Checklist

Status: covered by existing tests; no new coverage gap was identified.

| Checklist item | Coverage evidence | Status |
|---|---|---|
| Valid candidate submit | `src/test/unit-scaffoldai-mcp-submit-sdc-candidate.js`, `src/test/mcp-operator-http-e2e.js` | Covered |
| Invalid SDC rejection | `src/test/unit-scaffoldai-mcp-submit-sdc-candidate.js` | Covered |
| Autonomous wording rejection | `src/test/unit-scaffoldai-packet-intake.js` and the shared intake validator used by submit | Covered |
| Duplicate / pending / collision rejection | `src/test/validate-remote-submit-duplicate-and-pending-guards.js`, `src/test/mcp-operator-http-e2e.js` | Covered |
| Submit path does not mutate active runtime | `src/test/unit-scaffoldai-mcp-submit-sdc-candidate.js`, `src/test/mcp-operator-http-e2e.js` | Covered |
| Submit path does not mutate next-action state | `src/test/unit-scaffoldai-mcp-submit-sdc-candidate.js`, `src/test/mcp-operator-http-e2e.js` | Covered |
| Submit path does not mutate lifecycle state | `src/test/validate-remote-submit-duplicate-and-pending-guards.js`, `src/test/mcp-operator-http-e2e.js` | Covered |
| Submit path does not mutate git | Existing submit tests assert bounded inbox-only writes and no archive mutation | Covered |
| Observer surface cannot submit | `src/test/mcp-readonly-chatgpt-compatibility.js`, `src/test/mcp-readonly-http-e2e.js`, `src/test/mcp-readonly-stdio-e2e.js` | Covered |
| Operator surface cannot lifecycle-mutate | `src/test/mcp-operator-http-e2e.js` | Covered |
| Close-feature requires packet-bound verify evidence | `src/test/unit-scaffoldai-lifecycle-wrappers.js`, `src/test/unit-scaffoldai-lifecycle-simulation.js` | Covered |
| Stale, failed, or missing verification evidence fails closed | `src/test/unit-scaffoldai-lifecycle-wrappers.js`, `src/test/unit-scaffoldai-closeout.js` | Covered |

## Discoverability

Start here when you need the operator pattern:

- `.scaffoldai/process/runbook.process.md`
- `.scaffoldai/README.md`
- `README.md`
- `.scaffoldai/contracts/https-operator-submit-only.contract.md`

For packet execution and lifecycle details, continue with the closeout and verification docs linked from the main runbook.
