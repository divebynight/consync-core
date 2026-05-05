TYPE: FEATURE
PACKAGE: expose_nested_anchor_search_as_desktop_mock_flow

GOAL

Expose the existing nested-anchor discovery and search behavior through a simple “desktop-style” mock flow so the system begins to resemble real user interaction.

This is NOT a real UI package. It is a bridge between CLI/testing and eventual desktop behavior.

PRIMARY OUTCOME

Create a single command that simulates a user workflow:

- user chooses a root (like dragging Dropbox into Consync)
- user enters a query/theme
- system performs:
  - nested anchor discovery
  - bookmark metadata search
- system returns a clean, user-oriented result view

This should feel like:
“what the desktop app would show me”

NOT:
“raw CLI debug output”

SCOPE

Build a new read-only command that wraps existing behavior:

Example shape (name can vary, but keep it simple and user-facing):
- `sandbox-desktop-search <root> <query>`

This command should:
1. call nested anchor discovery
2. call bookmark metadata search
3. format output into a clear grouped result

OUTPUT EXPECTATION

Output should:
- group results by session / anchor
- show:
  - session/anchor name or path
  - matched bookmarked artifacts
  - associated note/tag text (if available)
- avoid raw JSON dumps
- avoid debug noise

The goal is readability and “this feels like a real feature”

DESIGN GUARDRAILS

- Read-only only
- No linking
- No mutation
- No index/database
- No schema changes
- Reuse existing logic (do not duplicate discovery/search logic)
- Keep formatting simple and deterministic (so it can still be tested)

TESTING

- Add at least one expectation file for this new command
- Ensure output is deterministic for the existing nested fixture
- Extend `npm run verify` to include this new behavior

DO NOT

- Do not introduce UI frameworks
- Do not change `.consync` structure
- Do not add ranking/weighting
- Do not infer relationships beyond current search
- Do not persist anything new

SUCCESS CRITERIA

The package is successful if:

- a single command simulates:
  “I selected a root and searched for a theme”
- output is human-readable and grouped
- results match the same underlying truth as `sandbox-search`
- no new architectural commitments are introduced

HANDOFF FORMAT

TYPE: FEATURE
PACKAGE: expose_nested_anchor_search_as_desktop_mock_flow

STATUS

PASS or FAIL

SUMMARY

FILES CREATED

FILES MODIFIED

BEHAVIOR ADDED

COMMANDS RUN

COMMANDS TO RUN

HUMAN VERIFICATION

VERIFICATION NOTES