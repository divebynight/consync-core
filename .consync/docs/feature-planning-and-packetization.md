# Feature Planning and Packetization

A practical process for breaking a feature request into small, independently executable, verifiable packets.

Based on: `.consync/docs/examples/search-panel-feature-example.md`

---

## 1. Overview

Feature packetization is the practice of decomposing a mid-size feature into a sequence of focused work packets, where each packet:

- has a single clear goal
- produces testable output
- is independently committed and verified
- is safe to re-run without duplicating work

It exists in Consync because mid-size features have too many concerns to fit in one work packet, but not enough complexity to justify a full project plan. Packetization keeps scope narrow, verification tight, and the system clean between steps.

---

## 2. When to Use Feature Packets

**Use feature packets when:**
- The feature has two or more independently testable concerns
- The feature touches multiple files across different surfaces (UI + docs, or spec + coverage map)
- Failure in one part should not block the other parts from being committed
- The feature is large enough that a single work packet would be hard to verify in one pass

**Do not use feature packets when:**
- The change fits in one spec file and one doc update
- The work is a single bug fix or a single assertion change
- There is no clear decomposition — forced splits create unnecessary overhead

**The search panel example:**
The Search Panel had two testable concerns (visibility/navigation and input/results) plus a cleanup step. Three packets was the right size. One packet would have been too broad; four would have been over-split.

---

## 3. Feature Breakdown Process

### Step 1 — Identify the surfaces

Read the source before planning. For a UI feature:
- What component or panel needs coverage?
- What is the user's entry point into that surface?
- What are the distinct interaction stages? (reach → interact → respond → close)

For the search panel:
- Entry point: "Search" button in resume panel
- Stage 1: panel renders with controls (smoke)
- Stage 2: inputs accept values, search runs, results appear, inspector updates (input + results)
- Stage 3: coverage map and docs are accurate (closeout)

### Step 2 — Assign one concern per packet

Each distinct stage from Step 1 becomes a packet. A concern is distinct when:
- It can be verified without the next concern
- It can be committed without the next concern
- Failure in it gives a clear signal about what broke

### Step 3 — Order packets by dependency

The simplest concern goes first. Each packet should assume the previous packet's commit is already in place.

For the search panel:
1. Navigation/visibility (no prior test needed)
2. Input/results (requires the panel to be reachable — Packet 1 proved this)
3. Closeout (requires tests and map to already be accurate — Packets 1+2 provided this)

### Step 4 — Define each packet's ALLOWED FILES before starting

Write down exactly which files each packet is permitted to create or modify. This is the scope boundary. If the work requires files outside the list, stop and evaluate whether scope has drifted.

---

## 4. Packet Design Rules

Each packet must satisfy all of these:

**Single clear goal.** One sentence that describes what the packet proves or delivers. If the goal requires "and" more than once, it may need to be split.

**Testable behavior.** The packet produces a passing test or a verifiable doc change. "Updated docs" is testable. "Improved code quality" is not.

**Real UI/system interaction.** Tests use visible UI elements or real IPC paths. Do not use state manipulation or test-only seams unless there is no visible path. For the search panel, the "Search" button was the real entry point — the test used it directly.

**Independently verifiable.** The packet can be verified with `npm run verify:full` before the next packet starts. If it cannot, the packet boundary is in the wrong place.

**Safe to re-run (idempotent).** Before doing any work, check:
1. Does the expected artifact already exist?
2. Is the coverage map already updated?
3. Is a work-log entry already present?
4. Does a recent commit already touch the relevant files?

If all four pass, return ALREADY_COMPLETE and do not modify files.

---

## 5. Execution Flow

Run this loop for each packet:

