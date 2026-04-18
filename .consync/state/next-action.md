TYPE: PROCESS
PACKAGE: capture_manual_observation_for_explicit_reveal_search_loop

GOAL

Capture one clean manual live observation of the explicit reveal search loop in the desktop shell so the previously blocked observational gap is resolved or escalated honestly.

WHY

The previous observational package failed because the live inspect -> explicit reveal interaction was not durably observed end to end, even though automated verification and CLI truth passed.

The loop state is now reconciled. The next honest step is to perform the blocked manual observation directly and close the gap without broadening implementation.

DO

1. Launch or use the running desktop shell.
2. In the live UI, perform one narrow manual pass of the current search loop:
   - run the grouped mock search
   - select a result row
   - confirm the detail panel updates without auto-revealing
   - use the explicit reveal action
   - reselect or change selection and confirm the shell remains coherent
3. Record exactly what was directly observed in the handoff.
4. If the live observation passes cleanly, close the package honestly as `PASS`.
5. If the live observation exposes a real UX or behavior blocker, close the package as `FAIL` or recommend the smallest repair package instead of smoothing it over.

CONSTRAINTS

- Keep this manual and observational.
- Do not broaden implementation in this package.
- Do not invent observations that were not directly seen.
- Prefer a narrow factual closeout over speculative UI commentary.

OUTPUT

Return the normal handoff format with:
- STATUS
- SUMMARY
- LIVE OBSERVATION
- FILES CREATED
- FILES MODIFIED
- COMMANDS TO RUN
- HUMAN VERIFICATION
- VERIFICATION NOTES
- NEXT RECOMMENDED PACKAGE

VERIFICATION

At minimum:
- perform the live desktop observation directly
- confirm whether the explicit reveal loop was actually seen end to end
- run `git status --short`