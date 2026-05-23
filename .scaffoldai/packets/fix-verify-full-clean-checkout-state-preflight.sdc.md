# SDC — Fix verify-full Clean Checkout State Preflight

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI lifecycle verification, state preflight, and clean-checkout verification behavior

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Fix the lifecycle mismatch where `make scaffold-status` reports `ON_TRACK` while `make verify-full` fails during `check:state-preflight` because ignored local ScaffoldAI runtime state files are missing.

BACKGROUND:
After `.scaffoldai/state/*` became runtime-owned and ignored, full verification still requires local runtime state files such as:
- `.scaffoldai/state/active-stream.md`
- `.scaffoldai/state/next-action.md`
- `.scaffoldai/state/snapshot.md`

This causes `make verify-full` to fail on a clean checkout even when:
- `make verify-scaffold` passes
- `make verify-consync` passes
- Consync e2e tests pass
- `make scaffold-status` reports `STATUS: ON_TRACK`

The failure appears to be a ScaffoldAI lifecycle verification mismatch, not a Consync product failure.

TASKS:
1. Reproduce the current failure.

Run `make verify-full` on `main` from the current clean working tree and confirm the failure occurs in `npm run check:state-preflight`.

2. Inspect verification command ordering.

Review the command chain for:
- `make verify-full`
- `npm run check:state-preflight`
- `make scaffold-status`
- any status/preflight helper used by `src/scaffoldai.js`

3. Identify the lifecycle mismatch.

Determine why `scaffold-status` treats absent runtime state as non-blocking while `check:state-preflight` treats the same condition as fatal.

4. Implement the smallest lifecycle-consistent fix.

The fix should make `make verify-full` runnable from a clean checkout when no active packet exists and missing `.scaffoldai/state/*` files are only ignored runtime state.

Acceptable fix strategies include:
- initializing or reconciling ephemeral runtime state before preflight
- adding a CI-safe or clean-checkout-safe preflight mode
- aligning preflight severity with `scaffold-status` when no active packet exists
- adjusting full verification command ordering if that is the true source of the mismatch

5. Preserve runtime/source boundaries.

Ensure the fix preserves the distinction between:
- tracked contracts and configuration
- ignored ScaffoldAI runtime state
- Consync product verification
- ScaffoldAI lifecycle verification

6. Avoid reintroducing tracked runtime state.

Do not re-track `.scaffoldai/state/*` files or move ScaffoldAI state into `.consync/`.

7. Update minimal documentation if needed.

Only update command help or lifecycle notes if the behavior change requires clarification.

VERIFY:
Run:
- `make scaffold-status`
- `make verify-scaffold`
- `make verify-consync`
- `make verify-full`
- `git status`

OUTPUT:
Return:
1. root cause
2. files changed
3. selected fix strategy
4. verification command results
5. confirmation that `.scaffoldai/state/*` runtime files were not re-tracked
6. confirmation that Consync product verification was not weakened
7. remaining risks or follow-up work

CONSTRAINTS:
- no MCP write authority expansion
- no autonomous execution
- no staging, committing, pushing, branching, or PR creation without human approval
- no re-tracking `.scaffoldai/state/*` runtime files
- no moving ScaffoldAI runtime state into `.consync/`
- no weakening Consync product verification
- no unrelated Consync product refactor
- no deletion of accepted packets
- no deletion of append-only logs
- human-controlled commits only
