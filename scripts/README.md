# scripts/

## Purpose

This folder contains project utility scripts that support development, verification, and CI workflows.

These scripts are not Consync runtime/product code and not ScaffoldAI process documentation.

---

## What Belongs Here

- `check-handoff-contract.js` — reads `.scaffoldai/state/handoff.md` and `next-action.md` and verifies required fields are present; used by `npm run check:handoff-contract`
- `playwright-electron-main.cjs` — Playwright helper for Electron e2e test setup; referenced by the e2e test suite

---

## What Does NOT Belong Here

- Consync runtime/product logic (belongs in `src/lib/` or `src/commands/`)
- ScaffoldAI process documentation, agents, or state files (belong under `.scaffoldai/`)
- Test assertions or test fixtures (belong in `src/test/` and `sandbox/`)

---

## Important Boundaries

- Scripts here are project-level utilities invoked via `package.json` scripts — `package.json` remains the command surface
- If a script grows reusable logic, that logic should be extracted into `src/lib/` so it can be tested and used across CLI, Electron, and other surfaces
- Scripts should be thin: read state, run a check, print output — do not embed product business logic here
- Scripts may read `.scaffoldai/state/` files but must not write or modify them

---

## Related Folders

| Folder | Relationship |
|--------|-------------|
| `src/lib/` | Reusable logic that scripts may call or that should absorb logic that outgrows a script |
| `src/test/` | Test runners; some tests use scripts here as helpers |
| `.scaffoldai/state/` | State files that scripts like `check-handoff-contract.js` read |
| `.scaffoldai/process/` | Process documentation — separate from these utility scripts |

---

## Verification Notes

- Scripts wired into `package.json` are exercised as part of `npm run verify:full` (e.g. `check:state-preflight`, `check:state-postflight`)
- `check-handoff-contract.js` can be run standalone: `npm run check:handoff-contract`
- `playwright-electron-main.cjs` is invoked automatically by the Playwright e2e runner — do not run it directly
