# SDC — Validate Remote Submit Duplicate and Pending Guards

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI HTTPS operator MCP candidate submission and inbox guard behavior

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Validate that remote HTTPS operator candidate submission remains deterministic, bounded, and understandable when duplicate, colliding, or pending-equivalent SDC candidates are submitted.

This packet should prove that `scaffoldai_submit_sdc_candidate` protects `.scaffoldai/inbox/` from ambiguous repeated submissions while preserving the current authority boundary:

```text
Remote Proposal, Local Lifecycle
```

Remote agents may submit bounded SDC candidates into `.scaffoldai/inbox/`, but they must not intake, activate, claim, execute, verify, closeout, cleanup, clear, commit, or mutate lifecycle/runtime/git state.

BACKGROUND:
The previous validation proved that ChatGPT can submit a valid SDC candidate through the HTTPS operator MCP and that local CLI intake can accept it. The next risk to validate is repeated remote proposal behavior: exact duplicates, same-title candidates, suggested filename collisions, and pending candidate ambiguity.

The inbox should remain safe and legible even when remote agents retry, double-submit, or submit overlapping work.

TASKS:
1. Establish baseline inbox state.

Record the current `.scaffoldai/inbox/` contents before test submission attempts. Preserve `README.md`, examples, and unrelated candidates.

2. Submit or simulate an exact duplicate candidate.

Verify that submitting the same packet content/title/identity more than once is rejected or handled idempotently with deterministic diagnostics.

3. Submit or simulate a same-title / same-slug collision.

Verify that two candidates resolving to the same packet identity cannot create ambiguous pending candidates.

4. Submit or simulate a suggested filename collision.

Verify that filename collisions are sanitized, rejected, or deterministically disambiguated without arbitrary overwrite.

5. Submit or simulate a content-distinct but identity-equivalent candidate.

Verify that a different body with the same canonical packet identity is rejected or requires explicit local/manual resolution.

6. Confirm guard behavior is fail-closed.

All duplicate, pending, or collision guard failures must return structured diagnostics and must not mutate active runtime state, next-action state, lifecycle state, or git state.

7. Confirm positive-path candidate behavior remains intact.

A unique valid SDC candidate should still be accepted into `.scaffoldai/inbox/` as a bounded proposal only.

8. Confirm lifecycle boundary remains intact.

No remote duplicate/pending/collision test should cause intake, activation, claim, execution, verification, closeout, cleanup, clear, or commit.

9. Confirm final inbox state is understandable.

The test should leave clear evidence of what was accepted or rejected, avoid broad cleanup, and preserve README/examples/unrelated candidates.

VERIFY:
Run:
- `npm run verify:scaffoldai`

Also verify or document evidence for:
- exact duplicate submission behavior
- same-title / same-slug collision behavior
- suggested filename collision behavior
- identity-equivalent content-distinct candidate behavior
- structured rejection diagnostics
- no arbitrary overwrite of existing inbox files
- no path traversal or arbitrary file writes
- no active runtime mutation from submit attempts
- no next-action mutation from submit attempts
- no lifecycle mutation from submit attempts
- no git mutation through MCP
- final inbox state remains legible and bounded

OUTPUT:
Return:
1. files changed
2. baseline inbox state
3. duplicate guard behavior
4. pending/same-slug guard behavior
5. filename collision behavior
6. structured diagnostics observed
7. authority boundary evidence
8. final inbox state
9. verification result

CONSTRAINTS:
- no remote lifecycle authority
- no remote execution authority
- no remote closeout or cleanup authority
- no git authority over MCP
- no arbitrary file writes
- no path traversal
- no broad inbox cleanup
- no deletion of README, examples, unrelated candidates, accepted packets, or append-only logs
- no active runtime mutation from HTTPS operator submit path
- no next-action mutation from HTTPS operator submit path
- no lifecycle mutation from HTTPS operator submit path
- preserve strict fail-closed operation ordering
- preserve deterministic duplicate/pending candidate guards
- preserve packet identity coherence
- human-controlled commits only
