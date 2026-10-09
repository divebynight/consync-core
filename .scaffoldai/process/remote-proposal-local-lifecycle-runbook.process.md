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

The operator HTTPS MCP surface authenticates Cloudflare Access assertions and
currently authorizes only the five metadata observation tools (`metadata:read`),
the two shared-report tools (`report:read`), and the append-only
`scaffoldai_message_send` tool (`message:write`).

Candidate submission and both planning aliases remain registered but denied,
as do executor status/result retrieval. It must not intake, activate, claim, perform
writable execution, verify-run, close out, cleanup, commit, or mutate next-action.

Local JWT verification is implemented; this alone does not prove production
Cloudflare + ChatGPT integration. Start the production operator only in a
separately approved configuration/test window. Do not expose the legacy observer
HTTP implementation instead: it does not gain the operator's authentication.

### Local authentication configuration

Required startup environment values (placeholders only; do not store real values
or credentials in Git):

```text
SCAFFOLDAI_ACCESS_ISSUER=https://<team-name>.cloudflareaccess.com
SCAFFOLDAI_ACCESS_AUD=<dedicated lowercase 64-hex application AUD>
SCAFFOLDAI_ACCESS_SUBJECTS=["<approved Access user sub>"]
```

The allowlist supports 1-16 unique subjects, each assigned only metadata:read.
There is no configurable production grant for execution or other future
capabilities. Invalid/missing configuration throws before the listener starts.
Changing the allowlist requires an explicitly approved local reconfiguration.

The configured team endpoint supplies cached JWKS. Verification pins RS256,
issuer, audience, app-token type, approved human subject and token times.
No unsigned identity header, cookie, session ID, candidate attribution, or
caller-provided approval substitutes for the assertion.

All /mcp requests and /health require authentication. Authenticated sessions bind
to issuer + subject; another approved subject cannot reuse them. Credentials are
not forwarded into SDK handler context. Capabilities are checked at invocation,
including inherited read-only handlers; tool discovery is not authorization.

Missing/invalid/expired assertions return 401. Unknown subjects and session
mismatches return 403. Denied tools return a structured MCP error. Raw assertions
and upstream verification errors are never returned or logged.

Future remote job creation requires trusted owner metadata before spawning.
Remote reads require matching ownership; ownerless historical artifacts stay
local-only and are not adopted automatically. No production principal can start
or read executor jobs in this rollout. Local stdio/CLI behavior remains separate.

Cloudflare still must authenticate OAuth clients/users, enforce Access policy,
map opaque OAuth tokens to signed assertions, and handle revocation. Offline JWT
verification cannot immediately detect a revoked but unexpired assertion.
No local OAuth server or discovery endpoint is implemented.

### Temporary action-discovery diagnostics

The HTTP operator temporarily emits `[MCP diagnostic]` JSON records to stderr
for the first 128 HTTP requests per server instance, at most five records per
request (640 total). The counter saturates; later requests continue normally
without diagnostic records. No disk log, credentials, or configuration switch
is added. Startup and fixed maintenance messages remain separate.

Records contain only server-generated timestamps/request numbers, allowlisted
HTTP methods/routes, assertion presence, authentication outcome/fixed reason,
allowlisted MCP method class, session presence/found/owner booleans, and HTTP
status/completion/fixed protocol-error category. Unknown routes and method names
become `other`; query strings, bodies, tool arguments, identifiers, claim values,
credentials and upstream exception text are never emitted. Subject match is
reported only after cryptographic verification and a local allowlist comparison;
its absence does not mean a mismatch.

Authentication failures retain generic client errors. Local reason codes are
`missing_assertion`, `issuer_mismatch`, `audience_mismatch`, `signature_failure`,
`jwks_failure`, `expired`, `not_yet_valid`, `invalid_token_type`,
`unapproved_subject`, or `other_auth_failure`. Key resolution failures, including
an unknown key ID, are `jwks_failure`; no key ID is logged.

Protocol classification happens after authentication and JSON parsing, before
SDK dispatch: `initialize`, `notifications/initialized`, `tools/list`, or `other`.
Session lookup describes an existing session before any new initialization.
Response completion means Node finished writing, not proof that ChatGPT accepted
the response. A disconnect before headers has no status field. HTTP errors
without a more specific local category are `http_rejected`; JSON-RPC response
bodies are not inspected, so HTTP 200 alone does not prove semantic success.
Authentication may settle after a disconnect and keeps the same request number.

