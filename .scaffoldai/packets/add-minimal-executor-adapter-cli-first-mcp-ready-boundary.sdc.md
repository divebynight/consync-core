# SDC — Add Minimal Executor Adapter CLI-First MCP-Ready Boundary

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI executor adapter, operator CLI wrappers, and MCP-ready executor invocation boundary

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Add the first bounded executor adapter implementation for Copilot CLI, using a CLI-first design that can later be exposed safely through MCP tools.

The implementation must support:
- bounded executor planning mode
- bounded executor work mode
- active packet resolution
- deterministic project scoping
- operator-first invocation

without coupling executor execution to lifecycle orchestration, discussion behavior, or autonomous workflow transitions.

BACKGROUND:
ScaffoldAI currently supports:
- SDC submission
- packet intake
- packet activation
- next-action workflow
- handoff workflow
- operator-controlled lifecycle progression

Current executor usage is manual and prompt-driven.

Recent executor validation demonstrated:
- Copilot CLI supports bounded capability execution
- planning mode can prohibit writes and shell execution
- execution mode can allow writes while denying shell execution
- repository scoping can be enforced with `copilot -C <repoRoot>`
- Copilot CLI already provides native conversational/session behavior

Architectural clarification:
- executor planning mode is NOT the discussion lane
- discussion/chat behavior is parallel and out of scope
- ScaffoldAI should coordinate executor invocation, not replace executor conversational memory

Core principle:
> Mode is enforced by runner capability boundaries, not prompt wording.

TASKS:
1. Add minimal executor adapter abstraction.

The adapter must:
- support Copilot CLI as the first implementation
- construct bounded executor commands deterministically
- isolate executor-specific behavior behind a narrow adapter boundary
- remain extensible for future executor CLIs
- avoid embedding lifecycle authority

2. Add bounded planning mode execution.

Planning mode must:
- invoke Copilot CLI in read-only planning mode
- prohibit writes
- prohibit shell execution
- support non-interactive invocation
- return captured planning output

Expected boundary equivalent:

```bash
copilot \
  -C <repoRoot> \
  --plan \
  --silent \
  --disable-builtin-mcps \
  --deny-tool='write' \
  --deny-tool='shell(*)' \
  -p "<prompt>"
```

3. Add bounded work mode execution.

Work mode must:
- invoke Copilot CLI in executable mode
- allow bounded writes
- continue prohibiting shell execution
- support non-interactive invocation
- operate only against active approved packet context

Expected boundary equivalent:

```bash
copilot \
  -C <repoRoot> \
  --silent \
  --allow-tool='write' \
  --deny-tool='shell(*)' \
  -p "<prompt>"
```

4. Add deterministic repository scoping.

Executor invocation must:
- resolve repository root deterministically
- invoke Copilot CLI using `-C <repoRoot>`
- also spawn using cwd at repository root
- refuse execution if repository root cannot be resolved
- avoid relying on operator shell location

5. Add operator CLI wrappers.

Add operator-facing commands:
- `make scaffold-plan`
- `make scaffold-work`

These commands should become the primary operator execution surface.

6. Add active packet and next-action resolution.

Executor wrappers must:
- resolve active packet
- resolve current next-action
- refuse execution if no active packet exists
- refuse execution if next-action is unavailable
- pass bounded packet context into executor prompt construction

7. Preserve lifecycle separation.

Executor invocation must not:
- auto-activate packets
- auto-close packets
- auto-verify
- mutate approval state
- mutate workflow phases
- create autonomous orchestration behavior

8. Add MCP-ready execution boundaries.

Structure the implementation so future MCP tools can safely expose:
- executor planning requests
- executor work requests
- executor output retrieval

without exposing arbitrary shell execution.

9. Add targeted tests.

Test at least:
- planning mode command construction
- work mode command construction
- repository scoping behavior
- active packet resolution
- refusal behavior with no active packet
- next-action resolution behavior
- operator command wiring

VERIFY:
Run:
- `npm run verify:scaffoldai`

Also run targeted executor adapter tests added by this work.

OUTPUT:
Return:
1. files changed
2. executor adapter architecture
3. planning mode boundary
4. work mode boundary
5. repository scoping behavior
6. operator command surface
7. lifecycle separation guarantees
8. MCP-ready boundary strategy
9. tests run and results

CONSTRAINTS:
- do not implement discussion lane behavior
- do not implement chat/session systems
- do not redesign lifecycle orchestration
- do not add autonomous execution
- do not mutate approval state automatically
- do not modify `.consync/`
- do not mix Consync state with ScaffoldAI runtime state
- human-controlled commits only
