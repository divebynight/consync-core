TYPE: FEATURE
PACKAGE: add_reveal_in_finder_for_search_results

GOAL

Add one minimal read-only interaction to the desktop search results so a user can click a result and reveal its location in Finder (or OS equivalent).

This completes the basic loop:
search → inspect → act

PRIMARY OUTCOME

When a user clicks a result row:

- the system resolves the full file path
- sends that path through preload → IPC → main
- main process reveals the file (or its parent folder) in Finder

No session data is modified.

SCOPE

Implement one interaction:

1. Add click handler (or extend existing one) on result rows
2. Send selected result path via preload bridge
3. Add IPC handler in main process
4. Use Electron shell API (or Node equivalent) to reveal the file

If direct file reveal fails, fallback to revealing parent folder.

DESIGN GUARDRAILS

- Read-only only
- No linking
- No navigation system
- No preview panel
- No session mutation
- No schema changes
- No ranking/filtering changes
- No persistence
- No history tracking

This is a single action: reveal location

EXPECTED BEHAVIOR

- click result → Finder opens at correct location
- no visible UI change required
- system remains deterministic

TESTING

- extend desktop scaffold test to confirm IPC path exists
- manual verification:
  - click result → Finder opens correct location

SUCCESS CRITERIA

- user can click any result
- correct file or folder is revealed
- no other system behavior is introduced
- `npm run verify` still passes

HANDOFF FORMAT

TYPE: FEATURE
PACKAGE: add_reveal_in_finder_for_search_results

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