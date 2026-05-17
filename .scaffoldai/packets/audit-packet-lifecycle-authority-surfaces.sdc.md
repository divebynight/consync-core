# SDC — Audit Packet Lifecycle Authority Surfaces

MODE: PLANNING

EXECUTION SURFACE:
consync-core ScaffoldAI process source, lifecycle state docs, authority references, verification/closeout surfaces, and read-only lifecycle inspection.

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Audit end-to-end packet lifecycle authority surfaces so ScaffoldAI has a clear source-of-truth map for each lifecycle decision and can reduce operator ambiguity without changing lifecycle mechanics in this packet.

This packet follows the stream usage audit, which found that streams are not the only lifecycle-adjacent surface with authority or documentation drift.

TASKS:
1. Inventory every file and module involved in packet lifecycle decisions.
2. Map the lifecycle phases: intake, activation, claim/collision handling, implementation handoff, verification evidence, closeout, cleanup, status, and idle recovery.
3. Identify the authoritative source of truth for each lifecycle decision.
4. Classify each state artifact as authoritative, derived, evidence, continuity-only, compatibility, or stale/legacy.
5. Identify docs-vs-implementation conflicts around lifecycle authority.
6. Identify surfaces that create operator cognitive load or require memorized choreography.
7. Identify lifecycle-adjacent dangling wires or partial implementations beyond streams.
8. Confirm Consync product/runtime surfaces are not part of ScaffoldAI lifecycle authority.
9. Produce a bounded remediation plan prioritized by risk and ergonomics.
10. Recommend whether a follow-up implementation packet should simplify verified closeout/operator flow.

VERIFY:
This is a planning/audit packet. Prefer read-only inspection unless a separate implementation packet is explicitly approved.

Verification recommendations to include in the audit output:
- npm run verify:scaffoldai for any future ScaffoldAI lifecycle/process implementation change
- npm run verify:consync for any future shared entrypoint, command routing, or runtime-adjacent change
- targeted checks confirming packet authority does not depend on continuity-only artifacts
- targeted checks confirming closeout behavior and generated artifacts are documented and predictable

OUTPUT:
- canonical lifecycle phase map
- authority matrix showing source of truth per lifecycle decision
- state artifact classification matrix
- read/write surface inventory
- docs-vs-code conflict matrix
- operator friction/cognitive-load findings
- dangling-wire or partial-subsystem list
- Consync coupling/risk assessment
- prioritized follow-up remediation plan

CONSTRAINTS:
- Planning/audit first; do not change lifecycle mechanics in this packet.
- Do not broaden into Consync product refactors.
- Do not implement epic/expo/multi-packet orchestration.
- Do not introduce automation authority.
- Do not add git, cleanup, activation, closeout, or verification authority to remote tools.
- Preserve one-active-packet semantics.
- Preserve fail-closed behavior.
- Treat packet lifecycle as the trust boundary.
- Treat operator ergonomics as important, but separate guidance/choreography automation from authority automation.

CONTEXT:
Recent validated lifecycle work showed that packet intake, activation, implementation, verification, closeout, cleanup, and idle recovery now work end-to-end.

However, repeated use exposed operator friction and several lifecycle-adjacent surfaces that may be authoritative, derived, stale, or partially implemented. The stream audit found stream state to be partly load-bearing for gatekeeper consistency while packet authority remains state-first. It also surfaced broader concerns around active policy/runtime, next-action, verify evidence, closeout gates, housekeeping, snapshots, status/question surfaces, and docs drift.

The desired next step is to build an explicit authority map before making implementation changes, so future process improvements can move faster without introducing regressions or bloat.
