# SDC — Stabilize Lifecycle Artifact Ownership and Commit Choreography

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI lifecycle orchestration, verification sequencing, closeout choreography, lifecycle artifact ownership classification, operator-facing status flows, and lifecycle simulation/e2e test infrastructure

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Eliminate operator confusion and lifecycle contradictions around verification, closeout, workspace cleanliness, and commit choreography.

Stabilize the canonical happy-path workflow so operators can reliably execute:
- intake
- activate
- work
- verify
- closeout
- review artifacts
- single intentional commit

without hidden lifecycle contradictions, ambiguous dirty-state failures, repeated manual recovery steps, or uncontrolled checkpoint commits.

BACKGROUND:
Recent lifecycle hardening improved internal safety and enforcement, but exposed orchestration inconsistencies:
- verify writes lifecycle-owned artifacts that dirty the workspace
- closeout may require cleanliness while also generating lifecycle-owned artifacts
- closeout itself writes additional lifecycle-owned artifacts
- operator-visible state and MCP-visible state can diverge in detail
- lifecycle-managed files are treated the same as arbitrary developer edits
- repeated closeout attempts can create confusing operator experiences
- commit choreography expectations remain implicit and inconsistent
- Copilot checkpoint commits introduced unnecessary review noise and operator confusion

The system is safer internally but still imposes too much cognitive load on operators.

TASKS:
1. Introduce lifecycle-owned artifact classification.

At minimum classify:
- `.scaffoldai/state/verify-evidence.json`
- `.scaffoldai/state/handoff.md`
- `.scaffoldai/state/snapshot.md`
- `.scaffoldai/streams/*/stream.md`
- lifecycle-generated packet metadata

The lifecycle engine must distinguish:
- lifecycle-owned generated artifacts
- operator-authored implementation changes

Workspace cleanliness enforcement must account for lifecycle-owned artifacts appropriately.

2. Canonicalize happy-path lifecycle flow.

Codify and stabilize the canonical operator sequence:
- intake
- activate
- work
- verify
- closeout
- review artifacts
- single intentional commit

The flow must become:
- deterministic
- idempotent where appropriate
- explicitly documented
- reflected consistently in status/help messaging
- validated through automated tests

3. Reconcile verify and closeout semantics.

Resolve contradictions between:
- verification evidence persistence
- clean workspace enforcement
- closeout artifact generation

Closeout after verify must not fail because of expected lifecycle-managed writes.

Repeated closeout attempts must become:
- safe
- explainable
- deterministic
- operator-friendly

4. Stabilize commit choreography policy.

Default lifecycle behavior must assume:
- no automatic commits
- no hidden checkpoint commits
- operator-controlled final review
- operator-controlled final commit

Document this as canonical default behavior.

Future extension points for optional commit automation may be documented, but must remain disabled by default.

5. Align MCP and local lifecycle visibility.

Reduce ambiguity between:
- local CLI lifecycle state
- MCP-visible lifecycle state
- git cleanliness state
- packet lifecycle state

Clarify authority boundaries and operator expectations.

6. Expand lifecycle test coverage.

Add or update unit tests for:
- lifecycle artifact ownership rules
- clean/dirty workspace classification
- verify/closeout sequencing
- idempotent closeout behavior
- repeated lifecycle operations

Add or update simulation tests for:
- repeated operator cycles
- interrupted closeout flows
- verify to closeout to commit choreography
- no-active-packet recovery states
- lifecycle retry scenarios

Add or update end-to-end tests for:
- deterministic operator workflows from intake through final clean post-closeout state
- expected lifecycle artifacts
- no hidden checkpoint commits

7. Update documentation.

Document:
- canonical happy-path operator flow
- lifecycle-owned artifact policy
- expected generated files
- commit timing
- MCP versus local status visibility
- default no-agent-commit policy

VERIFY:
Run:
- `npm run verify:scaffoldai`

If shared Consync command routing or Consync runtime/product behavior is touched, also run:
- `npm run verify:consync`

OUTPUT:
Return:
1. files changed
2. lifecycle-owned artifact policy
3. canonical happy-path workflow
4. verify/closeout reconciliation behavior
5. commit choreography policy
6. MCP/local status visibility notes
7. test coverage added or updated
8. verification result
9. confirmation that no automatic commits were introduced

CONSTRAINTS:
- no automatic commits by default
- no automatic pushes
- no remote lifecycle authority
- no verification bypass
- no weakening of lifecycle safety guarantees
- no ambiguous packet ownership
- no multi-packet orchestration
- preserve one-active-packet semantics
- preserve fail-closed behavior
- preserve explicit operator review before final commit
- human-controlled commits only
