# Planning — scaffoldai-execution-classification-v1

Created: 2026-05-06
Decided: 2026-05-06
Status: DECIDED

---

## 0. Decisions (2026-05-06)

These decisions were made after the PLAN phase was verified. They govern v1 implementation scope.

### Accepted

- **7-class execution model accepted.** Classes `READ_ONLY`, `LOCAL_WRITE`, `PROJECT_STRUCTURE_CHANGE`, `VERIFY_REQUIRED`, `HUMAN_APPROVAL_REQUIRED`, `EXTERNAL_SYSTEM_ACCESS`, and `DESTRUCTIVE` are the authoritative v1 taxonomy. No new classes may be added during implementation.

- **Tier 0–2 authority model accepted.** Tier 0 (no gate), Tier 1 (verify evidence required), and Tier 2 (explicit human decision) are the v1 approval tiers.

- **First integration point: `scaffoldai question`.** The first runtime implementation of execution classification will be a new question category: `EXECUTION_CLASS_BOUNDARY`. It will be raised when a pending or detected action exceeds the safe execution class for the current contract mode.

- **No permission enforcement in v1.** Execution class is a structural vocabulary layer only. No enforcement, sandboxing, or gating beyond what `question` surfaces.

- **No MCP, orchestration, or autonomous behavior.** Out of scope for this model in v1 and v2.

### Deferred

- **`active-contract.json max_permitted_class` field** — deferred to v2. Contract-level class gating (section 10, item 5) will not be implemented until the class model has been live through at least one full packet cycle.

### Out of Scope

- Audit trails, access logs, permission grants/revocations.
- Dynamic class upgrades or session-scoped authority.
- Any enforcement mechanism beyond `question` surfacing.

---

## 1. Purpose

ScaffoldAI currently has deterministic runtime commands for status, preflight, verify, question, and closeout. Before introducing any deeper behavior — deeper verification, richer question detection, or human-in-the-loop gating — the system needs a structural vocabulary for what kind of action is being requested and what level of authority that action carries.

An execution classification model answers:

> "What class of action is this, and what does that imply about risk, required verification, and human approval?"

This model is a structural vocabulary layer, not a permission system, sandbox, or execution engine. It defines the labels and rules. It does not enforce them yet.

---

## 2. Non-Goals (v1)

- Does NOT implement permission enforcement or sandboxing.
- Does NOT implement autonomous execution or orchestration.
- Does NOT implement MCP or any external system binding.
- Does NOT add flags or output changes to existing runtime commands.
- Does NOT write access logs or audit trails.
- Does NOT grant or revoke authority dynamically.
- Does NOT introduce "agent" terminology into user-facing output.
- Does NOT replace or modify `preflight`, `verify`, `question`, or `closeout`.
- Does NOT define runtime class for operations outside ScaffoldAI's scope.

---

## 3. What It Is

An execution class is a structural label attached to a class of actions. It defines:

- **Risk** — how consequential or hard-to-reverse the action is
- **Verification requirement** — whether verify must have been run before this class proceeds
- **Approval requirement** — whether explicit human approval is required
- **Dry-run safety** — whether the action can safely be previewed without side effects
- **Current gate policy** — what ScaffoldAI should do when this class is encountered under the current contract

The model exists so that future commands (and future `question` / `closeout` checks) can reason about action types using consistent labels.

---

## 4. Execution Class Definitions (v1)

Seven classes in v1, ordered from safest to most consequential.

---

### CLASS 1 — READ_ONLY

**Definition:** Reads state, configuration, or file content. No writes. No side effects.

**Examples:**
- `scaffoldai status`
- `scaffoldai question`
- `scaffoldai preflight`
- `scaffoldai verify` (recommend mode)
- Reading `active-contract.json`, `next-action.md`, or any state file
- `git status` reads

**Risk:** None. Cannot cause harm by running.

**Dry-run safe:** Always.

**Verify required:** No.

**Human approval required:** No.

**Current gate policy:** ALWAYS PERMITTED. No contract restriction applies.

---

### CLASS 2 — LOCAL_WRITE

**Definition:** Writes to local files within the project boundary. Reversible with `git checkout` or manual edit. Does not affect project structure, process state, or external systems.

**Examples:**
- Writing a timestamped artifact (`*.json` capture file)
- Writing a GUID metadata file
- Writing to `.scaffoldai/tmp/` (log output, verify artifacts)
- Appending to a local event log

**Risk:** Low. Reversible. Scoped to project root.

**Dry-run safe:** Safely previewable. Dry-run should show what would be written.

**Verify required:** No (but `verify` should be run before `closeout`).

**Human approval required:** No (unless contract mode explicitly requires it).

