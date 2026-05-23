# SDC — Validate Remote Proposal Local Lifecycle Loop

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI HTTPS operator proposal submission and local lifecycle orchestration validation

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Validate the complete end-to-end ScaffoldAI orchestration loop now that the HTTPS operator MCP exposes readonly observer tools plus bounded `scaffoldai_submit_sdc_candidate` authority.

The validation must preserve the current authority boundary:

```text
Remote Proposal, Local Lifecycle
```

Remote agents may propose work by writing bounded SDC candidates into `.scaffoldai/inbox/`, but only local/manual authority may intake, activate, claim, execute, verify, closeout, cleanup, clear, commit, or otherwise mutate lifecycle/runtime/git state.

BACKGROUND:
Current architecture state includes:
- strict SDC packet lifecycle hardening
- deterministic intake validation
- forbidden transition tests
- cleanup safety preconditions
- active packet replacement guards
- packet identity coherence
- durable packet identity reuse
- duplicate/pending candidate guards
- idempotent lifecycle handling
- fail-closed operation ordering
- HTTPS observer/operator separation
- HTTPS operator MCP exposing readonly observer tools plus only `scaffoldai_submit_sdc_candidate`

The HTTPS operator authority must remain limited to bounded inbox proposal submission only.

TASKS:
1. Confirm this candidate arrived through the HTTPS operator MCP submit tool as an inbox-only candidate.

2. Intake the candidate locally through the CLI.

3. Activate the accepted packet locally through the CLI.

4. Claim and execute locally as appropriate.

5. Verify lifecycle and authority behavior using the existing ScaffoldAI verification command.

6. Confirm no remote lifecycle authority was used or exposed.

7. Confirm no git mutation occurred through MCP.

8. Confirm closeout remains a separate local/manual primitive.

9. Confirm cleanup remains gated on successful terminal closeout evidence.

10. Confirm cleanup only removes artifacts tied to the completed packet/process instance.

11. Confirm lifecycle integrity returns to a clean idle/no-active-packet state after closeout, cleanup, and clear.

VERIFY:
Run:
- `npm run verify:scaffoldai`

Also verify or document evidence for:
- HTTPS operator MCP exposes only readonly observer tools plus `scaffoldai_submit_sdc_candidate`
- no MCP tool exists for intake, activate, claim, execute, closeout, cleanup, clear, commit, or arbitrary file/git mutation
- packet identity remains coherent across inbox, intake, packet archive, active state, closeout, cleanup, and clear
- duplicate/pending guards remain deterministic
- cleanup remains narrow, packet/process-instance-bound, and idempotent
- README/examples/unrelated candidates are preserved
- final state is clean: no active packet, no stale claim, no unsafe pending lifecycle state

OUTPUT:
Return:
1. candidate source path and accepted packet id
2. local intake result
3. local activation result
4. verification result
5. evidence that remote MCP authority remained submit-only
6. evidence that lifecycle transitions remained local/manual
7. evidence that cleanup/closeout boundaries remained intact
8. final lifecycle status

CONSTRAINTS:
- no remote lifecycle authority
- no remote execution authority
- no remote closeout or cleanup authority
- no git authority over MCP
- no broad `.scaffoldai/inbox/` write access beyond bounded candidate submission
- no active runtime mutation from the HTTPS operator submit path
- no next-action mutation from the HTTPS operator submit path
- no Consync/ScaffoldAI responsibility collapse
- no `.consync/` product metadata usage for ScaffoldAI process state
- preserve strict fail-closed operation ordering
- preserve cleanup as separately gated, narrow, idempotent, and evidence-based
- preserve packet identity coherence and deterministic duplicate/pending guards
- human-controlled commits only