Use one manually approved ChatGPT discovery retry, then inspect local records.
No records means only that no request was captured: it does not establish a
particular edge failure, especially if the 128-request budget was exhausted.
Removal of this temporary instrumentation is a separate approved code change.
Diagnostics do not grant tools, relax authentication, or modify workspace state.

For the separately approved identity-binding test, `auth.js` also emits one
`[MCP identity]` record per verifier lifetime, after all cryptographic,
application-token and human-token checks pass and before subject approval.
It contains only `intended_email_match` and `same_assertion_subject` booleans.
The first compares the exact validated email's UTF-8 SHA-256 fingerprint with
the pinned intended-identity fingerprint, without case folding or trimming.
The second confirms the subject used by the unchanged allowlist check comes
from that same verified payload. A matching email never approves a subject.
The fingerprint override exists only in the verifier's synthetic-test dependency
seam; production has no environment/configuration override. The fingerprint
avoids plaintext identity in source; it is not encryption or anonymization.

This one-shot record is additional to the 640-record HTTP diagnostic budget.
Invalid tokens do not consume it; the first fully verified application assertion
does, even if its email does not match. Missing output is not a false comparison.
Use one approved Safari navigation and correlate the existing request/auth/HTTP
records with this observation; unrelated concurrent traffic makes attribution
uncertain. The record retains no email, subject or assertion for later approval.
Both booleans must be true before claiming identity binding, and changing the
allowlist still requires a separate approval.

### One-shot subject capture

To learn the verified Access `sub` for an explicitly approved allowlist change,
the operator may be armed for a single launch with
`SCAFFOLDAI_ACCESS_SUBJECT_CAPTURE=1` in the process environment only. Never add
it to the auth configuration file. Unset or empty leaves behavior unchanged; any
other value refuses startup. When armed, startup emits
`[MCP subject-capture] {"armed":true}`.

Capture shares the `[MCP identity]` one-shot: it is evaluated only for the first
assertion that passes every cryptographic, application-token and human-token
check. If `intended_email_match` is true it emits
`[MCP subject-capture] {"captured":true,"sub":"<verified sub>"}`; otherwise
`{"captured":false}` and nothing further is revealed for that operator lifetime.
Invalid assertions do not consume it. Email never approves a subject.

Capture does not enroll the subject, write any file, change the allowlist,
capabilities or HTTP responses. An unlisted subject still receives 403. Stop the
operator after capture, update `SCAFFOLDAI_ACCESS_SUBJECTS` only with explicit
approval, validate configuration, and restart without the arming variable.

### Known-good ChatGPT OAuth integration (2026-10-06)

First proven round trip: ChatGPT conversation → `ScaffoldAI MCP OAuth Test`
plugin → OAuth → Cloudflare Access → Cloudflare tunnel → local operator →
`scaffoldai_status` (`execution_class: READ_ONLY`) → response in ChatGPT.
The run used capture mode OFF and the unchanged `metadata:read` remote policy.

**ChatGPT plugins (do not confuse):** two configurations share the same MCP URL.

- `ScaffoldAI MCP` — older; Authorization supported/used: None. It did not
  prove the authenticated path.
- `ScaffoldAI MCP OAuth Test` — Authorization supported/used: OAuth. This is
  the known-good configuration.

**Identity:** the verified Access `sub` was obtained once via one-shot subject
capture from a real ChatGPT assertion (`intended_email_match`,
`same_assertion_subject` and `captured` all true), then explicitly approved as
the only entry in `SCAFFOLDAI_ACCESS_SUBJECTS`. The value lives only in
`~/.config/scaffoldai/operator-auth.env` (owner-only), never in Git.

**Tunnel (remotely managed):** cloudflared runs as a root launchd daemon
(`/Library/LaunchDaemons/com.cloudflare.cloudflared.plist`) with
`tunnel run --token <redacted>`. Ingress is configured in the Cloudflare
dashboard, not on disk: `<mcp-hostname>` → `http://localhost:3133`, else
`http_status:404`. Logs: `/Library/Logs/com.cloudflare.cloudflared.err.log`.
The origin says `localhost` while the operator binds only `127.0.0.1`;
cloudflared may try `[::1]:3133` first and fall back. This works today and is
recorded, not changed.

**Normal startup** (from the repository root; no capture variable):

