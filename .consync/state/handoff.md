TYPE: PROCESS
PACKAGE: define_canonical_state_contracts_and_integrity_checks

STATUS

PASS

SUMMARY

Defined explicit contracts for the four core live-state artifacts and introduced the preflight/postflight integrity-check model as a small operational layer over the existing single-package loop.

The new contracts doc defines required structure, required fields, representational meaning, and always-true conditions for `active-stream.md`, `next-action.md`, `handoff.md`, and `snapshot.md`. It also defines live-state invariants, formal `OPEN` versus `CLOSED` behavior, bounded zones of influence, the allowed-change rule, and a lightweight ownership model for human, prompt, future integrity, and process enforcement. Supporting changes stayed small: one runbook pointer and one snapshot refresh.

FILES CREATED

- `.consync/docs/state-contracts-and-integrity-checks.md` — defines explicit live-state contracts, invariants, open/closed behavior, preflight/postflight checks, zones of influence, and the integrity ownership model.

FILES MODIFIED

- `.consync/docs/runbook.md` — adds one small pointer to the new contracts doc in the deeper-docs list.
- `.consync/state/snapshot.md` — refreshes the global snapshot so it names the current contracts package and the current definition-only process phase accurately.
- `.consync/state/handoff.md` — records this process package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && sed -n '1,360p' .consync/docs/state-contracts-and-integrity-checks.md`
- `cd /Users/markhughes/Projects/consync-core && sed -n '120,180p' .consync/docs/runbook.md`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/state/snapshot.md`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

VERIFICATION

- Read `.consync/docs/state-contracts-and-integrity-checks.md` end to end and confirmed it clearly defines what valid state means for the four core live-state artifacts.
- Confirmed the new doc explicitly defines preflight and postflight checks, canonical invariants, allowed versus protected change surfaces, and the `OPEN` versus `CLOSED` contract without introducing an action-plan system.
- Read `.consync/state/snapshot.md` and confirmed it now reflects the current package instead of the earlier integrity-layer package.
- Read the updated deeper-docs section in `.consync/docs/runbook.md` and confirmed the pointer stayed minimal and accurate.
- Ran `git status --short` and confirmed the package stayed narrow: one new contracts doc, one small runbook pointer, the snapshot refresh, and the live handoff file. The live `next-action.md` is also modified because it mounts the current package.

MANUAL VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,360p' .consync/docs/state-contracts-and-integrity-checks.md`.
2. Confirm success behavior: each core state artifact has a contract covering required structure, required fields, what it represents, and what must always be true.
3. Confirm success behavior: the doc explicitly defines preflight and postflight checks, `OPEN` versus `CLOSED`, zones of influence, and the allowed-change rule.
4. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/state/snapshot.md`.
5. Confirm success behavior: the snapshot names `define_canonical_state_contracts_and_integrity_checks` as the current package and describes the current phase as definition-only.
6. Failure case: if the contracts doc implies validators, permissions, or a full action-plan system already exist, treat this package as out of scope.
7. Failure case: if the doc leaves the four core live-state artifacts underspecified or makes the system harder to explain, treat the package as incomplete.

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the package-specific changed surface is limited to `.consync/docs/state-contracts-and-integrity-checks.md`, the small runbook pointer, the snapshot refresh, and the live handoff. The mounted `next-action.md` may also appear as part of the live loop.
2. Open `.consync/docs/state-contracts-and-integrity-checks.md` and verify success behavior: a new assistant could use it to understand what valid state means before and after package execution without inferring rules from scattered markdown.
3. Open `.consync/docs/runbook.md` and verify success behavior: the new pointer improves discoverability without duplicating the contracts doc.
4. Verify failure behavior: if `snapshot.md` still points at the prior package or if the contracts doc conflicts with the existing automation contract for required handoff structure, treat the package as failing verification.
5. Verify failure behavior: if the zones-of-influence model reads like permissions or security rather than bounded package scope, treat the package as too complex.

VERIFICATION NOTES

- Actually tested: end-to-end reading of the new contracts doc, focused reads of the refreshed snapshot and runbook pointer section, and `git status --short` for changed-surface scope.
- Observed outcome: the doc stays definition-only, defines the four core live-state artifact contracts explicitly, defines `OPEN`/`CLOSED` and preflight/postflight clearly, and keeps the bounded-change model conceptual rather than permission-based.
- Important edge cases validated: the doc explicitly treats conflicting canonical state as a reconciliation trigger, and it keeps `CLOSED` as a brief between-packages state rather than introducing a heavier planning system.

NEXT SUGGESTED PACKAGE

- `implement_preflight_and_postflight_doc_integrity_checks` — the first implementation package that adds a lightweight integrity check (script or agent prompt) that runs before and after each package execution.