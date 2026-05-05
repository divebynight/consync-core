TYPE: PROCESS
PACKAGE: rerun_observational_search_loop_after_selection_reveal_split

GOAL

Run a narrow observational rerun of the desktop search -> inspect -> reveal flow after separating selection from reveal, and capture whether the interaction now feels clean and stable in the live shell without changing product scope.

SCOPE

- Do not add new features.
- Do not change search ranking, grouping, persistence, saved queries, session mutation, or history behavior.
- Do not expand the renderer surface unless a small fix is required to restore the intended inspect -> explicit reveal flow.
- Stay inside the already-established desktop search mock loop.

TASKS

1. Re-read the current state docs before touching code:
   - `.consync/state/package_plan.md`
   - `.consync/state/snapshot.md`
   - `.consync/state/next-action.md`

2. Run the current verification baseline:
   - `cd /Users/markhughes/Projects/consync-core && node src/test/desktop-scaffold.js`
   - `cd /Users/markhughes/Projects/consync-core && npm run verify`

3. Run the CLI mock search used as the truth source:
   - `cd /Users/markhughes/Projects/consync-core && node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss`

4. Launch the desktop shell and perform one focused observational pass of the live flow using the same mock search input:
   - search
   - click one grouped result row
   - confirm only selection/detail changes occur
   - click `Reveal in Finder`
   - confirm reveal still works
   - switch to another result
   - confirm selection updates remain stable and no automatic reveal returns

5. If the flow is clean, do not make product changes. Only update state docs to record the observational rerun and queue the next real package.
   - If a small regression is found and it is tightly inside the intended package boundary, fix only that regression and keep the fix minimal.
   - If you fix anything, rerun the relevant verification commands after the fix.

6. Update:
   - `.consync/state/package_plan.md`
   - `.consync/state/snapshot.md`
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`

7. Preserve the executed instruction in history using the normal history/plans convention before restoring the live `next-action.md` slot.

CONSTRAINTS

- Keep this package narrow and observational.
- Prefer no code changes unless needed to restore the intended interaction.
- Do not introduce new state, new IPC, new commands, or new UX ideas.
- Do not widen this into polish work.

HANDOFF FORMAT

TYPE: PROCESS
PACKAGE: rerun_observational_search_loop_after_selection_reveal_split

STATUS

PASS or FAIL

SUMMARY

2-4 short paragraphs covering:
- whether the live inspect -> explicit reveal loop behaved correctly
- whether any regression was found
- whether code changed or this remained a pure observational/state-update package

FILES CREATED

FILES MODIFIED

BEHAVIOR OBSERVED

BEHAVIOR PRESERVED

BEHAVIOR CHANGED

COMMANDS RUN

COMMANDS TO RUN

HUMAN VERIFICATION

VERIFICATION NOTES

HUMAN VERIFICATION REQUIREMENTS

Include a short manual check list that confirms:
1. grouped search results still appear for the mock search
2. selecting a row updates detail only
3. Finder does not open on selection
4. `Reveal in Finder` still works on demand
5. the selected detail still matches the CLI truth output
6. `git status --short` is limited to expected files

VERIFICATION NOTES REQUIREMENTS

- State exactly which commands were actually run.
- State whether any live desktop-shell observation was actually performed.
- If no product code changed, say so explicitly.
- If a regression was fixed, describe it briefly and name the file(s) changed.