# consync-core

Consync is a small local-first CLI workspace for creating and inspecting structured artifact metadata, with a lightweight workflow layer kept inside `.consync/`.

Today the repo provides:

- CLI commands for artifact creation and inspection
- a deterministic sandbox verification loop
- a portable scaffold command for installing a minimal Consync workflow starter into another repo
- a portable `.consync/` boundary for workflow state and durable internal docs

It does not require network access, servers, or external services.

## Repository Structure

- `.consync/` — internal workflow state, durable artifacts, plans, and system docs
- `.github/prompts/` — Copilot adapter layer for running the next-action and closeout workflow
- `src/` — CLI commands, reusable helpers, and verification code
- `sandbox/` — fixtures, expectations, and current runtime artifacts used for manual and automated verification

## Workflow Loop

The working loop is:

1. update `.consync/state/next-action.md`
2. execute the packet and write `.consync/state/handoff.md`
3. run verification, usually with `npm run verify`

This keeps the active workflow state explicit and local to the repo.

## Portable Boundary

`.consync/` is the portable system boundary for Consync's internal process. It holds the workflow state and supporting artifacts that let the repo travel without depending on external coordination.

To scaffold the minimal workflow starter into another repo, run `node src/index.js portable --target /path/to/other-repo`.

## Verification

Run `npm run verify` to execute the current verification pass.

Expected result: the suite ends with `[verify] PASS`.

For a quick CLI check, run `node src/index.js new-guid --note "some text"` to create an artifact in `sandbox/current/` and append an event to `.consync/state/events.log`.
