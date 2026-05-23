# SDC — Stabilize End-to-End Packet Operator Flow

MODE: PLANNING

EXECUTION SURFACE:
ScaffoldAI lifecycle operator flow, Makefile wrappers, CLI/MCP status guidance, verification/closeout behavior, lifecycle tests, simulation tests, e2e-style workflow tests, and related documentation.

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Stabilize the real end-to-end packet operator workflow so the basic happy path is simple, predictable, tested, and safe.

The operator should not need to remember lifecycle choreography, flags, generated artifact timing, or recovery behavior from notes. ScaffoldAI status and wrapper commands should make the next safe action clear.

TARGET OPERATOR FLOW:
1. ChatGPT or another remote proposer submits an SDC candidate.
2. Human/operator intakes and activates the packet locally.
3. Copilot or another local agent performs the packet work without committing unless explicitly authorized.
4. Verification runs and persists packet-bound evidence.
5. Closeout runs through the preferred wrapper surface.
6. Closeout may generate expected lifecycle artifacts.
7. Human/operator reviews and makes one final curated commit.
8. Status reports no active packet, clean git state, and ON_TRACK.
9. Only then should the next packet be activated.

TASKS:
1. Build or repair end-to-end lifecycle tests for the real operator path:
   - intake
   - activate
   - work/change files
   - verify evidence persistence
   - closeout
   - generated closeout artifacts
   - final commit boundary simulation
   - clean status

2. Add or repair unit tests for lifecycle edge cases:
   - missing verification evidence
   - stale verification evidence
   - dirty workspace before activation
   - dirty workspace after closeout
   - close called after successful closeout
   - close wrapper called without required verification context
   - no active packet

3. Add or repair simulation tests for repeated packet cycles:
   - packet A completes cleanly
   - packet B cannot activate while packet A artifacts are unresolved
   - packet B activates after clean boundary
   - no stale active packet leakage

4. Fix the preferred close wrapper behavior.
   - `make scaffold-close` or the documented preferred close command must match the verified closeout path.
   - Operators should not need to remember a lower-level `--verify-passed` command when verification evidence is already valid.
   - If a separate verified close target is required, document it and make status point to it explicitly.

5. Improve closeout idempotency and already-closed guidance.
   - If close is called after the packet is already closed, return clear guidance instead of a confusing failure.
   - Do not mutate lifecycle state again.
   - Tell the operator whether to commit generated artifacts, check status, or activate a new packet.

6. Improve status and next-safe-action messaging.
   - Status should clearly distinguish:
     - active packet in progress
     - verification needed
     - closeout ready
     - closeout completed but generated artifacts uncommitted
     - clean and ready for next packet
   - Messages should be concise and operator-action oriented.

7. Prevent Copilot/agent commit noise in the standard workflow.
   - Update prompts/docs/process guidance so Copilot should not commit during packet work unless explicitly authorized.
   - Preserve human git authority.
   - Do not add automatic commits.

8. Update documentation to describe one authoritative tested happy path.
   - Include expected generated files.
   - Include when to commit.
   - Include what command to run next at each phase.
   - Remove or correct stale contradictory guidance.

9. Verify that test and docs updates are part of the packet, not follow-up chores.
   - A work packet is responsible for its tests and docs when behavior changes.

VERIFY:
Run `npm run verify:scaffoldai`.

Run `npm run verify:consync` only if shared command routing, Consync command surfaces, or Consync runtime/product behavior are touched.

Verification must include:
- unit coverage for key lifecycle edge cases
- simulation coverage for repeated packet cycles
- e2e-style coverage for the full operator happy path
- assertions that generated closeout artifacts are expected and handled predictably
- assertions that no automatic git commit/push behavior is introduced
- assertions that Copilot/agent workflow guidance discourages commits unless explicitly authorized

OUTPUT:
- tested end-to-end operator workflow
- repaired close wrapper or clearly documented verified close wrapper
- improved lifecycle/status next-safe-action messages
- unit/simulation/e2e-style tests for lifecycle operator flow
- updated docs for the tested happy path
- clear statement of remaining deferred issues, if any

CONSTRAINTS:
- Do not implement auto-commit.
- Do not implement auto-push.
- Do not introduce remote lifecycle authority.
- Do not implement multi-packet orchestration.
- Do not redesign packet lifecycle architecture unless a test proves the existing behavior cannot be stabilized.
- Preserve one-active-packet semantics.
- Preserve fail-closed behavior.
- Preserve explicit human authority over git history.
- Keep the packet focused on making the core operator flow reliable, not adding new product features.

CONTEXT:
Recent packets improved lifecycle authority documentation and attempted to harden packet completion boundaries. However, real use exposed that the operator experience is still inconsistent and cognitively heavy.

Observed problems include:
- preferred close wrapper still requiring lower-level flags in practice
- closeout generating additional artifacts after the operator thinks the packet is complete
- confusing behavior when close is called after a packet already closed
- multiple commits or noisy commits becoming easy to create during agent debugging
- status reporting lifecycle state but not always giving a sufficiently actionable next step
- tests covering primitives more than the real operator journey

The intent of this packet is not to add more ceremony. The intent is to make the basic packet workflow boring, tested, and reliable so future work can move faster without regressions or operator confusion.
