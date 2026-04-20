TYPE: PROCESS
PACKAGE: define_artifact_role_labels_for_state_control_governance_reference_and_history

GOAL

Define a small artifact-role model for Consync so markdown and related system files can be reasoned about by operational role instead of being treated as one undifferentiated file class, and explicitly establish stronger validation expectations around process/governance surfaces than around ordinary feature work.

WHY

The repo now contains multiple kinds of operational files that all happen to be human-readable text, but they do not all serve the same purpose. Some define live truth, some drive execution, some govern process, some explain, and some preserve history.

Without role labeling, AI tools and humans are more likely to treat all markdown-like files as equivalent. That increases drift risk and makes it too easy for ordinary feature work to influence process/governance surfaces casually.

Consync does not need maximum validation everywhere. It needs role-aware validation:
- lighter checks during normal UI/session/feature work
- stronger checks when process/state/governance artifacts are touched
- strongest protection around the process silo and its governing artifacts

This package should define the role model and expected validation weight by role before any broader enforcement is added.

SCOPE

Keep this package definition-focused and lightweight.

Expected outcome:
- one doc defines the core artifact roles
- the main operational artifacts are grouped by role
- the process silo is explicitly identified as the highest-governance zone
- validation expectations are defined by artifact role
- role-aware reasoning becomes possible without restructuring the repo

Do not:
- introduce file permissions or OS-level security
- create a tagging framework across the whole repo
- rename large parts of the repo
- implement new validators in this package
- scan or classify every file exhaustively
- mix this with UI or feature work

WORK INSTRUCTIONS

1. Create a new doc, preferably at:

   `.consync/docs/artifact-role-model.md`

2. In that doc, define a small and stable set of artifact roles.
   Use explicit, operational naming.

   At minimum, define:

   - `state`
     - artifacts that declare current live truth

   - `control`
     - artifacts that drive the active loop or mounted execution

   - `governance`
     - artifacts that define rules, contracts, policies, and process expectations

   - `reference`
     - artifacts that explain, clarify, orient, or provide examples

   - `history`
     - artifacts that preserve past actions, prior states, or archived records

3. For each role, define:
   - purpose
   - examples
   - whether it is canonical, supporting, or non-canonical
   - expected change frequency
   - expected validation weight
   - typical owner or stream relationship

4. Explicitly define the process silo as the highest-governance zone.

   Make clear that:
   - process/state/governance artifacts deserve stronger validation than ordinary feature work
   - non-process packages should not casually modify governance/process surfaces
   - when ordinary work must affect governance/process artifacts, that should be explicit and narrowly justified

5. Add a section defining validation tiers by role.

   Example shape:
   - `state` → always checked by core smoke/contract checks
   - `control` → always checked when mounted/live
   - `governance` → checked most heavily when touched
   - `reference` → lightly checked, usually only for relevance or pointer accuracy
   - `history` → usually append/preserve, not heavily validated unless it affects live truth

6. Add a section defining cross-role expectations.

   At minimum:
   - reference artifacts must not override state artifacts
   - history artifacts must not override live truth
   - governance artifacts define how state/control artifacts are interpreted
   - control artifacts may drive action but do not automatically redefine governance
   - process changes that touch governance/state/control surfaces should trigger stronger integrity expectations

7. Include a small “practical mapping” section listing the main current artifacts by role, for example:
   - `.consync/state/active-stream.md`
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`
   - `.consync/state/snapshot.md`
   - `runbook.md`
   - `doc-integrity-layer.md`
   - `state-contracts-and-integrity-checks.md`
   - archived handoffs or stream-local history surfaces
   - example/reference docs

8. Keep the role model small, human-readable, and operational.
   It should reduce ambiguity, not create a taxonomy hobby.

9. If useful, add one or two tiny pointers from existing governance docs such as:
   - `runbook.md`
   - `doc-integrity-layer.md`

   Keep them minimal.

CONTENT REQUIREMENTS

The new role-model doc should clearly answer:

- What kinds of artifacts exist in Consync?
- Which ones define current truth?
- Which ones drive action?
- Which ones govern interpretation and process?
- Which ones are explanatory only?
- Which ones preserve history?
- Which surfaces deserve the strongest validation?
- Why should process/governance be treated more carefully than ordinary feature work?

It should also state explicitly that:

- artifact role matters more than file format
- markdown alone is not a meaningful operational classifier
- the system should validate based on role and risk, not uniformly across all files
- the process silo is the highest-governance zone and should carry the strongest validation expectations

CONSTRAINTS

- keep the model compact
- avoid over-classifying
- no implementation of new checks in this package
- no repo-wide labeling migration
- no heavy refactor
- no security theater

VERIFICATION

1. Read the new role-model doc end to end and confirm it makes the repo easier to explain.
2. Confirm the five roles are distinct and useful in practice.
3. Confirm the process silo is clearly identified as the highest-governance zone.
4. Confirm the validation-tier section makes it clear that not every stream or artifact gets the same level of checking.
5. Confirm the role model does not imply that all feature work should trigger heavy process validation.
6. If you add pointers from existing docs, keep them minimal and verify they are accurate.

HANDOFF REQUIREMENTS

Write the handoff to the live `handoff.md` using the project’s standard structure.

Include:
- TYPE
- PACKAGE
- STATUS
- SUMMARY
- FILES CREATED
- FILES MODIFIED
- VERIFICATION
- MANUAL VERIFICATION
- NEXT SUGGESTED PACKAGE

For `NEXT SUGGESTED PACKAGE`, recommend:

`scope_integrity_check_triggers_by_artifact_role_and_stream`

and describe it as the next narrow package that defines when light versus heavy integrity checks should run based on artifact role, stream type, and whether process/governance surfaces were touched.