```sh
umask 077
set -a; . ~/.config/scaffoldai/operator-auth.env; set +a
unset HOST PORT SCAFFOLDAI_ACCESS_SUBJECT_CAPTURE
node src/scaffoldai/mcp-operator/http.js >> ~/.config/scaffoldai/<run>.log 2>&1
```

`npm run scaffoldai:mcp:operator:http` runs the same entry point; the proven run
invoked `node` directly. Expect `server listening on 127.0.0.1:3133` and no
`[MCP subject-capture]` line. Verify with
`lsof -nP -iTCP:3133 -sTCP:LISTEN` (one `node` on `127.0.0.1:3133`).

**Restart procedure:**

1. Confirm cloudflared is running (`pgrep -fl cloudflared`) and its error log
   shows no recent disconnects.
2. Start the operator as above with the existing auth env.
3. Confirm `127.0.0.1:3133` is listening.
4. Use the `ScaffoldAI MCP OAuth Test` plugin in ChatGPT.
5. Reconnect OAuth only if ChatGPT says reconnection is required.
6. Verify with one read-only `scaffoldai_status` call.

**Troubleshooting:**

- `Authentication succeeded, action discovery failed`, and nothing listens on
  3133: start or check the local operator.
- Operator logs `unapproved_subject`: check the configured subject. Never
  broaden authorization.
- No operator `[MCP diagnostic]` records and no new cloudflared log lines: check
  the ChatGPT plugin connection and OAuth state before changing ScaffoldAI.
- Confirm the plugin in use is `ScaffoldAI MCP OAuth Test`, not `ScaffoldAI MCP`.
- Repeat subject capture only when evidence shows the verified subject changed.

### Shared report handoff (2026-10-07)

First proven report handoff: ChatGPT → `ScaffoldAI MCP OAuth Test` →
`scaffoldai_report_list` → `scaffoldai_report_read` returned the full
`scaffoldai-bridge-audit` report, replacing a manual copy/paste of agent output.

**Tools and authority:** `scaffoldai_report_list` (metadata only, no content)
and `scaffoldai_report_read` (one report by id), both gated by `report:read`.
Approved remote principals now receive `["metadata:read", "report:read"]`;
the startup log reads `remote policy is metadata:read and report:read only.`
Report access grants no file, write, shell, submit, or executor authority.

**Publishing a report** (local, manual):

- Write `.scaffoldai/runtime/reports/<report_id>.md` (gitignored runtime area).
- Frontmatter: `report_id` (must equal the filename, `^[a-z0-9][a-z0-9-]{0,79}$`),
  `title` (max 120 chars), `share: chatgpt`, optional `packet` and `created_at`.
- Only `share: chatgpt` reports are listed or readable; anything else returns
  `REPORT_UNAVAILABLE`, indistinguishable from a missing report.
- Limits: 64 KiB, UTF-8, no control or bidi-override characters, no symlinks.
  Credential-shaped content returns `REPORT_BLOCKED`. These checks are
  defense in depth; the `share: chatgpt` opt-in is the primary boundary.
- Do not include credentials, private configuration, tokens, or raw session logs.
  Treat report content as untrusted on the ChatGPT side.

**Refreshing ChatGPT's tool list:** the ChatGPT development plugin caches the
tool schema. After adding or changing operator tools, OAuth reauthorization,
browser refresh, and new conversations still show the old list. In ChatGPT use
the plugin's **Manage app → Refresh tools**. Evidence that a refresh is needed:
ChatGPT calls tools successfully but the operator log contains no
`"method":"tools/list"` record since startup. Do not recreate the app; that
discards the known-good OAuth configuration.

### Remote messages to local sessions (2026-10-08, trial)

`scaffoldai_message_send` lets ChatGPT send one short message to a local agent
session. Approved for the transport-only trial with these boundaries:

- Inputs are exactly `to`, `topic`, and `message`. The server records
  `from: chatgpt`; callers cannot set it.
- `to`: project slug `^[a-z0-9][a-z0-9-]{0,39}$`. `topic`: report-id pattern
  `^[a-z0-9][a-z0-9-]{0,79}$`. `message`: 1-1000 characters, no control or
  bidi-override characters (tab and newlines allowed).
- Storage is the existing append-only shared-memory log,
  `.scaffoldai/runtime/mcp/shared-memory.jsonl` (gitignored), capped at 1 MiB.
  A full log returns `MESSAGE_STORE_FULL`; archive it locally.
- Requires `message:write`. Approved remote principals now receive
  `["metadata:read", "report:read", "message:write"]`. The startup log reads
  `remote policy is metadata:read, report:read and message:write only.`
