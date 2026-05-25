# SDC — Executor Plan Output Capture and Terminal-State Reliability

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI async executor planning reliability

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Harden the async executor planning system so terminal state, stdout/stderr capture, and timeout behavior are deterministic and observable under real Copilot CLI execution.

BACKGROUND:
The async executor planning architecture is now working end-to-end:
- async MCP job creation
- status polling
- result retrieval
- durable runtime artifacts
- lifecycle separation
- bounded execution constraints

However, the first live validation exposed reliability gaps:
1. Copilot completed with exit code 0 but stdout/stderr artifacts were empty
2. MCP polling briefly reported stale `running` state while artifact state had already transitioned to `completed`
3. Real-world execution timing (~120s) revealed need for stronger watchdog/terminal guarantees

This packet focuses ONLY on runtime reliability and observability.

TASKS:
1. Harden terminal-state finalization.
- Ensure status/result artifacts are written atomically
- Ensure MCP status reads cannot observe stale in-memory state
- Ensure finalize paths are idempotent
- Ensure:
  - exit
  - close
  - error
  - timeout
  all converge through a single finalize path

2. Improve stdout/stderr capture reliability.
- Verify Copilot CLI output behavior under:
  - `--plan`
  - `--silent`
  - non-interactive spawn
- Determine whether output is emitted on:
  - stdout
  - stderr
  - tty-only streams
- Capture all available streams deterministically
- Preserve bounded execution guarantees

3. Add runtime observability.
Persist additional runtime metadata:
- pid
- spawn time
- finalize reason
- terminal event source
- bytes captured
- timeout-fired boolean

4. Add watchdog correctness guarantees.
- Ensure timeout always transitions terminal state
- Ensure orphaned processes cannot remain indefinitely running
- Ensure duplicate finalize calls are safely ignored

5. Improve artifact ergonomics.
Add optional incremental artifacts if appropriate:
- stdout.partial.log
- stderr.partial.log

Only if they improve observability without increasing lifecycle authority.

6. Add targeted tests.
Cover:
- stdout capture
- stderr capture
- finalize-on-close
- finalize-on-exit
- timeout finalize
- duplicate finalize suppression
- stale running-state prevention
- artifact atomicity
- zero-output successful completion behavior

VERIFY:
Run:
- async executor plan tests
- scaffoldai verification
- one live MCP async planning flow

OUTPUT:
Return:
1. observed Copilot output behavior
2. finalized runtime model
3. artifact behavior
4. timeout/watchdog behavior
5. any remaining architecture concerns

CONSTRAINTS:
- no arbitrary prompt execution
- no arbitrary shell execution
- no work-mode execution
- no lifecycle mutation authority
- no auto-approval behavior
- no commit authority
- no `.consync` usage
- preserve operator-controlled lifecycle boundaries