**Current gate policy:** PERMITTED under current contract. `require_dry_run: true` applies — must be previewed before commit.

---

### CLASS 3 — PROJECT_STRUCTURE_CHANGE

**Definition:** Adds, removes, or renames files/directories in a way that changes the structural layout of the project. Affects what the project is, not just its content.

**Examples:**
- Creating a new `src/commands/` file
- Creating a new `src/lib/` module
- Creating a new `src/test/` file
- Adding a new stream directory under `.scaffoldai/streams/`
- Renaming or removing existing source files

**Risk:** Medium. Affects refactoring surface, tests, and downstream tooling. Reversible with `git reset`.

**Dry-run safe:** Safely previewable as a diff/manifest before write.

**Verify required:** Yes. `verify` or `verify:scaffoldai` must pass after any structural change.

**Human approval required:** No automatic approval gate, but `preflight` and `closeout` should flag if structural changes exist without verify evidence.

**Current gate policy:** PERMITTED under current contract. `require_dry_run: true` and `require_clean_git: true` both apply. Structural changes must be committed cleanly.

---

### CLASS 4 — VERIFY_REQUIRED

**Definition:** An action that cannot be safely completed or declared done without explicit verification evidence. Not a class in itself, but a gate modifier that can apply to any class ≥ LOCAL_WRITE.

**Examples:**
- Running `scaffoldai closeout --verify-passed` after a structural change
- Declaring a packet complete
- Any action where "done" is the output

**Risk:** Medium–High depending on underlying class. The risk is in declaring work complete when it has not been verified.

**Dry-run safe:** Depends on underlying class.

**Verify required:** Always — by definition.

**Human approval required:** Depends on what is being declared complete.

**Current gate policy:** `closeout` enforces this via `--verify-passed` flag. Any VERIFY_REQUIRED action without verify evidence should surface a `QUESTION` or `BLOCKED` status.

---

### CLASS 5 — HUMAN_APPROVAL_REQUIRED

**Definition:** An action that changes persistent state, process model, or contract in a way that requires an explicit human decision. Cannot be performed by the ScaffoldAI runtime without a human explicitly authorizing the change.

**Examples:**
- Modifying `active-contract.json` (mode, allowed/blocked types)
- Updating `next-action.md` to a new packet
- Modifying the active stream in `active-stream.md`
- Merging a feature branch or committing to main
- Updating `.scaffoldai/agents/*.agent.md` behavior definitions
- Publishing or releasing output

**Risk:** High. These changes affect the authority model, process flow, or release state.

**Dry-run safe:** Yes, as a preview. But execution requires human signoff.

**Verify required:** Yes. Verify must pass before human approval is sought.

**Human approval required:** Always.

**Current gate policy:** These actions are outside the scope of runtime commands. The runtime commands (`status`, `preflight`, `verify`, `question`, `closeout`) can surface the question of whether approval is needed, but they cannot perform these actions. Any attempt to perform a HUMAN_APPROVAL_REQUIRED action via a runtime command should BLOCK.

---

### CLASS 6 — EXTERNAL_SYSTEM_ACCESS

**Definition:** Reads from or writes to a system outside the local project boundary. Includes network access, cloud services, external APIs, external databases, inter-process communication, or system-level operations (clipboard read/write, browser interaction, OS keychain).

**Examples:**
- Reading from or writing to the clipboard
- Network API calls
- Any MCP tool that touches an external system
- Reading from or writing to a path outside the project root
- Desktop automation (keyboard, mouse, browser)

**Risk:** High–Variable. External operations are not reversible within the project. Side effects are outside the project boundary.

**Dry-run safe:** No. Cannot safely simulate most external operations.

**Verify required:** Depends on operation. Evidence of what was read/written should be captured.

**Human approval required:** Yes, for write operations. Read-only external access (e.g., reading a remote API doc) may not require approval, but should be logged.

**Current gate policy:** BLOCKED in current contract mode. The ScaffoldAI runtime commands do not currently perform external system access. Any code path that would trigger EXTERNAL_SYSTEM_ACCESS must be flagged by `question` as a TOOL_BOUNDARY_CONCERN.

---

### CLASS 7 — DESTRUCTIVE

**Definition:** An action that permanently deletes, overwrites without recovery, or forcefully modifies state in a way that cannot be undone by standard git operations. Hard-to-reverse by design.

**Examples:**
- `git push --force`
- `git reset --hard`
- Dropping a database table
- Permanently deleting artifacts outside source control
- Overwriting `.scaffoldai/state/*` files without a backup/snapshot
- `rm -rf` on tracked content

**Risk:** Very High. Irreversible or hard-to-reverse.

**Dry-run safe:** No.

