TYPE: PROCESS
PACKAGE: define_human_assisted_observation_closeout_rules

GOAL

Define clear rules for how human-assisted manual observation packages must be closed so that live UI behavior is recorded accurately and cannot degrade into weak or ambiguous PASS states.

WHY

The previous manual observation package exposed a gap in the process:
- Copilot defaulted to a weak "window visible" closeout
- actual observed behavior (end-to-end reveal flow) was not captured until corrected

Without explicit rules, manual observation packages risk:
- recording insufficient evidence
- passing without real behavior verification
- introducing drift between actual UI behavior and recorded history

This package formalizes how human-assisted observation must be captured and validated.

DO

1. Define what qualifies as valid manual observation:
   - must describe concrete user actions
   - must describe observable system responses
   - must include end-to-end behavior when applicable

2. Define minimum required structure for manual observation sections:
   - SUMMARY must describe the observed flow, not just environment state
   - LIVE OBSERVATION must list step-by-step actions and results
   - VERIFICATION NOTES must confirm what was directly observed vs assumed

3. Define invalid closeout patterns:
   - "window visible" as sole evidence
   - absence of user actions
   - absence of system response description
   - PASS without interaction proof

4. Define how Copilot should behave:
   - treat human input as authoritative observation source
   - do not attempt to replace observation with environment probing
   - do not close PASS without explicit behavior evidence

5. Keep rules lightweight and aligned with current handoff format

CONSTRAINTS

- Do not introduce automation or scripts
- Do not change package lifecycle
- Do not expand into full test strategy
- Keep focused on manual observation packages only

OUTPUT

Return the normal handoff format with:
- STATUS
- SUMMARY
- OBSERVATION RULES
- VALID VS INVALID CLOSEOUT EXAMPLES
- FILES CREATED
- FILES MODIFIED
- COMMANDS TO RUN
- HUMAN VERIFICATION
- VERIFICATION NOTES
- NEXT RECOMMENDED PACKAGE

VERIFICATION

- confirm rules match the successful observation package you just completed
- confirm rules prevent the earlier weak closeout pattern
- confirm no process bloat introduced