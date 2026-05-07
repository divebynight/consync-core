TYPE: PROCESS
PACKAGE: rerun_mock_session_desktop_trial_after_search_exposure

INTEGRITY TRIGGER

- level: `light`
- why: this example package is ordinary observation work inside the expected process surface
- preflight checks:
   - `npm run check:state-preflight`
- postflight checks:
   - `npm run check:state-postflight`
- extra review required:
   - none unless the package crosses into `state`, `control`, or `governance` changes beyond the stated scope

GOAL

Rerun the short desktop mock-session trial now that the grouped mock-search flow is exposed through the desktop shell, and identify the next smallest real usability blocker or confirm that the current mock flow is coherent enough to continue.

This is an observational package. Do not expand scope into fixes unless the trial reveals something impossible to evaluate without a tiny correction. Prefer recording one concrete blocker over speculative redesign.

PRIMARY QUESTION

Now that desktop can accept a root and query and show grouped mock-search results, what is the next real friction point in the mock-session flow?

TRIAL TO RUN

Use the current desktop shell and attempt a short mock session that mirrors the architecture we have been building toward:

1. Launch the desktop shell.
2. Enter a root such as:
   `sandbox/fixtures/nested-anchor-trial`
3. Enter a query such as:
   `moss`
4. Run the grouped search.
5. Review the result as if you were actually trying to use Consync to find relevant prior context.

Focus on whether the shell now supports a coherent minimal loop, and if not, what the single next blocker is.

EVALUATION CRITERIA

Look for the next smallest blocker in areas like:
- clarity of the root/query flow
- readability of grouped results
- whether the results give enough context to be useful
- whether the desktop shell now feels like a meaningful thin wrapper over the existing search truth
- whether there is a missing read-only action needed to continue the mock session

Do NOT jump ahead to solving broad UX, linking, ranking, or persistence questions.

CONSTRAINTS

- Read-only only
- No new feature work in this package unless absolutely necessary to complete the observation, and if so keep it extremely narrow
- No linking
- No saved query history
- No ranking changes
- No schema changes
- No architecture expansion
- Prefer naming one concrete blocker, not a list of abstract wishes

SUCCESS CONDITION

This package is successful if it produces one of these outcomes:

A) the desktop mock-session flow is now coherent enough that the next package can move to one small read-only interaction improvement, or

B) the trial reveals one clear next blocker, stated narrowly and grounded in actual usage

HANDOFF FORMAT

Return a handoff in this exact structure:

TYPE: PROCESS
PACKAGE: rerun_mock_session_desktop_trial_after_search_exposure

STATUS

PASS or FAIL

SUMMARY

A concise summary of what the rerun trial showed and what the next smallest blocker or next step is.

FILES CREATED

- path — short reason
- path — short reason

FILES MODIFIED

- path — what changed
- path — what changed

TRIAL OUTCOME

- bullet list of the concrete findings from the rerun trial

NEXT SMALLEST BLOCKER OR NEXT STEP

- one bullet only

COMMANDS RUN

- exact command
- exact command

COMMANDS TO RUN

- exact command
- exact command

HUMAN VERIFICATION

1. step
2. step
3. step

VERIFICATION NOTES

- explain how you reran the trial and why the recorded blocker or next step is the smallest grounded move