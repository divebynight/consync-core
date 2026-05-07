# sandbox/

## Purpose

This folder contains development and testing artifacts used to verify Consync behavior against known inputs and expected outputs.

It is a development tool, not a Consync runtime data store.

---

## What Belongs Here

- `fixtures/` — deterministic input directories used by CLI commands during verify and e2e tests
- `expectations/` — expected output files matched against CLI output during `runExpectationStep` in the verify runner
- `probes/` — targeted test scripts for specific subsystems (e.g. audio session capture)
- `current/` — temporary working artifacts generated during local development (gitignored for ephemeral files)

---

## What Does NOT Belong Here

- ScaffoldAI process state (`.scaffoldai/state/`, `.scaffoldai/streams/`, `.scaffoldai/packets/`)
- User-facing Consync session data or GUID metadata
- Work packets, handoff records, or snapshot files
- Production runtime data of any kind

---

## Important Boundaries

- `sandbox/fixtures/` is committed, deterministic, and version-controlled — treat changes to fixtures as test changes requiring verify to pass
- `sandbox/expectations/` files are the source of truth for CLI output verification — do not edit them to make a failing test pass; fix the command instead
- `sandbox/current/` may contain local working files that are not committed — do not rely on it as a stable data source
- Probes under `sandbox/probes/` are standalone test scripts for specific subsystems; they are not part of the main verify loop unless explicitly wired in

---

## Related Folders

| Folder | Relationship |
|--------|-------------|
| `src/test/` | Test runners and unit/integration/e2e test files; they reference fixtures and expectations here |
| `src/commands/` | CLI commands exercised against fixtures during verify |
| `.scaffoldai/` | ScaffoldAI process harness — separate from sandbox artifacts |

---

## Verification Notes

- `npm run verify` exercises fixtures and expectations automatically via `runExpectationStep` calls in `src/test/verify.js`
- If a fixture or expectation changes, run `npm run verify` to confirm expectations still match
- Probes are run manually or via dedicated scripts (e.g. `npm run test:probe:audio-session`)
