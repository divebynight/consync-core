# Production Change Packet Rules

Rules for when a packet is allowed to modify production code, how that differs from coverage-only or docs-only packets, and what extra safeguards apply.

---

## 1. Packet Types

### Coverage-only packet

**Purpose:** Add e2e or unit tests for existing behavior.

**Allowed:** test spec files, coverage map, work-log.

**Not allowed:** production source (`src/electron/`, `src/commands/`, `src/lib/`, `src/core/`).

**Verification:** FULL_VERIFY before commit (new spec files require e2e pass).

**Example:** `search_panel_smoke_e2e`, `inspector_empty_state_e2e`

---

### Behavior / production-change packet

**Purpose:** Add or adjust minimal production behavior so that a test can be written or a stop condition can be resolved.

**Allowed:** targeted production source files (listed in ALLOWED FILES), new or updated test specs, coverage map, work-log.

**Not allowed:** broad refactors, architecture changes, new systems, speculative improvements.

**Verification:** single spec first, then FULL_VERIFY before commit.

**Example:** `inspector_marker_selection_behavior`

---

### Closeout / docs-only packet

**Purpose:** Confirm accuracy of docs after all implementation and coverage work is complete.

**Allowed:** coverage map, work-log, reference docs.

**Not allowed:** production source, test specs.

**Verification:** FAST_CHECK is sufficient if no spec files changed. FULL_VERIFY if any doc update affects a coverage assertion.

**Example:** `search_panel_coverage_closeout`, `inspector_coverage_closeout`

---

## 2. When Production Changes Are Allowed

A packet may modify production code only when **all three** of the following are true:

1. **Behavior is missing or unclear.** A coverage packet discovered through a STOP condition that the expected behavior does not exist in the UI or system. The behavior gap is documented in the work-log STOPPED entry or in the packet GOAL.

2. **The packet goal explicitly states a production change.** A coverage-only packet that quietly modifies production source has drifted. If production code needs to change, name it in the GOAL and ALLOWED FILES before starting.

3. **The change is minimal and scoped.** The smallest targeted change that makes the stated behavior work. If the change requires touching more than one or two files in `src/`, or requires adding a new architectural concept, stop and replan.

**Do not modify production code speculatively.** If the behavior already exists and only the test is missing, write a coverage-only packet.

---

## 3. Safeguards for Production-Change Packets

Run these steps in order. Do not skip.

### Before starting

```
git status --short       → repo is clean
CI=true npm run verify:full    → all phases pass
```

If either fails, do not begin.

### Implement

- Read the relevant source files before writing any code
- Make only the changes listed in ALLOWED FILES
- Do not introduce new abstractions unless the packet goal explicitly requires them

### Test the new work in isolation

```
npx playwright test <new-spec>
```

Confirm the spec passes before running the full suite. Fix all assertion failures before proceeding.

### Verify the full suite

```
CI=true npm run verify:full
```

The e2e count must increase by the expected amount (one new spec = one more passing test). If FULL_VERIFY fails, stop and record STOPPED before attempting anything else.

### Update docs

- Append an entry to `.consync/docs/03_work-log.md`
- Update `.consync/docs/ui-e2e-coverage-map.md` if a new spec was added

### Commit

- Stage only files listed in ALLOWED FILES that were actually changed
- Do not push

---

## 4. Example: Inspector Marker Selection Behavior

This is the first production-change packet executed in Consync.

**What happened:**

1. Coverage attempt (`inspector_marker_selection_e2e`) hit a STOP condition: clicking a timeline marker seek button did not update the Inspector Panel. The behavior was missing.

2. A new packet (`inspector_marker_selection_behavior`) was defined with an explicit production-change goal: add minimal renderer state so clicking a seek button selects a marker in the Inspector.

3. **Change made:** Added `selectedBookmarkId` state to `App.jsx`. Updated the seek button `onClick` to set `selectedBookmarkId` alongside seeking the audio player. Added a "Selected Marker" render branch to `InspectorPanel`.

4. **Why this was minimal:** One new state variable, one line added to an existing click handler, one new conditional render branch. No new files, no new IPC channels, no architectural change.

5. **Verification:** Single spec passed first. `CI=true npm run verify:full` passed (16 e2e tests).

6. **Closed cleanly:** Work-log entry appended, coverage map updated, repo clean, dedicated closeout packet confirmed accuracy.

**Key principle confirmed by this example:**

A STOP condition in a coverage packet is not a failure — it is information. It tells you that the behavior needs to be built before the test can be written. The right response is a new, explicitly-scoped production-change packet, not a workaround inside the coverage packet.

---

## Reference

- `.consync/docs/feature-planning-and-packetization.md` — packet design rules and execution loop
- `.consync/templates/work-packet-v3.md` — ALLOWED FILES, STOP conditions, and output contract
- `.consync/docs/verification-ladder.md` — FAST_CHECK, UI_CHECK, FULL_VERIFY definitions
