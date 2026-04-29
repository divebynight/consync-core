TYPE: FEATURE
PACKAGE: add_selected_match_detail_panel

GOAL

Add a minimal read-only detail panel for a selected search result so users can inspect one match more deeply without leaving the desktop shell.

This builds on the structured grouped search results and introduces the first selection-based interaction, without adding navigation, linking, or persistence.

PRIMARY OUTCOME

When a user clicks a result row:

- that result becomes “selected”
- a detail panel (or section) displays:
  - full file path
  - full note text
  - tags (if present)
  - session/anchor context
- no changes are made to session data
- no linking or navigation is introduced

SCOPE

Implement one interaction:

1. Add click handler to result rows
2. Track selected result in renderer state
3. Render a simple detail panel showing expanded information

Keep this panel minimal:
- no editing
- no actions
- no navigation
- no persistence

DESIGN GUARDRAILS

- Read-only only
- No linking
- No reveal-in-finder yet
- No navigation system
- No schema changes
- No IPC changes unless absolutely necessary
- Prefer using already available structured data

EXPECTED BEHAVIOR

- clicking a result highlights/selects it
- detail panel updates immediately
- panel shows more complete information than list row
- selection does not affect search results or system state

TESTING

- extend renderer test to confirm:
  - selection state updates
  - detail panel renders expected fields
- manual verification:
  - click → panel updates correctly

SUCCESS CRITERIA

- user can click any result
- detail panel shows correct expanded info
- no new system behavior introduced
- existing verify still passes

HANDOFF FORMAT

TYPE: FEATURE
PACKAGE: add_selected_match_detail_panel

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