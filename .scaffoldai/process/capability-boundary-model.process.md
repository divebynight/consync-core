# ScaffoldAI Capability Boundary Model

**Core Principle:** Mode is not a prompt. Mode is the runner capability boundary.

## Overview

ScaffoldAI separates planning/discussion from execution using runner-level capability boundaries instead of relying on prompt wording or lifecycle over-enforcement. This model was proven in the external scaffoldai-executor-poc.

## Role Boundaries

### COORDINATOR
- Proposes and reviews work through MCP
- Read-only observation of state
- Submit-only candidate artifact creation
- Cannot activate, close, or commit

### OPERATOR
- Human authority for critical lifecycle transitions
- Approves packet intake via `make scaffold-intake`
- Activates work via `make scaffold-activate`
- Closes completed work via `make scaffold-close`
- Controls all git commits
- Manual, intentional decisions only

### EXECUTOR
- Runs through bounded runner wrappers
- Two modes: DISCUSS and WORK
- Mode determines capability boundary, not prompt content

## Runner Capability Boundaries

### DISCUSS Runner (`make scaffold-discuss`)

**Purpose:** Read-only planning, analysis, and question answering

**Capabilities:**
- Read files and repository state
- Analyze code and documentation
- Answer questions about the codebase
- Plan and discuss approaches
- Read discussion/question artifacts if present

**Restrictions:**
- ❌ Cannot write to source files
- ❌ Cannot execute shell commands
- ❌ Cannot modify git state
- ❌ Cannot activate or close packets
- ❌ Cannot commit changes
- ❌ Builtin MCPs disabled unless explicitly required

**Use Cases:**
- "What does this module do?"
- "How should I structure this refactor?"
- "Where is X implemented?"
- Planning sessions before work begins
- Code review and analysis

### WORK Runner (`make scaffold-work`)

**Purpose:** Execute approved next-action within bounded workspace

**Capabilities:**
- Read and write files within approved work surface
- Execute approved next-action tasks
- Create/modify files specified in next-action
- Run verification commands

**Restrictions:**
- ❌ Cannot run arbitrary shell commands outside safe list
- ❌ Cannot modify files outside approved work surface
- ❌ Cannot commit (human operator only)
- ❌ Cannot activate/close packets (human operator only)
- Bounded to the current active next-action scope

**Prerequisites:**
- Active next-action must be mounted (`make scaffold-activate`)
- Work surface must be defined in next-action
- Human operator approval required

## Artifact Protocol

### Executable Contracts
- **next-action.md** - The only executable work contract
- Must be explicitly activated by human operator
- Defines bounded work surface and tasks
- Authorizes WORK runner execution

### Non-Executable Artifacts
- **Discussion artifacts** - Read by DISCUSS runner, not executable
- **Proposal SDCs** - Submitted via MCP, require human intake approval
- **Question artifacts** - Optional input for DISCUSS runner

### Completion Artifacts
- **handoff.md** - Documents completed work
- Written during closeout process
- Records files changed, behavior changes, verification results

## Workflow Phases

### 1. Proposal Phase
- COORDINATOR submits SDC candidate via MCP
- Human reviews candidate in inbox
- Human decides: intake or reject

### 2. Planning Phase (Optional)
- Run `make scaffold-discuss` with question/planning artifact
- Read-only exploration and analysis
- No source file modifications
- Output written to bounded discussion artifact or terminal

### 3. Activation Phase
- Human runs `make scaffold-intake` (accepts SDC into packets/)
- Human runs `make scaffold-activate` (mounts as next-action)
- Active next-action becomes executable contract

### 4. Execution Phase
- Run `make scaffold-work` to execute approved next-action
- WORK runner operates within bounded surface
- Source files modified according to next-action
- Verification run before completion

### 5. Closeout Phase
- Human reviews completed work
- Human runs `make scaffold-close`
- handoff.md written
- Active next-action cleared
- Human commits changes manually

## Safety Model

### Capability Boundary Enforcement
- DISCUSS runner: tool-level restrictions (no write, no shell)
- WORK runner: workspace-level restrictions (bounded surface only)
- Human operator: explicit approval required for all lifecycle transitions

### What Changed from Previous Model
**Before:** Relied on prompt wording and lifecycle state policing
**After:** Tool and workspace boundaries enforced by runner configuration

**Before:** Heavy git-state checking to prevent unsafe actions
**After:** Minimal state checks + runner boundaries = simpler and clearer

**Before:** Uncertainty about whether AI would respect "don't modify files"
**After:** DISCUSS runner physically cannot modify files

## Authority Boundaries

### MCP Authority (Unchanged)
- ✅ Submit SDC candidates to inbox (create only)
- ✅ Read-only observation of state and status
- ❌ Cannot activate packets
- ❌ Cannot close packets
- ❌ Cannot commit changes
- ❌ Cannot execute work autonomously

### Human Operator Authority
- ✅ All lifecycle transitions (intake, activate, close, cancel)
- ✅ All git commits
- ✅ Decision to use DISCUSS vs WORK runner
- ✅ Approval of work surface boundaries

### Runner Authority
- DISCUSS: Read-only observation, no state modification
- WORK: Write within approved surface, no lifecycle control

## Implementation Notes

- Runners are thin wrappers around Copilot CLI or similar executor
- Capability restrictions configured at runner invocation (flags/config)
- Minimal implementation: prefer small scripts over architecture
- Keep next-action and handoff as core workflow artifacts
- No hidden orchestration or automatic sequencing

## Future Considerations

- WORK runner may evolve to support sandboxed execution
- Discussion artifacts may gain structured formats if needed
- Runner capability sets may be refined based on operator feedback
- This model does not require architectural rewrites to be useful

## See Also

- `feature-packet-execution.process.md` - Packet execution workflow
- `remote-proposal-local-lifecycle-runbook.process.md` - Proposal and intake flow
- `runbook.process.md` - Complete ScaffoldAI process runbook
