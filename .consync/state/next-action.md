TYPE: PROCESS
PACKAGE: define_canonical_state_contracts_and_integrity_checks

GOAL

Define explicit contracts for the core live-state artifacts and introduce the preflight/postflight integrity check model so the system can prevent drift without introducing heavy planning or file-level security.

WHY

The system currently relies on disciplined iteration (`next-action → handoff`) but lacks enforcement between steps. This creates risk of silent drift where state artifacts diverge or are modified outside their intended scope.

We do not need a full action-plan system. We need:

- clear contracts for core state artifacts
- a definition of what a valid state looks like
- preflight checks before a package runs
- postflight checks before a handoff is accepted
- a lightweight definition of “zones of influence” for packages

This preserves the simplicity of one-step iteration while adding guardrails that maintain system integrity.

SCOPE

This is a definition-only package.

Expected outcome:
- explicit contracts for core state artifacts
- definition of preflight and postflight checks
- definition of “allowed change surface” per package
- definition of protected/global artifacts
- no implementation of agents or automation yet

Do not:
- implement automated validators yet
- introduce a full action-plan system
- redesign existing docs
- add security mechanisms or permissions
- mix this with UI work

WORK INSTRUCTIONS

1. Create a new doc:

   `.consync/docs/state-contracts-and-integrity-checks.md`

2. Define **core state contracts**

For each of the following artifacts, define:
- required structure
- required fields
- what it represents
- what must always be true

Artifacts:
- `.consync/state/active-stream.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`
- `.consync/state/snapshot.md`

3. Define **canonical state invariants**

Examples:
- exactly one active stream
- next-action belongs to active stream
- handoff reflects the last completed package
- system is either OPEN or CLOSED, not both
- no conflicting ownership across state files

4. Define **system OPEN vs CLOSED contract**

Explicitly define:
- when system is OPEN (active package in progress)
- when system is CLOSED (no active package)
- allowed actions in each state

5. Define **preflight check (before package runs)**

Must verify:
- system state is coherent
- active stream is unambiguous
- next-action is valid and not stale
- no unresolved state conflicts

6. Define **postflight check (before accepting handoff)**

Must verify:
- handoff matches executed package
- required sections are present
- state files remain consistent
- no unintended artifacts were modified

7. Define **zones of influence (bounded change model)**

Define three categories:

- **in-scope artifacts**
  - expected to change in a package

- **controlled artifacts**
  - may change but must match contract

- **protected artifacts**
  - should not change unless explicitly required

Make this conceptual, not permission-based.

8. Define **allowed change rule**

A package should:
- declare or imply what it is allowed to modify
- avoid modifying unrelated artifact classes
- trigger reconciliation if it must cross boundaries

9. Define **integrity ownership model**

Define roles:

- human operator: final verification
- prompt layer: enforces structure
- future integrity agent: enforces contracts
- process agent: enforces loop correctness

10. Keep everything simple and operational

The doc should make the system easier to explain, not harder.

CONSTRAINTS

- no implementation yet
- no over-engineering
- no large-scale rewrites
- no duplication of existing docs
- keep the model small and usable

VERIFICATION

1. Read the doc end to end and confirm:
   - it clearly defines what “valid state” means
   - it clearly defines pre/post checks
   - it clearly defines allowed vs protected changes
   - it reduces ambiguity instead of adding it

2. Confirm:
   - it does not introduce unnecessary complexity
   - it does not require an action plan system
   - it preserves the current iteration model

HANDOFF REQUIREMENTS

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

For NEXT SUGGESTED PACKAGE:

`implement_preflight_and_postflight_doc_integrity_checks`

Describe it as:
the first implementation package that adds a lightweight integrity check (script or agent prompt) that runs before and after each package execution.