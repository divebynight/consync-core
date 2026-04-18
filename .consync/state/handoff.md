TYPE: PROCESS
PACKAGE: define_human_assisted_observation_closeout_rules

STATUS

PASS

SUMMARY

Defined a small process rule for how human-assisted manual observation packages must be closed so they capture observed behavior rather than collapsing into weak environment-only PASS states.

The new doc requires concrete user actions, observable system responses, and end-to-end behavior when a full interaction loop matters. It also defines the handoff expectations for `SUMMARY`, `LIVE OBSERVATION`, and `VERIFICATION NOTES`, marks window visibility as insufficient evidence on its own, and tells Copilot to treat explicit human observation as the authoritative source instead of replacing it with environment probing.

OBSERVATION RULES

- valid manual observation must include concrete user actions
- valid manual observation must include observable system responses
- end-to-end behavior must be recorded when the package depends on a full interaction loop
- `SUMMARY` must describe the observed flow, not just the environment state
- `LIVE OBSERVATION` must list step-by-step actions and results
- `VERIFICATION NOTES` must state what was directly observed versus assumed
- Copilot should treat explicit human input as the authoritative observation source
- Copilot should not close `PASS` without explicit behavior evidence

VALID VS INVALID CLOSEOUT EXAMPLES

Valid closeout pattern:

- grouped mock search with query `moss` ran, a result row was selected, the detail panel updated, selection did not auto-trigger reveal, `Reveal in Finder` opened Finder to `moss-study.jpg`, and selection plus detail state remained coherent after reveal

Invalid closeout patterns:

- `PASS` based only on window visibility
- no user actions recorded
- no system response recorded
- environment probing substituted for supplied human observation

FILES CREATED

- `.consync/docs/human-assisted-observation-closeout-rules.md` — defines the minimal rules for valid human-assisted manual observation closeouts, invalid patterns, and Copilot behavior in this narrow case.

FILES MODIFIED

- `.consync/docs/current-system.md` — adds a light pointer to the new human-assisted observation closeout rules doc.
- `.consync/state/handoff.md` — records this process package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Open `.consync/docs/human-assisted-observation-closeout-rules.md` and confirm it requires concrete user actions, observable system responses, and end-to-end behavior when applicable.
2. Confirm the doc explicitly marks window visibility alone as invalid evidence for a `PASS` closeout.
3. Confirm the doc requires `SUMMARY`, `LIVE OBSERVATION`, and `VERIFICATION NOTES` to carry actual observed behavior rather than environment-only statements.
4. Compare the rules against the successful `capture_manual_observation_for_explicit_reveal_search_loop` handoff and confirm the `moss` search/reveal example matches the new valid closeout guidance.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the change stayed limited to the new rules doc, the light pointer, and the live handoff. If the rules broaden into test strategy or automation design, treat that as a failure.

VERIFICATION NOTES

- Verification was manual and inspection-based.
- Confirmed the new rules match the successful observation package by using the directly observed `moss` search -> select -> explicit reveal -> coherent post-reveal state as the positive example.
- Confirmed the earlier weak pattern is now explicitly invalid: window visibility alone is listed as insufficient evidence for `PASS`.
- Confirmed scope stayed narrow: one small rules doc and one light discoverability pointer, with no automation, scripts, or lifecycle changes introduced.

NEXT RECOMMENDED PACKAGE

- Select the next small planned package explicitly, now that both the manual observation package and its closeout rules are captured clearly.