**Verify required:** Yes — and verify must show PASS, not just "was run."

**Human approval required:** Always. Explicit, unambiguous human confirmation required.

**Current gate policy:** ALWAYS BLOCKED by ScaffoldAI runtime. No runtime command should ever trigger or assist a DESTRUCTIVE action without an unambiguous, explicit, in-session human instruction — and even then, should require confirmation.

---

## 5. Authority Model

The execution classification model defines who may authorize each class of action.

| Class                      | Authority Required           | Runtime Can Perform? |
|----------------------------|------------------------------|----------------------|
| READ_ONLY                  | None                         | Yes                  |
| LOCAL_WRITE                | None (dry-run first)         | Yes                  |
| PROJECT_STRUCTURE_CHANGE   | None (verify after)          | Yes                  |
| VERIFY_REQUIRED (modifier) | Verify evidence required     | Yes (with evidence)  |
| HUMAN_APPROVAL_REQUIRED    | Explicit human decision      | No — surface only    |
| EXTERNAL_SYSTEM_ACCESS     | Human approval (write)       | No in current mode   |
| DESTRUCTIVE                | Explicit human confirmation  | Never alone          |

"Runtime Can Perform" means the ScaffoldAI runtime commands may assist with or perform the action. "No" means the runtime may surface the need, but cannot execute.

---

## 6. Approval Model

Three tiers of approval in v1:

### Tier 0 — No Approval Required
Classes: READ_ONLY, LOCAL_WRITE (with dry-run).
The runtime may proceed without any human gate. Verify may still be required before closeout.

### Tier 1 — Verify Evidence Required
Classes: PROJECT_STRUCTURE_CHANGE, anything touching `closeout`.
Verify must have been run and must have passed. The `--verify-passed` flag on `closeout` is the current signal. Future: a verified evidence file may formalize this.

### Tier 2 — Explicit Human Decision
Classes: HUMAN_APPROVAL_REQUIRED, EXTERNAL_SYSTEM_ACCESS (write), DESTRUCTIVE.
No runtime command may perform these. They must be initiated by an explicit human instruction in session. The runtime may surface that approval is needed (via `question`) but must not proceed on its own.

---

## 7. Verification Relationship

How execution class maps onto the existing runtime loop:

| Runtime Command     | Relevant Classes                                 | Effect                                               |
|---------------------|--------------------------------------------------|------------------------------------------------------|
| `status`            | READ_ONLY                                        | Always permitted. No class gating needed.            |
| `preflight`         | READ_ONLY + checks for ≥ HUMAN_APPROVAL_REQUIRED | Warns if pending human-approval actions are present. |
| `verify`            | READ_ONLY (report) or LOCAL_WRITE (run)          | Produces evidence for VERIFY_REQUIRED gate.          |
| `question`          | READ_ONLY + detects class boundary violations    | Surfaces if a pending action is above safe class.    |
| `closeout`          | VERIFY_REQUIRED gate enforcer                    | Enforces Tier 1 approval. Blocks if not met.         |

Future `question` check category: `EXECUTION_CLASS_BOUNDARY` — raised when a pending or detected action exceeds the safe class for the current contract mode.

---

## 8. Dry-Run Relationship

`require_dry_run: true` in the current contract maps to execution class as follows:

- READ_ONLY: always dry-run safe (is effectively a dry run by definition).
- LOCAL_WRITE: dry-run produces a preview manifest of what would be written.
- PROJECT_STRUCTURE_CHANGE: dry-run produces a diff of what files would be added/removed.
- VERIFY_REQUIRED: dry-run does not satisfy the verify gate.
- HUMAN_APPROVAL_REQUIRED: dry-run shows what would be proposed to the human.
- EXTERNAL_SYSTEM_ACCESS: dry-run is not meaningful for most operations.
- DESTRUCTIVE: dry-run must be forced explicitly; output clearly labeled.

---

## 9. Risks and Guardrails

### Risk: Class inflation
Adding too many classes creates a complex taxonomy that is hard to reason about. Keep v1 to 7 classes. Resist adding sub-classes.

**Guardrail:** New classes require a planning SDC. No class may be added inline during implementation.

### Risk: Silent class upgrade
A READ_ONLY command quietly begins writing as a side effect. The runtime appears safe when it is not.

**Guardrail:** Each runtime command's class must be declared explicitly. `question` should be able to detect when a command's actual behavior exceeds its declared class.

### Risk: Approval washing
A human approval is sought for a low-stakes action to bypass scrutiny of a higher-stakes embedded action.

**Guardrail:** Approval is per action, not per session or per command. The class is determined by the highest-risk sub-action, not the overall command.