```
1. READINESS GATE
   - git status --short         → repo is clean
   - npm run verify:full        → all phases pass
   - confirm prior packet committed

2. READ SOURCE
   - read the relevant UI or system source
   - probe deterministic data if needed (run fixture programmatically)
   - confirm the entry point through visible UI

3. IMPLEMENT
   - create the spec or make the targeted change
   - stay within ALLOWED FILES

4. TEST THE NEW WORK ALONE
   - npx playwright test <single spec> or equivalent
   - fix assertion failures before running the full suite

5. UPDATE DOCS
   - coverage map if a new test was added
   - work-log entry for this packet

6. VERIFY
   - npm run verify:full
   - confirm e2e count increased by expected amount

7. COMMIT
   - stage only ALLOWED FILES
   - use a clear commit message
   - do not push

8. ADVANCE
   - only move to next packet after commit is clean
   - if FULL_VERIFY failed, stop and record STOPPED in work-log
```

**Do not advance past step 8 with a dirty repo or a failing verify.**

---

## 6. Verification Model

| Level | Command | When required |
|---|---|---|
| Single spec | `npx playwright test <spec>` | After writing a new spec, before running full suite |
| FAST_CHECK | `npm test` | After docs-only changes with no behavior change |
| FULL_VERIFY | `npm run verify:full` | Before every commit that creates or modifies a spec |

**How this was applied in the search panel example:**

- After writing each spec: ran the spec alone first to confirm it passed before touching the full suite
- Before committing Packets 1 and 2: ran `npm run verify:full` (required — new spec files added)
- Before committing Packet 3: ran `npm run verify:full` (required — post-implementation closeout)
- For docs-only changes (work-log, coverage map after Packet 3): `npm test` was sufficient

---

## 7. Idempotency + Stop Conditions

### ALREADY_COMPLETE

Before implementing anything, check:

1. Expected spec or artifact file exists at the stated path
2. Coverage map reflects the new coverage
3. Work-log contains an entry for this packet or PACKET_ID
4. `git log --oneline -- <relevant files>` shows a recent matching commit

If all four pass: return ALREADY_COMPLETE, do not modify any files.

This matters in multi-session and multi-agent workflows where a packet may be re-examined after it was already executed.

### Stop Conditions

Return STOPPED and do not continue if:
- A required UI element is not reachable through visible UI
- Search or fixture results are non-deterministic across runs
- The implementation requires files outside ALLOWED FILES
- `npm run verify:full` fails after one retry
- A product decision is required that is not already made
- Scope has drifted from the stated packet goal

Record the reason and the repo state in the work-log before stopping. Leave the repo clean.

### When to escalate

Escalate (do not attempt to resolve autonomously) when:
- The stop condition requires a product decision
- Multiple retries have not resolved a flaky test
- The packet boundary needs to be redefined

---

## 8. Feature Closeout

A feature is complete when all of the following are true:

- All packets returned COMPLETE or ALREADY_COMPLETE
- `npm run verify:full` passes with the expected test count
- The coverage map reflects every new test and no stale entries remain
- The work-log contains an entry for each packet
- No unexpected files were changed
- The repo is clean

**Closeout packet pattern (from the search panel example):**

The final packet was a dedicated closeout: read the coverage map, remove stale sections, confirm test count, append a work-log entry. No production changes. This kept housekeeping separate from implementation and gave a clean final verification.

---

## 9. System Integration

| System component | Role in feature packetization |
|---|---|
| `work-packet-v3.md` | Template for each individual packet. Defines ALREADY_COMPLETE, COMPLETE, and STOPPED outcomes. Each packet in a feature is a work-packet-v3 instance. |
| `verification-ladder.md` | Defines FAST_CHECK, UI_CHECK, and FULL_VERIFY. FULL_VERIFY is required before committing any packet that creates a spec. |
| `ui-e2e-coverage-map.md` | Updated in the same commit as each new spec. The closeout packet confirms the map is accurate before the feature is closed. |
| `03_work-log.md` | One entry per packet, appended in the same commit. The entry records files, tests, friction, decision, and follow-ups. |
| `feature-packet-execution.md` | Defines the coordination layer — roles, readiness gate, execution loop, stop conditions. This doc is the practical complement to that one. |

---

## Reference

Canonical example: `.consync/docs/examples/search-panel-feature-example.md`

For packets that require production changes: `.consync/docs/production-change-packet-rules.md`
