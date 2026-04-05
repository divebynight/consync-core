## Work Packet (candidate concept)

Status: emerging  
Confidence: medium  
Origin: dev loop (next-action / handoff workflow)

Idea:
A “Work Packet” is a bite-size unit of work that is only complete when it includes:
- implementation
- machine verification
- human verification
- handoff/status
- documentation updates
- optional tooling updates

Key distinctions:
- Verify → does it work?
- Demonstrate → can a human perceive it works?
- Record → will we understand this later?

Notes:
- avoid forcing all layers every time
- tooling updates should be optional


## Work Packet Closeout (candidate concept)

Status: emerging
Confidence: medium
Origin: dev loop (next-action / handoff workflow)

Idea:
A completed Work Packet should eventually have a lightweight closeout prompt that finalizes the packet without creating extra friction.

Preferred concept name:
- `complete_work_packet.prompt.md`

Purpose:
A closeout prompt should mark a packet as complete after implementation and verification are done.

Likely responsibilities:
- confirm runnable verification passes
- confirm there is a human verification path
- summarize what changed
- confirm relevant docs were updated
- clear or reset transient shared state
- optionally prepare commit / branch / PR workflow

Preferred modes:

### Mode A — local/simple
Use when the packet is being completed directly on the current branch.

Behavior:
- verify current packet state
- summarize completed work
- confirm docs/handoff are in a good state
- commit latest changes
- clear or reset transient shared files

### Mode B — branch/PR
Use when the packet needs review.

Behavior:
- verify current packet state
- summarize completed work
- confirm docs/handoff are in a good state
- commit latest changes to a branch
- prepare PR text or PR-ready handoff
- clear or reset transient shared files
- preserve branch/PR artifacts

Important rule:
Do not delete aggressively.

Prefer:
- clear or reset transient files
- archive if useful
- preserve foundational or historical artifacts

Likely transient files:
- `state/handoff-up.md`
- `state/next-action.md`

Likely preserved files:
- `artifacts/foundations.md`
- `README.md`
- specs
- prompt files
- durable docs

Notes:
- this should close out a Work Packet, not necessarily a full feature
- avoid the word “feature” if the completed unit is smaller than a feature
- the closeout prompt should reduce loose ends, not create ceremony
- this should probably be validated through a few more cycles before becoming a formal rule

## Output Path & Execution Model

Status: emerging  
Confidence: high  
Origin: sandbox + path discussion during V1

Consync is a local-first tool.

- It runs inside a project directory
- The working directory defines the active context

Current default output location:

sandbox/current/

This keeps runtime artifacts separate from source files and prevents root-level clutter.

Important principle:

The output path is conceptually configurable, but configuration is not implemented in V1.

Future direction (not implemented):

1. CLI flag  
   --out /path

2. Environment variable  
   CONSYNC_ROOT=/path

3. Default fallback  
   ./sandbox/current/

Constraint:

Do not introduce configuration until there is real pressure.

All path logic should remain centralized so future changes are low-cost.

## Validation Work Packets

Status: emerging  
Confidence: high  
Origin: sandbox/output-path verification packet

Not all Work Packets should produce code changes.

A valid Work Packet can:
- validate an architectural assumption
- confirm an invariant is already satisfied
- prevent unnecessary implementation
- reduce future risk

If a packet results in:

- no files changed
- no new code added

but successfully confirms the system behaves as intended:

It is still considered complete.

Principle:

Prefer validation over unnecessary implementation when the system already satisfies the design.

## Verification Status Distinction

Status: emerging  
Confidence: high  
Origin: repeated closeout behavior during V1

Consync should distinguish between machine verification and human verification.

Current practical workflow:

- Machine verification is usually run via `npm run verify`
- Human verification is often not run unless the packet specifically benefits from it

This is a valid workflow state as long as it is represented honestly in handoff and closeout.

Preferred reporting shape:

- Machine: PASS | FAIL | NOT RUN
- Human: PASS | FAIL | NOT RUN

Principle:

The system should surface verification state clearly without forcing unnecessary ceremony.

## Artifact Read/Write Loop

A minimal system loop should exist where artifacts can be:
- created
- read
- verified

This establishes a baseline "memory system" before adding interpretation or automation layers.

Example:
- new-guid → write
- list-guid → read