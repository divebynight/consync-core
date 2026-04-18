# Human-Assisted Observation Closeout Rules

This is the current working rule for closing packages that depend on human-assisted manual observation.

## Purpose

These rules exist so manual observation packages:

- record sufficient evidence
- close on actual observed behavior
- avoid weak or ambiguous PASS states

Keep the closeout lightweight, but make the observed behavior explicit.

## Valid Manual Observation

Valid manual observation must include:

- concrete user actions
- observable system responses
- end-to-end behavior when the package depends on a full interaction loop

Human input is the authoritative observation source for these packages.

Copilot should record that observation faithfully instead of replacing it with environment probing.

## Required Handoff Structure For Observation Packages

For human-assisted observation packages:

- `SUMMARY` must describe the observed behavior flow, not just the environment state
- `LIVE OBSERVATION` must list step-by-step actions and observed results
- `VERIFICATION NOTES` must distinguish what was directly observed from what was inferred or not observed

When a package depends on a full interaction loop, a `PASS` closeout should describe that loop end to end.

## Invalid Closeout Patterns

These patterns are not enough for a valid `PASS`:

- window visibility as the sole evidence
- no recorded user actions
- no recorded system responses
- `PASS` without interaction proof
- substituting process inspection for reported human observation when the package goal is manual behavior confirmation

## Copilot Behavior Rules

When handling a human-assisted observation package, Copilot should:

- treat explicit human observation as the primary evidence source
- record the actions and outcomes exactly as supplied
- avoid weakening the closeout into environment-only statements
- avoid extra probing when the human has already supplied the needed behavior evidence
- stop and report uncertainty if the observation is incomplete or ambiguous

## Valid Vs Invalid Examples

Valid:

- "Ran grouped mock search with query `moss`, selected a result row, detail updated, reveal did not auto-trigger, clicked `Reveal in Finder`, Finder opened to `moss-study.jpg`, and selection plus detail state remained coherent after reveal."

Invalid:

- "The Electron window was visibly open."
- "No blocker was reported."
- "PASS based on manual observation" without the observed interaction details

## Scope Guard

These rules only govern how manual observation packages are closed.

They do not change package lifecycle, test strategy, or automation behavior outside this narrow closeout case.