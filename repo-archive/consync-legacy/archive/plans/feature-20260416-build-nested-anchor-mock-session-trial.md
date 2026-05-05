TYPE: FEATURE
PACKAGE: build_nested_anchor_mock_session_trial

GOAL

Advance Consync from the newly documented context-anchor architecture into a small, read-only mock-session trial that exercises the model in a realistic sandbox shape.

This package should NOT build the full future system. It should create the smallest useful trial that proves the architecture can touch reality without collapsing into filesystem mirroring or premature durable linking.

PRIMARY OUTCOME

Set up a nested mock-session sandbox scenario and add a read-only discovery/search surface that can:

- start from a chosen higher-level root
- discover nested local `.consync` anchors beneath that root
- read only the compact local context truth from those anchors
- surface bookmarked artifacts that match a simple search/theme query
- ignore ambient non-bookmarked files as active session scope
- avoid writing any durable higher-level links from discovery alone

This is a trial / proving step, not final product behavior.

CONTEXT TO PRESERVE

The docs now establish that:

- Consync captures context, not full filesystem truth.
- Session is the primary unit of captured context.
- Local `.consync` anchors are sparse local durable truth where meaningful persistence exists.
- Selective capture is the default: interacted-with / bookmarked artifacts matter; ambient nearby files do not by default.
- Broader discovery may scan nested anchors under a chosen root.
- Search/discovery associations are provisional and should not automatically become durable structural links.
- `sandbox/current` is a development harness, not the long-term ontology.

This package should express those decisions in executable form.

SCOPE

Do the smallest clean version of the following:

1. Create or revise sandbox fixtures to represent a realistic nested anchor scenario.
2. Add a read-only command or commands that can discover nested `.consync` anchors from a chosen root.
3. Add a read-only command or commands that can search bookmark/session metadata across the discovered anchors using a simple text query.
4. Return results that make the selective context model visible and testable.
5. Update package/state docs only as needed for this package and its handoff.

PROPOSED MOCK SCENARIO

Use a simple nested example inspired by the architecture discussion, with names that are easy to understand in fixtures/tests. Example shape is fine to refine if needed:

- a top-level mock root
- nested month/project folders
- at least two child folders with local `.consync` anchors
- at least one sibling folder without a `.consync` anchor
- each anchored folder has a compact session artifact containing a few bookmarked files and lightweight searchable notes/tags
- some bookmark/session text should match a shared theme query
- some should not

The key is to prove:
- discovery finds anchors, not every folder
- search surfaces bookmarked context, not whole-folder ambient contents
- non-anchored siblings do not pretend to be session truth

DESIGN GUARDRAILS

- Read-only only. Do not add writes, linking, mutation, or auto-created durable relationships in this package.
- Do not invent a full production schema if a minimal fixture format will do.
- Do not treat search hits as durable parent/child links.
- Do not imply every folder must contain a `.consync` directory.
- Do not replace `sandbox/current`; leave it intact as the existing dev harness.
- Do not overbuild ranking, fuzzy search, gravity, decay, or retention behavior.
- Do not add a database or global required index.
- Prefer rebuildable discovery from local anchor truth.

PREFERRED SURFACE

Choose names that fit the existing Consync CLI/read-only style.

A reasonable outcome would be one or two new read-only commands such as:
- one command that discovers nested anchors from a root
- one command that searches bookmark/session metadata across those anchors

Exact names are up to you, but they should be:
- simple
- consistent with current command naming
- clearly read-only
- easy to verify with fixture expectations

EXPECTED BEHAVIOR

At minimum, the trial should support this kind of flow conceptually:

- point Consync at a mock top-level root
- discover nested local `.consync` anchors beneath it
- run a simple query such as a theme/topic phrase
- receive matching bookmarked artifacts and enough context to understand where they came from
- no structural mutation occurs
- no durable linking is created just because a query found related sessions

VERIFICATION TARGET

The package should be considered successful if the mock-session trial demonstrates all of the following:

- nested anchor discovery works from a chosen root
- only anchored sessions contribute durable context truth
- only bookmarked / explicitly captured artifacts are surfaced as active results
- ambient neighboring files in the sandbox do not appear as if they were captured context
- discovery/search remains read-only
- output is deterministic enough for fixture/expectation verification

PACKAGE PLAN UPDATE EXPECTATION

Update the package plan to record completion of the docs architecture package and make this mock-session trial the active feature package. If the work naturally splits into two small packages, that is acceptable, but prefer one contained package unless a clean split is clearly better.

If split is necessary, use this order:

1. nested anchor fixture + discovery surface
2. metadata search across discovered anchors

Only split if it improves cleanliness materially.

HANDOFF FORMAT

Return a handoff in this exact structure:

TYPE: FEATURE
PACKAGE: build_nested_anchor_mock_session_trial

STATUS

PASS or FAIL

SUMMARY

A concise summary of the mock-session trial behavior now supported and what architectural assumptions it proves.

FILES CREATED

- path — short reason
- path — short reason

FILES MODIFIED

- path — what changed
- path — what changed

BEHAVIOR ADDED

- bullet list of the user-visible or command-visible behaviors added

ARCHITECTURE ASSUMPTIONS PROVED

- bullet list of the architecture principles exercised by this trial

OPEN QUESTIONS / FOLLOW-UPS

- bullet list of anything learned or deferred

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

- explain how you verified the mock-session trial works and stays within the documented architecture boundaries