### Risk: Verify evidence becoming stale
`--verify-passed` flag is self-reported. There is no timestamp or binding between verify output and the closeout call.

**Guardrail (v1):** Documented limitation. Future: tie verify evidence to a timestamped artifact that `closeout` can read.

### Risk: BLOCKED overuse
Classifying too many things as BLOCKED creates friction without safety value.

**Guardrail:** BLOCKED is reserved for DESTRUCTIVE and HUMAN_APPROVAL_REQUIRED in unsafe conditions. QUESTION and WARNING are the preferred signal for ambiguity.

---

## 10. Future Evolution Path

Once the execution classification vocabulary exists, the following become possible without rearchitecting:

1. **`question` category: `EXECUTION_CLASS_BOUNDARY`** — surfaces when a pending action in `next-action.md` or a detected code change would exceed the safe execution class for the current contract mode.

2. **`preflight` class check** — preflight can verify that the proposed next action is a permitted class under the current contract before work begins.

3. **`closeout` class report** — closeout can report the highest execution class touched in the current change set, making it clear what was and was not performed.

4. **`dry-run-check` expansion** — `dry-run-check` can validate that a proposed action's execution class is dry-run safe before proceeding.

5. **Contract-level class gating** — `active-contract.json` can declare `max_permitted_class: "PROJECT_STRUCTURE_CHANGE"`, making any higher-class action auto-BLOCKED without a contract change.

6. **Execution class tagging in handoff-bundle** — the handoff summary can include the highest execution class reached in the packet, providing a permanent record.

7. **MCP tool classification (future)** — when MCP tools are introduced, each tool can be tagged with its execution class at definition time, making the runtime model extensible without rearchitecting.

---

## 11. Example Mappings

| Action                                              | Execution Class              | Dry-Run Safe | Verify Required | Human Approval |
|-----------------------------------------------------|------------------------------|:------------:|:---------------:|:--------------:|
| `scaffoldai status`                                 | READ_ONLY                    | Always       | No              | No             |
| `scaffoldai question`                               | READ_ONLY                    | Always       | No              | No             |
| `scaffoldai preflight`                              | READ_ONLY                    | Always       | No              | No             |
| `scaffoldai verify --run`                           | LOCAL_WRITE (log output)     | Preview only | No              | No             |
| `scaffoldai closeout`                               | READ_ONLY + VERIFY_REQUIRED  | Always       | Yes             | No             |
| Writing a timestamped artifact                      | LOCAL_WRITE                  | Yes          | No              | No             |
| Creating a new `src/commands/*.js` file             | PROJECT_STRUCTURE_CHANGE     | Yes (diff)   | Yes             | No             |
| Adding a `verify:scaffoldai` step to `verify.js`   | PROJECT_STRUCTURE_CHANGE     | Yes (diff)   | Yes             | No             |
| Modifying `active-contract.json`                    | HUMAN_APPROVAL_REQUIRED      | Preview only | Yes             | Yes            |
| Updating `next-action.md` to a new packet           | HUMAN_APPROVAL_REQUIRED      | Preview only | No              | Yes            |
| Committing to main / merging a PR                   | HUMAN_APPROVAL_REQUIRED      | Preview only | Yes             | Yes            |
| Reading clipboard for a capture                     | EXTERNAL_SYSTEM_ACCESS (read)| N/A          | No              | No (read only) |
| Posting to an external API                          | EXTERNAL_SYSTEM_ACCESS (write)| No          | Yes             | Yes            |
| `git reset --hard`                                  | DESTRUCTIVE                  | No           | Yes             | Always         |
| `git push --force`                                  | DESTRUCTIVE                  | No           | Yes             | Always         |
| Overwriting `.scaffoldai/state/active-contract.json`| DESTRUCTIVE                  | No           | Yes             | Always         |

---

## 12. Implementation Readiness

This planning doc is the output of `scaffoldai-execution-classification-v1` (PLAN phase).

**Recommended next step: DO NOT implement yet.**

Before implementation, the following should be resolved:

1. Human confirms the 7-class model is correct and complete for v1.
2. Human confirms the authority model (Tiers 0–2) matches intent.
3. Decide which runtime command should first expose execution class labels — likely `question` via a new `EXECUTION_CLASS_BOUNDARY` category, or `closeout` via a class report section.
4. Decide whether `active-contract.json` will be extended with `max_permitted_class` in v1 or deferred.

The model is internally consistent with the existing runtime commands and does not require any structural change to implement incrementally.

---

## 13. Verification Expectation

After this planning doc is created:

```
npm run verify:scaffoldai
```

Expected: OVERALL: PASS — no implementation changes made, no tests affected.

The doc is inert. No code paths reference it yet.
