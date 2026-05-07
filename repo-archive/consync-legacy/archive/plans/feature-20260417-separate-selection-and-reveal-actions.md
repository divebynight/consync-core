TYPE: FEATURE
PACKAGE: separate_selection_and_reveal_actions

GOAL

Separate result-row selection from reveal behavior so that clicking a result only selects it, and revealing the file is triggered by an explicit button.

This removes the current coupling between inspect and act.

PRIMARY OUTCOME

- clicking a result row:
  - selects it
  - updates detail panel
  - DOES NOT open Finder

- a new `Reveal in Finder` button:
  - appears in the detail panel
  - triggers the existing reveal IPC flow

SCOPE

1. Update renderer:
   - remove reveal call from result-row click handler
   - keep selection behavior intact

2. Add button in detail panel:
   - label: `Reveal in Finder` (or similar)
   - triggers same preload → IPC → main reveal path

3. Reuse existing reveal logic
   - no changes to core or IPC contracts unless necessary

DESIGN GUARDRAILS

- No new data
- No persistence
- No linking
- No navigation system
- No additional UI complexity beyond one button
- Keep behavior deterministic

EXPECTED BEHAVIOR

- click result → selects only
- detail panel updates
- clicking `Reveal` button → opens Finder
- no automatic reveal on selection

TESTING

- update desktop scaffold test if needed
- manual:
  - click → no Finder
  - button → Finder opens correctly

SUCCESS CRITERIA

- selection and reveal are clearly separated
- reveal still works via button
- no regressions in search or detail panel
- `npm run verify` still passes

HANDOFF FORMAT

TYPE: FEATURE
PACKAGE: separate_selection_and_reveal_actions

STATUS

PASS or FAIL

SUMMARY

FILES CREATED

FILES MODIFIED

BEHAVIOR ADDED

BEHAVIOR PRESERVED

COMMANDS RUN

COMMANDS TO RUN

HUMAN VERIFICATION

VERIFICATION NOTES