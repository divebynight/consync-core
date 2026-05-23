# SDC — Harden Packet Completion Boundaries and Operator Ergonomics

MODE: PLANNING

EXECUTION SURFACE:
ScaffoldAI packet lifecycle guards, operator wrappers, activation preconditions, and lifecycle messaging surfaces.

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Reduce operator cognitive load and prevent unresolved lifecycle artifacts from leaking across packet boundaries while preserving explicit human git authority and fail-closed lifecycle behavior.

This packet should harden the lifecycle completion boundary so operators and AI agents cannot accidentally continue work while packet-generated artifacts remain unresolved.

TASKS:
1. Add a clean-workspace precondition before packet activation.
   - Refuse activation if git workspace contains modified/untracked files.
   - Surface the blocking files clearly.
   - Explain the required operator action.

2. Evaluate and, if appropriate, apply the same clean-workspace boundary to stream switching operations.
   - Keep scope narrow.
   - Preserve existing stream semantics.

3. Repair Makefile/operator wrapper ergonomics for verified closeout.
   - Ensure the preferred close wrapper path correctly supports verified closeout.
   - Remove the need for operators to remember lower-level close commands.

4. Normalize verify/close operator choreography.
   - Preferred lifecycle flow should become:
     - work
     - verify
     - closeout
     - review generated artifacts
     - single final commit
     - clean status

5. Improve lifecycle refusal and status messaging.
   - Clearly distinguish:
     - active packet conflicts
     - unresolved lifecycle artifacts
     - missing verification evidence
     - dirty workspace boundaries
   - Keep messaging concise and operator-action oriented.

6. Ensure status surfaces remain informative but non-authoritative.
   - Status may report dirty lifecycle artifacts.
   - Lifecycle guards enforce safety.
   - Git ownership remains human-controlled.

7. Verify no automation authority expansion occurs.
   - No auto-commit.
   - No auto-push.
   - No automatic git cleanup.
   - No hidden state transitions.

VERIFY:
Run `npm run verify:scaffoldai`.

Run `npm run verify:consync` only if shared command routing or Consync runtime surfaces are touched.

Verification should confirm:
- packet activation fails cleanly on dirty workspace
- refusal messaging is deterministic and actionable
- verified close wrapper works through the preferred operator surface
- status reporting remains coherent
- no lifecycle authority regressions occur

OUTPUT:
- hardened packet activation boundary
- improved verified close operator wrapper behavior
- clearer lifecycle refusal messaging
- normalized operator guidance for verify/close/commit ordering
- preserved explicit git authority boundaries

CONSTRAINTS:
- Do not implement auto-commit behavior.
- Do not implement auto-push behavior.
- Do not redesign lifecycle state architecture.
- Do not introduce packet queue automation.
- Do not implement multi-packet orchestration.
- Preserve one-active-packet semantics.
- Preserve fail-closed lifecycle behavior.
- Preserve explicit human authority over git history.
- Keep changes operationally narrow and lifecycle-focused.

CONTEXT:
Repeated real-world lifecycle usage exposed a consistent operator-friction pattern:
- verify generates lifecycle evidence
- closeout generates additional lifecycle artifacts
- operators can accidentally proceed with unresolved workspace state
- lower-level lifecycle commands are still sometimes required

The current lifecycle is coherent and safe, but too much operator memory is required to maintain clean packet boundaries.

This packet should improve lifecycle ergonomics by enforcing deterministic completion boundaries instead of relying on operator recall.
