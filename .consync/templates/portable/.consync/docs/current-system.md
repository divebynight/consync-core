# Current System

## What This Scaffold Provides

This portable scaffold installs a minimal Consync workflow layer into a repo.

It provides:

- `.consync/state/next-action.md` for the active packet
- `.consync/state/handoff.md` for the latest result
- `.consync/docs/current-system.md` for lightweight orientation
- `.github/prompts/` prompt adapters for the next-action and closeout flow

## What It Does Not Provide

This scaffold does not add runtime commands, tests, or automation by itself.

It does not:

- copy the full source repo
- export live runtime state automatically
- add package-manager setup
- infer project type
- overwrite existing files unless the scaffold command is run with force enabled

## State And Prompt Locations

- Workflow state lives in `.consync/state/`
- Orientation docs can live in `.consync/docs/`
- Prompt adapters live in `.github/prompts/`

## Adapter Layer

The prompt files in `.github/prompts/` are the adapter layer that tells Copilot where to read the current packet and where to write the handoff.

## Verification Expectations

The host repo should define its own verification commands.

At minimum, an on-track scaffold should have:

- a current `.consync/state/next-action.md`
- a current `.consync/state/handoff.md`
- prompt files that read and write those locations consistently
- a clear human verification path for each packet