TYPE: PROCESS
PACKAGE: implement_preflight_and_postflight_doc_integrity_checks

GOAL

Implement the first lightweight documentation and process integrity checks so the system can validate core live-state coherence before package execution and again before accepting closeout.

WHY

The system now has defined integrity rules, state contracts, and bounded change concepts, but those protections are still only written rules. We now need a minimal enforcement layer that behaves like a smoke-test and contract-check pass for the core live loop.

This package should add a small, practical integrity check surface that verifies current truth without introducing a heavy validator framework or bloated process.

SCOPE

Keep this package intentionally small and v1.

Expected outcome:
- one lightweight preflight integrity check exists
- one lightweight postflight integrity check exists
- checks focus only on core live-state artifacts
- checks return clear PASS/FAIL output with short reasons
- checks are simple enough to run during the package loop

Do not:
- build a full validation framework
- validate every markdown file in the repo
- introduce file permissions or security controls
- build a large agent system in this package
- mix this package with UI work
- over-engineer naming or artifact taxonomy beyond what is needed for the checks

WORK INSTRUCTIONS

1. Inspect the current verification and process surface to find the simplest place to add a lightweight integrity check.

2. Implement a small v1 integrity check surface.
   This may be:
   - a small script,
   - a small verify subcommand,
   - or another repo-native mechanism,
   whichever best fits the current Consync structure.

3. The v1 check should only govern the core live-state artifacts:

   - `.consync/state/active-stream.md`
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`
   - `.consync/state/snapshot.md`

4. Implement a **preflight** check that verifies, at minimum:

   - there is exactly one active stream
   - the active stream is readable and explicit
   - the mounted `next-action.md` is present and readable
   - the active package can be identified
   - the live state does not appear obviously contradictory
   - if contradiction exists, output FAIL and indicate reconciliation is required

5. Implement a **postflight** check that verifies, at minimum:

   - `handoff.md` is present and readable
   - the handoff package can be identified
   - the handoff and mounted package are not obviously contradictory
   - the live state artifacts still agree on active ownership
   - the system can still answer the canonical questions:
     - open or closed
     - active stream
     - active package
     - next safe action

6. Keep the checks intentionally shallow and valuable.
   This package is for smoke/contract checking, not deep repo-wide validation.

7. Output should be concise and operational, for example:
   - `STATUS: PASS`
   - `STATUS: FAIL`
   - brief reason lines
   - optional note on what to reconcile

8. If appropriate, wire the checks into an existing verify surface in a minimal way.
   If not, expose them through one small explicit command and document how to run them.

9. Add only the smallest necessary documentation update so operators know:
   - when to run preflight
   - when to run postflight
   - what PASS/FAIL means

TESTING MODEL FOR THIS PACKAGE

This package should behave like a lightweight process/doc equivalent of:
- smoke checks
- contract checks

It does not need to implement broader “integration checks” across all documentation yet.

CONSTRAINTS

- keep the implementation small
- do not turn this into a generalized markdown linter
- do not add broad repo scanning
- do not implement a separate doc-integrity agent yet unless the existing repo structure clearly demands it
- do not validate historical/reference docs in this package
- prioritize clarity, trust, and low cognitive load

VERIFICATION

1. Run the new preflight check against the current repo state and confirm it returns PASS when state is coherent.
2. Run the new postflight check against the current repo state and confirm it returns PASS when state is coherent.
3. If practical, simulate or reason through at least one obvious failure condition, such as:
   - conflicting active stream and next-action ownership
   - unreadable or missing mounted package
   - contradictory package names across live state artifacts
4. Confirm the output is short and understandable.
5. Confirm the implementation stayed narrow and did not expand into a broad documentation validation system.

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

`expand_integrity_checks_from_core_state_to_stream_local_state`

and describe it as the next narrow package that extends the same smoke/contract model from the four global live-state artifacts to the paused/active stream-local state surfaces without yet scanning broader reference docs.