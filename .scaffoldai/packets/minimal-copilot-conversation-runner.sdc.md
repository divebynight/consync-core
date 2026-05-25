# SDC — Minimal Copilot Conversation Runner

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI runner adapter and CLI conversation execution path

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Build the smallest safe path from `next-action` to Copilot CLI execution to `handoff`, with mode enforced by runner command capability boundaries rather than prompt-only lifecycle policing.

BACKGROUND:
ScaffoldAI is shifting toward a simpler architecture:
- safety enforced through executor capability boundaries
- thin workflow protocol
- human-controlled transitions
- bounded runners
- simple artifacts

Key principle:
> Mode is not a prompt. Mode is the runner capability boundary.

The previous lifecycle system is stable enough to leave in place for now. This packet should not begin by refactoring lifecycle, closeout, freshness enforcement, or reconciliation/state inference. It should create the thinnest working conversation runner slice.

TASKS:
1. Add a Copilot CLI adapter module.

The adapter must:
- build bounded Copilot CLI commands
- support at least `discuss` mode
- keep command construction testable without invoking Copilot
- avoid embedding workflow transition authority in the adapter

2. Implement `discuss` mode command boundaries.

The discuss mode boundary must be equivalent to:

```bash
copilot \
  --plan \
  --silent \
  --disable-builtin-mcps \
  --deny-tool='write' \
  --deny-tool='shell(*)'
```

3. Add one minimal ScaffoldAI CLI entry point for invoking the Copilot runner against the current `next-action` artifact.

Acceptable command names include one of:
- `scaffoldai converse`
- `scaffoldai runner:copilot`
- another clearly named command consistent with existing CLI patterns

4. Read current `next-action` content as the runner prompt/input.

5. Invoke Copilot CLI through the adapter with the selected runner mode boundary.

6. Capture Copilot output into a simple `handoff` artifact.

The handoff should be simple and should not become an orchestration/state system.

7. Preserve human-controlled transitions.

The runner must not:
- auto-close
- auto-verify
- auto-activate
- auto-claim
- auto-cleanup
- mutate phase authority

8. Add targeted tests.

Test at least:
- discuss mode command construction
- unsupported mode rejection, if applicable
- basic next-action to handoff artifact flow where practical

VERIFY:
Run:
- `npm run verify:scaffoldai`

Also run any targeted runner or adapter tests added by this work.

OUTPUT:
Return:
1. files changed
2. command added
3. Copilot adapter architecture
4. exact discuss mode command boundary
5. next-action input behavior
6. handoff output behavior
7. tests run and results
8. known limitations or follow-up work

CONSTRAINTS:
- do not refactor lifecycle enforcement in this packet
- do not redesign closeout in this packet
- do not remove or expand verify freshness behavior in this packet
- do not add complex reconciliation/state inference
- do not perform workflow phase transitions from inside the runner
- do not modify `.consync/`
- do not mix Consync product state with ScaffoldAI process state
- do not build a full chat UI yet
- do not attempt all runner modes at once; `discuss` mode is enough for this first slice
- human-controlled commits only
