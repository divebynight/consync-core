# SUPPORTING PROCESS DOCUMENTATION — NOT SOURCE OF TRUTH
# Manual ScaffoldAI Execution Flow

## Current Command Surfaces

- `intake-run` — executes Intake agent classification logic
- `preflight-run` — executes Preflight agent readiness validation
- `dry-run-check` — Gatekeeper simulation only (prints decision report, no execution)
- `consync-run` — Gatekeeper approval only (prompts on ALLOW, no execution wiring)

## Intended Flow

1. Human writes a prompt describing the work
2. Run `intake-run --prompt "..."`
3. Run `preflight-run --prompt "..."` (same prompt)
4. Human reviews output, decides whether to revise, split, or mount a packet
5. If ready, proceed with manual packet process (mount, verify, closeout, etc.)

No agent chaining, no auto-dispatch, no state mutation, no commits, no hidden execution.

## Status Meanings

**Intake**
- `PASS`: Classification clear, type detected
- `NEEDS_CLARIFICATION`: Input too vague or unknown, revise prompt
- `BLOCKED`: No prompt or unclassifiable input

**Preflight**
- `PASS`: Ready to proceed
- `WARN`: Ambiguous (mixed) classification, human review recommended
- `BLOCKED`: Not ready, needs clarification or input is unknown

## What This Flow Does NOT Do

- Does not chain agents or commands
- Does not auto-dispatch or auto-mount packets
- Does not mutate `.consync/state/`
- Does not write files or commit
- Does not execute any work beyond classification/validation

## Known Limitations

- Classification is keyword-based and intentionally basic
- False BLOCKED/unknown results are expected and acceptable
- Human operator may override by revising prompt or manually proceeding
- No orchestration or pipeline exists

## Example Prompts and Outputs

### 1. Clear Product Prompt

```
$ node src/index.js intake-run --prompt "build a new electron window feature"
Agent: Intake
Input: build a new electron window feature

STATUS: PASS
CLASSIFICATION: product
...
```

```
$ node src/index.js preflight-run --prompt "build a new electron window feature"
Agent: Preflight
Input: build a new electron window feature

STATUS: PASS
CLASSIFICATION: product
READINESS: ready
...
```

### 2. Mixed Prompt

```
$ node src/index.js intake-run --prompt "build a test for the electron feature and document it"
Agent: Intake
Input: build a test for the electron feature and document it

STATUS: PASS
CLASSIFICATION: mixed
AMBIGUITY: multiple types detected: product, tests, docs
...
```

```
$ node src/index.js preflight-run --prompt "build a test for the electron feature and document it"
Agent: Preflight
Input: build a test for the electron feature and document it

STATUS: WARN
CLASSIFICATION: mixed
READINESS: ambiguous
...
```

### 3. Vague Prompt

```
$ node src/index.js intake-run --prompt "do the thing with the stuff"
Agent: Intake
Input: do the thing with the stuff

STATUS: NEEDS_CLARIFICATION
CLASSIFICATION: unknown
...
```

```
$ node src/index.js preflight-run --prompt "do the thing with the stuff"
Agent: Preflight
Input: do the thing with the stuff

STATUS: BLOCKED
CLASSIFICATION: unknown
READINESS: needs_clarification
...
```
