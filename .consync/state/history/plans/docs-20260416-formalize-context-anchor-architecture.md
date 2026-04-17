TYPE: DOCS
PACKAGE: formalize_context_anchor_architecture

GOAL

Update the active Consync docs so they reflect the current architecture direction we just agreed on:

- Consync captures context, not full filesystem truth.
- Local `.consync` anchors are the durable source of truth.
- Broader relationships are discovered or linked above that layer.
- Sessions begin local and self-contained.
- Higher-level context can be attached later through meaningful linking, not by rewriting history.
- Search/discovery may scan nested `.consync` anchors under a chosen root.
- Search/discovery associations are not automatically durable structural links.
- `sandbox/current` should be treated as a development harness, not the long-term ontology.
- The system should support selective capture: only interacted-with / bookmarked artifacts matter by default.
- Future “gravity / decay / self-cleaning hoard” ideas are horizon concepts, not foundation behavior yet.

PRIMARY REQUEST

Review the current Consync docs and update whichever active docs should carry this architecture direction. Prefer updating existing active docs over creating new ones unless a short dedicated architecture note is clearly the cleanest fit.

The result should leave the repo in a better re-entry state for both humans and AI tools.

CONSTRAINTS

- Do not overdesign schemas or invent implementation details we have not agreed on.
- Do not turn this into a full technical spec.
- Keep the writing crisp, grounded, and aligned with current project language.
- Preserve flexibility and explicitly note where behavior is still provisional.
- Do not imply that Consync is a full file-tracking or file-repair system.
- Do not treat every folder as requiring a `.consync` directory.
- Do not imply that every root/view change is durable history.
- Do not remove useful existing material unless it directly conflicts with this updated direction.

TARGET CONTENT TO CAPTURE

Make sure the updated docs communicate the following ideas clearly:

1. WHAT CONSYNC IS
- A context/memory layer over creative work.
- It captures meaningful interaction and re-entry cues that normal filesystems do not express well.

2. WHAT CONSYNC IS NOT
- Not a full mirror of the filesystem.
- Not responsible for repairing renamed/moved user structures.
- Not a tracker of every file in ambient scope.

3. PRIMARY UNIT
- Session is the primary unit of captured context.
- Folder is important as local context, but folder != session.

4. LOCAL TRUTH
- Local `.consync` anchors hold durable context truth where meaningful local persistence exists.
- These anchors should be sparse and intentional, not sprayed everywhere.

5. SELECTIVE CAPTURE
- By default, only artifacts explicitly interacted with (for example bookmarked / dragged into Consync) become active session scope.
- Ambient nearby files are background unless scope is deliberately widened.

6. RELATIONSHIPS
- Parent / higher-level context may know about child contexts.
- Child contexts should remain locally legible and portable on their own.
- Higher-level context can be linked after the fact.
- Distinguish durable links from temporary discovered associations.

7. SEARCH / DISCOVERY
- A broader search root may scan downward for nested `.consync` anchors.
- A rebuildable index/cache may exist later for speed, but local anchors remain source of truth.
- Search hits do not automatically become permanent structural links.

8. CURRENT DEV HARNESS
- `sandbox/current` is a temporary dev/testing harness.
- It should not be treated as the final ontology or implied long-term storage model.

9. HORIZON / FUTURE
- Capture depth/fidelity may become a throttle later.
- Gravity/decay/self-cleaning-hoard ideas remain future-layer behavior, not present foundation rules.

PREFERRED DOC OUTCOME

Update the most relevant active docs, likely including whichever files currently serve as:
- current direction / architecture summary
- active work / near-term direction
- system overview / human+AI re-entry docs

If needed, add one short dedicated architecture note only if that is cleaner than forcing too much into an existing doc.

PROCESS

1. Inspect the current active docs and determine which ones should be updated.
2. Make the smallest clean set of doc changes needed to capture the architecture direction above.
3. Keep terminology consistent across docs.
4. Avoid duplicative sprawl.
5. Update any orientation text that still over-implies root-level or single-session assumptions.

HANDOFF FORMAT

Return a handoff in this exact structure:

TYPE: DOCS
PACKAGE: formalize_context_anchor_architecture

STATUS

PASS or FAIL

SUMMARY

A concise summary of what docs were updated and what architecture direction is now documented.

FILES CREATED

- path — short reason
- path — short reason

FILES MODIFIED

- path — what changed
- path — what changed

KEY DOCUMENTED DECISIONS

- bullet list of the most important architecture decisions now captured in docs

OPEN QUESTIONS / DEFERRED DETAILS

- bullet list of anything intentionally left open

COMMANDS RUN

- exact command
- exact command

VERIFICATION NOTES

- explain how you verified the docs are internally consistent and aligned with current direction