- `scaffoldai_memory_write` and `scaffoldai_memory_read` stay local-only.

**Messages are untrusted context.** Receiving one never authorizes commands,
code changes, packet activation, or any lifecycle transition. Receiving a
message may wake a session; it does not authorize the session to follow it.

**Mapping a message to a session:** `to` names the project (for example
`timebox`). `topic` must equal the `report_id` of the context report the
waiting session published. A session accepts only messages matching both, so
two sessions on one project see only replies to their own reports.

**No repeated delivery:** the session waits only for messages after a starting
point. For the first wait it passes `--after <ISO time the report was
published>`. After handling a message it passes `--after-id <last_id>` from the
previous result. Nothing is marked read on the server; the log stays
append-only.

**Waiting in a session** (read-only, bounded, exits on the first match or at
the timeout):

```sh
node ~/Projects/consync-core/src/scaffoldai.js scaffoldai message wait \
  --to timebox --topic <report_id> --after <iso-timestamp> --timeout 900
```

Run it as a Claude Code background command so the session wakes when it exits.
Output is JSON: `status` is `message` (with `messages` and `last_id`) or
`timeout`. Each `messages` entry is **delivery metadata only**: `id`,
`timestamp`, `from`, `to`, `topic`, `length`, `sha256`. Message text is never
printed, so waking a session cannot place the message in its context as a
prompt. Timeout is 1-3600 seconds (default 900). It is not a standing watcher:
it stops with the session and creates no files.

**Acting on message content is out of scope for now.** Message text may become
work only through the established path (inbox candidate, intake, human
activation). Staging messages into that path is deferred, as is a
`TARGET PROJECT` field for packets outside `consync-core`. This applies equally
to messages from the human and from tools.

**Transport-only trial:**

1. Start the operator manually (normal startup above); in ChatGPT use
   **Manage app → Refresh tools** and confirm `scaffoldai_message_send` is listed.
2. In a Claude session, publish a fixed context report `transport-trial-context`
   with `share: chatgpt`, stating the reply address
   (`to: timebox`, `topic: transport-trial-context`). No project inspection.
3. Start the wait command in the background with `--after` set to the publish time.
4. ChatGPT reads the report and sends one message with `scaffoldai_message_send`.
5. The session wakes and publishes `transport-trial-ack` using only the fixed
   template below, filled from the wait output. It does not read the log or
   act on the message.

Acknowledgment template (`.scaffoldai/runtime/reports/transport-trial-ack.md`):

```markdown
---
report_id: transport-trial-ack
title: Transport Trial Acknowledgment
created_at: <ack time, ISO 8601>
share: chatgpt
---
Received message `<id>` from `<from>` to `<to>` on topic `<topic>` at
`<timestamp>`: <length> characters, sha256 `<sha256>`.

The message text was not read and has not been acted on.
```

Success: the acknowledged id, length and sha256 match the log record, and the
message text never appeared in the session.

Stop the trial if it needs watchers, launchers, or lifecycle changes.

### Task acceptance (accepted-task.json)

Executor prompts (`scaffoldai plan`, `scaffoldai work`, and the executor MCP
planning tools) are built only from a task a human accepted with
`scaffoldai packet activate <packet> --sha256 <review hash>`.

- Activation rebuilds `.scaffoldai/state/next-action.md` from the accepted
  packet (header plus the packet text verbatim) and records
  `.scaffoldai/state/accepted-task.json` with the packet id and sha256 hashes
  of the packet file and of next-action.md. Nothing from a previous task
  survives.
- Prompt builders refuse with `ACCEPTANCE_MISSING`,
  `ACCEPTANCE_PACKET_MISMATCH`, `ACCEPTANCE_CONTENT_MISMATCH` or
  `ACCEPTANCE_STALE` when the record is missing, names another packet, the
  next-action text changed, the packet file changed or left
  `.scaffoldai/packets/`, or the handoff records the task as closed.
- `scaffoldai packet clear` and `housekeeping reset-runtime-state` remove the
  record (and any work authorization) before rewriting next-action.md.
- **Re-acceptance:** an open task without a valid record needs an explicit
  `scaffoldai packet activate <packet> --sha256 <review hash>`; that rebuilds next-action.md from the
  packet file. Re-activating a task the handoff records as closed is refused
  (`packet_already_closed`); create a new packet instead.
- This is task-integrity enforcement: it controls which instructions reach a
  worker, not what the worker does with them. The record is not a signature.

