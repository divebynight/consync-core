TYPE: FEATURE
PACKAGE: build_nested_anchor_mock_session_trial

STATUS

PASS

SUMMARY

Built a small read-only nested-anchor mock-session trial that proves Consync can discover sparse local `.consync` anchors from a chosen root and search bookmarked artifact metadata across those anchors without treating ambient files or search hits as durable captured context.

The trial adds one nested sandbox fixture, one read-only discovery command, and one read-only search command. Together they make the selective context model executable: only anchored sessions contribute local truth, only bookmarked artifacts surface in search results, unanchored siblings stay background, and discovery alone creates no durable links.

The result is still explicitly provisional and read-only. It proves the architecture can touch reality in a deterministic sandbox without committing to a production schema, database, or parent/child linking model.

FILES CREATED

- `.consync/state/history/plans/feature-20260416-build-nested-anchor-mock-session-trial.md` — preserved the executed feature instruction before restoring the live `next-action.md` slot to the next planned package.
- `src/lib/sandbox-anchors.js` — added the shared read-only logic for nested anchor discovery and bookmark metadata search.
- `src/commands/sandbox-discover.js` — added the read-only command that discovers nested local `.consync` anchors beneath a chosen root.
- `src/commands/sandbox-search.js` — added the read-only command that searches bookmarked artifact metadata across the discovered anchors.
- `sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/.consync/session.json` — added one anchored local session with bookmarked context truth.
- `sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/captures/moss-study.jpg` — added one bookmarked artifact placeholder for the greenhouse session.
- `sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/notes/light-pass.txt` — added a second bookmarked artifact placeholder for the greenhouse session.
- `sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/notes/ambient-research.txt` — added one ambient non-bookmarked file to prove search ignores uncaptured nearby context.
- `sandbox/fixtures/nested-anchor-trial/2026/april/balcony-zine/.consync/session.json` — added a second anchored local session with its own bookmarked context truth.
- `sandbox/fixtures/nested-anchor-trial/2026/april/balcony-zine/exports/cover-notes.md` — added one bookmarked artifact placeholder for the balcony zine session.
- `sandbox/fixtures/nested-anchor-trial/2026/april/balcony-zine/exports/page-sequence.txt` — added a second bookmarked artifact placeholder for the balcony zine session.
- `sandbox/fixtures/nested-anchor-trial/2026/april/reference-shelf/moss-board.txt` — added one unanchored sibling file that mentions the shared theme query without becoming captured context.
- `sandbox/expectations/nested-anchor-trial-discover.md` — added the deterministic expected output for nested anchor discovery.
- `sandbox/expectations/nested-anchor-trial-search-moss.md` — added the deterministic expected output for bookmark metadata search.

FILES MODIFIED

- `src/cli/index.js` — wired the new read-only sandbox discovery and search commands into the CLI surface.
- `src/commands/sandbox-catalog.js` — listed the new nested-anchor fixture and its discovery/search expectations in the sandbox catalog output.
- `src/commands/system-summary.js` — added the new read-only commands and nested-anchor expectations to the surface summary.
- `src/commands/system-check.js` — added the new command files to the repo surface checks.
- `src/test/verify.js` — added deterministic expectation checks for nested anchor discovery and bookmark metadata search.
- `.consync/state/package_plan.md` — recorded the nested-anchor mock-session trial as completed and moved the planned desktop mock-session package behind it.
- `.consync/state/snapshot.md` — updated the re-entry summary to reflect the new nested fixture and read-only discovery/search surface.
- `.consync/state/next-action.md` — restored the next live slot to the planned desktop mock-session package with the nested-anchor trial as its new dependency.
- `.consync/state/handoff.md` — overwrote the handoff with the completed result of this feature package.

BEHAVIOR ADDED

- `sandbox-discover <root>` now finds nested local `.consync` anchors beneath a chosen root and reports only compact local context summaries.
- `sandbox-search <root> <query>` now searches bookmarked artifact metadata across the discovered anchors and returns matching bookmarked context with anchor/session origin.
- `npm run verify` now checks the nested-anchor trial outputs against deterministic expectations.
- The new nested sandbox fixture now proves that unanchored siblings and ambient non-bookmarked files remain outside active captured scope.

ARCHITECTURE ASSUMPTIONS PROVED

- Nested discovery can begin from a chosen higher-level root without forcing every folder under that root into captured scope.
- Local `.consync` anchors can act as sparse durable local truth while still remaining portable and self-contained.
- Bookmarked artifacts are sufficient for a first searchable context layer; ambient neighboring files do not need to be treated as active session truth.
- Search results can remain provisional, read-only associations without creating durable parent/child links.
- Rebuildable discovery from local anchor truth is enough for this proving step; no database or global index is required.

OPEN QUESTIONS / FOLLOW-UPS

- Whether the minimal `.consync/session.json` fixture shape should survive unchanged once real nested anchor capture begins.
- Whether the next read-only step should broaden search behavior slightly or instead move back to desktop trial usability.
- How much session-level context beyond bookmarked artifact metadata is worth surfacing before durable linking is considered.
- Whether discovery should eventually surface lightweight parent context hints without crossing into durable structural relationships.

COMMANDS RUN

- `cd /Users/markhughes/Projects/consync-core && node src/index.js sandbox-discover sandbox/fixtures/nested-anchor-trial`
- `cd /Users/markhughes/Projects/consync-core && node src/index.js sandbox-search sandbox/fixtures/nested-anchor-trial moss`
- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Run `cd /Users/markhughes/Projects/consync-core && node src/index.js sandbox-discover sandbox/fixtures/nested-anchor-trial` and confirm it reports only the two anchored folders, not the unanchored sibling.
3. Run `cd /Users/markhughes/Projects/consync-core && node src/index.js sandbox-search sandbox/fixtures/nested-anchor-trial moss` and confirm it returns only bookmarked matches from the anchored sessions.
4. Inspect `sandbox/fixtures/nested-anchor-trial/2026/april/reference-shelf/moss-board.txt` and `sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/notes/ambient-research.txt`, then confirm neither ambient file appears in the search output.
5. Confirm no command in this package writes links, mutates fixtures at runtime, or creates durable parent/child relationships from discovery alone.
6. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm changes are limited to the expected command, fixture, expectation, verify, and state files.
7. Failure case: if discovery reports folders that do not contain a local `.consync` anchor, the package is incomplete.
8. Failure case: if search results include ambient unbookmarked files or imply durable structural links, the package is incomplete.

VERIFICATION NOTES

- Actually tested the new discovery command, the new search command, the full `npm run verify` suite, and `git status --short` after adding the nested-anchor trial surface.
- Observed outcome: nested anchor discovery returned only the two anchored folders, bookmark metadata search returned only the two bookmarked `moss` matches, and `npm run verify` passed with the new expectation checks included.
- Validated the important edge cases that the unanchored sibling file mentioning the shared theme does not appear in results, the ambient non-bookmarked greenhouse note does not appear in results, and the search surface stays read-only and deterministic.