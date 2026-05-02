# Janitor Agent — Concept Doc

Status: CONCEPT (not yet bound)
Captured: 2026-04-27
Packet: janitor-agent-concept-v1

---

## Purpose

The Janitor Agent is a future inspection agent responsible for repo hygiene.

Its job is to surface cleanup candidates, stale docs, unused files, broken references, and generated artifacts that should be gitignored — without deleting, moving, or modifying anything on its own.

Janitor **proposes**. Humans **approve**. Cleanup runs as an **explicit named packet**.

---

## Scope

- Inspect repo structure against known inventory docs
- Detect files and folders with no observed references or active purpose
- Detect docs that are stale, superseded, or no longer aligned with current state
- Detect generated or ephemeral artifacts that should be excluded by `.gitignore`
- Detect broken or dead references within docs and state files
- Produce structured cleanup candidate reports for human review

---

## Non-Scope

- No automatic deletion of any file or folder
- No automatic refactoring or reorganization
- No silent or background cleanup
- No orchestration of other agents
- No modification of `.consync/state/` or `.consync/docs/` as a side effect of inspection
- No dispatching of cleanup packets

---

## Inputs

| Input | Description |
|---|---|
| Repo structure | Directory tree, file names, file sizes |
| Git status | Untracked files, uncommitted changes, recent commit history |
| Reference/search results | Cross-file grep for names, paths, imports, and identifiers |
| Inventory docs | `.consync/docs/repo-structure-inventory.md` and similar |
| Test and verify results | Output of `npm run verify` and related checks |

---

## Outputs

| Output | Description |
|---|---|
| Cleanup candidates | Files and folders with no observed active reference or purpose |
| Stale docs | Documents that no longer reflect current repo state or active work |
| Broken references | Links, paths, or identifiers in docs that point to removed or renamed targets |
| Generated files to ignore | Artifacts produced by build, test, or tooling that should be added to `.gitignore` |
| Recommended cleanup packets | Named, scoped packets a human can choose to execute |

All outputs are advisory only. No output implies automatic action.

---

## Safety Rule

> Janitor proposes. Human approves. Cleanup runs as an explicit packet.

No inspection by the Janitor Agent should trigger any repo modification.

Every cleanup item must be packaged, reviewed, and explicitly executed by a human.

Cleanup packets produced from Janitor findings follow the same naming and commit discipline as all other Consync packets.

---

## Invocation Model

When bound, the Janitor Agent will be invoked manually, like all other Consync agents.

It is not a scheduled task, watcher, or background service.

Suggested invocation point: after a package closeout, or before a new stream begins, as an optional hygiene pass.

---

## Relationship to Existing Agents

| Agent | Relationship |
|---|---|
| Preflight | Janitor is complementary — Preflight checks process state; Janitor checks repo hygiene |
| Intake | Janitor findings may be used as input when scoping a cleanup package via Intake |
| Verify | Janitor may consume Verify output as one of its inputs |
| Closeout | A Janitor pass may be recommended as an optional step before Closeout |

---

## Notes

- The `repo-structure-inventory.md` cleanup workflow (2026-04-26) is the human-driven precursor to what this agent would automate as inspection.
- This agent is not yet bound. No agent file exists in `.consync/agents/` for it.
- When ready to bind, create `.consync/agents/janitor.md` and update this doc with a binding reference.