**Current state (2026-10-09):** the live next-action.md was hand-written for
the smoke-test task `test-async-executor-plan-flow.sdc` and has no acceptance
record, so executor prompts refuse with `ACCEPTANCE_MISSING`. This is
intentional. Re-accepting it with
`scaffoldai packet activate test-async-executor-plan-flow.sdc --sha256 <review hash>`
would replace the hand-written instructions with that packet file's text; do so
only deliberately.

### Review binding (preview and --sha256)

Validation PASS only makes a proposal eligible for review. Acceptance binds the
exact text the human reviewed:

1. `scaffoldai packet preview <path>` (read-only) prints the validation result,
   the APPROVAL values, task-state conflicts, the packet text with hidden
   control and bidi characters escaped, and the **review hash**: the sha256 of
   the normalized text (trailing newline ensured).
2. `scaffoldai packet intake <path> --sha256 <hash> [--activate]` hashes the
   bytes it actually read and refuses (`review_hash_required`,
   `review_hash_mismatch`) before writing anything. One hash covers
   `--activate` too.
3. `scaffoldai packet activate <packet> --sha256 <hash>` checks the packet
   bytes it will accept, before any write and before the idempotent return.
   A refusal leaves an existing acceptance record untouched.
4. `scaffoldai lifecycle intake-latest|activate-latest|start-latest` require
   `--sha256` and refuse without it, because they pick a candidate by recency.
   npm: `npm run scaffoldai:activate-latest -- --sha256 <hash>`.
   make: `make scaffold-activate SHA256=<hash>`.

The accepted record's `packet_sha256` equals the previewed review hash for any
packet that entered through intake.

**Approval text.** Proposals must arrive with exactly one APPROVAL block
containing only `execute: PENDING` and `commit: PENDING`. Other values,
unknown or duplicate keys, duplicate blocks and malformed approval headers are
rejected at submission and intake. Activation applies the same parser, so
historical packets with any other approval text cannot be newly activated
(`packet_approval_not_pending`). Only legacy packets with no approval-like
header at all activate under the documented PENDING default. Prompts state
that packet APPROVAL text grants no authority. Acceptance selects the
reviewed instructions; execution, commit and push each need explicit human
authorization. Work authorization is recorded and checked as described in
"Work authorization (authorize-work)" below.

**Limits.** The hash proves the accepted bytes equal the reviewed bytes. It
does not prove a human ran the command: any process running as the same user
can compute a hash. Work authorization is not part of this step.

### Work authorization (authorize-work)

Acceptance selects the instructions; it does not authorize work. `scaffoldai
work` prints a work prompt and command only for a task the human has also
authorized for work:

- `scaffoldai packet authorize-work <packet> --sha256 <review hash>` writes
  `.scaffoldai/state/work-authorization.json` (gitignored) through
  `scaffoldaiState`. The record binds `packet_id`, `packet_file`,
  `packet_sha256`, `next_action_sha256` and `accepted_at` of the current
  acceptance, with `mode: work`. It refuses, writing nothing, without a
  matching acceptance record (`acceptance_missing`,
  `acceptance_packet_mismatch`, `acceptance_invalid`), for a task that is not
  open (`task_not_open`), without or with a wrong review hash, or when the
  accepted packet's approval text is not PENDING
  (`packet_approval_not_pending`). Legacy packets with no approval-like header
  keep the PENDING default and record `approval_compatibility`.
- `scaffoldai packet activate <packet> --sha256 <hash> --authorize-work` does
  both in one explicit command, with one hash. If activation is refused,
  authorization is not attempted. If authorization is refused after a
  successful activation, the acceptance stays and work stays unauthorized
  (exit code 1). Plain `activate` never authorizes, and `packet intake`
  refuses `--authorize-work`.
- **Invalidation.** Every activation that is not refused removes the record,
  including re-activating the already accepted packet. `packet clear` and
  `housekeeping reset-runtime-state` remove it. A closed, replaced or
  re-accepted task makes any remaining record unusable, because every bound
  field must equal the current acceptance and the task must be open. Refused
  activations change nothing. A failed activation leaves work unauthorized.
- **Enforcement.** `buildWorkPrompt` and `scaffoldai work` refuse with
  `EXECUTION_NOT_AUTHORIZED` (with `acceptance_code` when acceptance itself
  failed) before printing any prompt or command. Planning (`scaffoldai plan`
  and the local executor planning tools) needs acceptance and an explicit
  request, not work authorization. Activation and authorization launch
  nothing.
- **Limits.** File and surface scope in the instructions remain instructional;
  Copilot `--allow-tool=write` is repo-wide. The record does not prove a human
  created it; any process running as the same user can forge it. The check
  runs when the prompt and command are generated; a command already printed
  cannot be revoked by it, and interactive Claude or Copilot sessions follow
  it by convention only.

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
| Concurrent application requests, including authentication and health | 32; excess returns 503 |
| Concurrent MCP SSE streams, including authenticated bootstrap | 8 |
| SSE connection lifetime | Shorter of 60 seconds and assertion validity; reauthenticate on reconnect |
| HTTP sockets | 64; additional sockets are rejected |
| Access assertion | 8192 characters maximum; RS256 verification required |
| JWKS retrieval | 3 seconds, 64 KiB, no redirects |
| JWKS refresh/cache | Coalesced refresh; 30-second cooldown including failures; 10-minute key cache |
| Inbox entries | 100; further submissions refused, no automatic deletion |
| Concurrent planning executors | One per repository, across existing entry points |
| Retained executor artifact entries | 100; refuse new jobs rather than delete evidence |
| Output capture | 8,000-character tail per stream; more than 1 MiB per stream triggers termination |
| JSON artifact reads | 128 KiB; larger artifacts are refused |

The retained local executor flow uses scaffoldai_executor_plan_start, then
scaffoldai_executor_plan_status and scaffoldai_executor_plan_result with the
returned UUIDv4. These tools are denied over HTTP in the initial rollout.
Historical non-UUID test labels are no longer accepted as job identifiers.

The legacy scaffoldai_executor_plan adapter retains its artifact-backed async
implementation and admission/retention limits, behind the invocation guard.
It cannot execute under the initial remote policy.
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

Security tests use generated local signing keys, the real JOSE verifier with
mocked JWKS retrieval, isolated artifacts, and disposable loopback servers on
ephemeral ports. No production entry point, real token, or Cloudflare request is
needed. The process-group test launches only harmless Node fixtures, not Copilot.

### Local Lifecycle Surface

Local/manual lifecycle commands own the full lifecycle after a candidate exists in `.scaffoldai/inbox/`.

Only local commands may perform intake, activation, claim, verification, close-feature, cleanup, and idle recovery.

## Remote Proposal / Local Lifecycle Flow

Historical flow below is retained for context. Step 1 is disabled by the current
metadata-only HTTP policy; authentication does not re-enable it.

1. A remote operator submits a canonical SDC candidate through the HTTPS operator submit-only surface.
2. The candidate lands only in `.scaffoldai/inbox/` and does not mutate runtime or lifecycle state.
3. A human operator previews the candidate (`scaffoldai packet preview`) and runs local intake and activation with the review hash (`--sha256`) when the candidate is ready.
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

`scaffold-intake`, `scaffold-activate` and `scaffold-start` require the review
hash from `scaffoldai packet preview`: pass `SHA256=<hash>`. Without it they
refuse with guidance.

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

Submission mechanics remain covered locally. HTTP tests now prove authenticated
submission denial rather than successful remote submission.

| Checklist item | Coverage evidence | Status |
|---|---|---|
| Valid local candidate submit | `src/test/unit-scaffoldai-mcp-submit-sdc-candidate.js` | Covered |
| Invalid SDC rejection | `src/test/unit-scaffoldai-mcp-submit-sdc-candidate.js` | Covered |
| Autonomous wording rejection | `src/test/unit-scaffoldai-packet-intake.js` and the shared intake validator used by submit | Covered |
| Duplicate / pending / collision rejection | `src/test/validate-remote-submit-duplicate-and-pending-guards.js` | Covered |
| Submit path does not mutate active runtime | `src/test/unit-scaffoldai-mcp-submit-sdc-candidate.js`, `src/test/mcp-operator-http-e2e.js` | Covered |
| Submit path does not mutate next-action state | `src/test/unit-scaffoldai-mcp-submit-sdc-candidate.js`, `src/test/mcp-operator-http-e2e.js` | Covered |
| Submit path does not mutate lifecycle state | `src/test/validate-remote-submit-duplicate-and-pending-guards.js` | Covered |
| Authenticated remote submission and planning are denied | `src/test/mcp-operator-auth-security.js`, `src/test/mcp-operator-http-e2e.js` | Covered |
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
